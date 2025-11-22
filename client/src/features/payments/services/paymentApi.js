import API_BASE_URL from '@shared/config/api';
import { PAYMENT_ERRORS } from '../constants/paymentConstants';
import { logger } from '@shared/utils/logger';

// Payment API endpoints
const PAYMENT_ENDPOINTS = {
  BID_FEE: `${API_BASE_URL}/api/payments/bid-fee`,
  LISTING: `${API_BASE_URL}/api/payments/listing`,
  BONUS: `${API_BASE_URL}/api/payments/bonus`,
  SUBSCRIPTION: `${API_BASE_URL}/api/payments/subscription`,
  WITHDRAWAL: `${API_BASE_URL}/api/payments/withdrawal`,
  PAYMENT_STATUS: (orderId) => `${API_BASE_URL}/api/payments/status/${orderId}`,
  PAYMENT_HISTORY: `${API_BASE_URL}/api/payments/history`,
  SUBSCRIPTION_STATUS: `${API_BASE_URL}/api/payments/subscription/status`,
  BONUS_POOLS: `${API_BASE_URL}/api/payments/bonus-pools`,
  WITHDRAWAL_HISTORY: `${API_BASE_URL}/api/payments/withdrawal/history`,
  PAYMENT_ANALYTICS: `${API_BASE_URL}/api/payments/analytics`,
  PAYMENT_SUMMARY: `${API_BASE_URL}/api/payments/summary`,
  REFUND_HISTORY: `${API_BASE_URL}/api/payments/refund/history`,
  PROCESS_REFUND: (paymentIntentId) => `${API_BASE_URL}/api/payments/refund/${paymentIntentId}`,
  CHECK_PAYMENT: (orderId) => `${API_BASE_URL}/api/payments/check/${orderId}`
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let retryAfter = null;
    
    // Check for 429 rate limit error
    if (response.status === 429) {
      // Extract Retry-After header (can be read multiple times)
      const retryAfterHeader = response.headers.get('Retry-After');
      if (retryAfterHeader) {
        retryAfter = parseInt(retryAfterHeader, 10);
      }
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        // Use retryAfter from response body if available (takes precedence over header)
        if (errorData.retryAfter || errorData.retryAfterSeconds) {
          retryAfter = errorData.retryAfter || errorData.retryAfterSeconds;
        }
      } catch (e) {
        // If JSON parsing fails, use default error message
      }
      
      // Create enhanced error with retry information
      const error = new Error(errorMessage);
      error.status = 429;
      error.retryAfter = retryAfter;
      if (retryAfter) {
        const minutes = Math.ceil(retryAfter / 60);
        error.message = `${errorMessage} Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
      }
      throw error;
    }
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // If JSON parsing fails, use default error message
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid response format');
  }
};

// Helper function to make API requests
const makeRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  
  // Properly merge headers - ensure Authorization is always included
  const mergedHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {}) // Merge any additional headers from options
  };

  const requestOptions = {
    ...options, // Spread method, body, etc.
    headers: mergedHeaders // Override with properly merged headers
  };

  try {
    const response = await fetch(url, requestOptions);
    return handleResponse(response);
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(PAYMENT_ERRORS.NETWORK_ERROR);
    }
    throw error;
  }
};

// Payment API functions
export const paymentApi = {
  // Bid Fee Payment
  createBidFeePayment: async (projectId, bidId) => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.BID_FEE, {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          bidId,
          amount: 9,
          purpose: 'bid_fee'
        })
      });
      return response.data;
    } catch (error) {
      logger.error('Bid fee payment error:', error);
      throw error;
    }
  },

  // Bonus Funding Payment
  createBonusFundingPayment: async (projectId, contributorCount, projectTitle, isNewProject = false, amountPerContributor = 200) => {
    try {
      // Validate required fields
      const contributorsCountNum = Number(contributorCount);
      if (!contributorsCountNum || contributorsCountNum < 1 || !Number.isInteger(contributorsCountNum)) {
        throw new Error('Contributor count must be a positive integer (at least 1)');
      }

      // Explicitly convert isNewProject to boolean
      const isNew = Boolean(isNewProject);

      // Build request body based on validation schema requirements
      const requestBody = {
        contributorsCount: contributorsCountNum, // Must be a number, integer, min 1
        isNewProject: isNew
      };

      if (isNew) {
        // For new projects: projectTitle and amountPerContributor are required
        if (!projectTitle || String(projectTitle).trim() === '') {
          throw new Error('Project title is required for new projects');
        }
        const amountPerContributorNum = Number(amountPerContributor);
        if (!amountPerContributorNum || amountPerContributorNum < 200 || !Number.isInteger(amountPerContributorNum)) {
          throw new Error('Amount per contributor must be at least ₹200 and must be an integer');
        }
        requestBody.projectTitle = String(projectTitle).trim();
        requestBody.amountPerContributor = amountPerContributorNum;
      } else {
        // For existing projects: projectId is required (must be a string, not null)
        if (!projectId || String(projectId).trim() === '') {
          throw new Error('Project ID is required for existing projects');
        }
        requestBody.projectId = String(projectId).trim();
        // Include amountPerContributor if provided (optional for existing projects)
        if (amountPerContributor && Number(amountPerContributor) >= 200) {
          requestBody.amountPerContributor = Number(amountPerContributor);
        }
      }

      logger.debug('Bonus funding request body:', requestBody);

      const response = await makeRequest(PAYMENT_ENDPOINTS.BONUS, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      // handleResponse already returns the parsed JSON, so return the full response
      return response;
    } catch (error) {
      logger.error('Bonus funding payment error:', error);
      throw error;
    }
  },

  // Subscription Payment
  createSubscriptionPayment: async (planName = 'starter', planType = 'monthly', amount) => {
    try {
      logger.payment('Creating subscription payment:', { planName, planType, amount });
      const response = await makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION, {
        method: 'POST',
        body: JSON.stringify({
          planName,
          planType,
          amount,
          purpose: 'subscription'
        })
      });
      logger.debug('Subscription payment response:', response);
      return response.data;
    } catch (error) {
      logger.error('Subscription payment error:', error);
      logger.debug('Error details:', error.response?.data || error.message);
      throw error;
    }
  },

  // Withdrawal Fee Payment
  createWithdrawalPayment: async (amount) => {
    try {
      if (!amount || amount <= 0 || amount > 10000) {
        throw new Error('Invalid withdrawal amount. Must be between ₹1 and ₹10,000');
      }
      
      const response = await makeRequest(PAYMENT_ENDPOINTS.WITHDRAWAL, {
        method: 'POST',
        body: JSON.stringify({
          amount,
          fee: 15,
          purpose: 'withdrawal_fee'
        })
      });
      return response.data;
    } catch (error) {
      logger.error('Withdrawal payment error:', error);
      throw error;
    }
  },

  // Get Payment History
  getPaymentHistory: async (page = 1, limit = 50) => {
    try {
      const response = await makeRequest(`${PAYMENT_ENDPOINTS.PAYMENT_HISTORY}?page=${page}&limit=${limit}`);
      return response.data?.payments || [];
    } catch (error) {
      logger.error('Get payment history error:', error);
      throw error;
    }
  },

  // Get Withdrawal History
  getWithdrawalHistory: async (page = 1, limit = 50) => {
    try {
      const response = await makeRequest(`${PAYMENT_ENDPOINTS.WITHDRAWAL_HISTORY}?page=${page}&limit=${limit}`);
      return response.data?.withdrawals || [];
    } catch (error) {
      logger.error('Get withdrawal history error:', error);
      throw error;
    }
  },

  // Get Bonus Pools
  getBonusPools: async () => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.BONUS_POOLS);
      return response.data || [];
    } catch (error) {
      logger.error('Get bonus pools error:', error);
      throw error;
    }
  },

  // Get Subscription Status
  getSubscriptionStatus: async () => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.SUBSCRIPTION_STATUS);
      return response.data;
    } catch (error) {
      logger.error('Get subscription status error:', error);
      throw error;
    }
  },

  // Get Subscription Plans
  getSubscriptionPlans: async () => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/subscription/plans`);
      return response.data;
    } catch (error) {
      logger.error('Get subscription plans error:', error);
      throw error;
    }
  },

  // Activate Subscription
  activateSubscription: async (paymentIntentId) => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/subscription/activate/${paymentIntentId}`, {
        method: 'POST'
      });
      return response.data;
    } catch (error) {
      logger.error('Activate subscription error:', error);
      throw error;
    }
  },

  // Cancel Subscription
  cancelSubscription: async () => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/subscription/cancel`, {
        method: 'POST'
      });
      return response.data;
    } catch (error) {
      logger.error('Cancel subscription error:', error);
      throw error;
    }
  },

  // Check Payment Status
  getPaymentStatus: async (orderId) => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.PAYMENT_STATUS(orderId));
      return response.data;
    } catch (error) {
      logger.error('Get payment status error:', error);
      throw error;
    }
  },

  // Get Payment Analytics
  getPaymentAnalytics: async (period = '30d') => {
    try {
      const response = await makeRequest(`${PAYMENT_ENDPOINTS.PAYMENT_ANALYTICS}?period=${period}`);
      return response.data;
    } catch (error) {
      logger.error('Get payment analytics error:', error);
      throw error;
    }
  },

  // Get Payment Summary
  getPaymentSummary: async () => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.PAYMENT_SUMMARY);
      return response.data;
    } catch (error) {
      logger.error('Get payment summary error:', error);
      throw error;
    }
  },

  // Get Refund History
  getRefundHistory: async (page = 1, limit = 50) => {
    try {
      const response = await makeRequest(`${PAYMENT_ENDPOINTS.REFUND_HISTORY}?page=${page}&limit=${limit}`);
      return response.data?.refunds || [];
    } catch (error) {
      logger.error('Get refund history error:', error);
      throw error;
    }
  },

  // Process Refund
  processRefund: async (paymentIntentId, reason = 'User requested refund') => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.PROCESS_REFUND(paymentIntentId), {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      return response.data;
    } catch (error) {
      logger.error('Process refund error:', error);
      throw error;
    }
  },

  // Check Payment and Update Bid
  checkPaymentAndUpdateBid: async (orderId) => {
    try {
      const response = await makeRequest(PAYMENT_ENDPOINTS.CHECK_PAYMENT(orderId));
      return response.data;
    } catch (error) {
      logger.error('Check payment error:', error);
      throw error;
    }
  },


  // Update Payment Method
  updatePaymentMethod: async (paymentMethodId) => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/payment-method`, {
        method: 'PUT',
        body: JSON.stringify({ paymentMethodId })
      });
      return response.data;
    } catch (error) {
      logger.error('Update payment method error:', error);
      throw error;
    }
  },

  // Verify Payment with Razorpay
  verifyPayment: async (paymentId, orderId, signature) => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/verify`, {
        method: 'POST',
        body: JSON.stringify({
          paymentId,
          orderId,
          signature
        })
      });
      return response.data;
    } catch (error) {
      logger.error('Verify payment error:', error);
      throw error;
    }
  },

  // Get Payment Receipt
  getPaymentReceipt: async (paymentId) => {
    try {
      const response = await makeRequest(`${API_BASE_URL}/api/payments/receipt/${paymentId}`);
      return response.data;
    } catch (error) {
      logger.error('Get payment receipt error:', error);
      throw error;
    }
  }
};

export default paymentApi;
