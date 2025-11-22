/**
 * Project Status Utility Functions
 * Handles project status calculation based on duration and contributor selection
 */

/**
 * Calculate project status based on duration and contributor selection
 * @param {Object} project - Project object
 * @returns {Object} - Status object with status, message, and styling info
 */
export const calculateProjectStatus = (project) => {
  if (!project) {
    return {
      status: 'unknown',
      message: 'Status Unknown',
      color: 'gray',
      bgColor: 'gray-500/20',
      borderColor: 'gray-500/30',
      icon: 'help'
    };
  }

  const currentDate = new Date();
  const projectEndDate = new Date(project.project_duration);
  const isProjectExpired = currentDate > projectEndDate;
  
  // Check if contributors are selected and working
  const hasSelectedContributors = project.selectedContributors && 
    project.selectedContributors.length > 0;
  
  const hasActiveContributors = hasSelectedContributors && 
    project.selectedContributors.some(contributor => 
      contributor.status === 'pending' || contributor.status === 'paid'
    );

  // Check if there are active tasks (if project has tasks)
  const hasActiveTasks = project.tasks && 
    project.tasks.some(task => 
      task.status === 'in_progress' || task.status === 'pending'
    );

  // Status Logic
  if (isProjectExpired) {
    return {
      status: 'closed',
      message: 'Project Closed',
      color: 'red',
      bgColor: 'red-500/20',
      borderColor: 'red-500/30',
      icon: 'lock',
      description: 'Project duration has ended'
    };
  }

  if (hasActiveContributors && (hasActiveTasks || hasSelectedContributors)) {
    return {
      status: 'team_working',
      message: 'Team Working on Project',
      color: 'blue',
      bgColor: 'blue-500/20',
      borderColor: 'blue-500/30',
      icon: 'users',
      description: 'Contributors are actively working'
    };
  }

  if (hasSelectedContributors) {
    return {
      status: 'contributors_selected',
      message: 'Contributors Selected',
      color: 'yellow',
      bgColor: 'yellow-500/20',
      borderColor: 'yellow-500/30',
      icon: 'check',
      description: 'Contributors have been selected'
    };
  }

  // Default status for active projects
  return {
    status: 'active',
    message: 'Active Project',
    color: 'green',
    bgColor: 'green-500/20',
    borderColor: 'green-500/30',
    icon: 'play',
    description: 'Open for bidding'
  };
};

/**
 * Get status-specific styling classes
 * @param {Object} statusInfo - Status object from calculateProjectStatus
 * @returns {Object} - Tailwind CSS classes
 */
export const getStatusStyling = (statusInfo) => {
  const baseClasses = "px-3 py-1 rounded-full font-medium border text-xs";
  
  return {
    container: `${baseClasses} bg-${statusInfo.bgColor} text-${statusInfo.color}-400 border-${statusInfo.borderColor}`,
    icon: `text-${statusInfo.color}-400`,
    text: `text-${statusInfo.color}-400`
  };
};

/**
 * Check if project is accepting new bids
 * @param {Object} project - Project object
 * @returns {Boolean} - Whether project accepts new bids
 */
export const isProjectAcceptingBids = (project) => {
  const statusInfo = calculateProjectStatus(project);
  return statusInfo.status === 'active' || statusInfo.status === 'contributors_selected';
};

/**
 * Get project status for display in different contexts
 * @param {Object} project - Project object
 * @param {String} context - Context ('card', 'list', 'detail')
 * @returns {Object} - Formatted status for specific context
 */
export const getProjectStatusForContext = (project, context = 'card') => {
  const statusInfo = calculateProjectStatus(project);
  
  switch (context) {
    case 'card':
      return {
        ...statusInfo,
        displayText: statusInfo.message,
        showDescription: false
      };
    
    case 'list':
      return {
        ...statusInfo,
        displayText: statusInfo.message,
        showDescription: true
      };
    
    case 'detail':
      return {
        ...statusInfo,
        displayText: statusInfo.message,
        showDescription: true,
        showIcon: true
      };
    
    default:
      return statusInfo;
  }
};
