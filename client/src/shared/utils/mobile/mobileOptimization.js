// Mobile optimization utilities

// Device detection
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
};

export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth > 1024;
};

// Screen size breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
  LARGE_DESKTOP: 1536
};

// Responsive utilities
export const getScreenSize = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width <= BREAKPOINTS.MOBILE) return 'mobile';
  if (width <= BREAKPOINTS.TABLET) return 'tablet';
  if (width <= BREAKPOINTS.DESKTOP) return 'desktop';
  return 'large-desktop';
};

// Touch detection
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 || 
         navigator.msMaxTouchPoints > 0;
};

// Viewport utilities
export const getViewportDimensions = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight
  };
};

// Mobile-specific optimizations
export const optimizeForMobile = {
  // Reduce animation complexity on mobile
  shouldReduceMotion: () => {
    if (typeof window === 'undefined') return false;
    
    return isMobile() || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
           navigator.connection?.effectiveType === 'slow-2g' ||
           navigator.connection?.effectiveType === '2g';
  },
  
  // Optimize images for mobile
  getImageSize: (baseSize) => {
    if (isMobile()) {
      return Math.min(baseSize, window.innerWidth * 0.8);
    }
    return baseSize;
  },
  
  // Adjust font sizes for mobile
  getFontSize: (baseSize) => {
    if (isMobile()) {
      return Math.max(baseSize * 0.9, 14); // Minimum 14px for readability
    }
    return baseSize;
  },
  
  // Optimize spacing for mobile
  getSpacing: (baseSpacing) => {
    if (isMobile()) {
      return Math.max(baseSpacing * 0.8, 8); // Minimum 8px spacing
    }
    return baseSpacing;
  }
};

// Performance optimizations for mobile
export const mobilePerformance = {
  // Lazy load images
  lazyLoadImages: () => {
    if (typeof window === 'undefined' || !isMobile()) return;
    
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  },
  
  // Debounce scroll events
  debounceScroll: (callback, delay = 100) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => callback.apply(null, args), delay);
    };
  },
  
  // Throttle resize events
  throttleResize: (callback, delay = 250) => {
    let timeoutId;
    let lastExecTime = 0;
    return (...args) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        callback.apply(null, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          callback.apply(null, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }
};

// Mobile-specific UI adjustments
export const mobileUI = {
  // Adjust modal sizes for mobile
  getModalSize: () => {
    if (isMobile()) {
      return {
        width: '95vw',
        maxWidth: '95vw',
        height: '90vh',
        maxHeight: '90vh'
      };
    }
    return {
      width: '80vw',
      maxWidth: '800px',
      height: '80vh',
      maxHeight: '600px'
    };
  },
  
  // Adjust button sizes for touch
  getButtonSize: (baseSize = 'md') => {
    if (isMobile()) {
      const sizes = {
        sm: 'py-3 px-4 text-base',
        md: 'py-4 px-6 text-lg',
        lg: 'py-5 px-8 text-xl'
      };
      return sizes[baseSize] || sizes.md;
    }
    return baseSize;
  },
  
  // Adjust input sizes for mobile
  getInputSize: (baseSize = 'md') => {
    if (isMobile()) {
      const sizes = {
        sm: 'py-3 px-4 text-base',
        md: 'py-4 px-4 text-lg',
        lg: 'py-5 px-6 text-xl'
      };
      return sizes[baseSize] || sizes.md;
    }
    return baseSize;
  },
  
  // Get optimal grid columns for mobile
  getGridColumns: (baseColumns) => {
    if (isMobile()) {
      return Math.min(baseColumns, 1);
    }
    if (isTablet()) {
      return Math.min(baseColumns, 2);
    }
    return baseColumns;
  }
};

// Mobile navigation utilities
export const mobileNavigation = {
  // Handle mobile menu toggle
  toggleMobileMenu: (isOpen, setIsOpen) => {
    if (isMobile()) {
      setIsOpen(!isOpen);
      // Prevent body scroll when menu is open
      document.body.style.overflow = !isOpen ? 'hidden' : 'auto';
    }
  },
  
  // Close mobile menu on route change
  closeOnRouteChange: (setIsOpen) => {
    if (isMobile()) {
      setIsOpen(false);
      document.body.style.overflow = 'auto';
    }
  },
  
  // Handle back button on mobile
  handleBackButton: (callback) => {
    if (isMobile() && window.history.length > 1) {
      window.history.back();
    } else if (callback) {
      callback();
    }
  }
};

// Mobile form optimizations
export const mobileForms = {
  // Focus management for mobile
  focusNextInput: (currentInput) => {
    if (isMobile()) {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      const currentIndex = inputs.indexOf(currentInput);
      const nextInput = inputs[currentIndex + 1];
      
      if (nextInput) {
        nextInput.focus();
      } else {
        currentInput.blur();
      }
    }
  },
  
  // Prevent zoom on input focus (iOS)
  preventZoom: () => {
    if (isMobile()) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      }
    }
  },
  
  // Restore zoom after form submission
  restoreZoom: () => {
    if (isMobile()) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.content = 'width=device-width, initial-scale=1.0';
      }
    }
  }
};

// Mobile-specific event handlers
export const mobileEvents = {
  // Handle touch events
  handleTouchStart: (callback) => {
    if (isTouchDevice()) {
      return callback;
    }
    return null;
  },
  
  // Handle swipe gestures
  handleSwipe: (element, onSwipeLeft, onSwipeRight) => {
    if (!isTouchDevice()) return;
    
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Only trigger if horizontal swipe is greater than vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 50 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diffX < -50 && onSwipeRight) {
          onSwipeRight();
        }
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }
};

export default {
  isMobile,
  isTablet,
  isDesktop,
  getScreenSize,
  isTouchDevice,
  getViewportDimensions,
  optimizeForMobile,
  mobilePerformance,
  mobileUI,
  mobileNavigation,
  mobileForms,
  mobileEvents,
  BREAKPOINTS
};
