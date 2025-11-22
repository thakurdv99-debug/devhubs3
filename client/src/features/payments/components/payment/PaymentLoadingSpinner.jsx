import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, LockIcon } from '@shared/utils/iconUtils';

const PaymentLoadingSpinner = ({ 
  isVisible, 
  message = "Processing payment...",
  showProgress = true 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Initializing payment...",
    "Validating details...",
    "Connecting to payment gateway...",
    "Processing transaction...",
    "Finalizing payment..."
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return steps.length - 1;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
    };
  }, [isVisible, steps.length]);

  if (!isVisible) return null;

  const percentage = progress;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const progressVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 8 },
  };

  const stepsVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const percentageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          
          {/* Loading Container */}
          <motion.div
            className="relative w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="glass rounded-xl p-8 border border-gray-700 shadow-2xl text-center">
              {/* Spinner */}
              <motion.div
                className="mx-auto w-20 h-20 mb-6"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-full h-full border-4 border-[#2A2A2A] border-t-[#00A8E8] rounded-full" />
              </motion.div>

              {/* Loading Message */}
              <motion.h2
                className="text-xl font-semibold text-white mb-2"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                Processing Payment
              </motion.h2>

              <motion.p
                className="text-gray-400 mb-6"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                {message}
              </motion.p>

              {/* Progress Bar */}
              <motion.div
                className="w-full bg-[#2A2A2A] rounded-full h-2 mb-4"
                variants={progressVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] h-2 rounded-full"
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </motion.div>

              {/* Progress Steps */}
              <motion.div
                className="space-y-2"
                variants={stepsVariants}
                initial="hidden"
                animate="visible"
              >
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-3"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.5 }}
                  >
                    <motion.div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index < currentStep
                          ? 'bg-green-500 text-white'
                          : index === currentStep
                          ? 'bg-[#00A8E8] text-white'
                          : 'bg-[#2A2A2A] text-gray-400'
                      }`}
                      animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {index < currentStep ? (
                        <CheckIcon className="w-3 h-3" />
                      ) : (
                        index + 1
                      )}
                    </motion.div>
                    <span className={`text-sm ${
                      index < currentStep
                        ? 'text-green-400'
                        : index === currentStep
                        ? 'text-white'
                        : 'text-gray-400'
                    }`}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Percentage */}
              <motion.div
                className="mt-6"
                variants={percentageVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.span
                  className="gradient-text text-2xl font-bold"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {percentage}%
                </motion.span>
              </motion.div>

              {/* Security Notice */}
              <motion.p
                className="text-gray-500 text-xs mt-4 flex items-center justify-center"
                variants={textVariants}
                initial="hidden"
                animate="visible"
              >
                <LockIcon className="w-3 h-3 mr-1" />
                Secure payment processing...
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentLoadingSpinner;
