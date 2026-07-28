// ── WebAuthn Service ──────────────────────────────────────────────────────
// Business logic for WebAuthn/biometric authentication

const { AppError } = require('../middleware/errorHandler');
const WebAuthnRepository = require('../repositories/webauthnRepository');
const config = require('../config/auth');

/**
 * Derive the WebAuthn rpID from the configured origin URL.
 * rpID must be the effective domain of the FRONTEND (not the API server).
 * e.g. https://dairyware.netlify.app -> dairyware.netlify.app
 */
function deriveRpID() {
  const origin = config.webauthn.origin;
  try {
    const url = new URL(origin);
    return url.hostname;
  } catch {
    return 'localhost';
  }
}

/**
 * Convert a PostgreSQL bytea hex string to a Buffer.
 * pg returns bytea columns as hex strings potentially prefixed with \x.
 * This strips the \x prefix and decodes.
 */
function publicKeyHexToBuffer(hexStr) {
  if (!hexStr) return null;
  if (Buffer.isBuffer(hexStr)) return hexStr;
  if (typeof hexStr !== 'string') return Buffer.from(hexStr);

  // pg bytea hex output looks like: \x3025a002... (backslash + x + hex)
  // Check character-by-character to avoid JS string escaping issues
  if (hexStr.length > 2 && hexStr.charCodeAt(0) === 92 && hexStr[1] === 'x') {
    return Buffer.from(hexStr.slice(2), 'hex');
  }
  return Buffer.from(hexStr, 'hex');
}

/**
 * Parse a stored credential ID back into a Buffer (Uint8Array).
 * Supports multiple storage formats:
 * 1. Raw base64url string (new format, preferred)
 * 2. JSON-stringified base64url (old format: '"abc"')
 * 3. JSON array-like object ('{"0": v, "1": v}')
 */
function storedIdToBuffer(storedId) {
  if (!storedId) return Buffer.alloc(0);
  // First, try to JSON parse it
  try {
    const parsed = JSON.parse(storedId);
    if (typeof parsed === 'string') {
      // JSON-stringified base64url string: '"abc123"' -> 'abc123'
      return Buffer.from(parsed, 'base64url');
    }
    // Array-like object: { "0": 123, "1": 45, ... }
    const bytes = Array.isArray(parsed) ? parsed : Object.values(parsed).filter(v => typeof v === 'number');
    return Buffer.from(bytes);
  } catch {
    // If JSON.parse fails, assume it's already a raw base64url string
    return Buffer.from(storedId, 'base64url');
  }
}

/**
 * Convert stored credential ID to a base64url string for comparison
 * with the credential.id returned from the browser.
 */
function storedIdToBase64url(storedId) {
  return storedIdToBuffer(storedId).toString('base64url');
}

// In-memory challenges store (lost on restart - acceptable for biometric auth)
const challenges = new Map();

