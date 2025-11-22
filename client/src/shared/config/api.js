import { getEnvVar, isDevelopment } from '../utils/validation/envValidation';
import { logger } from '../utils/logger';

// API Configuration with validation
// In production, fail if required env vars are missing
const isProduction = import.meta.env.MODE === 'production';
const API_BASE_URL = getEnvVar('VITE_API_URL', isProduction ? null : 'http://localhost:5001');
const SOCKET_SERVER_URL = getEnvVar('VITE_SOCKET_SERVER', isProduction ? null : 'http://localhost:5001');

if (isProduction && (!API_BASE_URL || !SOCKET_SERVER_URL)) {
  throw new Error('VITE_API_URL and VITE_SOCKET_SERVER are required in production');
}

// Debug API configuration in development
if (isDevelopment()) {
  logger.debug('API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    API_BASE_URL,
    SOCKET_SERVER_URL,
    Environment: import.meta.env.MODE,
    BaseURL: import.meta.env.BASE_URL
  });
}

// API endpoints
export const API_ENDPOINTS = {
  // User endpoints
  GET_USER: `${API_BASE_URL}/api/getuser`,
  PROFILE: `${API_BASE_URL}/api/profile`,
  
  // Project endpoints
  GET_PROJECTS: `${API_BASE_URL}/api/project/getlistproject`,
  GET_PROJECT: (id) => `${API_BASE_URL}/api/project/getlistproject/${id}`,
  
  // Bidding endpoints
  GET_BID: (id) => `${API_BASE_URL}/api/bid/getBid/${id}`,
  CREATE_BID: (id) => `${API_BASE_URL}/api/bid/createBid/${id}`,
  
  // Saved projects
  CHECK_SAVED: (id) => `${API_BASE_URL}/api/saved-projects/check/${id}`,
  SAVE_PROJECT: (id) => `${API_BASE_URL}/api/saved-projects/save/${id}`,
  UNSAVE_PROJECT: (id) => `${API_BASE_URL}/api/saved-projects/unsave/${id}`,
  
  // Admin endpoints
  ADMIN_APPLICANTS: `${API_BASE_URL}/api/admin/applicant`,
  ADMIN_PROJECTS: `${API_BASE_URL}/api/admin/myproject`,
  ADMIN_OVERVIEW: `${API_BASE_URL}/api/admin/overview`,
  ADMIN_DELETE_PROJECT: (id) => `${API_BASE_URL}/api/admin/deleteproject/${id}`,
  ADMIN_UPDATE_APPLICANT: (id) => `${API_BASE_URL}/api/admin/applicant/${id}`,
  ADMIN_PROJECT_TASK: `${API_BASE_URL}/api/admin/projecttask`,
  ADMIN_EDIT_PROJECT_TASK: (id) => `${API_BASE_URL}/api/admin/editprojecttask/${id}`,
  ADMIN_DELETE_PROJECT_TASK: (id) => `${API_BASE_URL}/api/admin/deleteprojecttask/${id}`,
  
  // Chat endpoints
  GET_CHAT: (id) => `${API_BASE_URL}/api/project/chat/${id}`,
  
  // Upload endpoints
  UPLOAD_AVATAR: `${API_BASE_URL}/api/uploads/single/avatar`,
  
  // User projects
  USER_PROJECTS_BASE: `${API_BASE_URL}/api/user-projects`,

  // Project Selection System endpoints
  PROJECT_SELECTION_BASE: `${API_BASE_URL}/api/project-selection`,
  CREATE_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/create/${projectId}`,
  GET_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}`,
  GET_TEAM_MEMBERS: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/team-members`,
  MANUAL_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/manual-selection`,
  GET_RANKED_BIDDERS: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/ranked-bidders`,
  UPDATE_SELECTION_CONFIG: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/config`,
  GET_PROJECT_OWNER_SELECTIONS: `${API_BASE_URL}/api/project-selection/owner/selections`,
  CANCEL_SELECTION: (projectId) => `${API_BASE_URL}/api/project-selection/${projectId}/cancel`,

  // Escrow Wallet System endpoints
  ESCROW_BASE: `${API_BASE_URL}/api/escrow`,
  CREATE_ESCROW: (projectId) => `${API_BASE_URL}/api/escrow/create/${projectId}`,
  GET_ESCROW: (projectId) => `${API_BASE_URL}/api/escrow/${projectId}`,
  LOCK_USER_FUNDS: (projectId, userId, bidId) => `${API_BASE_URL}/api/escrow/${projectId}/lock/${userId}/${bidId}`,
  RELEASE_USER_FUNDS: (projectId, userId, bidId) => `${API_BASE_URL}/api/escrow/${projectId}/release/${userId}/${bidId}`,
  REFUND_USER_FUNDS: (projectId, userId, bidId) => `${API_BASE_URL}/api/escrow/${projectId}/refund/${userId}/${bidId}`,
  COMPLETE_PROJECT: (projectId) => `${API_BASE_URL}/api/escrow/${projectId}/complete`,
  GET_PROJECT_OWNER_ESCROWS: `${API_BASE_URL}/api/escrow/owner/escrows`,
  GET_ESCROW_STATS: `${API_BASE_URL}/api/escrow/owner/stats`,
  // User Escrow endpoints for contribution panel
  GET_USER_ESCROW: (projectId) => `${API_BASE_URL}/api/escrow/user/${projectId}`,
  GET_USER_ESCROW_STATUS: (projectId) => `${API_BASE_URL}/api/escrow/user/${projectId}/status`,
  REQUEST_USER_WITHDRAWAL: (projectId) => `${API_BASE_URL}/api/escrow/user/${projectId}/withdraw`,
  // New two-step withdrawal system
  MOVE_FUNDS_TO_BALANCE: (projectId) => `${API_BASE_URL}/api/escrow/user/${projectId}/move-to-balance`,
  REQUEST_BALANCE_WITHDRAWAL: `${API_BASE_URL}/api/escrow/user/withdraw`,
  GET_USER_BALANCE: `${API_BASE_URL}/api/escrow/user/balance`,
  UPDATE_BANK_DETAILS: `${API_BASE_URL}/api/escrow/user/bank-details`,
  GET_BANK_DETAILS: `${API_BASE_URL}/api/escrow/user/bank-details`,

  // Project Task System endpoints
  PROJECT_TASKS_BASE: `${API_BASE_URL}/api/project-tasks`,
  CREATE_WORKSPACE: (projectId) => `${API_BASE_URL}/api/project-tasks/workspace/${projectId}`,
  GET_WORKSPACE: (projectId) => `${API_BASE_URL}/api/project-tasks/workspace/${projectId}`,
  CREATE_TASK: (projectId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks`,
  UPDATE_TASK: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}`,
  DELETE_TASK: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}`,
  COMPLETE_TASK: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}/complete`,
  REVIEW_TASK: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}/review`,
  ADD_TASK_COMMENT: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}/comments`,
  UPLOAD_TASK_FILE: (projectId, taskId) => `${API_BASE_URL}/api/project-tasks/${projectId}/tasks/${taskId}/files`,
  GET_USER_TASKS: `${API_BASE_URL}/api/project-tasks/user/tasks`,
  GET_PROJECT_STATISTICS: (projectId) => `${API_BASE_URL}/api/project-tasks/${projectId}/statistics`,
  GET_PROJECT_TASKS: (projectId) => `${API_BASE_URL}/api/project-tasks/${projectId}/get-tasks`,

  CREATE_FIREBASE_ACCESS: (projectId) => `${API_BASE_URL}/api/project-tasks/firebase-access/${projectId}`,
  GET_PROJECT_TEAM_MEMBERS: (projectId) => `${API_BASE_URL}/api/project-tasks/${projectId}/team`,
  CHECK_WORKSPACE_ACCESS: (projectId) => `${API_BASE_URL}/api/project-tasks/workspace/${projectId}/check-access`,
  DEBUG_PROJECT_ACCESS: (projectId) => `${API_BASE_URL}/api/project-tasks/debug/${projectId}`,
  DEBUG_PROJECT_BIDS: (projectId) => `${API_BASE_URL}/api/project-tasks/debug/${projectId}/bids`,
  
  // Project Resource Management endpoints
  UPLOAD_PROJECT_RESOURCE: (projectId) => `${API_BASE_URL}/api/project-tasks/${projectId}/resources`,
  GET_PROJECT_RESOURCES: (projectId) => `${API_BASE_URL}/api/project-tasks/${projectId}/resources`,
  UPDATE_PROJECT_RESOURCE: (projectId, resourceId) => `${API_BASE_URL}/api/project-tasks/${projectId}/resources/${resourceId}`,
  DELETE_PROJECT_RESOURCE: (projectId, resourceId) => `${API_BASE_URL}/api/project-tasks/${projectId}/resources/${resourceId}`,
};

// File URLs
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

// Socket configuration
export const SOCKET_CONFIG = {
  url: SOCKET_SERVER_URL,
  options: {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  }
};

export default API_BASE_URL;
