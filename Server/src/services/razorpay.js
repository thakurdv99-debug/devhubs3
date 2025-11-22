import axios from 'axios';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Environment validation and normalization
const normalizeEnv = (env) => {
  if (!env) return 'test'; // Default to test for safety
  const normalized = env.toLowerCase().trim();
  if (!['test', 'live', 'production'].includes(normalized)) {
    logger.warn(`Invalid RAZORPAY_ENV value: "${env}". Defaulting to test.`);
    return 'test';
  }
  return normalized === 'production' ? 'live' : normalized;
};

const validateApiKey = (key, keyName) => {
  if (!key) {
    logger.warn(`${keyName} is not set - Razorpay service will be disabled`);
    return null;
  }
  
  const trimmedKey = key.trim();
  if (trimmedKey !== key) {
    logger.warn(`${keyName} contains leading/trailing whitespace`);
  }
  
  if (trimmedKey.length < 10) {
    logger.warn(`${keyName} appears to be invalid (too short) - Razorpay service will be disabled`);
    return null;
  }
  
  return trimmedKey;
};

// Debug environment variables
console.log('🔍 [Razorpay] Debug - Raw environment variables:');
console.log('🔍 [Razorpay] process.env.RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
console.log('🔍 [Razorpay] process.env.RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET );
console.log('🔍 [Razorpay] process.env.RAZORPAY_ENV:', process.env.RAZORPAY_ENV );

// Initialize configuration
const RAZORPAY_ENV = normalizeEnv(process.env.RAZORPAY_ENV);
const RAZORPAY_KEY_ID = validateApiKey(process.env.RAZORPAY_KEY_ID, 'RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = validateApiKey(process.env.RAZORPAY_KEY_SECRET, 'RAZORPAY_KEY_SECRET');
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Check if Razorpay is properly configured
const isRazorpayConfigured = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET;

// Base URL configuration
const BASE_URL = RAZORPAY_ENV === 'test' 
  ? 'https://api.razorpay.com/v1'
  : 'https://api.razorpay.com/v1';

// Axios instance with proper configuration (only if configured)
const razorpayApi = isRazorpayConfigured ? axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  },
  auth: {
    username: RAZORPAY_KEY_ID,
    password: RAZORPAY_KEY_SECRET
  }
}) : null;

// Request interceptor for logging and headers (only if configured)
if (razorpayApi) {
  razorpayApi.interceptors.request.use((config) => {
    // Add idempotency key for POST requests
    if (config.method === 'post' && !config.headers['X-Razorpay-Idempotency']) {
      config.headers['X-Razorpay-Idempotency'] = uuidv4();
    }
    
    // Safe logging (hide sensitive data)
    const safeConfig = {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'X-Razorpay-Idempotency': config.headers['X-Razorpay-Idempotency'] ? 'SET' : 'NOT_SET',
        'Content-Type': config.headers['Content-Type']
      }
    };
    
    logger.debug('Razorpay API Request', safeConfig);
    return config;
  });
}

// Response interceptor for error handling (only if configured)
if (razorpayApi) {
  razorpayApi.interceptors.response.use(
    (response) => {
      logger.debug('Razorpay API Response', {
        status: response.status,
        url: response.config.url,
        method: response.config.method
      });
      return response;
    },
    (error) => {
      const errorInfo = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message
      };
      
      // Enhanced 401 error diagnostics
      if (error.response?.status === 401) {
        errorInfo.diagnostic = {
          environment: RAZORPAY_ENV,
          baseUrl: BASE_URL,
          keyIdPrefix: RAZORPAY_KEY_ID ? RAZORPAY_KEY_ID.substring(0, 8) : 'NOT_SET',
          secretKeyLength: RAZORPAY_KEY_SECRET ? RAZORPAY_KEY_SECRET.length : 0
        };
        
        logger.error('Razorpay 401 Unauthorized Error - Possible causes:', {
          ...errorInfo,
          suggestions: [
            'Check if API keys are correct for the environment',
            'Verify RAZORPAY_ENV matches your API key environment',
            'Ensure no whitespace in API keys',
            'Confirm you are using the correct API keys for test/live environment'
          ]
        });
      } else {
        logger.error('Razorpay API Error', errorInfo);
      }
      
      return Promise.reject(error);
    }
  );
}

