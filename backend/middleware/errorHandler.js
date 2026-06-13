const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(', ');
    message = `Duplicate value for field: ${field}`;
  }

  if (!err.isOperational) {
    console.error('UNEXPECTED ERROR:', err);
  }

  // Always return JSON — never let Express send an HTML error page
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;