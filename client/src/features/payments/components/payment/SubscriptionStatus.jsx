import React, { useState } from 'react';
import { usePayment } from '../../context/PaymentContext';
import { formatCurrency } from '../../utils/paymentUtils';
import { useSubscription } from '../../utils/subscriptionUtils';
import { PAYMENT_AMOUNTS } from '../../constants/paymentConstants';
import PaymentModal from './PaymentModal';
import PremiumBadge from '@shared/components/PremiumBadge';

const SubscriptionStatus = () => {
  const { subscription } = usePayment();
  const { getDaysRemaining, isExpiringSoon, getStatusText } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Use subscription utilities for calculations
  const daysRemaining = getDaysRemaining();
  const expiringSoon = isExpiringSoon();

  // Get subscription status color
  const getStatusColor = () => {
    if (daysRemaining === 0) return 'text-red-500';
    if (expiringSoon) return 'text-yellow-500';
    return 'text-green-500';
  };


  return (
    <div className="space-y-4">
      {/* Simplified Subscription Card */}
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-6 border border-[#00A8E8]/20 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">Premium Status</h3>
            {subscription.isActive && (
              <PremiumBadge 
                planName={subscription.planName || 'starter'}
                planType={subscription.planType || 'monthly'}
                size="small"
              />
            )}
          </div>
          <div className={`text-sm font-semibold ${getStatusColor()}`}>
            {getStatusText()}
          </div>
        </div>

        {/* Subscription Details */}
        {subscription.isActive ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-[#2A2A2A] rounded-lg">
              <span className="text-gray-300 text-sm">Plan:</span>
              <span className="text-white font-medium capitalize">
                {subscription.planName || 'Starter'} {subscription.planType || 'Monthly'}
              </span>
            </div>
            
            {subscription.expiresAt && (
              <div className="flex justify-between items-center p-3 bg-[#2A2A2A] rounded-lg">
                <span className="text-gray-300 text-sm">Expires:</span>
                <span className="text-white font-medium">
                  {new Date(subscription.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-4 bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 rounded-lg border border-[#00A8E8]/20">
            <div className="text-2xl font-bold bg-gradient-to-r from-[#00A8E8] to-[#0062E6] bg-clip-text text-transparent mb-1">
              {formatCurrency(PAYMENT_AMOUNTS.SUBSCRIPTION)}/month
            </div>
            <p className="text-gray-300 text-sm">Unlock unlimited access</p>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          {subscription.isActive ? (
            <button 
              onClick={() => window.location.href = '/subscription'}
              className="w-full bg-[#00A8E8] hover:bg-[#0096D6] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Manage
            </button>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0062E6] hover:from-[#0096D6] hover:to-[#0056CC] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Subscribe
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentType="subscription"
        onSuccess={(result) => {
          console.log('Subscription payment successful:', result);
          setShowPaymentModal(false);
        }}
      />
    </div>
  );
};

export default SubscriptionStatus;
