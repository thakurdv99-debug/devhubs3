export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const handleError = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  let { statusCode, message } = err;

  if (!statusCode) {
    statusCode = 500;
  }

  // Add CORS headers to error responses
  const origin = req.headers.origin;
  if (origin) {
    // In development, allow all origins
    if (!isProduction) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      // In production, check against allowed origins
      const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['https://devhubs.in', 'https://www.devhubs.in'];
      
      if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
      }
    }
  }

  // Sanitize error message in production
  if (isProduction) {
    // Use generic messages for common error types
    if (statusCode === 500) {
      message = 'Internal server error';
    } else if (statusCode === 400) {
      message = 'Bad request';
    } else if (statusCode === 401) {
      message = 'Unauthorized';
    } else if (statusCode === 403) {
      message = 'Forbidden';
    } else if (statusCode === 404) {
      message = 'Resource not found';
    } else {
      message = message || 'An error occurred';
    }
  } else {
    // In development, use actual error message
    message = message || 'Internal Server Error';
  }

  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  // Only include stack trace in development
  if (!isProduction && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
