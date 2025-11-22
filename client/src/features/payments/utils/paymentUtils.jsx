import { PAYMENT_AMOUNTS } from '../constants/paymentConstants';

// Format currency for display
export const formatCurrency = (amount, currency = 'INR') => {
  if (!amount || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Calculate bonus pool amount
export const calculateBonusPoolAmount = (contributorCount) => {
  return contributorCount * PAYMENT_AMOUNTS.BONUS_PER_CONTRIBUTOR;
};

// Calculate withdrawal fee
export const calculateWithdrawalFee = (amount) => {
  return PAYMENT_AMOUNTS.WITHDRAWAL_FEE;
};

// Calculate total withdrawal amount (including fee)
export const calculateTotalWithdrawalAmount = (amount) => {
  return amount - calculateWithdrawalFee(amount);
};

// Validate withdrawal amount
export const validateWithdrawalAmount = (amount, availableBalance = 0) => {
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount < PAYMENT_AMOUNTS.WITHDRAWAL_MIN) {
    return { 
      isValid: false, 
      error: `Minimum withdrawal amount is ₹${PAYMENT_AMOUNTS.WITHDRAWAL_MIN}` 
    };
  }
  
  if (amount > PAYMENT_AMOUNTS.WITHDRAWAL_MAX) {
    return { 
      isValid: false, 
      error: `Maximum withdrawal amount is ${formatCurrency(PAYMENT_AMOUNTS.WITHDRAWAL_MAX)}` 
    };
  }

  // Check if user has enough balance to cover withdrawal amount + fee
  const totalRequired = amount + calculateWithdrawalFee(amount);
  if (availableBalance > 0 && totalRequired > availableBalance) {
    return { 
      isValid: false, 
      error: `Insufficient balance. You need ${formatCurrency(totalRequired)} (${formatCurrency(amount)} + ${formatCurrency(calculateWithdrawalFee(amount))} fee)` 
    };
  }
  
  return { isValid: true, error: null };
};

// Validate contributor count for bonus pool
export const validateContributorCount = (count) => {
  if (count <= 0) {
    return { isValid: false, error: 'Number of contributors must be greater than 0' };
  }
  
  if (count > 100) {
    return { isValid: false, error: 'Maximum 100 contributors allowed per project' };
  }
  
  return { isValid: true, error: null };
};

// Get payment status color
export const getPaymentStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'paid':
      return 'text-green-400';
    case 'pending':
      return 'text-yellow-400';
    case 'failed':
    case 'cancelled':
      return 'text-red-400';
    case 'refunded':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

// Get payment status icon as JSX element
export const getPaymentStatusIcon = (status) => {
  const iconClass = "w-6 h-6";
  
  switch (status?.toLowerCase()) {
    case 'success':
    case 'paid':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
    case 'pending':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
    case 'failed':
    case 'cancelled':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
    case 'refunded':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
  }
};

// Format payment date
export const formatPaymentDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Get payment type display name
export const getPaymentTypeDisplayName = (type) => {
  switch (type?.toLowerCase()) {
    case 'bid_fee':
      return 'Bid Fee';
    case 'bonus_funding':
      return 'Bonus Funding';
    case 'withdrawal_fee':
      return 'Withdrawal Fee';
    case 'subscription':
      return 'Subscription';
    case 'listing':
      return 'Listing Fee';
    default:
      return type || 'Unknown';
  }
};

// Get payment provider display name
export const getPaymentProviderDisplayName = (provider) => {
  switch (provider?.toLowerCase()) {
    case 'razorpay':
      return 'Razorpay';
    case 'cashfree':
      return 'Cashfree';
    default:
      return provider || 'Unknown';
  }
};

// Calculate subscription savings
export const calculateSubscriptionSavings = (bidCount, listingCount) => {
  const bidSavings = bidCount * PAYMENT_AMOUNTS.BID_FEE;
  const listingSavings = listingCount * 0; // No listing fee
  return bidSavings + listingSavings;
};

// Check if payment is recent (within 24 hours)
export const isRecentPayment = (paymentDate) => {
  if (!paymentDate) return false;
  
  try {
    const payment = new Date(paymentDate);
    const now = new Date();
    const diffInHours = (now - payment) / (1000 * 60 * 60);
    return diffInHours <= 24;
  } catch (error) {
    return false;
  }
};

// Generate payment summary
export const generatePaymentSummary = (payment) => {
  if (!payment) return null;
  
  const { type, purpose, amount, status, createdAt, provider } = payment;
  
  return {
    type: getPaymentTypeDisplayName(type || purpose),
    amount: formatCurrency(amount),
    status: status,
    date: formatPaymentDate(createdAt),
    provider: getPaymentProviderDisplayName(provider),
    isRecent: isRecentPayment(createdAt)
  };
};

// Validate payment data
export const validatePaymentData = (payment) => {
  const errors = [];
  
  if (!payment) {
    errors.push('Payment data is required');
    return { isValid: false, errors };
  }
  
  if (!payment.id && !payment._id) {
    errors.push('Payment ID is required');
  }
  
  if (!payment.amount || isNaN(payment.amount)) {
    errors.push('Valid payment amount is required');
  }
  
  // Check for either 'type' or 'purpose' field
  if (!payment.type && !payment.purpose) {
    errors.push('Payment type is required');
  }
  
  if (!payment.status) {
    errors.push('Payment status is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format payment amount for display with proper handling
export const formatPaymentAmount = (amount, includeCurrency = true) => {
  if (!amount || isNaN(amount)) {
    return includeCurrency ? '₹0' : '0';
  }
  
  const formatted = new Intl.NumberFormat('en-IN').format(amount);
  return includeCurrency ? `₹${formatted}` : formatted;
};

// Get payment status badge color
export const getPaymentStatusBadgeColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'paid':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'failed':
    case 'cancelled':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'refunded':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};
