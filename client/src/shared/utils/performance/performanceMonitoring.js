// Performance monitoring and analytics utilities

// Performance metrics collection
export const performanceMetrics = {
  // Page load metrics
  getPageLoadMetrics: () => {
    if (typeof window === 'undefined' || !window.performance) return null;
    
    const navigation = performance.getEntriesByType('navigation')[0];
    if (!navigation) return null;
    
    return {
      // Core Web Vitals
      FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
      FID: performance.getEntriesByType('first-input')[0]?.processingStart,
      CLS: performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0),
      
      // Navigation timing
      DNS: navigation.domainLookupEnd - navigation.domainLookupStart,
      TCP: navigation.connectEnd - navigation.connectStart,
      TTFB: navigation.responseStart - navigation.requestStart,
      DOMContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      Load: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Resource timing
      totalResources: performance.getEntriesByType('resource').length,
      totalResourceSize: performance.getEntriesByType('resource').reduce((sum, entry) => sum + (entry.transferSize || 0), 0)
    };
  },
  
  // Component render metrics
  measureComponentRender: (componentName, renderFunction) => {
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    
    // Log slow renders in development
    if (import.meta.env.MODE === 'development' && renderTime > 16) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
    
    return {
      componentName,
      renderTime,
      result
    };
  },
  
  // API call metrics
  measureApiCall: async (apiName, apiCall) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      
      const metrics = {
        apiName,
        duration: endTime - startTime,
        success: true,
        timestamp: new Date().toISOString()
      };
      
      // Log slow API calls
      if (metrics.duration > 5000) {
        console.warn(`Slow API call detected: ${apiName} took ${metrics.duration.toFixed(2)}ms`);
      }
      
      return { result, metrics };
    } catch (error) {
      const endTime = performance.now();
      
      const metrics = {
        apiName,
        duration: endTime - startTime,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return { error, metrics };
    }
  },
  
  // Memory usage
  getMemoryUsage: () => {
    if (typeof window === 'undefined' || !window.performance.memory) return null;
    
    const memory = window.performance.memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
};

// User interaction tracking
export const userInteraction = {
  // Track user actions
  trackAction: (action, data = {}) => {
    const event = {
      action,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    // Log in development
    if (import.meta.env.MODE === 'development') {
      console.log('User Action:', event);
    }
    
    // Send to analytics service (implement based on your analytics provider)
    sendToAnalytics('user_action', event);
  },
  
  // Track page views
  trackPageView: (pageName, additionalData = {}) => {
    const event = {
      page: pageName,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      ...additionalData
    };
    
    sendToAnalytics('page_view', event);
  },
  
  // Track errors
  trackError: (error, context = {}) => {
    const event = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    sendToAnalytics('error', event);
  },
  
  // Track performance issues
  trackPerformanceIssue: (issue, metrics = {}) => {
    const event = {
      issue,
      metrics,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    sendToAnalytics('performance_issue', event);
  }
};

// Analytics service integration
const sendToAnalytics = (eventType, data) => {
  // Implement based on your analytics provider
  // Examples for common providers:
  
  // Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', eventType, data);
  }
  
  // Mixpanel
  if (typeof mixpanel !== 'undefined') {
    mixpanel.track(eventType, data);
  }
  
  // Custom analytics endpoint
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        data,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.warn('Failed to send analytics data:', error);
    });
  }
};

// Performance monitoring hooks
export const usePerformanceMonitoring = () => {
  const trackComponentMount = (componentName) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const mountTime = endTime - startTime;
      
      userInteraction.trackAction('component_mount', {
        componentName,
        mountTime
      });
    };
  };
  
  const trackUserAction = (action, data) => {
    userInteraction.trackAction(action, data);
  };
  
  const trackError = (error, context) => {
    userInteraction.trackError(error, context);
  };
  
  return {
    trackComponentMount,
    trackUserAction,
    trackError
  };
};

// Real-time performance monitoring
export const realTimeMonitoring = {
  // Monitor Core Web Vitals
  monitorCoreWebVitals: () => {
    if (typeof window === 'undefined') return;
    
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        userInteraction.trackPerformanceIssue('slow_fcp', {
          fcp: entry.startTime
        });
      }
    }).observe({ entryTypes: ['paint'] });
    
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.startTime > 2500) {
          userInteraction.trackPerformanceIssue('slow_lcp', {
            lcp: entry.startTime
          });
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.processingStart - entry.startTime > 100) {
          userInteraction.trackPerformanceIssue('slow_fid', {
            fid: entry.processingStart - entry.startTime
          });
        }
      }
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let clsValue = 0;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      if (clsValue > 0.1) {
        userInteraction.trackPerformanceIssue('high_cls', {
          cls: clsValue
        });
      }
    }).observe({ entryTypes: ['layout-shift'] });
  },
  
  // Monitor memory usage
  monitorMemoryUsage: () => {
    if (typeof window === 'undefined') return;
    
    setInterval(() => {
      const memoryUsage = performanceMetrics.getMemoryUsage();
      if (memoryUsage && memoryUsage.usagePercentage > 80) {
        userInteraction.trackPerformanceIssue('high_memory_usage', memoryUsage);
      }
    }, 30000); // Check every 30 seconds
  },
  
  // Monitor network performance
  monitorNetworkPerformance: () => {
    if (typeof window === 'undefined' || !navigator.connection) return;
    
    const connection = navigator.connection;
    
    const checkConnection = () => {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        userInteraction.trackPerformanceIssue('slow_connection', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      }
    };
    
    connection.addEventListener('change', checkConnection);
    checkConnection(); // Initial check
  }
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;
  
  // Initialize real-time monitoring
  realTimeMonitoring.monitorCoreWebVitals();
  realTimeMonitoring.monitorMemoryUsage();
  realTimeMonitoring.monitorNetworkPerformance();
  
  // Track initial page load
  window.addEventListener('load', () => {
    const metrics = performanceMetrics.getPageLoadMetrics();
    if (metrics) {
      userInteraction.trackAction('page_load_complete', metrics);
    }
  });
  
  // Track page unload
  window.addEventListener('beforeunload', () => {
    const metrics = performanceMetrics.getPageLoadMetrics();
    if (metrics) {
      userInteraction.trackAction('page_unload', metrics);
    }
  });
  
  // Global error tracking
  window.addEventListener('error', (event) => {
    userInteraction.trackError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  // Unhandled promise rejection tracking
  window.addEventListener('unhandledrejection', (event) => {
    userInteraction.trackError(new Error(event.reason), {
      type: 'unhandled_promise_rejection'
    });
  });
};

export default {
  performanceMetrics,
  userInteraction,
  usePerformanceMonitoring,
  realTimeMonitoring,
  initializePerformanceMonitoring
};
