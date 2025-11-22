import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { CloseIcon, LockIcon } from "@shared/utils/iconUtils";

const BidPaymentModal = ({ isOpen, onClose, paymentData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const containerRef = useRef(null);
  const cardRef = useRef(null);      // Cashfree card element
  const cashfreeRef = useRef(null);  // SDK instance
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && paymentData && !initializedRef.current) {
      initializedRef.current = true;
      initializePayment();
    }
    return () => {
      try {
        cardRef.current?.unmount?.();
      } catch {
        // Ignore unmount errors
      }
      if (containerRef.current) containerRef.current.innerHTML = "";
      initializedRef.current = false;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, paymentData]);

  const initializePayment = async () => {
    setLoading(true);
    setError("");

    const appId = import.meta.env.VITE_CASHFREE_APP_ID;
    const mode = (import.meta.env.VITE_CASHFREE_MODE || "sandbox").toLowerCase();

    try {
      if (!appId) throw new Error("Cashfree App ID not configured");
      if (typeof window === "undefined" || typeof window.Cashfree === "undefined")
        throw new Error("Cashfree SDK not loaded");

      const order = paymentData?.order || {};
      const paymentSessionId = order.payment_session_id || order.order_token || null;
      if (!paymentSessionId) throw new Error("Missing payment session id");

      console.log("🔧 Initializing Cashfree SDK with mode:", mode);
      const cashfree = new window.Cashfree({ mode });
      cashfreeRef.current = cashfree;

      console.log("🔧 Available Cashfree methods:", Object.keys(cashfree));

      // ---- OPTION A: Modern Checkout Modal (preferred) ----
      if (typeof cashfree.checkout === "function") {
        console.log("🔧 Using modern checkout method");
        await cashfree.checkout({
          paymentSessionId,
          redirectTarget: "_modal", // "_self" to redirect full page
        });
        return;
      }

      // ---- OPTION B: Modern Elements API ----
      if (typeof cashfree.create === "function") {
        console.log("🔧 Using modern Elements API");
        const container = containerRef.current || document.getElementById("cashfree-payment-container");
        if (!container) throw new Error("Payment container not found");
        container.innerHTML = "";

        // Create card element
        const card = cashfree.create("card", {
          style: {
            base: {
              fontSize: '16px',
              color: '#ffffff',
              backgroundColor: '#1a1a1a',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              padding: '12px'
            }
          }
        });
        cardRef.current = card;

        console.log("🔧 Card element created:", card);

        // Mount the card
        try {
          card.mount("#cashfree-payment-container");
          console.log("🔧 Card mounted successfully using selector");
        } catch {
          console.log("🔧 Selector mount failed, trying DOM element mount");
          if (!(container instanceof Element)) throw new Error("Container is not a valid DOM element");
          card.mount(container);
          console.log("🔧 Card mounted successfully using DOM element");
        }

        setReady(true); // enable "Pay Now" button
        return;
      }

      // ---- OPTION C: Legacy Methods (fallback) ----
      console.log("🔧 Modern API not available, trying legacy methods");
      
      if (typeof cashfree.elements === "function") {
        console.log("🔧 Using legacy elements method");
        const container = containerRef.current || document.getElementById("cashfree-payment-container");
        if (!container) throw new Error("Payment container not found");
        container.innerHTML = "";

        const paymentForm = cashfree.elements({
          orderToken: paymentSessionId,
          orderNumber: order.order_id,
          appId: appId,
          orderAmount: paymentData.amount,
          orderCurrency: "INR",
          customerName: localStorage.getItem("username") || "User",
          customerEmail: localStorage.getItem("email") || order.customer_details?.customer_email || "user@example.com",
          customerPhone: localStorage.getItem("phone") || order.customer_details?.customer_phone || "9999999999",
          orderNote: order.order_note || "Bid payment",
          source: "web",
          returnUrl: `${window.location.origin}?payment=success`,
          notifyUrl: `${import.meta.env.VITE_API_URL}/api/webhooks/cashfree`,
          style: {
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #3b82f6',
            padding: '16px'
          },
          onPaymentSuccess: (result) => {
            console.log("✅ Payment success:", result);
            onSuccess?.(result);
          },
          onPaymentFailure: (error) => {
            console.log("❌ Payment failure:", error);
            onError?.("Payment failed. Please try again.");
          },
          onClose: () => {
            console.log("🔒 Payment form closed");
            onClose?.();
          }
        });

        if (typeof paymentForm.render === 'function') {
          paymentForm.render(container);
        } else {
          container.appendChild(paymentForm);
        }
        return;
      }

      if (typeof cashfree.drop === "function") {
        console.log("🔧 Using legacy drop method");
        const container = containerRef.current || document.getElementById("cashfree-payment-container");
        if (!container) throw new Error("Payment container not found");
        container.innerHTML = "";

        cashfree.drop({
          orderToken: paymentSessionId,
          orderNumber: order.order_id,
          appId: appId,
          orderAmount: paymentData.amount,
          orderCurrency: "INR",
          customerName: localStorage.getItem("username") || "User",
          customerEmail: localStorage.getItem("email") || order.customer_details?.customer_email || "user@example.com",
          customerPhone: localStorage.getItem("phone") || order.customer_details?.customer_phone || "9999999999",
          orderNote: order.order_note || "Bid payment",
          source: "web",
          returnUrl: `${window.location.origin}?payment=success`,
          notifyUrl: `${import.meta.env.VITE_API_URL}/api/webhooks/cashfree`,
          onPaymentSuccess: (result) => {
            console.log("✅ Payment success:", result);
            onSuccess?.(result);
          },
          onPaymentFailure: (error) => {
            console.log("❌ Payment failure:", error);
            onError?.("Payment failed. Please try again.");
          },
          onClose: () => {
            console.log("🔒 Payment form closed");
            onClose?.();
          }
        });
        return;
      }

      throw new Error("No compatible Cashfree payment method found");

    } catch (err) {
      console.error("Payment init error:", err);
      setError(err.message || "Payment failed. Please try again.");
      onError?.(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setLoading(true);
      const order = paymentData?.order || {};
      const paymentSessionId = order.payment_session_id || order.order_token || null;

      const result = await cashfreeRef.current.pay({
        paymentSessionId,
        paymentMethod: cardRef.current,
        savePaymentInstrument: false,
      });
      onSuccess?.(result);
    } catch (e) {
      console.error("Cashfree pay error:", e);
      onError?.("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-blue-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Complete Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center text-blue-300 mb-2">
              <LockIcon className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <div className="text-white">
              <div className="flex justify-between mb-1">
                <span>Total Payment:</span>
                <span>₹{paymentData?.amount || 9}</span>
              </div>
              <div className="text-xs text-gray-400">Includes bid amount + ₹9 fee</div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-300">
                {!import.meta.env.VITE_CASHFREE_APP_ID
                  ? "Test Mode: Simulating payment..."
                  : "Loading payment form..."}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Container for Elements */}
          <div id="cashfree-payment-container" ref={containerRef} className="min-h-[300px]" />

          {/* Pay Now button (only when Elements is active) */}
          {ready && !loading && (
            <button
              onClick={handlePayNow}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Pay Now
            </button>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Your payment is secured by Cashfree's encryption
            </p>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default BidPaymentModal;
