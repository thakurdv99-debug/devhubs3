import React, { useState, useEffect } from 'react';
import { usePayment } from '../context/PaymentContext';
import PaymentModal from '../components/payment/PaymentModal';
import LoadingSpinner from '../components/LoadingSpinner';
import NavBar from '@shared/components/layout/NavBar';
import PremiumBadge, { SubscriptionStatusBadge } from '../components/PremiumBadge';
import notificationService from '../services/notificationService';
import paymentApi from '../services/paymentApi';
import { 
  PAYMENT_TYPES, 
  PAYMENT_AMOUNTS, 
  PAYMENT_STATUS 
} from '../constants/paymentConstants';
import { 
  formatCurrency, 
  getPaymentStatusColor, 
  getPaymentStatusIcon, 
  formatPaymentDate
} from '../utils/paymentUtils.jsx';

const SubscriptionPage = () => {
  const { 
    subscriptionStatus, 
    isProcessing, 
    refreshData
  } = usePayment();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanType, setSelectedPlanType] = useState('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Fallback plans data in case API fails
  const fallbackPlans = [
    {
      name: 'starter',
      displayName: 'Starter',
      description: 'Perfect for beginners and freelancers',
      plans: [
        { type: 'weekly', price: 99, popular: false, savings: 0 },
        { type: 'monthly', price: 299, popular: true, savings: 0 },
        { type: 'yearly', price: 2999, popular: false, savings: 17 }
      ],
      features: {
        unlimitedBids: true,
        prioritySupport: false,
        advancedAnalytics: false,
        premiumBadge: true,
        earlyAccess: false,
        customProfile: false,
        projectBoosting: false,
        teamCollaboration: false
      },
      limits: {
        maxProjects: 5,
        maxTeamMembers: 2,
        maxFileUploads: 100
      }
    },
    {
      name: 'pro',
      displayName: 'Pro',
      description: 'For serious developers and small teams',
      plans: [
        { type: 'weekly', price: 199, popular: false, savings: 0 },
        { type: 'monthly', price: 599, popular: true, savings: 0 },
        { type: 'yearly', price: 5999, popular: false, savings: 17 }
      ],
      features: {
        unlimitedBids: true,
        prioritySupport: true,
        advancedAnalytics: true,
        premiumBadge: true,
        earlyAccess: true,
        customProfile: true,
        projectBoosting: true,
        teamCollaboration: false
      },
      limits: {
        maxProjects: 20,
        maxTeamMembers: 5,
        maxFileUploads: 500
      }
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise',
      description: 'For large teams and organizations',
      plans: [
        { type: 'weekly', price: 399, popular: false, savings: 0 },
        { type: 'monthly', price: 1299, popular: false, savings: 0 },
        { type: 'yearly', price: 12999, popular: true, savings: 17 }
      ],
      features: {
        unlimitedBids: true,
        prioritySupport: true,
        advancedAnalytics: true,
        premiumBadge: true,
        earlyAccess: true,
        customProfile: true,
        projectBoosting: true,
        teamCollaboration: true
      },
      limits: {
        maxProjects: -1,
        maxTeamMembers: -1,
        maxFileUploads: -1
      }
    }
  ];

  // Fetch subscription plans and current status
  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      console.log('Fetching subscription data...');
      
      const [plansResponse, statusResponse] = await Promise.all([
        paymentApi.getSubscriptionPlans(),
        paymentApi.getSubscriptionStatus()
      ]);
      
      console.log('Plans response:', plansResponse);
      console.log('Status response:', statusResponse);
      
      // Handle plans response
      if (plansResponse && plansResponse.data && plansResponse.data.plans) {
        setPlans(plansResponse.data.plans);
      } else if (plansResponse && plansResponse.plans) {
        setPlans(plansResponse.plans);
      } else {
        console.warn('No plans found in response:', plansResponse);
        setPlans([]);
      }
      
      // Handle status response
      if (statusResponse && statusResponse.data) {
        setCurrentSubscription(statusResponse.data);
      } else if (statusResponse) {
        setCurrentSubscription(statusResponse);
      } else {
        console.warn('No subscription status found in response:', statusResponse);
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      console.error('Error details:', error.response?.data || error.message);
      notificationService.error('Failed to fetch subscription information');
      
      // Set fallback data to prevent empty state
      console.log('Using fallback plans data');
      setPlans(fallbackPlans);
      setCurrentSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
    // Only call refreshData once on mount, not on every refreshData change
  }, []); // Remove refreshData from dependencies

  const handlePlanSelect = (plan, planType) => {
    const price = getPlanPrice(plan, planType);
    console.log('Plan selected:', { 
      plan: plan.name, 
      planType, 
      price,
      planDetails: plan.plans.find(p => p.type === planType)
    });
    setSelectedPlan(plan);
    setSelectedPlanType(planType);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (result) => {
    console.log('Subscription payment successful:', result);
    setShowPaymentModal(false);
    setSelectedPlan(null);
    
    // Refresh subscription data and payment context
    await fetchSubscriptionData();
    await refreshData();
    
    notificationService.success('🎉 Subscription activated successfully! Welcome to premium!');
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will retain access until your current period ends.')) {
      return;
    }

    try {
      await paymentApi.cancelSubscription();
      await fetchSubscriptionData();
      await refreshData();
      notificationService.success('Subscription cancelled successfully');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      notificationService.error('Failed to cancel subscription');
    }
  };

  const getPlanPrice = (plan, planType) => {
    const planDetails = plan.plans.find(p => p.type === planType);
    return planDetails ? planDetails.price : 0;
  };

  const getPlanSavings = (plan, planType) => {
    const planDetails = plan.plans.find(p => p.type === planType);
    return planDetails ? planDetails.savings : 0;
  };

  const isCurrentPlan = (planName, planType) => {
    return currentSubscription?.subscription?.planName === planName && 
           currentSubscription?.subscription?.planType === planType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white">
        <NavBar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#121212] via-[#1a1a2e] to-[#16213e] text-white">
      <NavBar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#00A8E8]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#0062E6]/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-[#00A8E8] to-[#0062E6] bg-clip-text text-transparent mb-6">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Unlock your full potential with premium features designed for developers
            </p>
            
            {/* Current Subscription Status */}
            {currentSubscription?.isActive && (
              <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-6 py-3 mb-8">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 font-medium">Premium Active</span>
                <PremiumBadge 
                  planName={currentSubscription.subscription.planName}
                  planType={currentSubscription.subscription.planType}
                  size="small"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">

        {/* Current Subscription Management */}
        {currentSubscription?.isActive && (
          <div className="glass rounded-xl p-8 border border-gray-700 mb-12 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-4">Current Subscription</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <PremiumBadge 
                    planName={currentSubscription.subscription.planName}
                    planType={currentSubscription.subscription.planType}
                    size="large"
                  />
                  <div className="text-gray-300 space-y-1">
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Expires: {formatPaymentDate(currentSubscription.subscription.expiresAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Auto-renewal: {currentSubscription.subscription.autoRenew ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/payment'}
                  className="bg-[#00A8E8] hover:bg-[#0096D6] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Manage
                </button>
                <button
                  onClick={handleCancelSubscription}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Plan Type Selector */}
        <div className="flex justify-center mb-12">
          <div className="glass rounded-2xl p-2 border border-gray-700 flex bg-[#1a1a2e]/50">
            {['weekly', 'monthly', 'yearly'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedPlanType(type)}
                className={`px-8 py-3 rounded-xl transition-all duration-300 font-medium ${
                  selectedPlanType === type
                    ? 'bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg shadow-[#00A8E8]/25'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type === 'yearly' && (
                  <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    Save 17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Debug Information */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Debug Info:</h3>
            <p className="text-gray-300 text-sm">Plans loaded: {plans.length}</p>
            <p className="text-gray-300 text-sm">Selected plan type: {selectedPlanType}</p>
            <p className="text-gray-300 text-sm">Current subscription: {currentSubscription ? 'Active' : 'None'}</p>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {plans.length > 0 ? plans.map((plan, index) => {
            const price = getPlanPrice(plan, selectedPlanType);
            const savings = getPlanSavings(plan, selectedPlanType);
            const isCurrent = isCurrentPlan(plan.name, selectedPlanType);
            const isPopular = plan.plans.find(p => p.type === selectedPlanType)?.popular;

            return (
              <div
                key={plan.name}
                className={`relative glass rounded-2xl p-8 border-2 transition-all duration-500 hover:scale-105 ${
                  isPopular 
                    ? 'border-[#00A8E8] ring-4 ring-[#00A8E8]/20 bg-gradient-to-br from-[#00A8E8]/5 to-[#0062E6]/5' 
                    : 'border-gray-700 hover:border-gray-600 bg-gradient-to-br from-gray-800/20 to-gray-900/20'
                } ${isCurrent ? 'opacity-75' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      ⭐ Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="mb-6">
                    <PremiumBadge 
                      planName={plan.name}
                      size="large"
                      className="mb-4"
                    />
                    <h3 className="text-2xl font-bold text-white mb-3">{plan.displayName}</h3>
                    <p className="text-gray-400 text-base leading-relaxed">{plan.description}</p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {formatCurrency(price)}
                      </span>
                      <span className="text-gray-400 text-lg">/{selectedPlanType}</span>
                    </div>
                    {savings > 0 && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          💰 Save {savings}% with {selectedPlanType} billing
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features && Object.entries(plan.features).map(([feature, enabled]) => {
                    if (!enabled) return null;
                    
                    const featureNames = {
                      unlimitedBids: 'Unlimited Project Bids',
                      prioritySupport: 'Priority Customer Support',
                      advancedAnalytics: 'Advanced Project Analytics',
                      premiumBadge: 'Premium Profile Badge',
                      earlyAccess: 'Early Access to New Features',
                      customProfile: 'Custom Profile Customization',
                      projectBoosting: 'Project Visibility Boosting',
                      teamCollaboration: 'Advanced Team Collaboration'
                    };

                    return (
                      <div key={feature} className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-300 text-sm font-medium">{featureNames[feature]}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Limits */}
                {plan.limits && (
                  <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-xl p-4 mb-8 border border-gray-700/50">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                      </svg>
                      Plan Limits
                    </h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Max Projects:</span>
                        <span className="text-white font-medium">{plan.limits.maxProjects === -1 ? 'Unlimited' : plan.limits.maxProjects}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Team Members:</span>
                        <span className="text-white font-medium">{plan.limits.maxTeamMembers === -1 ? 'Unlimited' : plan.limits.maxTeamMembers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max File Uploads:</span>
                        <span className="text-white font-medium">{plan.limits.maxFileUploads === -1 ? 'Unlimited' : plan.limits.maxFileUploads}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handlePlanSelect(plan, selectedPlanType)}
                  disabled={isCurrent || isProcessing}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                    isCurrent
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed border border-gray-600'
                      : isPopular
                      ? 'bg-gradient-to-r from-[#00A8E8] to-[#0062E6] hover:from-[#0096D6] hover:to-[#0056CC] text-white shadow-lg shadow-[#00A8E8]/25 hover:shadow-[#00A8E8]/40'
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white border border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {isCurrent ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Current Plan
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Subscribe {formatCurrency(price)}/{selectedPlanType}
                    </span>
                  )}
                </button>
              </div>
            );
          }) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No Plans Available</h3>
                <p className="text-gray-400 mb-4">Unable to load subscription plans. Please try refreshing the page.</p>
                <button 
                  onClick={fetchSubscriptionData}
                  className="bg-[#00A8E8] hover:bg-[#0096D6] text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Retry Loading Plans
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="glass rounded-2xl p-12 border border-gray-700 bg-gradient-to-br from-[#1a1a2e]/50 to-[#16213e]/50">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-[#00A8E8] to-[#0062E6] bg-clip-text text-transparent mb-4">
              Why Choose Premium?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join thousands of developers who have unlocked their full potential with premium features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00A8E8] to-[#0062E6] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-3">Unlimited Bids</h3>
              <p className="text-gray-400 leading-relaxed">Bid on unlimited projects without restrictions and grow your portfolio</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00A8E8] to-[#0062E6] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-3">Priority Support</h3>
              <p className="text-gray-400 leading-relaxed">Get help faster with dedicated priority customer support</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00A8E8] to-[#0062E6] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-3">Advanced Analytics</h3>
              <p className="text-gray-400 leading-relaxed">Detailed insights into your project performance and growth</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#00A8E8] to-[#0062E6] rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-3">Premium Badge</h3>
              <p className="text-gray-400 leading-relaxed">Stand out with a premium profile badge and get recognized</p>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <PaymentModal
            paymentType="subscription"
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            amount={getPlanPrice(selectedPlan, selectedPlanType)}
            onSuccess={handlePaymentSuccess}
            planName={selectedPlan.name}
            planType={selectedPlanType}
          />
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;
