// ── WebAuthn Service ──────────────────────────────────────────────────────
// Business logic for WebAuthn/biometric authentication

const { AppError } = require('../middleware/errorHandler');
const WebAuthnRepository = require('../repositories/webauthnRepository');
const config = require('../config/auth');

// Helper: convert stored credential ID buffer to base64url for comparison
function credentialIdToBase64url(storedId) {
  try {
    // If stored as JSON stringified Uint8Array ({"0": v, "1": v, ...})
    const parsed = JSON.parse(storedId);
    if (typeof parsed === 'string') {
      // Already a base64url string
      return parsed;
    }
    // It's an array-like object or actual array — extract values
    const bytes = Array.isArray(parsed) ? parsed : Object.values(parsed).filter(v => typeof v === 'number');
    return Buffer.from(bytes).toString('base64url');
  } catch {
    // If parsing fails, assume it's already a base64url string
    return storedId;
  }
}

// Helper: parse stored credential ID into the format @simplewebauthn/server expects (Uint8Array)
function parseStoredCredentialId(storedId) {
  try {
    const parsed = JSON.parse(storedId);
    if (typeof parsed === 'string') {
      // It's a base64url string — decode to Buffer
      return Buffer.from(parsed, 'base64url');
    }
    // Array-like object — convert to array of values
    const bytes = Array.isArray(parsed) ? parsed : Object.values(parsed).filter(v => typeof v === 'number');
    return Buffer.from(bytes);
  } catch {
    // Assume raw base64url
    return Buffer.from(storedId, 'base64url');
  }
}

// In-memory challenges store (lost on restart — acceptable for biometric auth)
const challenges = new Map();

const WebAuthnService = {
  async generateRegistrationOptions(userId, username) {
    const { generateRegistrationOptions } = await import('@simplewebauthn/server');
    const existing = await WebAuthnRepository.findByUserId(userId, 'admin');
    const excludeCredentials = existing.map(r => parseStoredCredentialId(r.credential_id));

    const options = generateRegistrationOptions({
      rpName: config.webauthn.rpName,
      rpID: 'localhost', // Will be overridden by the controller with req.hostname
      userName: username,
      userDisplayName: username,
      timeout: config.webauthn.timeout,
      attestationType: 'none',
      excludeCredentials: excludeCredentials.map(c => ({
        id: c,
        type: 'public-key',
        transports: ['internal'],
      })),
      authenticatorSelection: {
        userVerification: 'required',
        residentKey: 'preferred',
      },
    });

    challenges.set(`register:${userId}`, options.challenge);
    return options;
  },

  async verifyRegistration(userId, username, credential, expectedOrigin, expectedRPID) {
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
    // Store credential ID as base64url string for reliable comparison
    const credentialIdBase64 = Buffer.from(registrationInfo.credentialID).toString('base64url');
    await WebAuthnRepository.create({
      userId,
      userType: 'admin',
      credentialId: JSON.stringify(credentialIdBase64),
      publicKey: registrationInfo.credentialPublicKey,
      counter: registrationInfo.counter,
      transports: JSON.stringify(credential.response.transports || []),
      deviceName: 'Unknown Device',
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
      id: parseStoredCredentialId(c.credential_id),
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
    const cred = creds.find(c => {
      return credentialIdToBase64url(c.credential_id) === credential.id;
    });
    if (!cred) {
      throw new AppError('Credential not found', 400, 'VALIDATION_ERROR');
    }

    const { verifyAuthenticationResponse } = await import('@simplewebauthn/server');
    const verification = await verifyAuthenticationResponse({
      credential,
      expectedChallenge: session.challenge,
      expectedOrigin,
      expectedRPID,
      credential: {
        id: parseStoredCredentialId(cred.credential_id),
        publicKey: cred.public_key,
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
