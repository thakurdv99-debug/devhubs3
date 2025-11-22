/**
 * Mock Payment Service
 * Handles simulated payment flows for development and testing
 */

class MockPaymentService {
  constructor() {
    this.mockDelay = 1000; // Simulate network delay
  }

  async createPaymentOrder(paymentData) {
    await this.delay();
    
    const orderId = `mock_order_${Date.now()}`;
    return {
      success: true,
      data: {
        order: {
          id: orderId,
          order_id: orderId,
          amount: paymentData.amount,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`,
          status: 'created'
        }
      }
    };
  }

  async processPayment(orderData) {
    await this.delay();
    
    const paymentId = `mock_pay_${Date.now()}`;
    return {
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderData.order_id,
      razorpay_signature: `mock_sign_${Date.now()}`
    };
  }

  async verifyPayment(orderId) {
    await this.delay();
    
    return {
      success: true,
      data: {
        verified: true,
        orderId: orderId,
        paymentId: `mock_pay_${Date.now()}`,
        status: 'paid'
      }
    };
  }

  async createRefund(paymentId, amount) {
    await this.delay();
    
    return {
      success: true,
      data: {
        refund_id: `mock_refund_${Date.now()}`,
        payment_id: paymentId,
        amount: amount,
        status: 'processed'
      }
    };
  }

  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.mockDelay));
  }
}

export const mockPaymentService = new MockPaymentService();