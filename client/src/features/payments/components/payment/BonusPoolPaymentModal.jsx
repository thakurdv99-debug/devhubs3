import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentApi } from '../../services/paymentApi';
import RazorpayPaymentModal from './RazorpayPaymentModal';

const BonusPoolPaymentModal = ({ 
  isOpen, 
  onClose, 
  project, 
  onSuccess, 
  onError 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryAfter, setRetryAfter] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const bonusAmount = project?.bonus_pool_amount || 0;
  const contributorCount = project?.bonus_pool_contributors || 0;
  const totalBonusPool = bonusAmount * contributorCount;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle countdown for retry after
  useEffect(() => {
    if (retryAfter !== null && retryAfter > 0) {
      const interval = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [retryAfter]);

  const handleFundBonus = async () => {
    if (!project?.bonus_pool_amount || !project?.bonus_pool_contributors) {
      setError('Bonus pool details are required');
      return;
    }

    setLoading(true);
    setError('');
    setRetryAfter(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Use the centralized paymentApi service
      // For existing projects, use projectId; for new projects, use projectTitle
      const isNewProject = !project._id;
      const response = await paymentApi.createBonusFundingPayment(
        project._id || null, // projectId (null for new projects)
        Number(contributorCount), // Ensure it's a number
        project.project_Title || project.projectTitle || 'Untitled Project',
        isNewProject, // isNewProject: true if no _id
        Number(bonusAmount) // amountPerContributor - ensure it's a number
      );

      if (response.success && response.data) {
        setPaymentData(response.data);
        setShowPaymentModal(true);
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (error) {
      // Error is already logged by paymentApi
      const errorMessage = error.message || 'Failed to create payment. Please try again.';
      setError(errorMessage);
      
      // Handle 429 rate limit errors with retry information
      if (error.status === 429 && error.retryAfter) {
        setRetryAfter(error.retryAfter);
      } else {
        setRetryAfter(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result) => {
    setShowPaymentModal(false);
    // Pass both the Razorpay result and the payment intent ID
    const paymentResult = {
      ...result,
      intentId: paymentData?.intentId
    };
    onSuccess?.(paymentResult);
    onClose();
  };

  const handlePaymentError = (error) => {
    setShowPaymentModal(false);
    onError?.(error);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-6 border border-[#00A8E8]/20 shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Fund Bonus Pool</h3>
                  <p className="text-sm text-gray-400">{project?.project_Title}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bonus Pool Details */}
            <div className="space-y-4 mb-6">
              <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#00A8E8]/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#00A8E8]">{formatCurrency(bonusAmount)}</p>
                    <p className="text-xs text-gray-400">Per Contributor</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0062E6]">{contributorCount}</p>
                    <p className="text-xs text-gray-400">Contributors</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#00A8E8]/20 text-center">
                  <p className="text-3xl font-bold text-white">{formatCurrency(totalBonusPool)}</p>
                  <p className="text-sm text-gray-400">Total Bonus Pool</p>
                </div>
              </div>

              {/* Info Section */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">How it works:</h4>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• Bonus pool is funded upfront</li>
                  <li>• Distributed equally among selected contributors</li>
                  <li>• Minimum ₹200 per contributor required</li>
                  <li>• Paid upon project completion</li>
                </ul>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div 
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start text-red-400">
                  <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p>{error}</p>
                    {retryAfter !== null && retryAfter > 0 && (
                      <p className="text-xs text-red-300 mt-1">
                        Please wait {Math.ceil(retryAfter / 60)} minute{Math.ceil(retryAfter / 60) !== 1 ? 's' : ''} ({retryAfter} seconds) before trying again.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-[#2A2A2A] text-gray-300 py-3 px-4 rounded-lg font-semibold hover:bg-[#00A8E8]/20 transition-all duration-300 border border-[#00A8E8]/30"
                disabled={loading}
              >
                Cancel
              </button>
                             <button
                 onClick={handleFundBonus}
                 disabled={loading || !project?.bonus_pool_amount || !project?.bonus_pool_contributors}
                 className="flex-1 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#0090c9] hover:to-[#0052cc] transition-all duration-300 shadow-lg hover:shadow-[#00A8E8]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
               >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Fund Pool - {formatCurrency(totalBonusPool)}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Razorpay Payment Modal */}
      <RazorpayPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={paymentData}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </>
  );
};

export default BonusPoolPaymentModal;