const WebAuthnService = {
  async generateRegistrationOptions(userId, username) {
    const { generateRegistrationOptions } = await import('@simplewebauthn/server');
    const existing = await WebAuthnRepository.findByUserId(userId, 'admin');
    const rpID = deriveRpID();

    const excludeCredentials = existing.map(r => ({
      id: storedIdToBuffer(r.credential_id),
      type: 'public-key',
      transports: ['internal'],
    }));

    const options = generateRegistrationOptions({
      rpName: config.webauthn.rpName,
      rpID,
      userName: username,
      userDisplayName: username,
      timeout: config.webauthn.timeout,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'preferred',
      },
    });

    challenges.set(`register:${userId}`, options.challenge);
    return options;
  },

  async verifyRegistration(userId, username, credential, expectedOrigin, expectedRPID, deviceName) {
    const expectedChallenge = challenges.get(`register:${userId}`);
    if (!expectedChallenge) {
      throw new AppError('No registration in progress', 400, 'VALIDATION_ERROR');
    }

    const { verifyRegistrationResponse } = await import('@simplewebauthn/server');
    const verification = await verifyRegistrationResponse({
      credential,
      expectedChallenge,
      expectedOrigin,
      expectedRPID,
    });

    if (!verification.verified) {
      throw new AppError('Registration verification failed', 400, 'VALIDATION_ERROR');
    }

    const { registrationInfo } = verification;
    // Store credential ID as raw base64url string (not JSON-stringified)
    const credentialIdBase64 = Buffer.from(registrationInfo.credentialID).toString('base64url');
    // Store publicKey as Buffer - pg will convert to bytea automatically
    // Use the device name from the request if provided, otherwise default
    const effectiveDeviceName = deviceName || 'Unknown Device';
    await WebAuthnRepository.create({
      userId,
      userType: 'admin',
      credentialId: credentialIdBase64,
      publicKey: Buffer.from(registrationInfo.credentialPublicKey),
      counter: registrationInfo.counter,
      transports: JSON.stringify(credential.response.transports || []),
      deviceName: effectiveDeviceName,
    });

    challenges.delete(`register:${userId}`);
    return { verified: true };
  },

  async generateLoginOptions(username) {
    const UserRepository = require('../repositories/userRepository');
    const user = await UserRepository.findByUsername(username);
    if (!user) {
      throw new AppError('No biometric login available', 404, 'NOT_FOUND');
    }

    const creds = await WebAuthnRepository.findByUserId(user.id, 'admin');
    if (creds.length === 0) {
      throw new AppError('No biometric login available', 404, 'NOT_FOUND');
    }

    const { generateAuthenticationOptions } = await import('@simplewebauthn/server');
    const allowCredentials = creds.map(c => ({
      id: storedIdToBuffer(c.credential_id),
      type: 'public-key',
      transports: JSON.parse(c.transports || '[]'),
    }));

    const options = generateAuthenticationOptions({
      timeout: config.webauthn.timeout,
      allowCredentials,
      userVerification: 'required',
    });

    challenges.set(`login:${user.id}`, { challenge: options.challenge, userId: user.id });
    return { ...options, userId: user.id };
  },

  async verifyLogin(userId, credential, expectedOrigin, expectedRPID) {
    const session = challenges.get(`login:${userId}`);
    if (!session) {
      throw new AppError('No login in progress', 400, 'VALIDATION_ERROR');
    }

    const creds = await WebAuthnRepository.findByUserId(userId, 'admin');
    // Compare using base64url on both sides
    const credentialIdB64 = credential.id;
    const cred = creds.find(c => storedIdToBase64url(c.credential_id) === credentialIdB64);
    if (!cred) {
      throw new AppError('Credential not found', 400, 'VALIDATION_ERROR');
    }

    const { verifyAuthenticationResponse } = await import('@simplewebauthn/server');
    const verification = await verifyAuthenticationResponse({
      // The browser's authentication response (FIXED: was duplicate key overwriting)
      response: credential,
      expectedChallenge: session.challenge,
      expectedOrigin,
      expectedRPID,
      // The stored authenticator for comparison
      authenticator: {
        credentialID: storedIdToBuffer(cred.credential_id),
        credentialPublicKey: publicKeyHexToBuffer(cred.public_key),
        counter: cred.counter,
        transports: JSON.parse(cred.transports || '[]'),
      },
    });

    if (!verification.verified) {
      throw new AppError('Authentication failed', 401, 'AUTH_FAILED');
    }

    await WebAuthnRepository.updateCounterAndLastUsed(cred.id, verification.authenticationInfo.newCounter);

    // Get user and generate token
    const UserRepository = require('../repositories/userRepository');
    const AuthService = require('./authService');
    const user = await UserRepository.findById(userId);
    const token = AuthService.generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    challenges.delete(`login:${userId}`);
    return { user: { ...user, token }, token };
  },

  async getCredentials(userId) {
    return await WebAuthnRepository.getCredentials(userId, 'admin');
  },

  async deleteCredential(id) {
    return await WebAuthnRepository.delete(id);
  },
};

module.exports = WebAuthnService;
