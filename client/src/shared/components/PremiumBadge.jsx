import React from 'react';

/**
 * Premium Badge Component
 * Displays different premium badges based on subscription plan
 * Professional design with icons instead of emojis
 */
const PremiumBadge = ({ 
  planName = 'starter', 
  planType = 'monthly', 
  size = 'medium',
  showText = true,
  className = ''
}) => {
  // Badge configurations for different plans
  const badgeConfigs = {
    starter: {
      name: 'Starter',
      color: 'from-blue-500 to-blue-600',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    pro: {
      name: 'Pro',
      color: 'from-purple-500 to-purple-600',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      )
    },
    enterprise: {
      name: 'Enterprise',
      color: 'from-yellow-500 to-orange-500',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  // Size configurations
  const sizeConfigs = {
    small: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    medium: {
      container: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    large: {
      container: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  const config = badgeConfigs[planName] || badgeConfigs.starter;
  const sizeConfig = sizeConfigs[size] || sizeConfigs.medium;

  return (
    <div className={`inline-flex items-center space-x-1.5 bg-gradient-to-r ${config.color} text-white rounded-full font-semibold shadow-lg ${sizeConfig.container} ${className}`}>
      <div className={`${sizeConfig.icon} flex-shrink-0`}>
        {config.icon}
      </div>
      {showText && (
        <span className={`${sizeConfig.text} font-medium`}>
          {config.name}
        </span>
      )}
    </div>
  );
};

/**
 * Subscription Status Badge
 * Shows current subscription status with expiration info
 */
export const SubscriptionStatusBadge = ({ 
  subscription, 
  size = 'small',
  showExpiry = false 
}) => {
  if (!subscription || !subscription.isActive) {
    return (
      <div className={`inline-flex items-center space-x-1.5 bg-gray-600 text-white rounded-full font-semibold ${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Free</span>
      </div>
    );
  }

  const isExpiringSoon = subscription.expiresAt && 
    new Date(subscription.expiresAt) - new Date() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <div className="flex flex-col items-end space-y-1">
      <PremiumBadge 
        planName={subscription.planName} 
        planType={subscription.planType}
        size={size}
      />
      {showExpiry && subscription.expiresAt && (
        <div className={`text-xs ${isExpiringSoon ? 'text-yellow-400' : 'text-gray-400'}`}>
          {isExpiringSoon ? 'Expires soon' : 'Active'}
        </div>
      )}
    </div>
  );
};

/**
 * Premium Feature Indicator
 * Shows when a feature requires premium access
 */
export const PremiumFeatureIndicator = ({ 
  feature, 
  userSubscription,
  size = 'small' 
}) => {
  const hasFeature = userSubscription?.features?.[feature] || false;
  
  if (hasFeature) {
    return (
      <div className={`inline-flex items-center space-x-1 text-green-400 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>Premium</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-1 text-gray-400 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
      </svg>
      <span>Premium Required</span>
    </div>
  );
};

export default PremiumBadge;
