// User-friendly error messages and error handling utilities

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'The request is taking longer than expected. Please try again.',
  CONNECTION_LOST: 'Connection lost. Please check your internet connection.',
  
  // Authentication errors
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  
  // Validation errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 8 characters long.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  
  // File upload errors
  FILE_TOO_LARGE: 'File size is too large. Please choose a smaller file.',
  INVALID_FILE_TYPE: 'Invalid file type. Please choose a supported file format.',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  
  // Payment errors
  PAYMENT_FAILED: 'Payment failed. Please check your payment details and try again.',
  PAYMENT_CANCELLED: 'Payment was cancelled. Please try again if you wish to complete the transaction.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please check your account balance.',
  CARD_DECLINED: 'Your card was declined. Please try a different payment method.',
  
  // Project errors
  PROJECT_NOT_FOUND: 'Project not found. It may have been deleted or moved.',
  PROJECT_ACCESS_DENIED: 'You don\'t have access to this project.',
  PROJECT_ALREADY_EXISTS: 'A project with this name already exists.',
  PROJECT_CREATION_FAILED: 'Failed to create project. Please try again.',
  
  // Bidding errors
  BID_TOO_LOW: 'Your bid is too low. Please enter a higher amount.',
  BID_TOO_HIGH: 'Your bid exceeds the project budget.',
  BIDDING_CLOSED: 'Bidding for this project has closed.',
  ALREADY_BID: 'You have already placed a bid on this project.',
  
  // Chat errors
  MESSAGE_SEND_FAILED: 'Failed to send message. Please try again.',
  CHAT_LOAD_FAILED: 'Failed to load chat messages. Please refresh the page.',
  
  // General errors
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  MAINTENANCE_MODE: 'The system is currently under maintenance. Please try again later.',
  
  // Subscription errors
  SUBSCRIPTION_REQUIRED: 'This feature requires a premium subscription.',
  SUBSCRIPTION_EXPIRED: 'Your subscription has expired. Please renew to continue.',
  SUBSCRIPTION_UPGRADE_FAILED: 'Failed to upgrade subscription. Please try again.',
  
  // Escrow errors
  ESCROW_CREATION_FAILED: 'Failed to create escrow. Please try again.',
  INSUFFICIENT_ESCROW_BALANCE: 'Insufficient funds in escrow. Please add more funds.',
  ESCROW_RELEASE_FAILED: 'Failed to release escrow funds. Please contact support.',
  
  // Task errors
  TASK_CREATION_FAILED: 'Failed to create task. Please try again.',
  TASK_UPDATE_FAILED: 'Failed to update task. Please try again.',
  TASK_DELETE_FAILED: 'Failed to delete task. Please try again.',
  TASK_ACCESS_DENIED: 'You don\'t have permission to access this task.',
};

export const getErrorMessage = (error, context = '') => {
  // Handle different error types
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error?.message) {
    // Map common error messages to user-friendly ones
    const message = error.message.toLowerCase();
    
    if (message.includes('network error') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    
    if (message.includes('unauthorized') || error?.response?.status === 401) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
    
    if (message.includes('forbidden') || error?.response?.status === 403) {
      return ERROR_MESSAGES.FORBIDDEN;
    }
    
    if (message.includes('not found') || error?.response?.status === 404) {
      return ERROR_MESSAGES.NOT_FOUND;
    }
    
    if (message.includes('rate limit') || error?.response?.status === 429) {
      return ERROR_MESSAGES.RATE_LIMITED;
    }
    
    if (error?.response?.status >= 500) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }
    
    // If it's a short, user-friendly message, use it
    if (error.message.length < 100 && !error.message.includes('Error:') && !error.message.includes('at ')) {
      return error.message;
    }
  }
  
  // Context-specific error messages
  if (context) {
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('payment')) {
      return ERROR_MESSAGES.PAYMENT_FAILED;
    }
    
    if (contextLower.includes('upload')) {
      return ERROR_MESSAGES.UPLOAD_FAILED;
    }
    
    if (contextLower.includes('project')) {
      return ERROR_MESSAGES.PROJECT_CREATION_FAILED;
    }
    
    if (contextLower.includes('bid')) {
      return ERROR_MESSAGES.BIDDING_CLOSED;
    }
    
    if (contextLower.includes('chat')) {
      return ERROR_MESSAGES.MESSAGE_SEND_FAILED;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};

export const getValidationError = (field, error) => {
  const fieldLower = field.toLowerCase();
  
  if (fieldLower.includes('email')) {
    return ERROR_MESSAGES.INVALID_EMAIL;
  }
  
  if (fieldLower.includes('password')) {
    if (error?.message?.includes('match')) {
      return ERROR_MESSAGES.PASSWORD_MISMATCH;
    }
    return ERROR_MESSAGES.INVALID_PASSWORD;
  }
  
  if (fieldLower.includes('phone')) {
    return ERROR_MESSAGES.INVALID_PHONE;
  }
  
  if (error?.message?.includes('required')) {
    return ERROR_MESSAGES.REQUIRED_FIELD;
  }
  
  return error?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};

export const getFileUploadError = (error) => {
  if (error?.message?.includes('size') || error?.message?.includes('large')) {
    return ERROR_MESSAGES.FILE_TOO_LARGE;
  }
  
  if (error?.message?.includes('type') || error?.message?.includes('format')) {
    return ERROR_MESSAGES.INVALID_FILE_TYPE;
  }
  
  return ERROR_MESSAGES.UPLOAD_FAILED;
};

export const getPaymentError = (error) => {
  if (error?.message?.includes('declined') || error?.message?.includes('rejected')) {
    return ERROR_MESSAGES.CARD_DECLINED;
  }
  
  if (error?.message?.includes('insufficient') || error?.message?.includes('funds')) {
    return ERROR_MESSAGES.INSUFFICIENT_FUNDS;
  }
  
  if (error?.message?.includes('cancelled') || error?.message?.includes('canceled')) {
    return ERROR_MESSAGES.PAYMENT_CANCELLED;
  }
  
  return ERROR_MESSAGES.PAYMENT_FAILED;
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const getErrorSeverity = (error) => {
  if (error?.response?.status >= 500) {
    return ERROR_SEVERITY.HIGH;
  }
  
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return ERROR_SEVERITY.MEDIUM;
  }
  
  if (error?.response?.status === 404) {
    return ERROR_SEVERITY.LOW;
  }
  
  if (error?.message?.includes('network') || error?.message?.includes('timeout')) {
    return ERROR_SEVERITY.MEDIUM;
  }
  
  return ERROR_SEVERITY.LOW;
};

export default {
  ERROR_MESSAGES,
  getErrorMessage,
  getValidationError,
  getFileUploadError,
  getPaymentError,
  getErrorSeverity,
  ERROR_SEVERITY
};
