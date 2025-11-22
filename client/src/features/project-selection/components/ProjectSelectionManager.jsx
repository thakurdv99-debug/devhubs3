import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectSelectionApi } from '../services/projectSelectionApi';
import { escrowWalletApi } from '@features/escrow/services/escrowWalletApi';
import { 
  Users, 
  Settings, 
  Play, 
  UserCheck, 
  UserX, 
  Award, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Star,
  DollarSign,
  Briefcase,
  Calendar,
  Wallet,
  Shield
} from 'lucide-react';

const ProjectSelectionManager = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [selection, setSelection] = useState(null);
  const [rankedBidders, setRankedBidders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('config');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [escrowWallet, setEscrowWallet] = useState(null);
  const [escrowLoading, setEscrowLoading] = useState(false);

  // Configuration state
  const [config, setConfig] = useState({
    selectionMode: 'manual', // Force manual mode only
    requiredContributors: 1,
    maxBidsToConsider: 50,
    requiredSkills: [],
    criteriaWeights: {
      skillMatch: 40,
      bidAmount: 30,
      experience: 20,
      availability: 10
    }
  });

  // Load selection data
  useEffect(() => {
    loadSelectionData();
  }, [projectId]);

  const loadSelectionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const selectionData = await projectSelectionApi.getSelection(projectId);
      setSelection(selectionData.selection);
      
      if (selectionData.selection) {
        setConfig({
          selectionMode: 'manual', // Force manual mode
          requiredContributors: selectionData.selection.requiredContributors || 1,
          maxBidsToConsider: selectionData.selection.maxBidsToConsider || 50,
          requiredSkills: selectionData.selection.requiredSkills || [],
          criteriaWeights: selectionData.selection.criteriaWeights || {
            skillMatch: 40,
            bidAmount: 30,
            experience: 20,
            availability: 10
          }
        });

        // Load escrow wallet data if selection is completed
        if (selectionData.selection.status === 'completed') {
          await loadEscrowWalletData();
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load selection data');
    } finally {
      setLoading(false);
    }
  };

  // Load escrow wallet data
  const loadEscrowWalletData = async () => {
    try {
      setEscrowLoading(true);
      const data = await escrowWalletApi.getEscrowWallet(projectId);
      setEscrowWallet(data.escrowWallet);
    } catch (error) {
      console.error('Failed to load escrow wallet data:', error);
      setEscrowWallet(null);
    } finally {
      setEscrowLoading(false);
    }
  };

  // Create or update selection configuration
  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (selection) {
        await projectSelectionApi.updateSelectionConfig(projectId, config);
      } else {
        await projectSelectionApi.createSelection(projectId, config);
      }
      
      await loadSelectionData();
      setActiveTab('overview');
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };



  // Load ranked bidders for user selection
  const handleLoadRankedBidders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await projectSelectionApi.getRankedBidders(projectId, config.maxBidsToConsider);
      setRankedBidders(result.rankedBidders);
      setShowManualSelection(true);
    } catch (err) {
      setError(err.message || 'Failed to load ranked bidders');
    } finally {
      setLoading(false);
    }
  };

  // User selection
  const handleManualSelection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await projectSelectionApi.manualSelection(projectId, selectedUsers, 'manual_selection');
      await loadSelectionData();
      setShowManualSelection(false);
      setSelectedUsers([]);
      
      // If escrow was created, load escrow data
      if (result.escrowCreated) {
        await loadEscrowWalletData();
      }
      
      setActiveTab('results');
    } catch (err) {
      setError(err.message || 'Failed to complete user selection');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        if (prev.length < config.requiredContributors) {
          return [...prev, userId];
        }
        return prev;
      }
    });
  };

  // Cancel selection
  const handleCancelSelection = async () => {
    if (!window.confirm('Are you sure you want to cancel this selection? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await projectSelectionApi.cancelSelection(projectId);
      await loadSelectionData();
    } catch (err) {
      setError(err.message || 'Failed to cancel selection');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading && !selection) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading selection data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Project User Selection Manager</h1>
        <p className="text-gray-600">Configure and manually select contributors for your project</p>
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'config', label: 'Configuration', icon: Settings },
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'manual', label: 'User Selection', icon: UserCheck },
            { id: 'results', label: 'Results', icon: Award }
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

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">User Selection Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Contributors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Contributors
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.requiredContributors}
                onChange={(e) => setConfig(prev => ({ ...prev, requiredContributors: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Max Bids to Consider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Bids to Consider
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={config.maxBidsToConsider}
                onChange={(e) => setConfig(prev => ({ ...prev, maxBidsToConsider: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills (comma-separated)
              </label>
              <input
                type="text"
                value={config.requiredSkills.join(', ')}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                }))}
                placeholder="JavaScript, React, Node.js"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Criteria Weights */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Evaluation Criteria (For Reference)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(config.criteriaWeights).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      criteriaWeights: {
                        ...prev.criteriaWeights,
                        [key]: parseInt(e.target.value)
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save User Selection Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">User Selection Overview</h2>
          
          {selection ? (
            <div className="space-y-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Current Status</h3>
                  <div className="mt-2">{getStatusBadge(selection.status)}</div>
                </div>
                
                <div className="flex space-x-3">
                  {selection.status === 'pending' && (
                    <>
                      <button
                        onClick={handleLoadRankedBidders}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Select Users
                      </button>
                    </>
                  )}
                  
                  {selection.status === 'pending' && (
                    <button
                      onClick={handleCancelSelection}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Cancel Selection
                    </button>
                  )}
                </div>
              </div>

              {/* Configuration Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Configuration Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Mode:</span>
                    <span className="ml-2 font-medium">Manual Selection Only</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Required:</span>
                    <span className="ml-2 font-medium">{selection.requiredContributors} contributors</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Bids:</span>
                    <span className="ml-2 font-medium">{selection.maxBidsToConsider}</span>
                  </div>
                </div>
              </div>

              {/* Selected Users */}
              {selection.selectedUsers && selection.selectedUsers.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Selected Users ({selection.selectedUsers.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selection.selectedUsers.map((user, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{user.userId?.username || 'Unknown User'}</h5>
                          <span className="text-sm text-gray-500">Score: {user.selectionScore}%</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Bid Amount: ₹{user.bidAmount || 0}</p>
                          <p>Reason: {user.selectionReason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No user selection configuration found. Please configure the user selection first.</p>
            </div>
          )}
        </div>
      )}

      {/* User Selection Tab */}
      {activeTab === 'manual' && showManualSelection && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">User Selection</h2>
          
          <div className="mb-4 flex items-center justify-between">
            <p className="text-gray-600">
              Select up to {config.requiredContributors} users from the ranked list below
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Selected: {selectedUsers.length}/{config.requiredContributors}
              </span>
              <button
                onClick={handleManualSelection}
                disabled={selectedUsers.length === 0 || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm User Selection'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {rankedBidders.map((bidder, index) => (
              <div
                key={bidder.userId}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedUsers.includes(bidder.userId)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleUserSelection(bidder.userId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{bidder.userId}</h4>
                      <p className="text-sm text-gray-600">Score: {bidder.totalScore}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span>₹{bidder.bidAmount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>{bidder.experienceScore}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>{bidder.skillMatchScore}%</span>
                    </div>
                  </div>
                </div>
                
                {bidder.profile && (
                  <div className="mt-3 text-sm text-gray-600">
                    <p>{bidder.profile.bio}</p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span>Projects: {bidder.profile.completedProjects}</span>
                      <span>Contributions: {bidder.profile.contributions}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && selection && selection.selectedUsers && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">User Selection Results</h2>
          
                      <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Final User Selection</h3>
                <p className="text-gray-600">
                  {selection.selectedUsers.length} users selected out of {selection.totalBidsConsidered || 0} total bids
                </p>
              </div>
              {getStatusBadge(selection.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selection.selectedUsers.map((user, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">{user.userId?.username || 'Unknown User'}</h4>
                  <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Selection Score</span>
                    <span className="font-medium">{user.selectionScore}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bid Amount</span>
                    <span className="font-medium">₹{user.bidAmount || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Skill Match</span>
                    <span className="font-medium">{user.skillMatchScore}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Experience</span>
                    <span className="font-medium">{user.experienceScore}%</span>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Reason: {user.selectionReason}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selection.status === 'completed' && (
            <>
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  <span className="text-green-800">
                    Selection completed successfully! Selected users have been notified and can now access the project workspace.
                  </span>
                </div>
              </div>

              {/* Escrow Wallet Management Section */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Wallet className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900">Escrow Wallet Management</h3>
                  </div>
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>

                {escrowLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                    <span className="text-blue-800">Loading escrow wallet...</span>
                  </div>
                ) : escrowWallet ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="text-sm text-blue-600 mb-1">Total Bonus Pool</div>
                        <div className="text-2xl font-bold text-blue-900">₹{escrowWallet.totalBonusPool}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="text-sm text-blue-600 mb-1">Locked Funds</div>
                        <div className="text-2xl font-bold text-blue-900">₹{escrowWallet.totalEscrowAmount || 0}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="text-sm text-blue-600 mb-1">Per Contributor</div>
                        <div className="text-2xl font-bold text-blue-900">₹{escrowWallet.bonusPoolDistribution?.amountPerContributor || 0}</div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => navigate(`/escrow-wallet/${projectId}`)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Wallet className="w-4 h-4" />
                        Manage Escrow Wallet
                      </button>
                      <button
                        onClick={() => navigate(`/admin/`)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Go to Admin Panel
                      </button>
                    </div>

                    <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
                      <strong>Escrow Status:</strong> Funds have been automatically locked in escrow for all selected contributors. 
                      The escrow wallet will be managed through the dedicated escrow management interface.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Wallet className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-800 mb-3">Escrow wallet is being created...</p>
                    <button
                      onClick={loadEscrowWalletData}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                    >
                      Refresh Status
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSelectionManager;
