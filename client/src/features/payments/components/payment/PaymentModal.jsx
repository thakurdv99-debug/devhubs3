import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '../../context/PaymentContext';
import { formatCurrency } from '../../utils/paymentUtils';
import { PAYMENT_AMOUNTS, PAYMENT_TYPES } from '../../constants/paymentConstants';
import PaymentLoadingSpinner from './PaymentLoadingSpinner';
import PaymentSuccessModal from './PaymentSuccessModal';
import PaymentErrorModal from './PaymentErrorModal';
import { CloseIcon, LockIcon } from '@shared/utils/iconUtils';
import paymentService from '../../services/paymentService';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  paymentType, 
  amount, 
  projectId, 
  bidId, 
  contributorCount,
  planName,
  planType,
  onSuccess 
}) => {
  const { isProcessing, paymentError, startPayment, completePayment, handlePaymentError, clearPaymentError } = usePayment();
  const [selectedProvider, setSelectedProvider] = useState('razorpay');
  const [paymentData, setPaymentData] = useState({});

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      clearPaymentError();
      setPaymentData({});
    }
  }, [isOpen, clearPaymentError]);

  // Calculate amount based on payment type
  const calculateAmount = useMemo(() => {
    let calculatedAmount;
    switch (paymentType) {
      case PAYMENT_TYPES.BID_FEE:
        calculatedAmount = PAYMENT_AMOUNTS.BID_FEE;
        break;
      case PAYMENT_TYPES.BONUS_FUNDING:
        calculatedAmount = contributorCount * PAYMENT_AMOUNTS.BONUS_PER_CONTRIBUTOR;
        break;
      case PAYMENT_TYPES.SUBSCRIPTION:
        // Use the amount prop for subscription payments (dynamic pricing)
        calculatedAmount = amount || PAYMENT_AMOUNTS.SUBSCRIPTION;
        console.log('Subscription amount calculation:', {
          amountProp: amount,
          fallbackAmount: PAYMENT_AMOUNTS.SUBSCRIPTION,
          calculatedAmount,
          planName,
          planType
        });
        break;
      case PAYMENT_TYPES.WITHDRAWAL_FEE:
        calculatedAmount = PAYMENT_AMOUNTS.WITHDRAWAL_FEE;
        break;
      default:
        calculatedAmount = amount || 0;
    }
    return calculatedAmount;
  }, [paymentType, amount, contributorCount, planName, planType]);

  // Get payment title
  const getPaymentTitle = useMemo(() => {
    switch (paymentType) {
      case PAYMENT_TYPES.BID_FEE:
        return 'Pay Bid Fee';
      case PAYMENT_TYPES.BONUS_FUNDING:
        return 'Fund Bonus Pool';
      case PAYMENT_TYPES.SUBSCRIPTION:
        return `Subscribe to ${planName ? planName.charAt(0).toUpperCase() + planName.slice(1) : 'Premium'} Plan`;
      case PAYMENT_TYPES.WITHDRAWAL_FEE:
        return 'Withdrawal Fee';
      default:
        return 'Payment';
    }
  }, [paymentType, planName]);

  // Get payment description
  const getPaymentDescription = useMemo(() => {
    switch (paymentType) {
      case PAYMENT_TYPES.BID_FEE:
        return 'Pay ₹9 to place your bid on this project';
      case PAYMENT_TYPES.BONUS_FUNDING:
        return `Fund bonus pool for ${contributorCount} contributors`;
      case PAYMENT_TYPES.SUBSCRIPTION:
        return `Get premium features with ${planName ? planName.charAt(0).toUpperCase() + planName.slice(1) : 'Premium'} plan (${planType || 'monthly'})`;
      case PAYMENT_TYPES.WITHDRAWAL_FEE:
        return 'Pay ₹15 withdrawal fee';
      default:
        return 'Complete your payment';
    }
  }, [paymentType, contributorCount, planName, planType]);

  // Handle payment submission
  const handlePaymentSubmit = useCallback(async () => {
    try {
      const paymentAmount = calculateAmount;
      
      const paymentData = {
        type: paymentType,
        amount: paymentAmount,
        provider: selectedProvider,
        projectId,
        bidId,
        contributorCount,
        planName,
        planType
      };

      startPayment(paymentData);

      // Process payment using Razorpay service
      await razorpayService.processPayment(paymentData, {
        onSuccess: (result) => {
          completePayment(result);
          onSuccess?.(result);
          onClose();
        },
        onError: (error) => {
          handlePaymentError(error);
        },
        onDismiss: () => {
          handlePaymentError(new Error('Payment cancelled by user'));
        }
      });

    } catch (error) {
      console.error('Payment submission error:', error);
      handlePaymentError(error);
    }
  }, [calculateAmount, paymentType, selectedProvider, projectId, bidId, contributorCount, planName, planType, startPayment, completePayment, onSuccess, onClose, handlePaymentError]);


  // Modal variants for animation
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="glass rounded-xl p-6 border border-gray-700 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">{getPaymentTitle}</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Payment Info */}
              <div className="mb-6">
                <p className="text-gray-400 mb-4">{getPaymentDescription}</p>
                
                {/* Amount Display */}
                <div className="bg-[#2A2A2A] rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Amount:</span>
                    <span className="gradient-text text-2xl font-bold">
                      {formatCurrency(calculateAmount)}
                    </span>
                  </div>
                  
                  {/* Bonus funding details */}
                  {paymentType === PAYMENT_TYPES.BONUS_FUNDING && (
                    <div className="mt-2 text-sm text-gray-400">
                      {contributorCount} contributors × ₹200 each
                    </div>
                  )}
                  
                  {/* Subscription plan details */}
                  {paymentType === PAYMENT_TYPES.SUBSCRIPTION && planName && planType && (
                    <div className="mt-2 text-sm text-gray-400">
                      {planName.charAt(0).toUpperCase() + planName.slice(1)} Plan - {planType.charAt(0).toUpperCase() + planType.slice(1)} billing
                    </div>
                  )}
                </div>

                {/* Payment Provider Selection */}
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm font-medium mb-3">
                    Select Payment Provider
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedProvider('razorpay')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedProvider === 'razorpay'
                          ? 'border-[#00A8E8] bg-[#00A8E8]/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">Razorpay</div>
                        <div className="text-gray-400 text-sm">Recommended</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {paymentError && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                  <p className="text-red-400 text-sm">{paymentError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isProcessing}
                  className="btn-primary flex-1 relative"
                >
                  {isProcessing ? (
                    <>
                      <span className="opacity-0">Pay Now</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      </div>
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </div>

              {/* Security Notice */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 flex items-center justify-center">
                  <LockIcon className="w-3 h-3 mr-1" />
                  Secure payment powered by Razorpay
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Enhanced Loading Spinner */}
      <PaymentLoadingSpinner 
        isVisible={isProcessing} 
        message="Processing your payment..."
      />

      {/* Success Modal */}
      <PaymentSuccessModal
        isOpen={!isProcessing && paymentData.status === 'success'}
        onClose={() => {
          setPaymentData({});
          onClose();
          if (onSuccess) onSuccess();
        }}
        paymentType={paymentType}
        amount={calculateAmount}
        transactionId={paymentData.orderId}
        onContinue={onSuccess}
      />

      {/* Error Modal */}
      <PaymentErrorModal
        isOpen={!isProcessing && paymentError}
        onClose={() => {
          clearPaymentError();
          setPaymentData({});
        }}
        onRetry={handlePaymentSubmit}
        paymentType={paymentType}
        amount={calculateAmount}
        error={paymentError}
        errorCode={paymentData.errorCode}
      />
    </>
  );
};

export default PaymentModal;
