import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { escrowWalletApi } from '../services/escrowWalletApi';
import { 
  Wallet, 
  Lock, 
  Unlock, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Shield,
  FileText,
  Star,
  Loader2,
  Eye,
  Settings,
  BarChart3
} from 'lucide-react';

const EscrowWalletManager = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [escrowWallet, setEscrowWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [bonusPoolAmount, setBonusPoolAmount] = useState('');
  const [showCreateEscrow, setShowCreateEscrow] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [qualityScore, setQualityScore] = useState(5);

  // Load escrow wallet data
  useEffect(() => {
    loadEscrowWallet();
  }, [projectId]);

  const loadEscrowWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await escrowWalletApi.getEscrowWallet(projectId);
      setEscrowWallet(data.escrowWallet);
    } catch (err) {
      if (err.message?.includes('not found')) {
        setEscrowWallet(null);
      } else {
        setError(err.message || 'Failed to load escrow wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create escrow wallet
  const handleCreateEscrow = async () => {
    if (!bonusPoolAmount || bonusPoolAmount <= 0) {
      setError('Please enter a valid bonus pool amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await escrowWalletApi.createEscrowWallet(projectId, parseFloat(bonusPoolAmount));
      await loadEscrowWallet();
      setShowCreateEscrow(false);
      setBonusPoolAmount('');
    } catch (err) {
      setError(err.message || 'Failed to create escrow wallet');
    } finally {
      setLoading(false);
    }
  };

  // Complete project
  const handleCompleteProject = async () => {
    if (!window.confirm('Are you sure you want to complete this project? This will release all funds to selected users.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await escrowWalletApi.completeProject(projectId, completionNotes, qualityScore);
      await loadEscrowWallet();
      setCompletionNotes('');
      setQualityScore(5);
    } catch (err) {
      setError(err.message || 'Failed to complete project');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: Shield },
      locked: { color: 'bg-yellow-100 text-yellow-800', icon: Lock },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  // Get lock status badge
  const getLockStatusBadge = (status) => {
    const statusConfig = {
      locked: { color: 'bg-red-100 text-red-800', icon: Lock },
      released: { color: 'bg-green-100 text-green-800', icon: Unlock },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: RefreshCw }
    };
    
    const config = statusConfig[status] || statusConfig.locked;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading && !escrowWallet) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading escrow wallet...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Escrow Wallet Manager</h1>
        <p className="text-gray-600">Manage project funds and payments securely</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Create Escrow Wallet */}
      {!escrowWallet && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Escrow Wallet Found</h2>
            <p className="text-gray-600 mb-6">
              Create an escrow wallet to securely manage project funds and bonus pool distribution.
            </p>
            
            {!showCreateEscrow ? (
              <button
                onClick={() => setShowCreateEscrow(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create Escrow Wallet
              </button>
            ) : (
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Pool Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bonusPoolAmount}
                    onChange={(e) => setBonusPoolAmount(e.target.value)}
                    placeholder="Enter bonus pool amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateEscrow}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Wallet'}
                  </button>
                  <button
                    onClick={() => setShowCreateEscrow(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Escrow Wallet Overview */}
      {escrowWallet && (
        <>
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'funds', label: 'Locked Funds', icon: Lock },
                { id: 'bonus', label: 'Bonus Pool', icon: DollarSign },
                { id: 'completion', label: 'Project Completion', icon: CheckCircle },
                { id: 'audit', label: 'Audit Log', icon: FileText }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Escrow Wallet Overview</h2>
                {getStatusBadge(escrowWallet.status)}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Bonus Pool</p>
                      <p className="text-2xl font-bold text-blue-900">₹{escrowWallet.totalBonusPool}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Total Contributors</p>
                      <p className="text-2xl font-bold text-green-900">{escrowWallet.bonusPoolDistribution.totalContributors}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Lock className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Locked Funds</p>
                      <p className="text-2xl font-bold text-yellow-900">₹{escrowWallet.totalEscrowAmount || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-purple-600">Per Contributor</p>
                      <p className="text-2xl font-bold text-purple-900">₹{escrowWallet.bonusPoolDistribution.amountPerContributor}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Completion Status */}
              {escrowWallet.projectCompletion && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Project Completion</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="ml-2 font-medium">
                        {escrowWallet.projectCompletion.isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    {escrowWallet.projectCompletion.completedAt && (
                      <div>
                        <span className="text-sm text-gray-600">Completed:</span>
                        <span className="ml-2 font-medium">
                          {new Date(escrowWallet.projectCompletion.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {escrowWallet.projectCompletion.qualityScore && (
                      <div>
                        <span className="text-sm text-gray-600">Quality Score:</span>
                        <span className="ml-2 font-medium flex items-center">
                          {escrowWallet.projectCompletion.qualityScore}/10
                          <Star className="w-4 h-4 text-yellow-500 ml-1" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Locked Funds Tab */}
          {activeTab === 'funds' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Locked Funds</h2>
              
              {escrowWallet.lockedFunds && escrowWallet.lockedFunds.length > 0 ? (
                <div className="space-y-4">
                  {escrowWallet.lockedFunds.map((fund, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{fund.userId?.username || 'Unknown User'}</h4>
                          <p className="text-sm text-gray-600">Bid ID: {fund.bidId}</p>
                        </div>
                        {getLockStatusBadge(fund.lockStatus)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Bid Amount:</span>
                          <span className="ml-2 font-medium">₹{fund.bidAmount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Bonus Amount:</span>
                          <span className="ml-2 font-medium">₹{fund.bonusAmount}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="ml-2 font-medium">₹{fund.totalAmount}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <span>Locked: {new Date(fund.lockedAt).toLocaleDateString()}</span>
                        {fund.releasedAt && (
                          <span className="ml-4">Released: {new Date(fund.releasedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No funds are currently locked in escrow.</p>
                </div>
              )}
            </div>
          )}

          {/* Bonus Pool Tab */}
          {activeTab === 'bonus' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Bonus Pool Distribution</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Pool Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Total Pool:</span>
                      <span className="font-medium">₹{escrowWallet.totalBonusPool}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Distributed:</span>
                      <span className="font-medium">₹{escrowWallet.bonusPoolDistribution.distributedAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Remaining:</span>
                      <span className="font-medium">₹{escrowWallet.bonusPoolDistribution.remainingAmount}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Distribution Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Total Contributors:</span>
                      <span className="font-medium">{escrowWallet.bonusPoolDistribution.totalContributors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">Amount per Contributor:</span>
                      <span className="font-medium">₹{escrowWallet.bonusPoolDistribution.amountPerContributor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project Completion Tab */}
          {activeTab === 'completion' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Completion</h2>
              
              {escrowWallet.projectCompletion?.isCompleted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-green-800 font-medium">Project Completed</span>
                  </div>
                  <div className="text-sm text-green-700">
                    <p>Completed on: {new Date(escrowWallet.projectCompletion.completedAt).toLocaleDateString()}</p>
                    {escrowWallet.projectCompletion.completionNotes && (
                      <p className="mt-2">Notes: {escrowWallet.projectCompletion.completionNotes}</p>
                    )}
                    {escrowWallet.projectCompletion.qualityScore && (
                      <p className="mt-2">Quality Score: {escrowWallet.projectCompletion.qualityScore}/10</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Clock className="w-5 h-5 text-yellow-400 mr-2" />
                      <span className="text-yellow-800 font-medium">Project In Progress</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Complete the project to release all funds to selected contributors.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">Complete Project</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Completion Notes
                        </label>
                        <textarea
                          value={completionNotes}
                          onChange={(e) => setCompletionNotes(e.target.value)}
                          placeholder="Add any notes about project completion..."
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quality Score (1-10)
                        </label>
                        <div className="flex items-center space-x-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => (
                            <button
                              key={score}
                              onClick={() => setQualityScore(score)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                qualityScore >= score
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={handleCompleteProject}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                          'Complete Project & Release Funds'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Audit Log</h2>
              
              {escrowWallet.auditLog && escrowWallet.auditLog.length > 0 ? (
                <div className="space-y-4">
                  {escrowWallet.auditLog.map((log, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{log.action.toUpperCase()}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">₹{log.amount}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{log.description}</p>
                      
                      <div className="text-xs text-gray-500">
                        <span>User: {log.userId}</span>
                        {log.ipAddress && <span className="ml-4">IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No audit logs available.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EscrowWalletManager;
