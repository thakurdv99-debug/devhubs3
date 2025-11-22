import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import paymentApi from '@features/payments/services/paymentApi';
import { PAYMENT_STATUS, PAYMENT_ERRORS } from '@features/payments/constants/paymentConstants';
import { validatePaymentData } from '@features/payments/utils/paymentUtils';
import { db } from '@shared/config/firebase';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';

// Initial state
const initialState = {
  // Payment state
  isProcessing: false,
  currentPayment: null,
  paymentError: null,
  
  // Subscription state
  subscription: {
    isActive: false,
    planType: null,
    expiresAt: null,
    autoRenew: false
  },
  
  // Bonus pools
  bonusPools: [],
  bonusPoolsLoading: false,
  
  // Payment history
  paymentHistory: [],
  paymentHistoryLoading: false,
  
  // Withdrawal state
  withdrawalHistory: [],
  withdrawalHistoryLoading: false,
  
  // Analytics
  paymentAnalytics: null,
  analyticsLoading: false,
  
  // Real-time updates
  lastUpdated: null
};

// Action types
const PAYMENT_ACTIONS = {
  SET_PROCESSING: 'SET_PROCESSING',
  SET_CURRENT_PAYMENT: 'SET_CURRENT_PAYMENT',
  SET_PAYMENT_ERROR: 'SET_PAYMENT_ERROR',
  CLEAR_PAYMENT_ERROR: 'CLEAR_PAYMENT_ERROR',
  SET_SUBSCRIPTION: 'SET_SUBSCRIPTION',
  SET_BONUS_POOLS: 'SET_BONUS_POOLS',
  SET_BONUS_POOLS_LOADING: 'SET_BONUS_POOLS_LOADING',
  SET_PAYMENT_HISTORY: 'SET_PAYMENT_HISTORY',
  SET_PAYMENT_HISTORY_LOADING: 'SET_PAYMENT_HISTORY_LOADING',
  SET_WITHDRAWAL_HISTORY: 'SET_WITHDRAWAL_HISTORY',
  SET_WITHDRAWAL_HISTORY_LOADING: 'SET_WITHDRAWAL_HISTORY_LOADING',
  ADD_PAYMENT_TO_HISTORY: 'ADD_PAYMENT_TO_HISTORY',
  UPDATE_BONUS_POOL: 'UPDATE_BONUS_POOL',
  SET_PAYMENT_ANALYTICS: 'SET_PAYMENT_ANALYTICS',
  SET_ANALYTICS_LOADING: 'SET_ANALYTICS_LOADING',
  UPDATE_PAYMENT_STATUS: 'UPDATE_PAYMENT_STATUS',
  SET_LAST_UPDATED: 'SET_LAST_UPDATED'
};

// Reducer
const paymentReducer = (state, action) => {
  switch (action.type) {
    case PAYMENT_ACTIONS.SET_PROCESSING:
      return { ...state, isProcessing: action.payload };
      
    case PAYMENT_ACTIONS.SET_CURRENT_PAYMENT:
      return { ...state, currentPayment: action.payload };
      
    case PAYMENT_ACTIONS.SET_PAYMENT_ERROR:
      return { ...state, paymentError: action.payload };
      
    case PAYMENT_ACTIONS.CLEAR_PAYMENT_ERROR:
      return { ...state, paymentError: null };
      
    case PAYMENT_ACTIONS.SET_SUBSCRIPTION:
      return { ...state, subscription: action.payload };
      
    case PAYMENT_ACTIONS.SET_BONUS_POOLS:
      return { ...state, bonusPools: action.payload };
      
    case PAYMENT_ACTIONS.SET_BONUS_POOLS_LOADING:
      return { ...state, bonusPoolsLoading: action.payload };
      
    case PAYMENT_ACTIONS.SET_PAYMENT_HISTORY:
      return { ...state, paymentHistory: action.payload };
      
    case PAYMENT_ACTIONS.SET_PAYMENT_HISTORY_LOADING:
      return { ...state, paymentHistoryLoading: action.payload };
      
    case PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY:
      return { ...state, withdrawalHistory: action.payload };
      
    case PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY_LOADING:
      return { ...state, withdrawalHistoryLoading: action.payload };
      
    case PAYMENT_ACTIONS.ADD_PAYMENT_TO_HISTORY:
      return { 
        ...state, 
        paymentHistory: [action.payload, ...state.paymentHistory],
        lastUpdated: new Date().toISOString()
      };
      
    case PAYMENT_ACTIONS.UPDATE_BONUS_POOL:
      return {
        ...state,
        bonusPools: state.bonusPools.map(pool => 
          pool._id === action.payload._id ? action.payload : pool
        )
      };
      
    case PAYMENT_ACTIONS.SET_PAYMENT_ANALYTICS:
      return { ...state, paymentAnalytics: action.payload };
      
    case PAYMENT_ACTIONS.SET_ANALYTICS_LOADING:
      return { ...state, analyticsLoading: action.payload };
      
    case PAYMENT_ACTIONS.UPDATE_PAYMENT_STATUS:
      return {
        ...state,
        paymentHistory: state.paymentHistory.map(payment => 
          payment._id === action.payload.paymentId 
            ? { ...payment, status: action.payload.status }
            : payment
        ),
        lastUpdated: new Date().toISOString()
      };
      
    case PAYMENT_ACTIONS.SET_LAST_UPDATED:
      return { ...state, lastUpdated: action.payload };
      
    default:
      return state;
  }
};

