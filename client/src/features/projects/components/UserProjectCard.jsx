import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaClock, FaHourglassHalf, FaTasks, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';

const UserProjectCard = ({ project, onClick }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <FaCheckCircle className="w-4 h-4 text-green-400" />;
      case 'In Progress':
        return <FaClock className="w-4 h-4 text-yellow-400" />;
      case 'Pending':
        return <FaHourglassHalf className="w-4 h-4 text-gray-400" />;
      default:
        return <FaClock className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'In Progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Pending':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 cursor-pointer group"
      onClick={() => onClick && onClick(project)}
    >
      {/* Project Cover Photo */}
      {project.coverPhoto && (
        <div className="relative overflow-hidden rounded-t-2xl">
          <img
                            src={`${import.meta.env.VITE_API_URL}${project.coverPhoto}`}
            alt={project.projectTitle}
            className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      )}

      <div className="p-6">
        {/* Project Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
            {project.projectTitle || 'Untitled Project'}
          </h3>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(project.projectStatus)}`}>
            {getStatusIcon(project.projectStatus)}
            <span className="text-xs font-medium">{project.projectStatus || 'Unknown'}</span>
          </div>
        </div>

        {/* Project Description */}
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {project.projectDescription || 'No description available'}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>{project.progressPercentage || 0}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${project.progressPercentage || 0}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Task Statistics */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1 text-green-400">
            <FaTasks className="w-3 h-3" />
            <span>{project.completedTasks || 0}/{project.totalTasks || 0} completed</span>
          </div>
          {(project.inProgressTasks || 0) > 0 && (
            <div className="flex items-center gap-1 text-yellow-400">
              <FaClock className="w-3 h-3" />
              <span>{project.inProgressTasks || 0} in progress</span>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="space-y-2">
          {/* Tech Stack */}
          <div className="flex items-center gap-2">
            <span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full text-xs">
              {project.techStack || 'No tech stack'}
            </span>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
            <div className="flex items-center gap-1 text-green-400">
              <FaDollarSign className="w-3 h-3" />
              <span className="text-sm font-semibold">${(project.bidAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <FaCalendarAlt className="w-3 h-3" />
              <span className="text-xs">{formatDate(project.assignedDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserProjectCard;
