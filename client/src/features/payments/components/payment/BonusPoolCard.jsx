import React from 'react';
import { motion } from 'framer-motion';

const BonusPoolCard = ({ project, onFundBonus, isOwner = false, isFunded = false }) => {
  const bonusAmount = project.bonus_pool_amount || 0;
  const contributorCount = project.bonus_pool_contributors || 0;
  const totalBonusPool = bonusAmount * contributorCount;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      y: -2,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-6 border border-[#00A8E8]/20 shadow-lg shadow-[#00A8E8]/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Bonus Pool</h3>
            <p className="text-sm text-gray-400">Reward distribution for contributors</p>
          </div>
        </div>
        {isFunded && (
          <div className="flex items-center bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            Funded
          </div>
        )}
      </div>

      {/* Bonus Pool Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{formatCurrency(totalBonusPool)}</p>
          <p className="text-xs text-gray-400">Total Pool</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#00A8E8]">{formatCurrency(bonusAmount)}</p>
          <p className="text-xs text-gray-400">Per Contributor</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[#0062E6]">{contributorCount}</p>
          <p className="text-xs text-gray-400">Contributors</p>
        </div>
      </div>

      {/* Status and Actions */}
      <div className="space-y-3">
        {isOwner && !isFunded && (
          <motion.button
            onClick={onFundBonus}
            className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#0090c9] hover:to-[#0052cc] transition-all duration-300 shadow-lg hover:shadow-[#00A8E8]/30"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Fund Bonus Pool - {formatCurrency(totalBonusPool)}
            </span>
          </motion.button>
        )}

        {isOwner && isFunded && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-green-400 text-sm text-center">
              ✅ Bonus pool is funded and ready for distribution
            </p>
          </div>
        )}

        {!isOwner && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-400 text-sm text-center">
              💰 Earn up to {formatCurrency(bonusAmount)} bonus by contributing to this project
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">How it works:</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Project owner funds the bonus pool upfront</li>
            <li>• Bonus is distributed equally among selected contributors</li>
            <li>• Minimum ₹200 per contributor required</li>
            <li>• Bonus is paid upon project completion</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default BonusPoolCard;