// Diagnostic logging on module load
console.log('🔍 [Razorpay] Configuration loaded:');
console.log('🔍 [Razorpay] Environment:', RAZORPAY_ENV);
console.log('🔍 [Razorpay] Base URL:', BASE_URL);
console.log('🔍 [Razorpay] Key ID:', RAZORPAY_KEY_ID ? `${RAZORPAY_KEY_ID.substring(0, 8)}...` : 'NOT_SET');
console.log('🔍 [Razorpay] Secret Key:', RAZORPAY_KEY_SECRET ? `***${RAZORPAY_KEY_SECRET.length} chars***` : 'NOT_SET');
console.log('🔍 [Razorpay] Service Status:', isRazorpayConfigured ? '✅ ENABLED' : '❌ DISABLED (missing configuration)');

export const createOrder = async ({ orderId, amount, currency = 'INR', customer, notes, receipt = null }) => {
  if (!isRazorpayConfigured) {
    throw new Error('Razorpay service is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  try {
    const requestData = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: currency,
      receipt: receipt || `receipt_${orderId}`,
      notes: {
        orderId: orderId,
        customerId: customer?.customer_id,
        customerEmail: customer?.customer_email,
        customerPhone: customer?.customer_phone,
        orderNote: notes
      }
    };
    
    logger.info('Creating Razorpay order', {
      orderId,
      amount,
      currency,
      customerId: customer?.customer_id,
      environment: RAZORPAY_ENV
    });
    
    const { data } = await razorpayApi.post('/orders', requestData);
    
    logger.info('Razorpay order created successfully', {
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      receipt: data.receipt
    });
    
    // Transform response to match expected format
    const responseWithToken = {
      order_id: data.id,
      cf_order_id: data.id, // Keep for compatibility
      amount: data.amount, // Add Razorpay's amount in paise
      order_amount: amount, // Keep for compatibility (in rupees)
      order_currency: currency,
      order_status: data.status,
      payment_session_id: data.id, // Razorpay uses order ID as session ID
      order_token: data.id, // For frontend compatibility
      receipt: data.receipt,
      notes: data.notes
    };
    
    return responseWithToken;
  } catch (error) {
    logger.error('Failed to create Razorpay order', {
      orderId,
      amount,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

export const getOrder = async (orderId) => {
  try {
    logger.debug('Fetching Razorpay order', { orderId });
    
    const { data } = await razorpayApi.get(`/orders/${orderId}`);
    
    logger.debug('Razorpay order fetched', {
      orderId: data.id,
      status: data.status,
      amount: data.amount
    });
    
    // Transform to match expected format
    return {
      order_id: data.id,
      order_amount: data.amount / 100, // Convert from paise to rupees
      order_currency: data.currency,
      order_status: data.status,
      receipt: data.receipt,
      notes: data.notes
    };
  } catch (error) {
    logger.error('Failed to fetch Razorpay order', {
      orderId,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

export const verifyWebhookSignature = (payload, signature) => {
  try {
    if (!RAZORPAY_WEBHOOK_SECRET) {
      logger.error('Razorpay webhook secret is not configured');
      return false;
    }
    
    if (!payload || !signature) {
      logger.error('Webhook payload or signature is missing');
      return false;
    }
    
    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    // Compare signatures
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
    
    if (!isValid) {
      logger.error('Webhook signature verification failed', {
        expectedSignature: expectedSignature.substring(0, 16) + '...',
        receivedSignature: signature.substring(0, 16) + '...'
      });
      return false;
    }
    
    logger.info('Razorpay webhook signature verified successfully');
    return true;
  } catch (error) {
    logger.error('Webhook signature verification error', { error: error.message });
    return false;
  }
};

// Verify order status with Razorpay API for additional security
export const verifyOrderWithRazorpay = async (orderId) => {
  try {
    if (!isRazorpayConfigured) {
      logger.error('Razorpay service is not configured - cannot verify order', { orderId });
      return false;
    }

    logger.info('Verifying order with Razorpay API', { orderId });
    
    const order = await getOrder(orderId);
    
    // Verify the order exists and has valid status
    if (!order || !order.order_id) {
      logger.error('Order verification failed - order not found', { orderId });
      return false;
    }
    
    // Check if order status is valid
    const validStatuses = ['paid', 'attempted', 'created'];
    if (!validStatuses.includes(order.order_status)) {
      logger.warn('Order verification - invalid status', { 
        orderId, 
        status: order.order_status 
      });
      return false;
    }
    
    logger.info('Order verification successful', { 
      orderId, 
      status: order.order_status,
      amount: order.order_amount 
    });
    
    return true;
  } catch (error) {
    logger.error('Order verification failed', { 
      orderId, 
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
};

export const createRefund = async (paymentId, refundId, amount, reason, idempotencyKey = null) => {
  try {
    const requestData = {
      amount: Math.round(amount * 100), // Convert to paise
      speed: 'normal',
      notes: {
        reason: reason,
        refundId: refundId
      }
    };
    
    logger.info('Creating Razorpay refund', {
      paymentId,
      refundId,
      amount,
      reason
    });
    
    const config = {};
    if (idempotencyKey) {
      config.headers = { 'X-Razorpay-Idempotency': idempotencyKey };
    }
    
    const { data } = await razorpayApi.post(`/payments/${paymentId}/refund`, requestData, config);
    
    logger.info('Razorpay refund created successfully', {
      refundId: data.id,
      amount: data.amount,
      status: data.status
    });
    
    // Transform to match expected format
    return {
      refund_id: data.id,
      cf_refund_id: data.id, // Keep for compatibility
      refund_amount: data.amount / 100, // Convert from paise to rupees
      refund_status: data.status
    };
  } catch (error) {
    logger.error('Failed to create Razorpay refund', {
      paymentId,
      refundId,
      amount,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

// Get payment details
export const getPayment = async (paymentId) => {
  try {
    logger.debug('Fetching Razorpay payment', { paymentId });
    
    const { data } = await razorpayApi.get(`/payments/${paymentId}`);
    
    logger.debug('Razorpay payment fetched', {
      paymentId: data.id,
      status: data.status,
      amount: data.amount
    });
    
    return {
      payment_id: data.id,
      order_id: data.order_id,
      amount: data.amount / 100, // Convert from paise to rupees
      currency: data.currency,
      status: data.status,
      method: data.method,
      captured: data.captured,
      description: data.description,
      email: data.email,
      contact: data.contact,
      notes: data.notes
    };
  } catch (error) {
    logger.error('Failed to fetch Razorpay payment', {
      paymentId,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

// Health check function
export const checkRazorpayHealth = async () => {
  try {
    const { data } = await razorpayApi.get('/orders');
    return { healthy: true, data };
  } catch (error) {
    return { 
      healthy: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Create payout to user account
export const createPayout = async (payoutData) => {
  if (!isRazorpayConfigured) {
    throw new Error('Razorpay service is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  try {
    const requestData = {
      account_number: payoutData.account_number,
      fund_account_id: payoutData.fund_account_id,
      amount: payoutData.amount, // Already in paise
      currency: payoutData.currency || 'INR',
      mode: payoutData.mode || 'IMPS',
      purpose: payoutData.purpose || 'payout',
      queue_if_low_balance: payoutData.queue_if_low_balance !== false,
      reference_id: payoutData.reference_id,
      narration: payoutData.narration || 'DevHubs Project Payment'
    };
    
    logger.info('Creating Razorpay payout', {
      referenceId: payoutData.reference_id,
      amount: payoutData.amount,
      currency: payoutData.currency,
      mode: payoutData.mode,
      environment: RAZORPAY_ENV
    });
    
    const { data } = await razorpayApi.post('/payouts', requestData);
    
    logger.info('Razorpay payout created successfully', {
      payoutId: data.id,
      amount: data.amount,
      status: data.status,
      referenceId: data.reference_id
    });
    
    return {
      id: data.id,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      mode: data.mode,
      purpose: data.purpose,
      reference_id: data.reference_id,
      narration: data.narration,
      created_at: data.created_at
    };
  } catch (error) {
    logger.error('Failed to create Razorpay payout', {
      referenceId: payoutData.reference_id,
      amount: payoutData.amount,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
};

// Configuration getter for debugging
export const getRazorpayConfig = () => ({
  environment: RAZORPAY_ENV,
  baseUrl: BASE_URL,
  keyIdPrefix: RAZORPAY_KEY_ID ? RAZORPAY_KEY_ID.substring(0, 8) : null,
  secretKeyLength: RAZORPAY_KEY_SECRET ? RAZORPAY_KEY_SECRET.length : 0,
  webhookSecretConfigured: !!RAZORPAY_WEBHOOK_SECRET
});
