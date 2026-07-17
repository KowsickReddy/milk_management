// ── WebAuthn Controller ───────────────────────────────────────────────────

const WebAuthnService = require('../services/webauthnService');
const asyncHandler = require('../middleware/asyncHandler');
const config = require('../config/auth');

const webauthnController = {
  registerBegin: asyncHandler(async (req, res) => {
    const { userId, username } = req.body;
    if (!userId || !username) {
      return res.status(400).json({ error: 'userId and username required' });
    }
    const options = await WebAuthnService.generateRegistrationOptions(userId, username);
    // Override rpID with actual hostname
    options.rpID = req.hostname;
    res.json(options);
  }),

  registerComplete: asyncHandler(async (req, res) => {
    const { userId, username, credential } = req.body;
    const expectedOrigin = config.webauthn.origin;
    const expectedRPID = req.hostname;
    const result = await WebAuthnService.verifyRegistration(userId, username, credential, expectedOrigin, expectedRPID);
    res.json(result);
  }),

  loginBegin: asyncHandler(async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    const options = await WebAuthnService.generateLoginOptions(username);
    options.rpID = req.hostname;
    res.json(options);
  }),

  loginComplete: asyncHandler(async (req, res) => {
    const { userId, credential } = req.body;
    const expectedOrigin = config.webauthn.origin;
    const expectedRPID = req.hostname;
    const { user, token } = await WebAuthnService.verifyLogin(userId, credential, expectedOrigin, expectedRPID);
    res.cookie(config.jwtCookieName, token, config.cookie);
    res.json(user);
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
