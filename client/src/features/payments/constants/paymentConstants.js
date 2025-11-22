// Payment Types
export const PAYMENT_TYPES = {
  BID_FEE: 'bid_fee',           // ₹9 per bid
  BONUS_FUNDING: 'bonus_funding', // ₹200 × contributors
  WITHDRAWAL_FEE: 'withdrawal_fee', // ₹20 (up to ₹10k)
  SUBSCRIPTION: 'subscription',   // ₹299/month
  LISTING: 'listing'             // ₹199 per listing
};

// Payment Amounts
export const PAYMENT_AMOUNTS = {
  BID_FEE: 9,
  BONUS_PER_CONTRIBUTOR: 200,
  WITHDRAWAL_FEE: 20,
  WITHDRAWAL_MAX: 10000,
  WITHDRAWAL_MIN: 100,
  SUBSCRIPTION: 299,
  LISTING_FEE: 199
};

// Payment Providers
export const PAYMENT_PROVIDERS = {
  RAZORPAY: 'razorpay',
  CASHFREE: 'cashfree'
};

// Subscription Benefits
export const SUBSCRIPTION_BENEFITS = [
  "Unlimited project bids",
  "Unlimited project listings", 
  "Priority support",
  "Advanced analytics",
  "No bid fees",
  "No listing fees"
];

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  CREATED: 'created'
};

// Payment Error Messages
export const PAYMENT_ERRORS = {
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_AMOUNT: 'Invalid payment amount',
  SUBSCRIPTION_REQUIRED: 'Subscription required for this action',
  ORDER_NOT_FOUND: 'Payment order not found',
  WEBHOOK_VERIFICATION_FAILED: 'Payment verification failed',
  DUPLICATE_PAYMENT: 'Payment already processed'
};

// Payment Success Messages
export const PAYMENT_SUCCESS = {
  BID_FEE: 'Bid fee paid successfully! You can now place your bid.',
  BONUS_FUNDING: 'Bonus pool funded successfully!',
  WITHDRAWAL: 'Withdrawal request submitted successfully!',
  SUBSCRIPTION: 'Subscription activated successfully!',
  LISTING: 'Project listing fee paid successfully!'
};

// Payment Status Display Names
export const PAYMENT_STATUS_DISPLAY = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.SUCCESS]: 'Success',
  [PAYMENT_STATUS.PAID]: 'Paid',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.CANCELLED]: 'Cancelled',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
  [PAYMENT_STATUS.CREATED]: 'Created'
};

// Payment Type Display Names
export const PAYMENT_TYPE_DISPLAY = {
  [PAYMENT_TYPES.BID_FEE]: 'Bid Fee',
  [PAYMENT_TYPES.BONUS_FUNDING]: 'Bonus Funding',
  [PAYMENT_TYPES.WITHDRAWAL_FEE]: 'Withdrawal Fee',
  [PAYMENT_TYPES.SUBSCRIPTION]: 'Subscription',
  [PAYMENT_TYPES.LISTING]: 'Listing Fee'
};

// Payment Provider Display Names
export const PAYMENT_PROVIDER_DISPLAY = {
  [PAYMENT_PROVIDERS.RAZORPAY]: 'Razorpay',
  [PAYMENT_PROVIDERS.CASHFREE]: 'Cashfree'
};

// Payment Analytics Periods
export const PAYMENT_ANALYTICS_PERIODS = {
  WEEK: '7d',
  MONTH: '30d',
  QUARTER: '90d',
  YEAR: '1y'
};

// Payment Filter Options
export const PAYMENT_FILTERS = {
  STATUS: {
    ALL: 'all',
    PENDING: PAYMENT_STATUS.PENDING,
    SUCCESS: PAYMENT_STATUS.SUCCESS,
    FAILED: PAYMENT_STATUS.FAILED,
    REFUNDED: PAYMENT_STATUS.REFUNDED
  },
  TYPE: {
    ALL: 'all',
    BID_FEE: PAYMENT_TYPES.BID_FEE,
    BONUS_FUNDING: PAYMENT_TYPES.BONUS_FUNDING,
    SUBSCRIPTION: PAYMENT_TYPES.SUBSCRIPTION,
    WITHDRAWAL_FEE: PAYMENT_TYPES.WITHDRAWAL_FEE,
    LISTING: PAYMENT_TYPES.LISTING
  },
  DATE: {
    ALL: 'all',
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month'
  }
};

// Payment Sort Options
export const PAYMENT_SORT_OPTIONS = {
  DATE: 'date',
  AMOUNT: 'amount',
  TYPE: 'type',
  STATUS: 'status'
};

// Payment Sort Orders
export const PAYMENT_SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
};
