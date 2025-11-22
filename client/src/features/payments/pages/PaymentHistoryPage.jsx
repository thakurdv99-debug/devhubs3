import React, { useState, useEffect, useMemo } from 'react';
import { usePayment } from '../context/PaymentContext';
import LoadingSpinner from '@shared/components/ui/LoadingSpinner';

import { 
  PAYMENT_TYPES, 
  PAYMENT_STATUS,
  PAYMENT_PROVIDERS,
  PAYMENT_FILTERS,
  PAYMENT_SORT_OPTIONS,
  PAYMENT_SORT_ORDERS
} from '../constants/paymentConstants';
import { 
  formatCurrency, 
  getPaymentStatusColor, 
  getPaymentStatusIcon, 
  formatPaymentDate,
  getPaymentTypeDisplayName,
  getPaymentProviderDisplayName,
  isRecentPayment,
  getPaymentStatusBadgeColor,
  validatePaymentData
} from '../utils/paymentUtils.jsx';

const PaymentHistoryPage = () => {
  const { 
    paymentHistory, 
    isProcessing, 
    refreshData, 
    getPaymentStats,
    lastUpdated 
  } = usePayment();
  
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(PAYMENT_FILTERS.STATUS.ALL);
  const [typeFilter, setTypeFilter] = useState(PAYMENT_FILTERS.TYPE.ALL);
  const [providerFilter, setProviderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(PAYMENT_FILTERS.DATE.ALL);
  const [sortBy, setSortBy] = useState(PAYMENT_SORT_OPTIONS.DATE);
  const [sortOrder, setSortOrder] = useState(PAYMENT_SORT_ORDERS.DESC);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        await refreshData();
      } catch (err) {
        setError('Failed to load payment history. Please try again.');
        console.error('Error loading payment history:', err);
      }
    };
    
    loadData();
  }, [refreshData]);

  // Filter and sort payments
  useEffect(() => {
    if (!paymentHistory || !Array.isArray(paymentHistory)) {
      setFilteredPayments([]);
      return;
    }

    let filtered = [...paymentHistory];

    // Validate and filter out invalid payments
    filtered = filtered.filter(payment => {
      const validation = validatePaymentData(payment);
      if (!validation.isValid) {
        console.warn('Invalid payment data:', validation.errors);
        return false;
      }
      return true;
    });

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        (payment.id || payment._id || '').toLowerCase().includes(searchLower) ||
        getPaymentTypeDisplayName(payment.type || payment.purpose).toLowerCase().includes(searchLower) ||
        (payment.amount?.toString() || '').includes(searchTerm) ||
        (payment.projectId?.project_Title || '').toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== PAYMENT_FILTERS.STATUS.ALL) {
      filtered = filtered.filter(payment => 
        (payment.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Type filter
    if (typeFilter !== PAYMENT_FILTERS.TYPE.ALL) {
      filtered = filtered.filter(payment => 
        (payment.type || payment.purpose || '').toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter(payment => 
        (payment.provider || '').toLowerCase() === providerFilter.toLowerCase()
      );
    }

    // Date filter
    if (dateFilter !== PAYMENT_FILTERS.DATE.ALL) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
              switch (dateFilter) {
          case PAYMENT_FILTERS.DATE.TODAY: {
            filtered = filtered.filter(payment => {
              const paymentDate = new Date(payment.createdAt);
              return paymentDate >= today;
            });
            break;
          }
          case PAYMENT_FILTERS.DATE.WEEK: {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(payment => {
              const paymentDate = new Date(payment.createdAt);
              return paymentDate >= weekAgo;
            });
            break;
          }
          case PAYMENT_FILTERS.DATE.MONTH: {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(payment => {
              const paymentDate = new Date(payment.createdAt);
              return paymentDate >= monthAgo;
            });
            break;
          }
          default:
            break;
        }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case PAYMENT_SORT_OPTIONS.AMOUNT:
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case PAYMENT_SORT_OPTIONS.DATE:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case PAYMENT_SORT_OPTIONS.TYPE:
          aValue = getPaymentTypeDisplayName(a.type || a.purpose);
          bValue = getPaymentTypeDisplayName(b.type || b.purpose);
          break;
        case PAYMENT_SORT_OPTIONS.STATUS:
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === PAYMENT_SORT_ORDERS.ASC) {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPayments(filtered);
  }, [paymentHistory, searchTerm, statusFilter, typeFilter, providerFilter, dateFilter, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    return getPaymentStats();
  }, [getPaymentStats]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setError(null);
      await refreshData();
    } catch (err) {
      setError('Failed to refresh data. Please try again.');
      console.error('Error refreshing data:', err);
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter(PAYMENT_FILTERS.STATUS.ALL);
    setTypeFilter(PAYMENT_FILTERS.TYPE.ALL);
    setProviderFilter('all');
    setDateFilter(PAYMENT_FILTERS.DATE.ALL);
    setSortBy(PAYMENT_SORT_OPTIONS.DATE);
    setSortOrder(PAYMENT_SORT_ORDERS.DESC);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
   
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 mt-[5vmin]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Payment History</h1>
              <p className="text-gray-300">Track all your payment transactions and activities</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={isProcessing}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh
              </button>
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  Last updated: {new Date(lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{stats.totalPayments}</p>
              </div>
              <div className="text-[#00A8E8]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Amount</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="text-[#00A8E8]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Successful</p>
                <p className="text-2xl font-bold text-white">{stats.successfulPayments}</p>
              </div>
              <div className="text-green-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-white">{stats.failedPayments}</p>
              </div>
              <div className="text-red-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-6 border border-gray-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Filters & Search</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              >
                <option value={PAYMENT_FILTERS.STATUS.ALL}>All Status</option>
                <option value={PAYMENT_STATUS.SUCCESS}>Success</option>
                <option value={PAYMENT_STATUS.PAID}>Paid</option>
                <option value={PAYMENT_STATUS.PENDING}>Pending</option>
                <option value={PAYMENT_STATUS.FAILED}>Failed</option>
                <option value={PAYMENT_STATUS.CANCELLED}>Cancelled</option>
                <option value={PAYMENT_STATUS.REFUNDED}>Refunded</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              >
                <option value={PAYMENT_FILTERS.TYPE.ALL}>All Types</option>
                <option value={PAYMENT_TYPES.BID_FEE}>Bid Fee</option>
                <option value={PAYMENT_TYPES.BONUS_FUNDING}>Bonus Funding</option>
                <option value={PAYMENT_TYPES.SUBSCRIPTION}>Subscription</option>
                <option value={PAYMENT_TYPES.WITHDRAWAL_FEE}>Withdrawal</option>
                <option value={PAYMENT_TYPES.LISTING}>Listing</option>
              </select>
            </div>

            {/* Provider Filter */}
            <div>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              >
                <option value="all">All Providers</option>
                <option value={PAYMENT_PROVIDERS.RAZORPAY}>Razorpay</option>
                <option value={PAYMENT_PROVIDERS.CASHFREE}>Cashfree</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              >
                <option value={PAYMENT_FILTERS.DATE.ALL}>All Time</option>
                <option value={PAYMENT_FILTERS.DATE.TODAY}>Today</option>
                <option value={PAYMENT_FILTERS.DATE.WEEK}>This Week</option>
                <option value={PAYMENT_FILTERS.DATE.MONTH}>This Month</option>
              </select>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4 mt-4">
            <span className="text-gray-300">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#1E1E1E] text-white px-3 py-1 rounded border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
            >
              <option value={PAYMENT_SORT_OPTIONS.DATE}>Date</option>
              <option value={PAYMENT_SORT_OPTIONS.AMOUNT}>Amount</option>
              <option value={PAYMENT_SORT_OPTIONS.TYPE}>Type</option>
              <option value={PAYMENT_SORT_OPTIONS.STATUS}>Status</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === PAYMENT_SORT_ORDERS.ASC ? PAYMENT_SORT_ORDERS.DESC : PAYMENT_SORT_ORDERS.ASC)}
              className="bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white px-3 py-1 rounded border border-gray-600 transition-colors"
            >
              {sortOrder === PAYMENT_SORT_ORDERS.ASC ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Payment List */}
        <div className="glass rounded-xl p-6 border border-gray-700">
          {isProcessing ? (
            <LoadingSpinner />
          ) : filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div
                  key={payment.id || payment._id}
                  className={`bg-[#2A2A2A] rounded-lg p-6 border border-gray-600 transition-all duration-200 hover:bg-[#333] ${
                    isRecentPayment(payment.createdAt) ? 'ring-2 ring-[#00A8E8]/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${getPaymentStatusColor(payment.status)}`}>
                        {getPaymentStatusIcon(payment.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold">
                            {getPaymentTypeDisplayName(payment.type || payment.purpose)}
                          </p>
                          {isRecentPayment(payment.createdAt) && (
                            <span className="bg-[#00A8E8] text-white text-xs px-2 py-1 rounded-full">
                              Recent
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {formatPaymentDate(payment.createdAt)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          ID: {payment.id || payment._id} • {getPaymentProviderDisplayName(payment.provider)}
                        </p>
                        {payment.projectId?.project_Title && (
                          <p className="text-gray-500 text-sm">
                            Project: {payment.projectId.project_Title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">{formatCurrency(payment.amount)}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusBadgeColor(payment.status)}`}>
                        {payment.status}
                      </span>
                      {payment.fee && (
                        <p className="text-gray-400 text-xs mt-1">
                          Fee: {formatCurrency(payment.fee)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Additional Details */}
                  {payment.description && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <p className="text-gray-300 text-sm">{payment.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-2">No payments found</p>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryPage;
