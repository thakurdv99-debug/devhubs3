import React from "react";
import { motion } from "framer-motion";
import {
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaTasks,
  FaProjectDiagram,
} from "react-icons/fa";

const ProjectStatsSection = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FaChartLine className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Project Statistics</h2>
        </div>
        <div className="text-gray-400 text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          Loading project statistics...
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Projects",
      value: stats?.totalProjects || 0,
      icon: FaProjectDiagram,
      color: "blue",
      bgColor: "bg-blue-500/20",
      textColor: "text-blue-400",
    },
    {
      title: "Completed",
      value: stats?.completedProjects || 0,
      icon: FaCheckCircle,
      color: "green",
      bgColor: "bg-green-500/20",
      textColor: "text-green-400",
    },
    {
      title: "In Progress",
      value: stats?.inProgressProjects || 0,
      icon: FaClock,
      color: "yellow",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400",
    },
    {
      title: "Total Earnings",
      value: `$${stats?.totalEarnings?.toLocaleString() || 0}`,
      icon: FaDollarSign,
      color: "purple",
      bgColor: "bg-purple-500/20",
      textColor: "text-purple-400",
    },
  ];

  const progressStats = [
    {
      title: "Completion Rate",
      value: `${stats?.completionRate || 0}%`,
      progress: stats?.completionRate || 0,
      color: "blue",
    },
    {
      title: "Task Completion",
      value: `${stats?.taskCompletionRate || 0}%`,
      progress: stats?.taskCompletionRate || 0,
      color: "green",
    },
  ];

  return (
    <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <FaChartLine className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Project Statistics</h2>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <span className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </span>
            </div>
            <h3 className="text-white font-semibold text-lg">{stat.title}</h3>
          </motion.div>
        ))}
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {progressStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">{stat.title}</h3>
              <span className={`text-2xl font-bold text-${stat.color}-400`}>
                {stat.value}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                className={`h-3 rounded-full bg-${stat.color}-500`}
                initial={{ width: 0 }}
                animate={{ width: `${stat.progress}%` }}
                transition={{ duration: 1, delay: index * 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProjectStatsSection;
