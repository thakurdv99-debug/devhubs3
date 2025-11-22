import axios from 'axios';
import { API_ENDPOINTS } from '@shared/config/api';

// Get auth token
const getAuthToken = () => localStorage.getItem('token');

// Create axios instance with auth header
const createAuthInstance = () => {
  const token = getAuthToken();
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Project Selection API Service
 * Handles all project selection related API calls
 */
export const projectSelectionApi = {
  /**
   * Create a new project selection configuration
   */
  createSelection: async (projectId, selectionData) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CREATE_SELECTION(projectId),
        selectionData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get project selection configuration
   */
  getSelection: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_SELECTION(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Manual selection of users
   */
  manualSelection: async (projectId, selectedUserIds, reason = 'manual') => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.MANUAL_SELECTION(projectId),
        { selectedUserIds, reason }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get ranked bidders for manual selection
   */
  getRankedBidders: async (projectId, limit = 50) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_RANKED_BIDDERS(projectId),
        { params: { limit } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Update selection configuration
   */
  updateSelectionConfig: async (projectId, configData) => {
    try {
      const response = await createAuthInstance().put(
        API_ENDPOINTS.UPDATE_SELECTION_CONFIG(projectId),
        configData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get all selections for project owner
   */
  getProjectOwnerSelections: async () => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_PROJECT_OWNER_SELECTIONS
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Cancel selection
   */
  cancelSelection: async (projectId) => {
    try {
      const response = await createAuthInstance().post(
        API_ENDPOINTS.CANCEL_SELECTION(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get team members for a project
   */
  getProjectTeamMembers: async (projectId) => {
    try {
      const response = await createAuthInstance().get(
        API_ENDPOINTS.GET_TEAM_MEMBERS(projectId)
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default projectSelectionApi;
