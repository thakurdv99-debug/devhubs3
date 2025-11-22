import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/paymentUtils';
import { getPaymentTypeDisplayName } from '../../utils/paymentUtils';
import { CheckIcon } from '@shared/utils/iconUtils';

const PaymentSuccessModal = ({ 
  isOpen, 
  onClose, 
  paymentType, 
  amount, 
  transactionId,
  onContinue 
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      
      const countdownTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownTimer);
    }
  }, [isOpen, onClose]);

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

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

  const checkmarkVariants = {
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

  if (!isOpen) return null;

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
              {/* Success Icon */}
              <motion.div
                className="mx-auto w-20 h-20 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-full flex items-center justify-center mb-6"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={checkmarkVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-white"
                >
                  <CheckIcon className="w-8 h-8" />
                </motion.div>
              </motion.div>

              {/* Success Message */}
              <motion.h2
                className="text-2xl font-bold text-white mb-2"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                Payment Successful!
              </motion.h2>

              <motion.p
                className="text-gray-400 mb-6"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                Your {getPaymentTypeDisplayName(paymentType)} payment has been processed successfully.
              </motion.p>

              {/* Payment Details */}
              <motion.div
                className="bg-[#2A2A2A] rounded-lg p-4 mb-6"
                variants={detailsVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Amount:</span>
                    <span className="gradient-text font-bold text-lg">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                  
                  {transactionId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Transaction ID:</span>
                      <span className="text-white font-mono text-sm">
                        {transactionId.slice(-8)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Status:</span>
                    <span className="text-green-400 font-medium">Completed</span>
                  </div>
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
                
                {onContinue && (
                  <button
                    onClick={onContinue}
                    className="btn-primary flex-1"
                  >
                    Continue
                  </button>
                )}
              </motion.div>

              {/* Auto-close notice */}
              <motion.p
                className="text-gray-500 text-xs mt-4"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                This window will close automatically in {countdown} seconds
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentSuccessModal;
