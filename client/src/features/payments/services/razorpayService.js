/**
 * Razorpay Integration Service
 * Handles all Razorpay payment operations on the frontend
 */

class RazorpayService {
  constructor() {
    this.isLoaded = false;
    this.loadPromise = null;
  }

  /**
   * Load Razorpay script dynamically
   */
  async loadScript() {
    if (this.isLoaded) return;
    
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      if (window.Razorpay) {
        this.isLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
      document.body.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Create payment order with backend
   */
  async createPaymentOrder(paymentData) {
    const endpoint = this.getPaymentEndpoint(paymentData.type);
    const requestBody = this.getPaymentRequestBody(paymentData);
    const token = localStorage.getItem('token');

    console.log('🔍 Creating payment order:', {
      endpoint,
      requestBody,
      token: token ? `${token.substring(0, 20)}...` : 'No token',
      apiUrl: import.meta.env.VITE_API_URL
    });

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Payment order creation failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: response.url
      });
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Initialize Razorpay payment
   */
  async initializePayment(orderData, paymentData, callbacks = {}) {
    await this.loadScript();

    // Get order ID from the correct structure
    const orderId = orderData.data?.order?.order_id || orderData.order?.order_id;
    const intentId = orderData.data?.intentId || orderData.intentId;
    
    console.log('🔍 Initializing payment with:', {
      orderId,
      intentId,
      orderData
    });

    if (!orderId) {
      throw new Error('Order ID not found in response');
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
      amount: Math.round(paymentData.amount * 100), // Convert to paise
      currency: 'INR',
      name: 'DeveloperProduct',
      description: this.getPaymentDescription(paymentData.type),
      order_id: orderId,
      handler: async (response) => {
        console.log('Payment success:', response);
        if (callbacks.onSuccess) {
          await callbacks.onSuccess(response, orderData, paymentData);
        }
      },
      prefill: {
        name: localStorage.getItem('username') || 'User',
        email: localStorage.getItem('email') || 'user@example.com',
        contact: localStorage.getItem('phone') || '9999999999'
      },
      notes: {
        orderId: orderId,
        purpose: paymentData.type,
        intentId: intentId
      },
      theme: {
        color: '#00A8E8'
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
          if (callbacks.onDismiss) {
            callbacks.onDismiss();
          }
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

    return razorpay;
  }

  /**
   * Verify payment with backend
   */
  async verifyPayment(orderId) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/verify-razorpay/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    return await response.json();
  }

  /**
   * Get payment endpoint based on payment type
   */
  getPaymentEndpoint(paymentType) {
    const endpoints = {
      'bid_fee': 'bid-fee',
      'bonus_funding': 'bonus',
      'subscription': 'subscription',
      'withdrawal_fee': 'withdrawal',
      'listing': 'listing'
    };

    return endpoints[paymentType] || 'subscription';
  }

  /**
   * Get payment request body based on payment type
   */
  getPaymentRequestBody(paymentData) {
    const { type, amount, projectId, bidId, contributorCount, planName, planType } = paymentData;

    const baseBody = { amount };

    switch (type) {
      case 'bid_fee':
        return {
          ...baseBody,
          projectId,
          bidId
        };
      case 'bonus_funding':
        return {
          ...baseBody,
          projectId,
          contributorsCount: contributorCount,
          projectTitle: 'Project Bonus Pool',
          isNewProject: !projectId
        };
      case 'subscription':
        return {
          ...baseBody,
          planName: planName || 'starter',
          planType: planType || 'monthly'
        };
      case 'withdrawal_fee':
        return baseBody;
      case 'listing':
        return {
          ...baseBody,
          projectId
        };
      default:
        return baseBody;
    }
  }

  /**
   * Get payment description based on payment type
   */
  getPaymentDescription(paymentType) {
    const descriptions = {
      'bid_fee': 'Bid fee payment',
      'bonus_funding': 'Bonus pool funding',
      'subscription': 'Premium subscription',
      'withdrawal_fee': 'Withdrawal fee',
      'listing': 'Project listing fee'
    };

    return descriptions[paymentType] || 'Payment for service';
  }

  /**
   * Process complete payment flow
   */
  async processPayment(paymentData, callbacks = {}) {
    try {
      // If mock mode is enabled, simulate payment flow and return a fake success result
      const MOCK_RAZORPAY = (import.meta.env.VITE_MOCK_RAZORPAY || 'false') === 'true';
      if (MOCK_RAZORPAY) {
        console.log('⚠️ Mock Razorpay enabled - simulating payment for', paymentData);

        // Simulate creating an order (structure similar to backend)
        const fakeOrderId = `mock_order_${Date.now()}`;
        const orderData = { data: { order: { order_id: fakeOrderId, amount: Math.round((paymentData.amount || 0) * 100) } } };

        // Small delay to mimic network latency
        await new Promise((res) => setTimeout(res, 200));

        // Simulated verification result (normally done on backend)
        const simulatedResult = {
          ...paymentData,
          status: 'success',
          orderId: fakeOrderId,
          paymentId: `mock_pay_${Date.now()}`,
          signature: 'mock_signature',
          createdAt: new Date().toISOString()
        };

        // Call success callback if provided
        if (callbacks.onSuccess) {
          try { callbacks.onSuccess(simulatedResult); } catch (err) { console.error('Mock onSuccess callback error', err); }
        }

        // Return a resolved promise with the simulated order data so callers expecting a Razorpay instance
        // still receive a truthy value (but not a real Razorpay object).
        return { mock: true, orderData };
      }

      // Create payment order
      const orderData = await this.createPaymentOrder(paymentData);
      
      console.log('🔍 Order data received:', orderData);

      // Initialize Razorpay payment
      const razorpay = await this.initializePayment(orderData, paymentData, {
        onSuccess: async (response, orderData, paymentData) => {
          try {
            // Get order ID from the correct structure
            const orderId = orderData.data?.order?.order_id || orderData.order?.order_id;
            console.log('🔍 Order ID for verification:', orderId);
            
            // Verify payment
            const verifyResult = await this.verifyPayment(orderId);
            
            if (verifyResult.success) {
              const result = {
                ...paymentData,
                status: 'success',
                orderId: orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                createdAt: new Date().toISOString()
              };
              
              if (callbacks.onSuccess) {
                callbacks.onSuccess(result);
              }
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            if (callbacks.onError) {
              callbacks.onError(error);
            }
          }
        },
        onDismiss: () => {
          if (callbacks.onDismiss) {
            callbacks.onDismiss();
          }
        }
      });

      return razorpay;
    } catch (error) {
      console.error('Payment processing error:', error);
      if (callbacks.onError) {
        callbacks.onError(error);
      }
      throw error;
    }
  }

  /**
   * Check if Razorpay is available
   */
  isAvailable() {
    return this.isLoaded && window.Razorpay;
  }

  /**
   * Get Razorpay configuration
   */
  getConfig() {
    return {
      keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
      mode: import.meta.env.VITE_RAZORPAY_MODE || 'test',
      isConfigured: !!import.meta.env.VITE_RAZORPAY_KEY_ID
    };
  }
}

// Create singleton instance
const razorpayService = new RazorpayService();

export default razorpayService;
