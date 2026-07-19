// ── WebAuthn Controller ───────────────────────────────────────────────────

const WebAuthnService = require('../services/webauthnService');
const asyncHandler = require('../middleware/asyncHandler');
const config = require('../config/auth');

/**
 * Derive the WebAuthn rpID from the configured origin URL.
 * rpID MUST be the frontend domain, NOT the API server hostname,
 * because WebAuthn binds credentials to the origin where the
 * browser is running (the frontend).
 */
function getRpID() {
  try {
    return new URL(config.webauthn.origin).hostname;
  } catch {
    return 'localhost';
  }
}

const webauthnController = {
  registerBegin: asyncHandler(async (req, res) => {
    const { userId, username } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username required' });
    }
    const options = await WebAuthnService.generateRegistrationOptions(userId, username);
    options.rpID = getRpID();
    res.json(options);
  }),

  registerComplete: asyncHandler(async (req, res) => {
    const { userId, username, credential, deviceName } = req.body;
    const expectedOrigin = config.webauthn.origin;
    const expectedRPID = getRpID();
    const result = await WebAuthnService.verifyRegistration(userId, username, credential, expectedOrigin, expectedRPID, deviceName);
    res.json(result);
  }),

  loginBegin: asyncHandler(async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const options = await WebAuthnService.generateLoginOptions(username);
    options.rpID = getRpID();
    res.json(options);
  }),

  loginComplete: asyncHandler(async (req, res) => {
    const { userId, credential } = req.body;
    const expectedOrigin = config.webauthn.origin;
    const expectedRPID = getRpID();
    const { user, token } = await WebAuthnService.verifyLogin(userId, credential, expectedOrigin, expectedRPID);
    res.cookie(config.jwtCookieName, token, config.cookie);
    // Return user with token for localStorage-based auth (App.js uses localStorage)
    res.json({ ...user, token });
  }),

  getCredentials: asyncHandler(async (req, res) => {
    const credentials = await WebAuthnService.getCredentials(req.params.userId);
    res.json(credentials);
  }),

  deleteCredential: asyncHandler(async (req, res) => {
    await WebAuthnService.deleteCredential(req.params.id);
    res.json({ success: true });
  }),
};

module.exports = webauthnController;
