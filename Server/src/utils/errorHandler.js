import { logger } from './logger.js';

/**
 * Sanitize error message for client response
 * In production, returns generic messages to prevent information disclosure
 */
export const sanitizeErrorMessage = (error, defaultMessage = 'An error occurred') => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // In production, return generic messages
    return defaultMessage;
  } else {
    // In development, return actual error message for debugging
    return error?.message || defaultMessage;
  }
};

/**
 * Create a safe error response object
 * Use this in catch blocks to ensure error messages are sanitized in production
 */
export const createSafeErrorResponse = (error, defaultMessage = 'Internal server error') => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log full error server-side
  logger.error('Error in controller', {
    message: error?.message,
    stack: error?.stack,
    name: error?.name
  });
  
  const response = {
    message: defaultMessage,
    timestamp: new Date().toISOString()
  };
  
  // Only include error details in development
  if (!isProduction && error?.message) {
    response.error = error.message;
  }
  
  return response;
};

/**
 * Create standardized error response
 */
export const createErrorResponse = (error, statusCode = 500, defaultMessage = 'Internal server error') => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log full error details server-side
  logger.error('Error occurred', {
    message: error?.message,
    stack: error?.stack,
    name: error?.name,
    statusCode
  });
  
  // Return sanitized response to client
  const response = {
    message: sanitizeErrorMessage(error, defaultMessage),
    timestamp: new Date().toISOString()
  };
  
  // Only include error details in development
  if (!isProduction && error?.message) {
    response.error = error.message;
    if (error?.stack) {
      response.stack = error.stack;
    }
  }
  
  return {
    statusCode,
    response
  };
};

/**
 * Express error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  const { statusCode, response } = createErrorResponse(
    err,
    err.statusCode || err.status || 500,
    'Internal server error'
  );
  
  res.status(statusCode).json(response);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

