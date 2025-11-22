// Environment variable validation
const REQUIRED_ENV_VARS = {
  VITE_API_URL: 'API base URL for backend communication',
  VITE_SOCKET_SERVER: 'Socket server URL for real-time features',
  VITE_FIREBASE_API_KEY: 'Firebase API key for authentication',
  VITE_FIREBASE_AUTH_DOMAIN: 'Firebase authentication domain',
  VITE_FIREBASE_PROJECT_ID: 'Firebase project ID',
  VITE_FIREBASE_STORAGE_BUCKET: 'Firebase storage bucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'Firebase messaging sender ID',
  VITE_FIREBASE_APP_ID: 'Firebase app ID',
  VITE_RAZORPAY_KEY_ID: 'Razorpay key ID for payments',
};

const OPTIONAL_ENV_VARS = {
  VITE_APP_NAME: 'Application name',
  VITE_APP_VERSION: 'Application version',
  VITE_DEBUG_MODE: 'Debug mode flag',
  VITE_ANALYTICS_ID: 'Analytics tracking ID',
};

export const validateEnvironment = () => {
  const missing = [];
  const warnings = [];
  
  // Check required environment variables
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      missing.push({ key, description });
    }
  });
  
  // Check optional environment variables
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, description]) => {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      warnings.push({ key, description });
    }
  });
  
  // Log validation results
  if (missing.length > 0) {
    console.error('🚨 Missing required environment variables:');
    missing.forEach(({ key, description }) => {
      console.error(`  - ${key}: ${description}`);
    });
    console.error('\nPlease set these environment variables in your .env file');
  }
  
  if (warnings.length > 0 && import.meta.env.MODE === 'development') {
    console.warn('⚠️ Missing optional environment variables:');
    warnings.forEach(({ key, description }) => {
      console.warn(`  - ${key}: ${description}`);
    });
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    hasWarnings: warnings.length > 0
  };
};

export const getEnvVar = (key, defaultValue = null) => {
  const value = import.meta.env[key];
  if (!value || value.trim() === '') {
    if (defaultValue !== null) {
      return defaultValue;
    }
    console.warn(`Environment variable ${key} is not set`);
    return null;
  }
  return value;
};

export const isDevelopment = () => import.meta.env.MODE === 'development';
export const isProduction = () => import.meta.env.MODE === 'production';

// Validate environment on import
let validation;
const isProd = import.meta.env.MODE === 'production';

if (isProd) {
  // In production, fail fast if required vars are missing
  validation = validateEnvironment();
  if (!validation.isValid) {
    const missingList = validation.missing.map(({ key }) => key).join(', ');
    throw new Error(
      `Missing required environment variables in production: ${missingList}. ` +
      'Please set all required environment variables before deploying.'
    );
  }
} else {
  // In development, warn but don't fail
  validation = validateEnvironment();
  if (!validation.isValid) {
    console.warn('⚠️ Environment validation failed. Some features may not work correctly.');
    console.warn('This is a warning in development mode. Please set required environment variables.');
  }
}

export default validation;
