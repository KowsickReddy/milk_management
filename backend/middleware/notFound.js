// ── 404 Not Found Handler ────────────────────────────────────────────────

const notFound = (req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
  });
};

module.exports = notFound;
