import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { CloseIcon, LockIcon } from "@shared/utils/iconUtils";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RazorpayPaymentModal = ({ isOpen, onClose, paymentData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MOCK_RAZORPAY = (import.meta.env.VITE_MOCK_RAZORPAY || 'false') === 'true';

  const simulateSuccess = () => {
    // Create a mock payment response
    const mockResponse = {
      razorpay_payment_id: 'mock_pay_' + Date.now(),
      razorpay_order_id: paymentData?.order?.order_id || paymentData?.order_id || 'mock_order_' + Date.now(),
      razorpay_signature: 'mock_sign_' + Date.now()
    };
    onSuccess?.(mockResponse);
  };

  const simulateFailure = () => {
    const fakeError = { code: 'MOCK_FAILED', description: 'Simulated payment failure' };
    onError?.(fakeError);
  };

  useEffect(() => {
    let mounted = true;

    const startRazorpayPayment = async () => {
      if (!isOpen) return;
      setLoading(true);
      setError("");

      const MOCK_RAZORPAY = (import.meta.env.VITE_MOCK_RAZORPAY || 'false') === 'true';
      // In mock mode we do NOT auto-complete the payment to avoid accidental bid creation.
      // Instead we present explicit buttons in the modal UI to simulate success/failure.
      if (MOCK_RAZORPAY) {
        // Let the modal render and show simulation controls. Do not auto-close or call onSuccess here.
        setLoading(false);
        return;
      }

      try {
        // Check if we're using mock payments
        if (MOCK_RAZORPAY) {
          // Simulate success after 1 second to mimic real payment flow
          setTimeout(() => {
            simulateSuccess();
          }, 1000);
          return;
        }
        
        // Load Razorpay SDK for real payments
        if (!window.Razorpay) {
          const isLoaded = await loadRazorpayScript();
          if (!isLoaded) throw new Error('Failed to load Razorpay script');
        }

        // If backend already provided an order (from createBid), use it. Otherwise create an order using payments API.
        let order = paymentData?.order;
        if (!order) {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/bid-fee`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              amount: paymentData?.amount,
              purpose: paymentData?.purpose || 'bid_fee',
              projectId: paymentData?.projectId,
              bidId: paymentData?.bidId
            })
          });
          if (!response.ok) throw new Error('Failed to create payment order');
          const orderJson = await response.json();
          order = orderJson.data?.order || orderJson.order;
        }

        // Validate order structure
        const orderId = order?.order_id || order?.id;
        if (!orderId) {
          console.error('Razorpay Payment Error: Order ID missing', { order, paymentData });
          throw new Error('Order ID is required for payment');
        }

        // Log order data for debugging
        console.log('Razorpay Payment: Order data', {
          orderId,
          orderAmount: order?.amount,
          orderAmountRupees: order?.order_amount,
          hasOrderId: !!orderId
        });

        // Get user data for prefill
        const userEmail = localStorage.getItem('email') || localStorage.getItem('userEmail') || '';
        const userPhone = localStorage.getItem('phone') || localStorage.getItem('userPhone') || '9999999999';
        const userName = localStorage.getItem('username') || localStorage.getItem('userName') || 'User';

        // Setup Razorpay options
        // Note: When order_id is present, Razorpay uses the order's amount automatically
        // Do NOT pass amount separately to avoid validation errors
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          // Remove amount field - Razorpay will use order's amount when order_id is present
          currency: 'INR',
          name: 'DevHubs',
          description: paymentData?.description || 'Bid Fee Payment',
          order_id: orderId,
          handler: function (response) {
            if (!mounted) return;
            onSuccess?.({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            setLoading(false);
          },
          prefill: {
            name: userName,
            email: userEmail || 'user@example.com',
            contact: userPhone || '9999999999'
          },
          theme: {
            color: '#00A8E8'
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          if (!mounted) return;
          setError('Payment failed. Please try again.');
          setLoading(false);
          onError?.(response.error);
        });
        rzp.open();
        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err?.message || 'An error occurred while initializing payment');
          setLoading(false);
          onError?.(err);
        }
      }
    };

    if (isOpen) startRazorpayPayment();
    return () => { mounted = false; };
  }, [isOpen, paymentData, onSuccess, onError]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-blue-500/30" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Complete Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center text-blue-300 mb-2">
              <LockIcon className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <div className="text-white">
              <div className="flex justify-between mb-1">
                <span>Total Payment:</span>
                <span>₹{paymentData?.amount || 0}</span>
              </div>
              <div className="text-xs text-gray-400">
                {paymentData?.purpose === 'bonus_funding'
                  ? 'Bonus pool funding payment'
                  : paymentData?.purpose === 'bid_fee'
                  ? 'Includes bid amount + ₹9 fee'
                  : 'Payment for service'
                }
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">
                {!import.meta.env.VITE_RAZORPAY_KEY_ID
                  ? "Test Mode: Simulating payment..."
                  : "Loading payment form..."}
              </p>
            </div>
          )}

          {/* Mock controls: explicit simulate buttons (only shown when MOCK_RAZORPAY is enabled) */}
          {MOCK_RAZORPAY && !loading && (
            <div className="py-4 flex flex-col items-center gap-3">
              <p className="text-sm text-yellow-300">Mock payment mode is ON. Use the buttons below to simulate payment outcome.</p>
              <div className="flex gap-3">
                <button onClick={simulateSuccess} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Simulate Success</button>
                <button onClick={simulateFailure} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">Simulate Failure</button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
              {error.includes("Razorpay Key ID not configured") && (
                <div className="mt-2 text-xs text-gray-400">
                  <p>To fix this error:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Create a <code className="bg-gray-800 px-1 rounded">.env</code> file in the client directory</li>
                    <li>Add: <code className="bg-gray-800 px-1 rounded">VITE_RAZORPAY_KEY_ID=your_razorpay_key_id</code></li>
                    <li>Add: <code className="bg-gray-800 px-1 rounded">VITE_RAZORPAY_MODE=test</code></li>
                    <li>Restart your development server</li>
                  </ol>
                  <p className="mt-2 text-blue-300">📖 See RAZORPAY_FRONTEND_SETUP.md for detailed instructions</p>
                </div>
              )}
            </div>
          )}

          <div id="razorpay-payment-container" className="min-h-[80px]" />
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">Your payment is secured by Razorpay's encryption</p>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default RazorpayPaymentModal;
