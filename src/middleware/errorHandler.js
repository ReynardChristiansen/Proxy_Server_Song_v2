/** Wraps async route handlers so rejections reach the error middleware. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 404, message: `Route ${req.method} ${req.path} not found` },
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message =
    status === 500 ? 'Internal server error' : err.message || 'Request failed';

  if (status === 500) {
    console.error(`[error] ${req.method} ${req.path}:`, err);
  }

  res.status(status).json({
    success: false,
    error: { code: status, message },
  });
}

module.exports = { asyncHandler, notFoundHandler, errorHandler };
