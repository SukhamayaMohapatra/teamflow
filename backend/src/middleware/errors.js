export function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` }); }
export function errorHandler(err, req, res, next) {
  req.log?.error({ err }, 'Request failed');
  if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Validation failed', errors: Object.values(err.errors).map(e => e.message) });
  if (err.code === 11000) return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid resource identifier' });
  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  res.status(status).json({ success: false, message: status === 500 ? 'Internal server error' : err.message });
}
