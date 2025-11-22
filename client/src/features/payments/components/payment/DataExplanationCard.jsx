import React from 'react';

const DataExplanationCard = ({ type }) => {
  const isOverview = type === 'overview';
  
  return (
    <div className="glass rounded-xl p-8 border border-gray-700 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-green-500/10 backdrop-blur-sm">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {isOverview ? 'Overview Data Methodology' : 'Analytics Data Methodology'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isOverview ? 'Understanding your payment overview calculations' : 'Understanding your analytics calculations'}
          </p>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Column - Key Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            Key Features
          </h3>
          
          {isOverview ? (
            <>
              <div className="group p-4 bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg hover:border-green-500/40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1">Only Successful Payments</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Includes payments with status: 'success' or 'paid' only. This shows your actual spending amount.</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg hover:border-blue-500/40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1">All-Time Statistics</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Shows complete payment history from account creation to present date.</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg hover:border-purple-500/40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1">Real-Time Updates</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Data refreshes automatically when new payments are processed.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="group p-4 bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-lg hover:border-orange-500/40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1">All Payment Types</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Includes successful, failed, pending, and cancelled payments for comprehensive analysis.</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1">Time-Period Filtered</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Data filtered by selected period (7 days, 30 days, 90 days, or 1 year).</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg hover:border-cyan-500/40 transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-1">Detailed Breakdown</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">Shows payment types, trends, recent activity, and success rates.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Right Column - Technical Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            Technical Details
          </h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Data Source</span>
                <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded-full">API</span>
              </div>
              <p className="text-gray-400 text-xs">Real-time data from secure payment processing system</p>
            </div>
            
            <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Update Frequency</span>
                <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded-full">Live</span>
              </div>
              <p className="text-gray-400 text-xs">Updates immediately when payment status changes</p>
            </div>
            
            <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Security</span>
                <span className="text-purple-400 text-xs bg-purple-500/20 px-2 py-1 rounded-full">Encrypted</span>
              </div>
              <p className="text-gray-400 text-xs">Bank-grade encryption and PCI DSS compliance</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Why the Difference */}
      <div className="border-t border-gray-600 pt-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2">Why the Numbers Differ?</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                <span className="font-medium text-white">Overview</span> shows your actual spending (successful payments only) for financial tracking, while <span className="font-medium text-white">Analytics</span> provides comprehensive insights including all payment attempts for better analysis and trend identification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  export default DataExplanationCard;
