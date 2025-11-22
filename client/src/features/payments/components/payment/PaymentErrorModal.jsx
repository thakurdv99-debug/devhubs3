import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/paymentUtils';
import { getPaymentTypeDisplayName } from '../../utils/paymentUtils';
import { ErrorIcon } from '@shared/utils/iconUtils';

const PaymentErrorModal = ({ 
  isOpen, 
  onClose, 
  onRetry,
  paymentType, 
  amount, 
  error,
  errorCode 
}) => {
  if (!isOpen) return null;

  const getErrorMessage = (code) => {
    switch (code) {
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient funds in your account. Please check your balance and try again.';
      case 'PAYMENT_DECLINED':
        return 'Your payment was declined by the bank. Please check your payment method and try again.';
      case 'NETWORK_ERROR':
        return 'Network connection error. Please check your internet connection and try again.';
      case 'TIMEOUT':
        return 'Payment request timed out. Please try again.';
      case 'INVALID_AMOUNT':
        return 'Invalid payment amount. Please enter a valid amount and try again.';
      default:
        return error || 'An unexpected error occurred. Please try again.';
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: {
      y: "-100vh",
      opacity: 0,
    },
    visible: {
      y: "0",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
    exit: {
      y: "-100vh",
      opacity: 0,
    },
  };

  const iconVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  const iconInnerVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  const detailsVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 700,
        damping: 30,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            <div className="glass rounded-xl p-8 border border-gray-700 shadow-2xl text-center">
              {/* Error Icon */}
              <motion.div
                className="mx-auto w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mb-6"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={iconInnerVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-white"
                >
                  <ErrorIcon type={errorCode} className="w-8 h-8" />
                </motion.div>
              </motion.div>

              {/* Error Message */}
              <motion.h2
                className="text-2xl font-bold text-white mb-2"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                Payment Failed
              </motion.h2>

              <motion.p
                className="text-gray-400 mb-6"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                {getErrorMessage(errorCode)}
              </motion.p>

              {/* Error Details */}
              <motion.div
                className="bg-[#2A2A2A] rounded-lg p-4 mb-6"
                variants={detailsVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-white font-bold">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Type:</span>
                    <span className="text-white">
                      {getPaymentTypeDisplayName(paymentType)}
                    </span>
                  </div>
                  
                  {errorCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Error Code:</span>
                      <span className="text-red-400 font-mono text-sm">
                        {errorCode}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="flex gap-3"
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
              >
                <button
                  onClick={onClose}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                
                <button
                  onClick={onRetry}
                  className="btn-primary flex-1"
                >
                  Try Again
                </button>
              </motion.div>

              {/* Help Text */}
              <motion.p
                className="text-gray-500 text-xs mt-4"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                If the problem persists, please contact support
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentErrorModal;