// Create context
const PaymentContext = createContext();

// Provider component
export const PaymentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(paymentReducer, initialState);

  // Load subscription status on mount
  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  // Load payment history on mount
  useEffect(() => {
    loadPaymentHistory();
  }, []);

  // Load bonus pools on mount
  useEffect(() => {
    loadBonusPools();
  }, []);

  // Load withdrawal history on mount
  useEffect(() => {
    loadWithdrawalHistory();
  }, []);

  // Load payment analytics on mount
  useEffect(() => {
    loadPaymentAnalytics();
  }, []);

  // Set up real-time payment updates with Firebase
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId || !db) return;

    // Listen for real-time payment updates
    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(
      paymentsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const paymentData = { id: change.doc.id, ...change.doc.data() };
          
          // Validate payment data
          const validation = validatePaymentData(paymentData);
          if (!validation.isValid) {
            console.warn('Invalid payment data received:', validation.errors);
            return;
          }

          // Only update if status actually changed to prevent unnecessary re-renders
          const existingPayment = state.paymentHistory.find(p => p.id === paymentData.id);
          if (!existingPayment || existingPayment.status !== paymentData.status) {
            dispatch({
              type: PAYMENT_ACTIONS.UPDATE_PAYMENT_STATUS,
              payload: {
                paymentId: paymentData.id,
                status: paymentData.status
              }
            });
          }
        }
      });
    }, (error) => {
      console.error('Firebase payment listener error:', error);
    });

    return () => unsubscribe();
  }, []); // Keep empty dependency array to prevent infinite loops

  // Load subscription status
  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const response = await paymentApi.getSubscriptionStatus();
      const subscription = response?.data || response;
      
      console.log('🔍 Subscription status response:', subscription);
      
      // Normalize subscription data
      const normalizedSubscription = {
        isActive: subscription?.isActive || false,
        planName: subscription?.subscription?.planName || null,
        planType: subscription?.subscription?.planType || null,
        expiresAt: subscription?.subscription?.expiresAt || null,
        autoRenew: subscription?.subscription?.autoRenew || false,
        features: subscription?.features || {},
        benefits: subscription?.benefits || [],
        planConfig: subscription?.planConfig || null
      };
      
      console.log('🔍 Normalized subscription:', normalizedSubscription);
      dispatch({ type: PAYMENT_ACTIONS.SET_SUBSCRIPTION, payload: normalizedSubscription });
    } catch (error) {
      console.error('Error loading subscription status:', error);
      dispatch({ type: PAYMENT_ACTIONS.SET_SUBSCRIPTION, payload: { isActive: false } });
    }
  }, []);

  // Load payment history
  const loadPaymentHistory = useCallback(async () => {
    dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_HISTORY_LOADING, payload: true });
    try {
      const history = await paymentApi.getPaymentHistory();
      const validatedHistory = Array.isArray(history) 
        ? history.filter(payment => {
            const validation = validatePaymentData(payment);
            if (!validation.isValid) {
              console.warn('Invalid payment in history:', validation.errors);
              return false;
            }
            return true;
          })
        : [];
      
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_HISTORY, payload: validatedHistory });
    } catch (error) {
      console.error('Error loading payment history:', error);
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_HISTORY, payload: [] });
    } finally {
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_HISTORY_LOADING, payload: false });
    }
  }, []);

  // Load bonus pools
  const loadBonusPools = useCallback(async () => {
    dispatch({ type: PAYMENT_ACTIONS.SET_BONUS_POOLS_LOADING, payload: true });
    try {
      const pools = await paymentApi.getBonusPools();
      dispatch({ type: PAYMENT_ACTIONS.SET_BONUS_POOLS, payload: Array.isArray(pools) ? pools : [] });
    } catch (error) {
      console.error('Error loading bonus pools:', error);
      dispatch({ type: PAYMENT_ACTIONS.SET_BONUS_POOLS, payload: [] });
    } finally {
      dispatch({ type: PAYMENT_ACTIONS.SET_BONUS_POOLS_LOADING, payload: false });
    }
  }, []);

  // Load withdrawal history
  const loadWithdrawalHistory = useCallback(async () => {
    dispatch({ type: PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY_LOADING, payload: true });
    try {
      const history = await paymentApi.getWithdrawalHistory();
      dispatch({ type: PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY, payload: Array.isArray(history) ? history : [] });
    } catch (error) {
      console.error('Error loading withdrawal history:', error);
      dispatch({ type: PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY, payload: [] });
    } finally {
      dispatch({ type: PAYMENT_ACTIONS.SET_WITHDRAWAL_HISTORY_LOADING, payload: false });
    }
  }, []);

  // Load payment analytics
  const loadPaymentAnalytics = useCallback(async () => {
    dispatch({ type: PAYMENT_ACTIONS.SET_ANALYTICS_LOADING, payload: true });
    try {
      const analytics = await paymentApi.getPaymentAnalytics();
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_ANALYTICS, payload: analytics });
    } catch (error) {
      console.error('Error loading payment analytics:', error);
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_ANALYTICS, payload: null });
    } finally {
      dispatch({ type: PAYMENT_ACTIONS.SET_ANALYTICS_LOADING, payload: false });
    }
  }, []);

  // Payment actions
  const paymentActions = {
    // Start payment processing
    startPayment: (paymentData) => {
      dispatch({ type: PAYMENT_ACTIONS.SET_PROCESSING, payload: true });
      dispatch({ type: PAYMENT_ACTIONS.SET_CURRENT_PAYMENT, payload: paymentData });
      dispatch({ type: PAYMENT_ACTIONS.CLEAR_PAYMENT_ERROR });
    },

    // Complete payment
    completePayment: (paymentResult) => {
      // Validate payment result
      const validation = validatePaymentData(paymentResult);
      if (!validation.isValid) {
        console.error('Invalid payment result:', validation.errors);
        dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_ERROR, payload: PAYMENT_ERRORS.PAYMENT_FAILED });
        return;
      }

      dispatch({ type: PAYMENT_ACTIONS.SET_PROCESSING, payload: false });
      dispatch({ type: PAYMENT_ACTIONS.SET_CURRENT_PAYMENT, payload: null });
      dispatch({ type: PAYMENT_ACTIONS.ADD_PAYMENT_TO_HISTORY, payload: paymentResult });
      
      // Reload subscription status if it was a subscription payment
      if (paymentResult.purpose === 'subscription' || paymentResult.type === 'subscription') {
        console.log('🔄 Reloading subscription status after payment completion');
        loadSubscriptionStatus();
      }
    },

    // Handle payment error
    handlePaymentError: (error) => {
      dispatch({ type: PAYMENT_ACTIONS.SET_PROCESSING, payload: false });
      dispatch({ type: PAYMENT_ACTIONS.SET_CURRENT_PAYMENT, payload: null });
      
      const errorMessage = error?.message || error || PAYMENT_ERRORS.PAYMENT_FAILED;
      dispatch({ type: PAYMENT_ACTIONS.SET_PAYMENT_ERROR, payload: errorMessage });
    },

    // Clear payment error
    clearPaymentError: () => {
      dispatch({ type: PAYMENT_ACTIONS.CLEAR_PAYMENT_ERROR });
    },

    // Refresh data
    refreshData: useCallback(() => {
      loadSubscriptionStatus();
      loadPaymentHistory();
      loadBonusPools();
      loadWithdrawalHistory();
      loadPaymentAnalytics();
      dispatch({ type: PAYMENT_ACTIONS.SET_LAST_UPDATED, payload: new Date().toISOString() });
    }, [loadSubscriptionStatus, loadPaymentHistory, loadBonusPools, loadWithdrawalHistory, loadPaymentAnalytics]),

    // Update payment status manually
    updatePaymentStatus: (paymentId, status) => {
      dispatch({
        type: PAYMENT_ACTIONS.UPDATE_PAYMENT_STATUS,
        payload: { paymentId, status }
      });
    }
  };

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    return state.subscription.isActive;
  };

  // Check if user can perform action without payment
  const canPerformAction = (actionType) => {
    if (actionType === 'bid' || actionType === 'list_project') {
      return hasActiveSubscription();
    }
    return true;
  };

  // Get payment statistics
  const getPaymentStats = () => {
    const payments = state.paymentHistory;
    
    return {
      totalPayments: payments.length,
      totalAmount: payments
        .filter(p => p.status === PAYMENT_STATUS.SUCCESS || p.status === PAYMENT_STATUS.PAID)
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      successfulPayments: payments.filter(p => 
        p.status === PAYMENT_STATUS.SUCCESS || p.status === PAYMENT_STATUS.PAID
      ).length,
      failedPayments: payments.filter(p => p.status === PAYMENT_STATUS.FAILED).length,
      pendingPayments: payments.filter(p => p.status === PAYMENT_STATUS.PENDING).length
    };
  };

  const value = {
    ...state,
    ...paymentActions,
    hasActiveSubscription,
    canPerformAction,
    getPaymentStats
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook to use payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentContext;
