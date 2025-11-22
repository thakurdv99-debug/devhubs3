import axios from 'axios';
import { API_ENDPOINTS } from '@shared/config/api';

// Get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  const authToken = localStorage.getItem('authToken');
  
  console.log('🔍 Token check:');
  console.log('  token key:', token ? `${token.substring(0, 20)}...` : 'No token');
  console.log('  authToken key:', authToken ? `${authToken.substring(0, 20)}...` : 'No authToken');
  
  // Return token from either key
  return token || authToken;
};

// Create axios instance with auth header
const createAuthInstance = () => {
  const token = getAuthToken();
  console.log('🔍 Auth token:', token ? `${token.substring(0, 20)}...` : 'No token');
  
  const instance = axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Add request interceptor for debugging
  instance.interceptors.request.use(
    (config) => {
      console.log('🔍 Making request to:', config.url);
      console.log('🔍 Request method:', config.method);
      console.log('🔍 Request headers:', config.headers);
      return config;
    },
    (error) => {
      console.error('❌ Request error:', error);
      return Promise.reject(error);
    }
  );
  
  return instance;
};

/**
 * Project Task API Service
 * Handles all project task and workspace related API calls
 */
export const projectTaskApi = {
  /**
   * Create project workspace
   */
  createWorkspace: async (projectId, workspaceData) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CREATE_WORKSPACE(projectId),
        workspaceData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get project workspace
   */
  getWorkspace: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_WORKSPACE(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Create a new task
   */
  createTask: async (projectId, taskData) => {
    try {
      console.log('🔍 Creating task for project:', projectId);
      console.log('🔍 Task data:', taskData);
      console.log('🔍 API endpoint:', API_ENDPOINTS.CREATE_TASK(projectId));
      
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CREATE_TASK(projectId),
        taskData
      );
      console.log('✅ Task created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      console.error('❌ Error response:', error.response);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update task
   */
  updateTask: async (projectId, taskId, updateData) => {
    try {
      const response = await createAuthInstance().put(
        API_ENDPOINTS.UPDATE_TASK(projectId, taskId),
        updateData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Complete task
   */
  completeTask: async (projectId, taskId, completionData) => {
    try {
      console.log('🔍 Completing task:', taskId);
      console.log('🔍 Project ID:', projectId);
      console.log('🔍 Completion data:', completionData);
      console.log('🔍 API endpoint:', API_ENDPOINTS.COMPLETE_TASK(projectId, taskId));
      
      const response = await createAuthInstance().post(
        API_ENDPOINTS.COMPLETE_TASK(projectId, taskId),
        completionData
      );
      console.log('✅ Task completed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error completing task:', error);
      console.error('❌ Error response:', error.response);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Review task (Admin only)
   */
  reviewTask: async (projectId, taskId, reviewData) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.REVIEW_TASK(projectId, taskId),
        reviewData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Add comment to task
   */
  addTaskComment: async (projectId, taskId, content) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.ADD_TASK_COMMENT(projectId, taskId),
        { content }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Upload file to task
   */
  uploadTaskFile: async (projectId, taskId, fileData) => {
    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('title', fileData.title || '');
      formData.append('description', fileData.description || '');
      formData.append('isPublic', fileData.isPublic || true);
      formData.append('tags', JSON.stringify(fileData.tags || []));

      const response = await createAuthInstance().post(
        API_ENDPOINTS.UPLOAD_TASK_FILE(projectId, taskId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get project tasks
   */
  getProjectTasks: async (projectId) => {
    try {
      console.log('🔍 Getting tasks for project:', projectId);
      console.log('🔍 API endpoint:', API_ENDPOINTS.GET_PROJECT_TASKS(projectId));
      
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_PROJECT_TASKS(projectId)
      );
      console.log('✅ Project tasks retrieved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error getting project tasks:', error);
      console.error('❌ Error response:', error.response);
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get user's tasks
   */
  getUserTasks: async (filters = {}) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_USER_TASKS,
        { params: filters }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get project statistics
   */
  getProjectStatistics: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_PROJECT_STATISTICS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete a task
   */
  deleteTask: async (projectId, taskId) => {
    try {
      const response = await createAuthInstance().delete(
        API_ENDPOINTS.DELETE_TASK(projectId, taskId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Upload project resource
   */
  uploadProjectResource: async (projectId, resourceData) => {
    try {
      const formData = new FormData();
      formData.append('name', resourceData.name);
      formData.append('type', resourceData.type);
      formData.append('description', resourceData.description || '');
      
      if (resourceData.type === 'file' && resourceData.file) {
        formData.append('file', resourceData.file);
      } else if (resourceData.type === 'link' && resourceData.url) {
        formData.append('url', resourceData.url);
      } else if (resourceData.type === 'document' && resourceData.file) {
        formData.append('file', resourceData.file);
      }

      const response = await createAuthInstance().post(
        API_ENDPOINTS.UPLOAD_PROJECT_RESOURCE(projectId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get project resources
   */
  getProjectResources: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_PROJECT_RESOURCES(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update project resource
   */
  updateProjectResource: async (projectId, resourceId, updateData) => {
    try {
      const response = await createAuthInstance().put(
        API_ENDPOINTS.UPDATE_PROJECT_RESOURCE(projectId, resourceId),
        updateData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Delete project resource
   */
  deleteProjectResource: async (projectId, resourceId) => {
    try {
      const response = await createAuthInstance().delete(
        API_ENDPOINTS.DELETE_PROJECT_RESOURCE(projectId, resourceId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },



  /**
   * Create Firebase access
   */
  createFirebaseAccess: async (projectId) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CREATE_FIREBASE_ACCESS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get project team members
   */
  getProjectTeamMembers: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_PROJECT_TEAM_MEMBERS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Check workspace access
   */
  checkWorkspaceAccess: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.CHECK_WORKSPACE_ACCESS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Debug project access
   */
  debugProjectAccess: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.DEBUG_PROJECT_ACCESS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Debug project bids
   */
  debugProjectBids: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.DEBUG_PROJECT_BIDS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default projectTaskApi;
