import { useState, useCallback, useRef, useEffect } from 'react';

export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const timeoutRef = useRef(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    // Set a timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setError(new Error('Request timed out. Please try again.'));
    }, 30000); // 30 second timeout
  }, []);

  const stopLoading = useCallback((result = null, error = null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsLoading(false);
    setError(error);
    if (result !== null) {
      setData(result);
    }
  }, []);

  const executeAsync = useCallback(async (asyncFn, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      onFinally,
      timeout = 30000,
      showErrorToast = true 
    } = options;

    startLoading();
    
    try {
      const result = await asyncFn();
      stopLoading(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      stopLoading(null, err);
      
      if (onError) {
        onError(err);
      } else if (showErrorToast) {
        // You can integrate with toast notifications here
        console.error('Async operation failed:', err);
      }
      
      throw err;
    } finally {
      if (onFinally) {
        onFinally();
      }
    }
  }, [startLoading, stopLoading]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    error,
    data,
    startLoading,
    stopLoading,
    executeAsync,
    reset,
    // Convenience methods
    setLoading: setIsLoading,
    setError,
    setData
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = (stateNames = []) => {
  const [states, setStates] = useState(() => {
    const initialStates = {};
    stateNames.forEach(name => {
      initialStates[name] = {
        isLoading: false,
        error: null,
        data: null
      };
    });
    return initialStates;
  });

  const updateState = useCallback((stateName, updates) => {
    setStates(prev => ({
      ...prev,
      [stateName]: {
        ...prev[stateName],
        ...updates
      }
    }));
  }, []);

  const startLoading = useCallback((stateName) => {
    updateState(stateName, { isLoading: true, error: null });
  }, [updateState]);

  const stopLoading = useCallback((stateName, data = null, error = null) => {
    updateState(stateName, { 
      isLoading: false, 
      data, 
      error 
    });
  }, [updateState]);

  const executeAsync = useCallback(async (stateName, asyncFn, options = {}) => {
    const { onSuccess, onError } = options;
    
    startLoading(stateName);
    
    try {
      const result = await asyncFn();
      stopLoading(stateName, result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      stopLoading(stateName, null, err);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    }
  }, [startLoading, stopLoading]);

  const resetState = useCallback((stateName) => {
    updateState(stateName, {
      isLoading: false,
      error: null,
      data: null
    });
  }, [updateState]);

  const resetAllStates = useCallback(() => {
    const resetStates = {};
    stateNames.forEach(name => {
      resetStates[name] = {
        isLoading: false,
        error: null,
        data: null
      };
    });
    setStates(resetStates);
  }, [stateNames]);

  return {
    states,
    startLoading,
    stopLoading,
    executeAsync,
    resetState,
    resetAllStates,
    updateState
  };
};

// Hook for debounced loading states
export const useDebouncedLoading = (delay = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    
    // Only show loading indicator after delay
    timeoutRef.current = setTimeout(() => {
      setShowLoading(true);
    }, delay);
  }, [delay]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setShowLoading(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading
  };
};

export default useLoadingState;
