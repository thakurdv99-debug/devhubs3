/**
 * Subscription Utilities
 * Handles subscription perks, features, and permissions
 */

import { usePayment } from '../context/PaymentContext';

// Subscription features mapping
export const SUBSCRIPTION_FEATURES = {
  UNLIMITED_BIDS: 'unlimitedBids',
  PRIORITY_SUPPORT: 'prioritySupport',
  ADVANCED_ANALYTICS: 'advancedAnalytics',
  PREMIUM_BADGE: 'premiumBadge',
  EARLY_ACCESS: 'earlyAccess',
  CUSTOM_PROFILE: 'customProfile',
  PROJECT_BOOSTING: 'projectBoosting',
  TEAM_COLLABORATION: 'teamCollaboration'
};

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  MAX_PROJECTS: 'maxProjects',
  MAX_TEAM_MEMBERS: 'maxTeamMembers',
  MAX_FILE_UPLOADS: 'maxFileUploads'
};

// Free user limits
export const FREE_USER_LIMITS = {
  maxProjects: 2,
  maxTeamMembers: 1,
  maxFileUploads: 10,
  maxBids: 3
};

/**
 * Check if user has a specific subscription feature
 */
export const hasFeature = (subscription, featureName) => {
  if (!subscription || !subscription.isActive) {
    return false;
  }
  
  return subscription.features && subscription.features[featureName] === true;
};

/**
 * Check if user has reached a specific limit
 */
export const checkLimit = (subscription, limitType, currentUsage) => {
  if (!subscription || !subscription.isActive) {
    // Free user limits
    const freeLimit = FREE_USER_LIMITS[limitType];
    return freeLimit ? currentUsage < freeLimit : false;
  }
  
  const limit = subscription.limits && subscription.limits[limitType];
  if (limit === -1) return true; // unlimited
  if (!limit) return false;
  
  return currentUsage < limit;
};

/**
 * Get user's current limits
 */
export const getUserLimits = (subscription) => {
  if (!subscription || !subscription.isActive) {
    return FREE_USER_LIMITS;
  }
  
  return {
    maxProjects: subscription.limits?.maxProjects || FREE_USER_LIMITS.maxProjects,
    maxTeamMembers: subscription.limits?.maxTeamMembers || FREE_USER_LIMITS.maxTeamMembers,
    maxFileUploads: subscription.limits?.maxFileUploads || FREE_USER_LIMITS.maxFileUploads,
    maxBids: subscription.features?.unlimitedBids ? -1 : FREE_USER_LIMITS.maxBids
  };
};

/**
 * Check if user can perform a specific action
 */
export const canPerformAction = (subscription, actionType, currentUsage = 0) => {
  switch (actionType) {
    case 'bid':
      return hasFeature(subscription, SUBSCRIPTION_FEATURES.UNLIMITED_BIDS) || 
             checkLimit(subscription, 'maxBids', currentUsage);
    
    case 'list_project':
      return checkLimit(subscription, SUBSCRIPTION_LIMITS.MAX_PROJECTS, currentUsage);
    
    case 'team_collaboration':
      return hasFeature(subscription, SUBSCRIPTION_FEATURES.TEAM_COLLABORATION);
    
    case 'project_boosting':
      return hasFeature(subscription, SUBSCRIPTION_FEATURES.PROJECT_BOOSTING);
    
    case 'advanced_analytics':
      return hasFeature(subscription, SUBSCRIPTION_FEATURES.ADVANCED_ANALYTICS);
    
    case 'custom_profile':
      return hasFeature(subscription, SUBSCRIPTION_FEATURES.CUSTOM_PROFILE);
    
    case 'priority_support':
      return hasFeature(subscription, SUBSCRIPTION_FEATURES.PRIORITY_SUPPORT);
    
    case 'early_access':
      return hasFeature(subscription, SUBSCRIPTION_FEATURES.EARLY_ACCESS);
    
    default:
      return false;
  }
};

/**
 * Get subscription benefits for display
 */
export const getSubscriptionBenefits = (subscription) => {
  if (!subscription || !subscription.isActive) {
    return [];
  }
  
  const benefits = [];
  
  if (hasFeature(subscription, SUBSCRIPTION_FEATURES.UNLIMITED_BIDS)) {
    benefits.push('Unlimited project bids');
  }
  if (hasFeature(subscription, SUBSCRIPTION_FEATURES.PRIORITY_SUPPORT)) {
    benefits.push('Priority customer support');
  }
  if (hasFeature(subscription, SUBSCRIPTION_FEATURES.ADVANCED_ANALYTICS)) {
    benefits.push('Advanced project analytics');
  }
  if (hasFeature(subscription, SUBSCRIPTION_FEATURES.PREMIUM_BADGE)) {
    benefits.push('Premium profile badge');
  }
  if (hasFeature(subscription, SUBSCRIPTION_FEATURES.EARLY_ACCESS)) {
    benefits.push('Early access to new features');
  }
  if (hasFeature(subscription, SUBSCRIPTION_FEATURES.CUSTOM_PROFILE)) {
    benefits.push('Custom profile customization');
  }
  if (hasFeature(subscription, SUBSCRIPTION_FEATURES.PROJECT_BOOSTING)) {
    benefits.push('Project visibility boosting');
  }
  if (hasFeature(subscription, SUBSCRIPTION_FEATURES.TEAM_COLLABORATION)) {
    benefits.push('Advanced team collaboration tools');
  }
  
  return benefits;
};

/**
 * Get subscription status text
 */
export const getSubscriptionStatusText = (subscription) => {
  if (!subscription || !subscription.isActive) {
    return 'Free Plan';
  }
  
  const planName = subscription.planName || 'Unknown';
  const planType = subscription.planType || 'monthly';
  
  return `${planName.charAt(0).toUpperCase() + planName.slice(1)} (${planType})`;
};

/**
 * Check if subscription is expiring soon
 */
export const isSubscriptionExpiringSoon = (subscription, daysThreshold = 7) => {
  if (!subscription || !subscription.isActive || !subscription.expiresAt) {
    return false;
  }
  
  const expiryDate = new Date(subscription.expiresAt);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysThreshold && diffDays > 0;
};

/**
 * Get days remaining for subscription
 */
export const getSubscriptionDaysRemaining = (subscription) => {
  if (!subscription || !subscription.isActive || !subscription.expiresAt) {
    return 0;
  }
  
  const expiryDate = new Date(subscription.expiresAt);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * React hook for subscription utilities
 */
export const useSubscription = () => {
  const { subscription } = usePayment();
  
  return {
    subscription,
    hasFeature: (featureName) => hasFeature(subscription, featureName),
    checkLimit: (limitType, currentUsage) => checkLimit(subscription, limitType, currentUsage),
    canPerformAction: (actionType, currentUsage) => canPerformAction(subscription, actionType, currentUsage),
    getUserLimits: () => getUserLimits(subscription),
    getBenefits: () => getSubscriptionBenefits(subscription),
    getStatusText: () => getSubscriptionStatusText(subscription),
    isExpiringSoon: (daysThreshold) => isSubscriptionExpiringSoon(subscription, daysThreshold),
    getDaysRemaining: () => getSubscriptionDaysRemaining(subscription),
    isActive: subscription?.isActive || false
  };
};

export default {
  hasFeature,
  checkLimit,
  canPerformAction,
  getUserLimits,
  getSubscriptionBenefits,
  getSubscriptionStatusText,
  isSubscriptionExpiringSoon,
  getSubscriptionDaysRemaining,
  useSubscription,
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_LIMITS,
  FREE_USER_LIMITS
};
