import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth header
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// User Projects API functions
export const userProjectsApi = {
  // Get user's assigned projects
  getAssignedProjects: async () => {
    try {
      const response = await apiClient.get('/user-projects/assigned');
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned projects:', error);
      throw error;
    }
  },

  // Get user's project statistics
  getProjectStats: async () => {
    try {
      const response = await apiClient.get('/user-projects/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching project stats:', error);
      throw error;
    }
  },

  // Get detailed project information
  getProjectDetails: async (projectId) => {
    try {
      const response = await apiClient.get(`/user-projects/details/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project details:', error);
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    try {
      const response = await apiClient.put(`/user-projects/task/${taskId}/status`, {
        task_status: status
      });
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },

  // Refresh project status (for debugging)
  refreshProjectStatus: async (projectId) => {
    try {
      const response = await apiClient.get(`/user-projects/refresh-status/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error refreshing project status:', error);
      throw error;
    }
  },

  // Debug project tasks (for troubleshooting)
  debugProjectTasks: async (projectId) => {
    try {
      const response = await apiClient.get(`/user-projects/debug-tasks/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error debugging project tasks:', error);
      throw error;
    }
  },

  // Test endpoint to create In Progress task
  createTestInProgressTask: async (projectId) => {
    try {
      const response = await apiClient.post(`/user-projects/test-in-progress/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error creating test In Progress task:', error);
      throw error;
    }
  }
};

export default userProjectsApi;
