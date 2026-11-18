const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';
  let details = err.details;

  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  else if (err.name === 'ValidationError' && err.errors) {
    status = 400; message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) { status = 409; message = 'Duplicate value'; }
  else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON body'; }

  if (status >= 500) {
    console.error(err);
    if (env.nodeEnv === 'production') message = 'Internal server error';
  }
  res.status(status).json({ success: false, message, ...(details && { details }) });
}

module.exports = { notFound, errorHandler };
