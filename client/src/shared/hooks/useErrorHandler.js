import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const useErrorHandler = () => {
  const handleError = useCallback((error, context = '') => {
    console.error(`Error in ${context}:`, error);
    
    // Determine user-friendly error message
    let userMessage = 'Something went wrong. Please try again.';
    
    if (error?.response?.status === 401) {
      userMessage = 'Please log in to continue.';
    } else if (error?.response?.status === 403) {
      userMessage = 'You don\'t have permission to perform this action.';
    } else if (error?.response?.status === 404) {
      userMessage = 'The requested resource was not found.';
    } else if (error?.response?.status === 429) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error?.response?.status >= 500) {
      userMessage = 'Server error. Please try again later.';
    } else if (error?.message) {
      // Use the error message if it's user-friendly
      if (error.message.length < 100 && !error.message.includes('Error:') && !error.message.includes('at ')) {
        userMessage = error.message;
      }
    }
    
    // Show toast notification
    toast.error(userMessage, {
      duration: 5000,
      position: 'top-right',
    });
    
    // Log detailed error for debugging
    if (import.meta.env.MODE === 'development') {
      console.group(`🚨 Error in ${context}`);
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      if (error?.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      console.groupEnd();
    }
    
    return userMessage;
  }, []);

  const handleAsyncError = useCallback(async (asyncFn, context = '') => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, context);
      throw error; // Re-throw so calling code can handle if needed
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
};

export default useErrorHandler;
