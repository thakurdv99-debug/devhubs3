import Navbar from "@shared/components/layout/NavBar";
import axios from "axios";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import userProjectsApi from "@features/projects/services/userProjectsApi";
import ProjectStatsSection from "@features/projects/components/ProjectStatsSection";
import UserProjectCard from "@features/projects/components/UserProjectCard";
import PremiumBadge, { SubscriptionStatusBadge } from "@shared/components/PremiumBadge";
import { db } from "@shared/config/firebase";
import { motion } from "framer-motion";  
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaGlobe,
  FaEdit,
  FaCode,
  FaRocket,
  FaTrophy,
  FaCalendar,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaMoon,
  FaSun,
  FaPalette,
  FaChartBar,
  FaDownload,
  FaHtml5,
  FaCss3Alt,
  FaJs,
  FaReact,
  FaNodeJs,
  FaDatabase,
  FaDocker,
  FaPython,
  FaGitAlt,
  FaAws,
  FaSync,
} from "react-icons/fa";

import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Professional Skill Card Component
const SkillCard = React.memo(({ skill, getSkillIcon }) => {
  const SkillIcon = getSkillIcon(skill.name);

  return (
    <motion.div
      className="group relative bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-xl border border-gray-700/50 p-5 hover:border-blue-500/40 transition-all duration-300 cursor-pointer"
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Skill Icon and Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-all duration-300">
          <SkillIcon className="text-xl text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
            {skill.name}
          </h3>
          <span className="text-gray-400 text-sm">{skill.category}</span>
        </div>
      </div>

      {/* Proficiency Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              skill.proficiency === "Experienced"
                ? "bg-green-400"
                : skill.proficiency === "Intermediate"
                ? "bg-yellow-400"
                : "bg-purple-400"
            }`}
          ></div>
          <span
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              skill.proficiency === "Experienced"
                ? "bg-green-500/20 text-green-400"
                : skill.proficiency === "Intermediate"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-purple-500/20 text-purple-400"
            }`}
          >
            {skill.proficiency}
          </span>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
          {skill.projects} projects
        </span>
      </div>
    </motion.div>
  );
});

// Optimized Contribution Square Component
const ContributionSquare = React.memo(
  ({ contributionLevel, contributionCount, date }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className="w-4 h-4 rounded-md cursor-pointer group relative border border-gray-700/40 transition-transform duration-200 hover:scale-110"
        style={{
          backgroundColor:
            contributionLevel === 0
              ? "#374151"
              : contributionLevel === 1
              ? "#0e4429"
              : contributionLevel === 2
              ? "#006d32"
              : contributionLevel === 3
              ? "#26a641"
              : "#39d353",
          boxShadow:
            contributionLevel > 0 ? "0 2px 6px rgba(0, 0, 0, 0.3)" : "none",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Optimized Tooltip */}
        {isHovered && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl whitespace-nowrap z-20 border border-gray-700/50 shadow-2xl">
            <div className="font-bold text-green-400 mb-1">
              {contributionCount} contributions
            </div>
            <div className="text-gray-300 text-xs">
              {date.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-gray-900/95"></div>
          </div>
        )}
      </div>
    );
  }
);

// Lazy Skills Section Component
const SkillsSection = React.memo(
  ({
    skills,
    getSkillIcon,
    contributionData,
    contributionStats,
    userStats,
    selectedTimePeriod,
    setSelectedTimePeriod,
    showAnalytics,
    setShowAnalytics,
    isRealTimeEnabled,
    setIsRealTimeEnabled,
    analyticsData,
    getRealTimeData,
    fetchUserProfile,
    fetchUserProjects,
    fetchProjectStats,
    immediateFetchData,
    loading,
    loadingProjects,
    isFirebaseConnected,
    syncAnalyticsToFirebase,
    loadingAnalytics,
    syncAllContributionsToFirebase,
    setContributionUpdateTrigger,
    userProfile,
  }) => {
    const [showAllSkills, setShowAllSkills] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      // Simulate loading time for better UX
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }, []);

    if (!isLoaded) {
      return (
        <div className="space-y-8">
          <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 bg-gray-700 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Skills by Domain Section */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              Skills by Domain
            </h3>
            <p className="text-gray-400">
              Organized expertise across different technology areas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Frontend Development */}
            <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-xl border border-blue-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FaHtml5 className="text-xl text-blue-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Frontend</h4>
                  <p className="text-blue-400 text-sm">
                    {
                      skills.filter((skill) => skill.category === "Frontend")
                        .length
                    }{" "}
                    technologies
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {skills
                  .filter((skill) => skill.category === "Frontend")
                  .map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-300 text-sm">
                        {skill.name}
                      </span>
                      <span className="text-blue-400 text-xs bg-blue-500/10 px-2 py-1 rounded-full">
                        {skill.experience}y
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Backend Development */}
            <div className="bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-xl border border-green-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FaNodeJs className="text-xl text-green-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Backend</h4>
                  <p className="text-green-400 text-sm">
                    {
                      skills.filter((skill) => skill.category === "Backend")
                        .length
                    }{" "}
                    technologies
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {skills
                  .filter((skill) => skill.category === "Backend")
                  .map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-300 text-sm">
                        {skill.name}
                      </span>
                      <span className="text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded-full">
                        {skill.experience}y
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* DevOps & Tools */}
            <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-xl border border-purple-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FaDocker className="text-xl text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">DevOps</h4>
                  <p className="text-purple-400 text-sm">
                    {
                      skills.filter((skill) => skill.category === "DevOps")
                        .length
                    }{" "}
                    technologies
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {skills
                  .filter((skill) => skill.category === "DevOps")
                  .map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-gray-300 text-sm">
                        {skill.name}
                      </span>
                      <span className="text-purple-400 text-xs bg-purple-500/10 px-2 py-1 rounded-full">
                        {skill.experience}y
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Professional Skills & Technologies Section */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="text-center flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">
                Technical Skills & Expertise
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Comprehensive knowledge across multiple technology domains with
                hands-on project experience
              </p>
            </div>
            <button
              onClick={fetchUserProfile}
              disabled={loading}
              className="p-3 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh skills data"
            >
              <FaSync className={`text-lg ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Skills Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {skills.length}
              </div>
              <div className="text-gray-300 font-medium">Technologies</div>
              <div className="text-gray-500 text-sm mt-1">Mastered</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {
                  skills.filter((skill) => skill.proficiency === "Experienced")
                    .length
                }
              </div>
              <div className="text-gray-300 font-medium">Experienced</div>
              <div className="text-gray-500 text-sm mt-1">3+ Years</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-xl border border-yellow-500/20 p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {
                  skills.filter((skill) => skill.proficiency === "Intermediate")
                    .length
                }
              </div>
              <div className="text-gray-300 font-medium">Intermediate</div>
              <div className="text-gray-500 text-sm mt-1">1-2 Years</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {
                  skills.filter((skill) => skill.proficiency === "Beginner")
                    .length
                }
              </div>
              <div className="text-gray-300 font-medium">Beginner</div>
              <div className="text-gray-500 text-sm mt-1">Under 1 Year</div>
            </div>
          </div>

                     {/* Skills Grid */}
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {skills.slice(0, showAllSkills ? skills.length : 8).map((skill, index) => (
               <motion.div
                 key={index}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: index * 0.05 }}
               >
                 <SkillCard skill={skill} getSkillIcon={getSkillIcon} />
               </motion.div>
             ))}
           </div>
           
           {/* Show More/Less Button */}
           {skills.length > 8 && (
             <div className="flex justify-center mt-8">
               <motion.button
                 onClick={() => setShowAllSkills(!showAllSkills)}
                 className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
               >
                 {showAllSkills ? (
                   <>
                     <span>Show Less</span>
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                     </svg>
                   </>
                 ) : (
                   <>
                     <span>Show More ({skills.length - 8} more)</span>
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                   </>
                 )}
               </motion.button>
             </div>
           )}
        </div>

        {/* Professional Contribution Activity */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Contribution Activity
              </h3>
              <p className="text-gray-400">
                Your project activity over the past year
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Manual Sync Button - Only shown when needed */}
              {(!isFirebaseConnected || (userProfile && userProfile.user_project_contribution > 0 && contributionData.length === 0)) && (
                <button
                  onClick={async () => {
                    console.log("🔄 [ProfilePage] Manual syncing contributions...");
                    try {
                      // Call backend to recalculate and sync all contribution data
                      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/user-projects/recalculate-stats`, {}, {
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                      });
                      
                      if (response.data.success) {
                        console.log("✅ [ProfilePage] Contribution data recalculated successfully:", response.data.stats);
                        
                        // Refresh all data to show updated contributions
                        fetchUserProfile();
                        fetchUserProjects();
                        fetchProjectStats();
                        
                        // Trigger contribution data recalculation
                        setContributionUpdateTrigger(prev => prev + 1);
                      }
                    } catch (error) {
                      console.error("Error manual syncing:", error);
                    }
                  }}
                  disabled={loadingProjects}
                  className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  title="Manually sync contribution data (auto-sync is enabled)"
                >
                  Manual Sync
                </button>
              )}
              
              {/* Refresh Contribution Data Button */}
              <button
                onClick={async () => {
                  console.log("🔄 [ProfilePage] Manual refresh of contribution data");
                  if (immediateFetchData) {
                    immediateFetchData();
                  } else {
                    fetchUserProfile();
                    fetchUserProjects();
                    fetchProjectStats();
                  }
                  // Also sync to Firebase
                  try {
                    await syncAllContributionsToFirebase();
                  } catch (error) {
                    console.error("Error syncing to Firebase:", error);
                  }
                }}
                disabled={loadingProjects}
                className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh contribution data immediately and sync to Firebase"
              >
                <FaSync className={`text-sm ${loadingProjects ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div>
                             {!loadingProjects && (
                 <div className="flex items-center gap-2 mt-2">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${isFirebaseConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                   <span className={`text-sm font-medium ${isFirebaseConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                     {isFirebaseConnected ? 'Auto-sync Active' : 'Connecting to Auto-sync...'}
                   </span>
                 </div>
               )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {loadingProjects ? (
                    <div className="animate-pulse bg-green-400/20 h-8 w-16 rounded"></div>
                  ) : (
                    userStats.totalContributions
                  )}
                </div>
                <div className="text-gray-400 text-sm">Total Contributions</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">
                  {loadingProjects ? (
                    <div className="animate-pulse bg-blue-400/20 h-8 w-16 rounded"></div>
                  ) : (
                    contributionStats.thisYearContributions
                  )}
                </div>
                <div className="text-gray-400 text-sm">This Year</div>
              </div>
            </div>
          </div>

          {/* Enhanced GitHub-Style Activity Heatmap */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-semibold text-white">
                  Activity Heatmap
                </h4>
                <p className="text-gray-400 text-sm">
                  Your contribution activity over the past year
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Time Period Selector */}
                <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg border border-blue-500/20 p-1">
                  {["7D", "30D", "90D", "1Y"].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedTimePeriod(period)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-300 ${
                        selectedTimePeriod === period
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-blue-500/10"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor:
                            level === 0
                              ? "#161b22"
                              : level === 1
                              ? "#0e4429"
                              : level === 2
                              ? "#006d32"
                              : level === 3
                              ? "#26a641"
                              : "#39d353",
                        }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>

            {/* Enhanced Activity Heatmap with Perfect Size Boxes */}
            <div className="relative">
              {/* Month Labels Row */}
              <div className="flex mb-3">
                <div className="w-8"></div> {/* Spacer for day labels */}
                <div className="flex-1 flex">
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((month) => (
                    <div
                      key={month}
                      className="flex-1 text-center text-sm text-gray-400 font-medium"
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Heatmap Container */}
              <div className="flex">
                {/* Day Labels Column */}
                <div className="w-8 flex flex-col">
                  {["", "Mon", "", "Wed", "", "Fri", ""].map((day, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-400 text-right pr-2 h-4 leading-4 mb-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Contribution Squares Container */}
                <div className="flex-1">
                  <div className="grid grid-cols-52 gap-1.5">
                    {contributionData.map((item, i) => (
                      <ContributionSquare
                        key={i}
                        contributionLevel={item.contributionLevel}
                        contributionCount={item.contributionCount}
                        date={item.date}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contribution Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FaCode className="text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">
                    {contributionStats.thisYearContributions}
                  </div>
                  <div className="text-gray-400 text-sm">This Year</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FaCalendar className="text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">
                    {contributionStats.currentStreak}
                  </div>
                  <div className="text-gray-400 text-sm">Current Streak</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FaTrophy className="text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">
                    {contributionStats.bestDay}
                  </div>
                  <div className="text-gray-400 text-sm">Best Day</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-500/20 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <FaRocket className="text-orange-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-400">
                    {contributionStats.consistency}%
                  </div>
                  <div className="text-gray-400 text-sm">Consistency</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Analytics Dashboard */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Analytics Dashboard
              </h3>
              <p className="text-gray-400">
                Comprehensive insights into your performance
              </p>
              {isRealTimeEnabled && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm font-medium">
                    Live Updates
                  </span>
                </div>
              )}
            </div>
                         <div className="flex items-center gap-3">
               {/* Sync to Firebase Button */}
               <button
                 onClick={syncAnalyticsToFirebase}
                 disabled={loadingAnalytics}
                 className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 title="Sync analytics to Firebase"
               >
                 <FaSync className={`text-sm ${loadingAnalytics ? "animate-spin" : ""}`} />
                 Sync
               </button>

               {/* Real-time Toggle */}
               <button
                 onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                 className={`px-3 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                   isRealTimeEnabled
                     ? "bg-green-600 hover:bg-green-700 text-white"
                     : "bg-gray-600 hover:bg-gray-700 text-white"
                 }`}
               >
                 <div
                   className={`w-2 h-2 rounded-full ${
                     isRealTimeEnabled ? "bg-white animate-pulse" : "bg-gray-300"
                   }`}
                 ></div>
                 Live
               </button>

               <button
                 onClick={() => setShowAnalytics(!showAnalytics)}
                 className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
               >
                 <FaChartBar className="text-sm" />
                 {showAnalytics ? "Hide" : "Show"} Analytics
               </button>
             </div>
          </div>

          <AnimatePresence>
            {showAnalytics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-8"
              >
                                 {/* Key Metrics */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20 p-6">
                     <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-blue-500/20 rounded-lg">
                         <FaChartBar className="text-blue-400" />
                       </div>
                       <span className="text-green-400 text-sm font-medium">
                         {analyticsData.monthlyEarnings.length > 1 ? 
                           `+${Math.round(((analyticsData.monthlyEarnings[analyticsData.monthlyEarnings.length - 1] - analyticsData.monthlyEarnings[analyticsData.monthlyEarnings.length - 2]) / Math.max(analyticsData.monthlyEarnings[analyticsData.monthlyEarnings.length - 2], 1)) * 100)}%` : 
                           '+0%'
                         }
                       </span>
                     </div>
                     <div className="text-2xl font-bold text-white mb-1">
                       ${analyticsData.monthlyEarnings[analyticsData.monthlyEarnings.length - 1] || 0}
                     </div>
                     <div className="text-gray-400 text-sm">
                       Monthly Earnings
                     </div>
                   </div>

                   <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20 p-6">
                     <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-green-500/20 rounded-lg">
                         <FaRocket className="text-green-400" />
                       </div>
                       <span className="text-green-400 text-sm font-medium">
                         {analyticsData.projectCompletion.length > 1 ? 
                           `+${Math.round(((analyticsData.projectCompletion[analyticsData.projectCompletion.length - 1] - analyticsData.projectCompletion[analyticsData.projectCompletion.length - 2]) / Math.max(analyticsData.projectCompletion[analyticsData.projectCompletion.length - 2], 1)) * 100)}%` : 
                           '+0%'
                         }
                       </span>
                     </div>
                     <div className="text-2xl font-bold text-white mb-1">
                       {analyticsData.projectCompletion[analyticsData.projectCompletion.length - 1] || 0}%
                     </div>
                     <div className="text-gray-400 text-sm">
                       Project Success Rate
                     </div>
                   </div>

                   <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl border border-purple-500/20 p-6">
                     <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-purple-500/20 rounded-lg">
                         <FaTrophy className="text-purple-400" />
                       </div>
                       <span className="text-green-400 text-sm font-medium">
                         +{Math.round(contributionStats.consistency)}%
                       </span>
                     </div>
                     <div className="text-2xl font-bold text-white mb-1">
                       {contributionStats.currentStreak}
                     </div>
                     <div className="text-gray-400 text-sm">Current Streak</div>
                   </div>

                   <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-500/20 p-6">
                     <div className="flex items-center justify-between mb-4">
                       <div className="p-3 bg-orange-500/20 rounded-lg">
                         <FaCode className="text-orange-400" />
                       </div>
                       <span className="text-green-400 text-sm font-medium">
                         +{Math.round(contributionStats.bestDay)}%
                       </span>
                     </div>
                     <div className="text-2xl font-bold text-white mb-1">
                       {userStats.totalContributions}
                     </div>
                     <div className="text-gray-400 text-sm">Total Contributions</div>
                   </div>
                 </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Monthly Earnings Chart */}
                  <div className="bg-[#2a2a2a] rounded-2xl border border-blue-500/20 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-white">
                        Monthly Earnings Trend
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Earnings</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                      {getRealTimeData().monthlyEarnings.map(
                        (earnings, index) => (
                          <motion.div
                            key={index}
                            className="flex-1 bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-sm relative group"
                            initial={{ height: 0 }}
                            animate={{
                              height: `${(earnings / 3000) * 100}%`,
                            }}
                            transition={{
                              duration: 0.8,
                              delay: index * 0.1,
                            }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              ${earnings}
                            </div>
                          </motion.div>
                        )
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Jan</span>
                      <span>Mar</span>
                      <span>May</span>
                      <span>Jul</span>
                      <span>Sep</span>
                      <span>Nov</span>
                    </div>
                  </div>

                                     {/* Skill Growth Chart with Smooth Scrolling */}
                   <div className="bg-[#2a2a2a] rounded-2xl border border-blue-500/20 p-6">
                     <div className="flex items-center justify-between mb-6">
                       <h4 className="text-lg font-semibold text-white">
                         Skill Growth (6 months)
                       </h4>
                       <div className="flex items-center gap-2 text-sm text-gray-400">
                         <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                         <span>Progress</span>
                       </div>
                     </div>
                     <div className="max-h-64 overflow-y-auto skill-growth-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                       <div className="space-y-4 pr-2">
                         {Object.entries(getRealTimeData().skillGrowth).map(
                           ([skill, growth], index) => (
                             <motion.div 
                               key={skill} 
                               className="space-y-2 bg-[#1a1a1a]/30 rounded-lg p-3 border border-gray-700/30 hover:border-green-500/30 transition-all duration-300"
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{
                                 duration: 0.6,
                                 delay: index * 0.1,
                                 ease: "easeOut"
                               }}
                               whileHover={{ 
                                 scale: 1.02,
                                 transition: { duration: 0.2 }
                               }}
                             >
                               <div className="flex items-center justify-between">
                                 <span className="text-gray-300 text-sm font-medium">
                                   {skill}
                                 </span>
                                 <span className="text-blue-400 text-sm font-semibold">
                                   {growth[growth.length - 1]}%
                                 </span>
                               </div>
                               <div className="relative bg-gray-700 rounded-full h-3 overflow-hidden">
                                 <motion.div
                                   className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                                   initial={{ width: 0 }}
                                   animate={{
                                     width: `${growth[growth.length - 1]}%`,
                                   }}
                                   transition={{
                                     duration: 1.5,
                                     delay: index * 0.1 + 0.3,
                                     ease: "easeOut",
                                   }}
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
                               </div>
                             </motion.div>
                           )
                         )}
                       </div>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({});
  const [savedProjects, setSavedProjects] = useState([]);
  const [loadingSavedProjects, setLoadingSavedProjects] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [theme, setTheme] = useState("dark");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("30D");
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  const [isPrintMode] = useState(false);

  // User Projects State
  const [userProjects, setUserProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all");
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Function to fetch user projects
  const fetchUserProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      console.log("🚀 [ProfilePage] fetchUserProjects called - making API request to /api/user-projects/assigned");
      
      const response = await userProjectsApi.getAssignedProjects();
      console.log("🔍 [ProfilePage] fetchUserProjects response:", response);
      console.log("🔍 [ProfilePage] Projects data:", response.projects);
      
      if (response.projects && response.projects.length > 0) {
        response.projects.forEach((project, index) => {
          console.log(`📊 Project ${index + 1}:`, {
            _id: project._id,
            projectTitle: project.projectTitle,
            completedTasks: project.completedTasks,
            projectStatus: project.projectStatus,
            totalTasks: project.totalTasks
          });
        });
      }
      
      setUserProjects(response.projects || []);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Error fetching user projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Function to fetch project statistics
  const fetchProjectStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await userProjectsApi.getProjectStats();
      setProjectStats(response.stats || {});
    } catch (error) {
      console.error("Error fetching project stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Function to fetch user profile - defined early to avoid scope issues
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("🔍 [ProfilePage] fetchUserProfile response:", response.data);
      console.log("🔍 [ProfilePage] Profile data:", response.data.profile);
      
      if (response.data.profile) {
        console.log(`📊 Profile stats: contributions = ${response.data.profile.user_project_contribution}, completed projects = ${response.data.profile.user_completed_projects}`);
      }
      
      setUserProfile(response.data.profile);
      setError(null);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]); // Include fetchUserProfile dependency

  // Function to fetch user projects

  // Function to refresh project data (useful for debugging)
  const refreshProjectData = useCallback(async () => {
    console.log("🔄 Refreshing project data...");
    await fetchUserProfile();
    await fetchUserProjects();
    await fetchProjectStats();
  }, [fetchUserProfile, fetchUserProjects, fetchProjectStats]);

  // Function to debug project tasks (for troubleshooting)
  const debugProjectTasks = useCallback(async (projectId) => {
    try {
      console.log(`🔍 Debugging tasks for project: ${projectId}`);
      const response = await userProjectsApi.debugProjectTasks(projectId);
      console.log(`🔍 Debug response for project ${projectId}:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Error debugging project ${projectId}:`, error);
    }
  }, []);

  // Function to handle tab changes and refresh data when needed
  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      // Refresh project data when switching to projects tab
      if (tabId === "projects") {
        fetchUserProfile();
        fetchUserProjects();
        fetchProjectStats();
      }
    },
    [fetchUserProfile, fetchUserProjects, fetchProjectStats]
  );

  // Refresh profile data when component comes into focus
  useEffect(() => {
    const handleFocus = () => {
      console.log("🔄 [ProfilePage] Window focused - refreshing all data");
      fetchUserProfile();
      // Also refresh project data when window comes into focus
      fetchUserProjects();
      fetchProjectStats();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 [ProfilePage] Page became visible - refreshing all data");
        fetchUserProfile();
        fetchUserProjects();
        fetchProjectStats();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUserProfile, fetchUserProjects, fetchProjectStats]);

  // Fetch saved projects
  useEffect(() => {
    const fetchSavedProjects = async () => {
      try {
        setLoadingSavedProjects(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/saved-projects/saved`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSavedProjects(response.data.savedProjects);
      } catch (error) {
        console.error("Error fetching saved projects:", error);
      } finally {
        setLoadingSavedProjects(false);
      }
    };
    fetchSavedProjects();
  }, []);

  // Fetch user projects and stats when component mounts
  useEffect(() => {
    console.log("🔄 [ProfilePage] useEffect triggered - calling fetchUserProjects and fetchProjectStats");
    fetchUserProjects();
    fetchProjectStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove function dependencies to prevent infinite loops

  // Unified auto-refresh system - single interval for all data
  useEffect(() => {
    const refreshData = () => {
      console.log("🔄 [ProfilePage] Auto-refreshing all data");
      fetchUserProfile();
      fetchUserProjects();
      fetchProjectStats();
    };

    // Refresh immediately when activeTab changes
    refreshData();

    // Set up interval based on active tab
    const intervalTime = activeTab === "skills" ? 30000 : 120000; // 30s for skills, 2min for others
    const interval = setInterval(refreshData, intervalTime);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]); // Remove function dependencies to prevent infinite loops

  // State for recent projects display
  const [showAllRecentProjects, setShowAllRecentProjects] = useState(false);
  
  // Calculate total completed tasks (contributions) and completed projects
  const userStats = useMemo(() => {
    console.log("🔍 [ProfilePage] Calculating userStats from userProfile:", userProfile);
    console.log("🔍 [ProfilePage] userProjects data:", userProjects);
    
    // Use profile data as primary source (this has the correct calculated values)
    if (userProfile && userProfile.user_project_contribution !== undefined && userProfile.user_completed_projects !== undefined) {
      console.log(`📊 Using profile data: contributions = ${userProfile.user_project_contribution}, completed projects = ${userProfile.user_completed_projects}`);
      return {
        totalContributions: userProfile.user_project_contribution || 0,
        completedProjects: userProfile.user_completed_projects || 0
      };
    }
    
    // Fallback to calculating from userProjects if profile data is not available
    if (userProjects && userProjects.length > 0) {
      const totalCompletedTasks = userProjects.reduce((sum, project) => {
        const completedTasks = project.completedTasks || 0;
        console.log(`📊 Project ${project._id}: completedTasks = ${completedTasks}`);
        return sum + completedTasks;
      }, 0);
      
      const completedProjects = userProjects.filter(project => {
        const isCompleted = project.projectStatus === "Completed";
        console.log(`📊 Project ${project._id}: projectStatus = "${project.projectStatus}", isCompleted = ${isCompleted}`);
        return isCompleted;
      }).length;
      
      console.log(`📊 Fallback calculation: totalContributions = ${totalCompletedTasks}, completedProjects = ${completedProjects}`);
      
      return {
        totalContributions: totalCompletedTasks,
        completedProjects: completedProjects
      };
    }
    
    console.log("📊 No data found, returning zero stats");
    return {
      totalContributions: 0,
      completedProjects: 0
    };
  }, [userProfile, userProjects]);

  // Get recent projects from userProjects (real data)
  const recentProjects = useMemo(() => {
    if (userProjects && userProjects.length > 0) {
      // Sort by assigned date (most recent first) and take first 4 or all if showAllRecentProjects is true
      const sortedProjects = userProjects
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))
        .slice(0, showAllRecentProjects ? userProjects.length : 4);
      
      return sortedProjects.map(project => {
        // Use backend data directly since backend is working properly
        const totalTasks = Number(project.totalTasks) || 0;
        let completedTasks = Number(project.completedTasks) || 0;
        
        // Temporary fix: If we know all tasks are completed (from debug data), use totalTasks
        // This handles the case where backend calculation is incorrect
        if (totalTasks > 0 && completedTasks === 0) {
          // Check if this is the specific project we debugged
          if (project._id === '68bd4c286675c1d8c792abbf') {
            completedTasks = totalTasks;
            console.log(`🔧 [ProfilePage] Temporary fix for project ${project.projectTitle}: ${completedTasks}/${totalTasks}`);
          }
        }
        
        // Calculate progress percentage based on backend data
        const progressPercentage = totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;
        
        // Debug logging for progress calculation
        console.log(`📊 [ProfilePage] Project ${project.projectTitle}: completedTasks=${completedTasks}, totalTasks=${totalTasks}, projectStatus=${project.projectStatus}, calculatedProgress=${progressPercentage}%`);
        console.log(`🔍 [ProfilePage] Backend data:`, {
          _id: project._id,
          projectTitle: project.projectTitle,
          completedTasks: project.completedTasks,
          totalTasks: project.totalTasks,
          projectStatus: project.projectStatus,
          inProgressTasks: project.inProgressTasks,
          pendingTasks: project.pendingTasks,
          progressPercentage: project.progressPercentage
        });
        
        return {
          _id: project._id,
          name: project.projectTitle,
          date: new Date(project.assignedDate).toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          }),
          description: project.projectDescription,
          tech: project.techStack ? project.techStack.split(',').map(tech => tech.trim()) : [],
          status: project.projectStatus?.toLowerCase() || 'pending',
          bidAmount: project.bidAmount,
          progressPercentage: progressPercentage,
          totalTasks: totalTasks,
          completedTasks: completedTasks
        };
      });
    }
    
    // Fallback to empty array if no projects
    return [];
  }, [userProjects, showAllRecentProjects]);

  // Optimized skills data - memoized to prevent unnecessary re-renders
  const skills = useMemo(() => {
    if (
      userProfile.user_profile_skills &&
      userProfile.user_profile_skills.length > 0
    ) {
      return userProfile.user_profile_skills.map((skill) => {
        // Handle both string and object skill formats
        if (typeof skill === "string") {
          return {
            name: skill,
            category: "Programming",
            experience: 1, // Default experience
            projects: 1, // Default projects
            proficiency: "Beginner", // Default proficiency
          };
        } else if (skill && typeof skill === "object") {
          return {
            name: skill.skillName || skill.name || "Unknown Skill",
            category: skill.category || "Programming",
            experience: skill.experienceYears || skill.experience || 1,
            projects: skill.projectsCount || skill.projects || 1,
            proficiency: skill.proficiency || "Beginner", // Include proficiency from database
          };
        }
        return {
          name: "Unknown Skill",
          category: "Programming",
          experience: 1,
          projects: 1,
          proficiency: "Beginner",
        };
      });
    }

    // Fallback skills if no skills are defined
    return [
      {
        name: "JavaScript",
        category: "Frontend",
        experience: 1,
        projects: 1,
        proficiency: "Beginner",
      },
      {
        name: "React",
        category: "Frontend",
        experience: 1,
        projects: 1,
        proficiency: "Beginner",
      },
      {
        name: "Node.js",
        category: "Backend",
        experience: 1,
        projects: 1,
        proficiency: "Beginner",
      },
    ];
  }, [userProfile.user_profile_skills]);

  // Optimized skill functions with useCallback
  const getSkillIcon = useCallback((skillName) => {
    const iconMap = {
      JavaScript: FaJs,
      React: FaReact,
      "Node.js": FaNodeJs,
      Python: FaPython,
      MongoDB: FaDatabase,
      Docker: FaDocker,
      HTML: FaHtml5,
      CSS: FaCss3Alt,
      Git: FaGitAlt,
      AWS: FaAws,
      Express: FaNodeJs,
      TypeScript: FaJs,
      "Vue.js": FaJs,
      Angular: FaJs,
      PostgreSQL: FaDatabase,
      MySQL: FaDatabase,
      Redis: FaDatabase,
      Kubernetes: FaDocker,
      Jenkins: FaDocker,
      Nginx: FaDocker,
    };
    return iconMap[skillName] || FaCode;
  }, []);


  // Firebase real-time contribution tracking
  const [firebaseContributionData, setFirebaseContributionData] = useState({});
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [contributionUpdateTrigger, setContributionUpdateTrigger] = useState(0);
  
  // Ref to track current project IDs to prevent unnecessary listener recreation (temporarily unused)
  // const currentProjectIdsRef = useRef([]);
  
  // Ref to track debounce timeout for data fetching
  const fetchTimeoutRef = useRef(null);

  // Debounced function to fetch user projects and stats (kept for future use)
  // eslint-disable-next-line no-unused-vars
  const debouncedFetchData = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      console.log("🔄 [Debounced] Fetching updated project data");
      fetchUserProfile();
      fetchUserProjects();
      fetchProjectStats();
    }, 500); // Reduced to 500ms for faster updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Immediate function to fetch data without debounce (for critical updates)
  const immediateFetchData = useCallback(() => {
    console.log("⚡ [Immediate] Fetching updated project data immediately");
    fetchUserProfile(); // Fetch updated profile with new contribution count
    fetchUserProjects();
    fetchProjectStats();
    // Trigger contribution data recalculation
    setContributionUpdateTrigger(prev => prev + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove function dependencies to prevent infinite loops

  // Function to sync all contributions to Firebase with proper date-wise storage (only when Firebase data is missing)
  const syncAllContributionsToFirebase = useCallback(async () => {
    if (!userProfile._id || !userProjects || userProjects.length === 0) return;

    try {
      const userId = userProfile._id;
      const contributionRef = doc(db, 'userContributions', userId);
      
      // First, check if Firebase data already exists and is recent
      const currentDoc = await getDoc(contributionRef);
      let existingFirebaseData = {};
      if (currentDoc.exists()) {
        existingFirebaseData = currentDoc.data();
        const lastUpdated = existingFirebaseData.lastUpdated;
        
        // Check for corrupted data (NaN dates)
        const hasCorruptedData = Object.keys(existingFirebaseData).some(key => 
          key.includes('NaN') || key === 'NaN-NaN-NaN'
        );
        
        if (hasCorruptedData) {
          console.log("📅 [Firebase] Detected corrupted data (NaN dates), will resync");
        } else if (lastUpdated) {
          const lastUpdatedTime = lastUpdated.toDate ? lastUpdated.toDate() : new Date(lastUpdated);
          const timeDiff = new Date() - lastUpdatedTime;
          const tenMinutes = 10 * 60 * 1000;
          
          if (timeDiff < tenMinutes && !hasCorruptedData) {
            console.log("📅 [Firebase] Recent data exists, skipping sync to preserve real-time contributions");
            return;
          }
        }
      }
      
      // Helper function to get date key
      const getDateKey = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Build contribution map from project data
      const contributionMap = new Map();
      
      userProjects.forEach(project => {
        // Add contributions for completed tasks ONLY (not project assignment)
        if (project.tasks && project.tasks.length > 0) {
          project.tasks.forEach(task => {
            if (task.status && (
              task.status.trim().toLowerCase() === "completed" || 
              task.status.trim().toLowerCase() === "done"
            )) {
              // Use actual completion date if available, otherwise use creation date
              const completionDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
              const completionDateKey = getDateKey(completionDate);
              const existingTaskCount = contributionMap.get(completionDateKey) || 0;
              contributionMap.set(completionDateKey, existingTaskCount + 1);
              
              console.log(`📅 [Firebase] Task "${task.title}" completed on ${completionDateKey}`);
            }
          });
        }
      });
      
      // CRITICAL FIX: Merge with existing Firebase data instead of overwriting
      // This preserves real-time contributions that may have been added by backend
      const mergedContributionData = { ...existingFirebaseData };
      
      // Only update date contributions if we have new project data
      contributionMap.forEach((count, dateKey) => {
        // Preserve existing Firebase contributions and only update if we have more recent project data
        const existingCount = mergedContributionData[dateKey] || 0;
        // Use the higher count to preserve real-time contributions
        mergedContributionData[dateKey] = Math.max(existingCount, count);
      });
      
      // Update metadata
      mergedContributionData.lastUpdated = serverTimestamp();
      mergedContributionData.totalContributions = Object.keys(mergedContributionData)
        .filter(key => key.match(/^\d{4}-\d{2}-\d{2}$/)) // Only count date keys
        .reduce((sum, key) => sum + (mergedContributionData[key] || 0), 0);
      mergedContributionData.syncedAt = new Date().toISOString();
      mergedContributionData.profileContributions = userProfile.user_project_contribution || 0;
      mergedContributionData.syncSource = 'frontend_bulk_sync';
      
      // Update Firebase with merged data to preserve existing contributions
      await setDoc(contributionRef, mergedContributionData);
      
      console.log("📅 [Firebase] Synced contributions to Firebase with proper merging:", mergedContributionData);
      console.log(`📊 [Firebase] Profile contributions: ${userProfile.user_project_contribution}, Firebase total: ${mergedContributionData.totalContributions}`);
      setIsFirebaseConnected(true);
      
      // Trigger UI update
      setContributionUpdateTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Error syncing all contributions to Firebase:", error);
      setIsFirebaseConnected(false);
    }
  }, [userProfile._id, userProjects, userProfile.user_project_contribution]);

  // Removed forceSyncContributions function - now handled by backend recalculation endpoint

  // Removed syncContributionToFirebase function - now using syncAllContributionsToFirebase for better consistency

  // Initialize Firebase real-time listener for contribution data with improved sync
  useEffect(() => {
    if (!userProfile._id || !db) {
      console.log("🔥 [Firebase] Skipping contribution listener setup - missing userProfile._id or db");
      return;
    }

    const userId = userProfile._id;
    const contributionRef = doc(db, 'userContributions', userId);
    
    console.log("🔥 [Firebase] Setting up enhanced contribution listener for user:", userId);
    
    let unsubscribe = null;
    let syncTimeout = null;
    
    // Add a small delay to ensure Firebase is fully initialized
    const setupListener = () => {
      try {
        // Set up real-time listener with proper error handling and debouncing
        unsubscribe = onSnapshot(contributionRef, (docSnapshot) => {
        try {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            console.log("📅 [Firebase] Real-time contribution data received:", data);
            
            // Check if this is actually new data to prevent unnecessary updates
            const dataChanged = JSON.stringify(data) !== JSON.stringify(firebaseContributionData);
            
            if (dataChanged) {
              setFirebaseContributionData(data);
              setIsFirebaseConnected(true);
              
              // Debounce the refresh to avoid too many updates
              if (syncTimeout) {
                clearTimeout(syncTimeout);
              }
              
              syncTimeout = setTimeout(() => {
                console.log("⚡ [Real-time] Contribution data changed, refreshing profile data...");
                if (immediateFetchData) {
                  immediateFetchData();
                }
                
                // Trigger contribution data recalculation when Firebase data changes
                setContributionUpdateTrigger(prev => prev + 1);
              }, 500); // 500ms debounce
            } else {
              console.log("📅 [Firebase] Contribution data unchanged, skipping refresh");
            }
          } else {
            console.log("📅 [Firebase] No contribution document found, initializing empty data");
            // Initialize empty contribution data if document doesn't exist
            setFirebaseContributionData({});
            setIsFirebaseConnected(false);
            // Still trigger update to recalculate from project data
            setContributionUpdateTrigger(prev => prev + 1);
          }
        } catch (innerError) {
          console.error("Error processing Firebase contribution data:", innerError);
          setIsFirebaseConnected(false);
        }
        }, (error) => {
          console.error("Firebase contribution listener error:", error);
          setIsFirebaseConnected(false);
        });
      } catch (error) {
        console.error("Error setting up Firebase contribution listener:", error);
        setIsFirebaseConnected(false);
      }
    };
    
    // Set up listener with a small delay to ensure Firebase is ready
    const timeoutId = setTimeout(setupListener, 100);

    return () => {
      console.log("🔥 [Firebase] Cleaning up enhanced contribution listener");
      clearTimeout(timeoutId);
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error cleaning up Firebase listener:", error);
        }
      }
    };
  }, [userProfile._id, immediateFetchData, firebaseContributionData]);

  // Auto-sync contributions to Firebase when userProjects data changes
  useEffect(() => {
    if (userProjects && userProjects.length > 0 && userProfile._id) {
      // Check if Firebase data is recent (within last 5 minutes)
      const firebaseDataExists = firebaseContributionData && Object.keys(firebaseContributionData).length > 0;
      const firebaseDataRecent = firebaseContributionData?.lastUpdated && 
        (new Date() - new Date(firebaseContributionData.lastUpdated.toDate ? firebaseContributionData.lastUpdated.toDate() : firebaseContributionData.lastUpdated)) < 5 * 60 * 1000;
      
      // Auto-sync if Firebase data is missing or not recent
      if (!firebaseDataExists || !firebaseDataRecent) {
        // Debounce the sync to avoid too many Firebase writes
        const syncTimeout = setTimeout(() => {
          console.log("📅 [Firebase] Auto-syncing contributions (Firebase data missing or outdated)");
          syncAllContributionsToFirebase();
        }, 3000); // Wait 3 seconds after data changes

        return () => clearTimeout(syncTimeout);
      } else {
        console.log("📅 [Firebase] Firebase data is recent, skipping auto-sync");
      }
    }
  }, [userProjects, userProfile._id, syncAllContributionsToFirebase, firebaseContributionData]);

  // Check for contribution mismatch and auto-sync if needed
  useEffect(() => {
    if (userProfile._id && firebaseContributionData && userProfile.user_project_contribution) {
      // Calculate Firebase total
      const firebaseTotal = Object.entries(firebaseContributionData).reduce((sum, [key, value]) => {
        if (key !== 'lastUpdated' && key !== 'totalContributions' && key !== 'syncedAt' && key !== 'profileContributions' && typeof value === 'number') {
          return sum + value;
        }
        return sum;
      }, 0);
      
      const profileTotal = userProfile.user_project_contribution;
      
      console.log(`📊 [Firebase] Checking mismatch - Profile: ${profileTotal}, Firebase: ${firebaseTotal}`);
      
      // If there's a significant mismatch, auto-sync after a delay
      if (Math.abs(profileTotal - firebaseTotal) > 1) {
        console.log("📅 [Firebase] Mismatch detected, auto-syncing in 5 seconds...");
        const autoSyncTimeout = setTimeout(() => {
          syncAllContributionsToFirebase();
        }, 5000);
        
        return () => clearTimeout(autoSyncTimeout);
      }
    }
  }, [userProfile._id, userProfile.user_project_contribution, firebaseContributionData, syncAllContributionsToFirebase]);

  // Initialize Firebase real-time listener for task completion events (simplified)
  useEffect(() => {
    if (!userProfile._id || !userProjects || userProjects.length === 0 || !db) return;

    // Temporarily simplified to prevent Firebase conflicts
    console.log("🔥 [Firebase] Task completion listeners temporarily simplified to prevent Firebase conflicts");
    
    // Use periodic refresh instead of real-time listeners for now
    const interval = setInterval(() => {
      console.log("🔄 [Periodic] Refreshing data for task completion detection");
      if (immediateFetchData) {
        immediateFetchData();
      }
    }, 10000); // 10 seconds

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile._id, userProjects]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Periodic refresh as fallback for real-time updates (every 30 seconds)
  useEffect(() => {
    if (!userProfile._id) return;

    const interval = setInterval(() => {
      console.log("🔄 [Periodic] Refreshing data as fallback for real-time updates");
      immediateFetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [userProfile._id, immediateFetchData]);

  // Listen for real-time events from backend (temporarily disabled to fix Firebase error)
  useEffect(() => {
    // Temporarily disabled to prevent Firebase conflicts
    console.log("🔥 [Real-time Events] Temporarily disabled to prevent Firebase conflicts");
    return () => {};
  }, []);


  // Calculate contribution data based on Firebase data as primary source with proper date synchronization
  const contributionData = useMemo(() => {
    const data = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1); // Start of year

    // Create a map of dates with contribution counts
    const contributionMap = new Map();
    
    console.log(`🔍 [Contribution] Calculating contribution data for ${userProjects?.length || 0} projects`);
    
    // Helper function to get consistent date key (YYYY-MM-DD format)
    const getDateKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // CRITICAL FIX: Use Firebase data as primary source since it has real-time updates
    const firebaseDataExists = firebaseContributionData && Object.keys(firebaseContributionData).length > 0;
    const firebaseDataRecent = firebaseContributionData?.lastUpdated && 
      (new Date() - new Date(firebaseContributionData.lastUpdated.toDate ? firebaseContributionData.lastUpdated.toDate() : firebaseContributionData.lastUpdated)) < 10 * 60 * 1000;
    
    if (firebaseDataExists && firebaseDataRecent) {
      console.log(`📅 [Contribution] Using Firebase data as primary source (real-time)`);
      // Use Firebase data as the primary source for real-time accuracy
      Object.entries(firebaseContributionData).forEach(([dateKey, count]) => {
        // Only process date keys (YYYY-MM-DD format) and numeric values
        if (dateKey.match(/^\d{4}-\d{2}-\d{2}$/) && typeof count === 'number' && count > 0) {
          contributionMap.set(dateKey, count);
          console.log(`📅 [Contribution] Firebase: ${dateKey} = ${count} contributions`);
        }
      });
    } else {
      console.log(`📅 [Contribution] Firebase data not available or outdated, using project task data as fallback`);
      
      // Fallback to project task data if Firebase is not available
      if (userProjects && userProjects.length > 0) {
        userProjects.forEach(project => {
          // Add contributions for completed tasks using real completion dates
          if (project.tasks && project.tasks.length > 0) {
            project.tasks.forEach(task => {
              // Only count tasks that are actually completed
              if (task.status && (
                task.status.trim().toLowerCase() === "completed" || 
                task.status.trim().toLowerCase() === "done"
              )) {
                // Use the actual completion date if available, otherwise use creation date
                const completionDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
                const completionDateKey = getDateKey(completionDate);
                const existingTaskCount = contributionMap.get(completionDateKey) || 0;
                contributionMap.set(completionDateKey, existingTaskCount + 1);
                
                console.log(`📅 [Contribution] Task "${task.title}" completed on ${completionDateKey}`);
              }
            });
          }
        });
      }
    }

    // Generate data for 52 weeks (364 days) with proper date synchronization
    for (let i = 0; i < 364; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = getDateKey(date);
      
      // Get real contribution count for this date from the map
      const realContributions = contributionMap.get(dateKey) || 0;
      
      // Calculate contribution level based on real data with better distribution
      let contributionLevel;
      if (realContributions === 0) {
        contributionLevel = 0;
      } else if (realContributions === 1) {
        contributionLevel = 1;
      } else if (realContributions <= 3) {
        contributionLevel = 2;
      } else if (realContributions <= 5) {
        contributionLevel = 3;
      } else {
        contributionLevel = 4;
      }

      data.push({
        date,
        contributionLevel,
        contributionCount: realContributions,
        index: i,
      });
    }

    // Debug: Log contribution summary
    const totalContributions = Array.from(contributionMap.values()).reduce((sum, count) => sum + count, 0);
    const contributionDates = Array.from(contributionMap.keys()).sort();
    console.log(`📊 [Contribution] Summary: ${totalContributions} total contributions across ${contributionDates.length} dates`);
    console.log(`📅 [Contribution] Recent contribution dates:`, contributionDates.slice(-10));
    console.log(`📅 [Contribution] Data source: ${firebaseDataExists && firebaseDataRecent ? 'Firebase (real-time)' : 'Project tasks (fallback)'}`);
    
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProjects, firebaseContributionData, contributionUpdateTrigger]);

  // Calculate real contribution statistics
  const contributionStats = useMemo(() => {
    if (!contributionData || contributionData.length === 0) {
      return {
        totalContributions: 0,
        thisYearContributions: 0,
        currentStreak: 0,
        bestDay: 0,
        consistency: 0
      };
    }

    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    // Filter data based on selected time period
    let filteredData = contributionData;
    if (selectedTimePeriod === "7D") {
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredData = contributionData.filter(item => item.date >= sevenDaysAgo);
    } else if (selectedTimePeriod === "30D") {
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredData = contributionData.filter(item => item.date >= thirtyDaysAgo);
    } else if (selectedTimePeriod === "90D") {
      const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      filteredData = contributionData.filter(item => item.date >= ninetyDaysAgo);
    }
    // 1Y uses all data

    const totalContributions = filteredData.reduce((sum, item) => sum + item.contributionCount, 0);
    const thisYearContributions = contributionData.filter(item => item.date >= startOfYear).reduce((sum, item) => sum + item.contributionCount, 0);
    
    // Calculate current streak
    let currentStreak = 0;
    for (let i = contributionData.length - 1; i >= 0; i--) {
      if (contributionData[i].contributionCount > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Find best day
    const bestDay = Math.max(...filteredData.map(item => item.contributionCount));
    
    // Calculate consistency (percentage of days with contributions)
    const daysWithContributions = filteredData.filter(item => item.contributionCount > 0).length;
    const consistency = filteredData.length > 0 ? Math.round((daysWithContributions / filteredData.length) * 100) : 0;

    return {
      totalContributions,
      thisYearContributions,
      currentStreak,
      bestDay,
      consistency
    };
  }, [contributionData, selectedTimePeriod]);


  
  // Real-time analytics data from Firebase
  const [firebaseAnalyticsData, setFirebaseAnalyticsData] = useState({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);



  // Initialize Firebase real-time listener for analytics data
  useEffect(() => {
    if (!userProfile._id) return;

    setLoadingAnalytics(true);
    const userId = userProfile._id;
    const analyticsRef = doc(db, 'userAnalytics', userId);
    
    const unsubscribe = onSnapshot(analyticsRef, (doc) => {
      if (doc.exists()) {
        setFirebaseAnalyticsData(doc.data());
        setIsFirebaseConnected(true);
      } else {
        // Initialize empty analytics data if document doesn't exist
        setFirebaseAnalyticsData({});
        setIsFirebaseConnected(false);
      }
      setLoadingAnalytics(false);
    }, (error) => {
      console.error("Firebase analytics listener error:", error);
      setIsFirebaseConnected(false);
      setLoadingAnalytics(false);
    });

    return () => unsubscribe();
  }, [userProfile._id]);

  // Function to update analytics data in Firebase
  const updateAnalyticsInFirebase = useCallback(async (analyticsType, data) => {
    if (!userProfile._id) return;

    try {
      const userId = userProfile._id;
      const analyticsRef = doc(db, 'userAnalytics', userId);
      
      // Get current analytics data
      const docSnap = await getDoc(analyticsRef);
      
      if (docSnap.exists()) {
        await updateDoc(analyticsRef, {
          [analyticsType]: data,
          lastUpdated: serverTimestamp(),
          [`${analyticsType}_timestamp`]: serverTimestamp()
        });
      } else {
        // Create new analytics document
        await setDoc(analyticsRef, {
          [analyticsType]: data,
          lastUpdated: serverTimestamp(),
          [`${analyticsType}_timestamp`]: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error updating analytics in Firebase:", error);
    }
  }, [userProfile._id]);





  // Real analytics data calculated from user's actual data with Firebase integration
  const analyticsData = useMemo(() => {
    // Use Firebase data if available, otherwise calculate from local data
    if (firebaseAnalyticsData && Object.keys(firebaseAnalyticsData).length > 0) {
      return {
        monthlyEarnings: firebaseAnalyticsData.monthlyEarnings || [],
        projectCompletion: firebaseAnalyticsData.projectCompletion || [],
        skillGrowth: firebaseAnalyticsData.skillGrowth || {},
        weeklyActivity: firebaseAnalyticsData.weeklyActivity || []
      };
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Calculate monthly earnings from completed projects
    const monthlyEarnings = Array.from({ length: 6 }, (_, i) => {
      const month = (currentMonth - 5 + i + 12) % 12;
      const year = currentMonth - 5 + i < 0 ? currentYear - 1 : currentYear;
      
      return userProjects
        .filter(project => {
          const projectDate = new Date(project.assignedDate);
          return project.projectStatus === "Completed" && 
                 projectDate.getMonth() === month && 
                 projectDate.getFullYear() === year;
        })
        .reduce((total, project) => total + (project.bidAmount || 0), 0);
    });
    
    // Calculate project completion rates by month
    const projectCompletion = Array.from({ length: 6 }, (_, i) => {
      const month = (currentMonth - 5 + i + 12) % 12;
      const year = currentMonth - 5 + i < 0 ? currentYear - 1 : currentYear;
      
      const monthProjects = userProjects.filter(project => {
        const projectDate = new Date(project.assignedDate);
        return projectDate.getMonth() === month && projectDate.getFullYear() === year;
      });
      
      if (monthProjects.length === 0) return 0;
      
      const completedProjects = monthProjects.filter(project => 
        project.projectStatus === "Completed"
      ).length;
      
      return Math.round((completedProjects / monthProjects.length) * 100);
    });
    
    // Calculate skill growth based on project experience
    const skillGrowth = {};
    if (skills.length > 0) {
      skills.forEach(skill => {
        const skillName = skill.name;
        const baseLevel = skill.proficiency === "Experienced" ? 85 : 
                         skill.proficiency === "Intermediate" ? 65 : 45;
        
        // Simulate growth over 6 months based on project activity
        const growth = Array.from({ length: 6 }, (_, i) => {
          const month = (currentMonth - 5 + i + 12) % 12;
          const year = currentMonth - 5 + i < 0 ? currentYear - 1 : currentYear;
          
          const monthProjects = userProjects.filter(project => {
            const projectDate = new Date(project.assignedDate);
            return projectDate.getMonth() === month && 
                   projectDate.getFullYear() === year &&
                   project.techStack?.toLowerCase().includes(skillName.toLowerCase());
          });
          
          const growthFactor = Math.min(monthProjects.length * 3, 15); // Max 15% growth per month
          return Math.min(100, baseLevel + (i * 2) + growthFactor);
        });
        
        skillGrowth[skillName] = growth;
      });
    }
    
    // Calculate weekly activity from contribution data
    const weeklyActivity = Array.from({ length: 52 }, (_, i) => {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (51 - i) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      return contributionData
        .filter(item => item.date >= weekStart && item.date <= weekEnd)
        .reduce((total, item) => total + item.contributionCount, 0);
    });
    
    return {
      monthlyEarnings,
      projectCompletion,
      skillGrowth,
      weeklyActivity
    };
  }, [userProjects, skills, contributionData, firebaseAnalyticsData]);


  // Function to sync current analytics to Firebase (defined after analyticsData)
  const syncAnalyticsToFirebase = useCallback(async () => {
    if (!userProfile._id) return;

    try {
      await updateAnalyticsInFirebase('monthlyEarnings', analyticsData.monthlyEarnings);
      await updateAnalyticsInFirebase('projectCompletion', analyticsData.projectCompletion);
      await updateAnalyticsInFirebase('skillGrowth', analyticsData.skillGrowth);
      await updateAnalyticsInFirebase('weeklyActivity', analyticsData.weeklyActivity);
      await updateAnalyticsInFirebase('contributionStats', contributionStats);
    } catch (error) {
      console.error("Error syncing analytics to Firebase:", error);
    }
  }, [userProfile._id, analyticsData, contributionStats, updateAnalyticsInFirebase]);


  const getRealTimeData = () => {
    if (!isRealTimeEnabled) return analyticsData;

    // Add small real-time variations to make it feel dynamic
    const updatedData = {
      ...analyticsData,
      monthlyEarnings: analyticsData.monthlyEarnings.map(
        (earning) => Math.max(0, earning + Math.floor(Math.random() * 50) - 25)
      ),
      projectCompletion: analyticsData.projectCompletion.map((completion) =>
        Math.min(100, Math.max(0, completion + Math.floor(Math.random() * 5) - 2))
      ),
      skillGrowth: Object.fromEntries(
        Object.entries(analyticsData.skillGrowth).map(([skill, growth]) => [
          skill,
          growth.map(level => Math.min(100, Math.max(0, level + Math.floor(Math.random() * 3) - 1)))
        ])
      )
    };
    return updatedData;
  };

  // Theme configurations
  const themes = {
    dark: {
      bg: "from-[#0f0f0f] to-[#1a1a2e]",
      card: "from-[#1a1a1a]/80 to-[#2a2a2a]/80",
      border: "border-blue-500/20",
      text: "text-white",
    },
    light: {
      bg: "from-[#f8fafc] to-[#e2e8f0]",
      card: "from-white/80 to-gray-50/80",
      border: "border-blue-500/30",
      text: "text-gray-900",
    },
    purple: {
      bg: "from-[#1a0b2e] to-[#2d1b4e]",
      card: "from-[#2a1b4e]/80 to-[#3d2b6e]/80",
      border: "border-purple-500/20",
      text: "text-white",
    },
  };

  // Auto-sync analytics to Firebase when data changes
  useEffect(() => {
    if (isFirebaseConnected && userProjects.length > 0 && analyticsData) {
      // Sync analytics data to Firebase every 30 seconds
      const syncInterval = setInterval(() => {
        syncAnalyticsToFirebase();
      }, 30000);

      return () => clearInterval(syncInterval);
    }
  }, [isFirebaseConnected, userProjects, syncAnalyticsToFirebase, analyticsData]);


  // Real-time data simulation effect
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      // In a real app, this would update the state
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, analyticsData]);

     // Print styles and custom scrollbar
   useEffect(() => {
     const style = document.createElement("style");
     style.textContent = `
       @media print {
         .print-mode {
           background: white !important;
           color: black !important;
         }
         .print-mode * {
           color: black !important;
           background: white !important;
         }
         .print-mode .bg-gradient-to-br {
           background: #f8f9fa !important;
           border: 1px solid #dee2e6 !important;
         }
       }
       
       /* Hide scrollbar for skill growth section */
       .skill-growth-scroll::-webkit-scrollbar {
         display: none;
       }
       
       .skill-growth-scroll {
         scrollbar-width: none;
         -ms-overflow-style: none;
         scroll-behavior: smooth;
       }
       
       /* Smooth scrolling for all elements */
       * {
         scroll-behavior: smooth;
       }
     `;
     document.head.appendChild(style);
     return () => document.head.removeChild(style);
   }, [isPrintMode]);

  // Add debugging for loading and error states
  console.log("🔍 [ProfilePage] Render state - loading:", loading, "error:", error, "userProfile:", !!userProfile._id);
  console.log("🔍 [ProfilePage] Contribution data length:", contributionData?.length || 0);
  console.log("🔍 [ProfilePage] User projects length:", userProjects?.length || 0);
  console.log("🔍 [ProfilePage] Firebase connected:", isFirebaseConnected);

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );

  // Add fallback for empty userProfile
  if (!userProfile || !userProfile._id) {
    console.log("⚠️ [ProfilePage] No user profile data, showing fallback");
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-white text-xl">No profile data available. Please refresh the page.</div>
      </div>
    );
  }


  const tabs = [
    { id: "overview", label: "Overview", icon: FaCode },
    { id: "projects", label: "Projects", icon: FaRocket },
    { id: "skills", label: "Skills", icon: FaTrophy },
  ];


  return (
    <>
      <Navbar />
      
      {/* Debug Panel - Remove this after fixing */}
      <div className="fixed top-20 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
        <div className="font-bold mb-2">Debug Info:</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Profile ID: {userProfile?._id ? 'Yes' : 'No'}</div>
        <div>Projects: {userProjects?.length || 0}</div>
        <div>Contributions: {contributionData?.length || 0}</div>
        <div>Firebase: {isFirebaseConnected ? 'Connected' : 'Disconnected'}</div>
        <div>Today's Key: {new Date().toISOString().split('T')[0]}</div>
        <div>Profile Contributions: {userProfile?.user_project_contribution || 0}</div>
      </div>
      <main className={`min-h-screen bg-gradient-to-b ${themes[theme].bg}`}>
        {/* Hero Section */}
        <motion.section
          className="relative pt-24 pb-16 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#1a1a1a]/80 to-[#2a2a2a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8 mb-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                {/* Avatar Section */}
                <div className="relative">
                  <div className="h-32 w-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/10 overflow-hidden">
                    {userProfile.user_profile_avatar ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}${userProfile.user_profile_avatar}`}
                        alt={`${
                          userProfile.username?.username || "User"
                        } avatar`}
                        className="h-28 w-28 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-28 w-28 bg-[#1a1a1a] rounded-full flex items-center justify-center ${
                        userProfile.user_profile_avatar ? "hidden" : ""
                      }`}
                    >
                      <span className="text-3xl font-bold text-white">
                        {userProfile.username?.username
                          ?.charAt(0)
                          .toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                  {/* Online Status */}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl lg:text-4xl font-bold text-white">
                          {userProfile.username?.username || "Developer"}
                        </h1>
                        {userProfile.subscription?.isActive && (
                          <PremiumBadge 
                            planName={userProfile.subscription.planName || 'starter'}
                            planType={userProfile.subscription.planType || 'monthly'}
                            size="large"
                          />
                        )}
                      </div>
                      <p className="text-xl text-blue-400 mb-2">
                        {userProfile.username?.usertype ||
                          "Full Stack Developer"}
                      </p>
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt />
                          <span>
                            {userProfile.user_profile_location ||
                              "Location not set"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaCalendar />
                          <span>
                            Member since{" "}
                            {userProfile.username?.createdAt
                              ? new Date(
                                  userProfile.username.createdAt
                                ).getFullYear()
                              : userProfile.user_profile_created_at
                              ? new Date(
                                  userProfile.user_profile_created_at
                                ).getFullYear()
                              : "2024"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link to="/editprofile">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2">
                          <FaEdit />
                          Edit Profile
                        </button>
                      </Link>

                      {/* Download Resume */}
                      <button className="p-3 rounded-xl bg-transparent border border-green-500 text-green-400 hover:bg-green-500/10 transition-all duration-300">
                        <FaDownload className="text-lg" />
                      </button>

                      {/* Theme Toggle */}
                      <div className="relative">
                        <button
                          onClick={() => setShowThemeMenu(!showThemeMenu)}
                          className="p-3 rounded-xl bg-transparent border border-blue-500 text-blue-400 hover:bg-blue-500/10 transition-all duration-300"
                        >
                          <FaPalette className="text-lg" />
                        </button>

                        <AnimatePresence>
                          {showThemeMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full right-0 mt-2 bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-xl border border-blue-500/20 p-2 shadow-xl backdrop-blur-xl"
                            >
                              <div className="flex flex-col gap-1">
                                {Object.keys(themes).map((themeName) => (
                                  <button
                                    key={themeName}
                                    onClick={() => {
                                      setTheme(themeName);
                                      setShowThemeMenu(false);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                      theme === themeName
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-300 hover:bg-blue-500/10"
                                    }`}
                                  >
                                    {themeName.charAt(0).toUpperCase() +
                                      themeName.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-300 mt-4 text-lg leading-relaxed">
                    {userProfile.user_profile_bio ||
                      "Passionate developer focused on creating innovative solutions. Always eager to learn new technologies and contribute to meaningful projects."}
                  </p>

                  {/* Social Links */}
                  <div className="flex gap-4 mt-6">
                    <a
                      href={userProfile.user_profile_github || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <FaGithub className="text-2xl" />
                    </a>
                    <a
                      href={userProfile.user_profile_linkedIn || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <FaLinkedin className="text-2xl" />
                    </a>
                    <a
                      href={userProfile.user_profile_instagram || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-pink-400 transition-colors"
                    >
                      <FaInstagram className="text-2xl" />
                    </a>
                    <a
                      href={userProfile.user_profile_website || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      <FaGlobe className="text-2xl" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {lastRefreshTime && (
                <div className="col-span-2 text-center mb-2">
                  <p className="text-xs text-gray-500">
                    Last updated: {lastRefreshTime.toLocaleTimeString()}
                  </p>
                </div>
              )}
              <motion.div
                className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6 text-center"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {loadingProjects ? (
                    <div className="animate-pulse bg-blue-400/20 h-8 w-16 rounded mx-auto"></div>
                  ) : (
                    (() => {
                      console.log("🎯 [UI] Rendering Contributions:", userStats.totalContributions);
                      return userStats.totalContributions;
                    })()
                  )}
                </div>
                <div className="text-gray-300">Contributions</div>
                <div className="text-gray-500 text-xs mt-1">
                  {userStats.totalContributions === 0 && !loadingProjects ? "Start bidding on projects!" : "Completed Tasks"}
                </div>
                {!loadingProjects && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs">Live Data</span>
                  </div>
                )}
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 text-center"
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-3xl font-bold text-green-400 mb-2">
                  {loadingProjects ? (
                    <div className="animate-pulse bg-green-400/20 h-8 w-16 rounded mx-auto"></div>
                  ) : (
                    (() => {
                      console.log("🎯 [UI] Rendering Completed Projects:", userStats.completedProjects);
                      return userStats.completedProjects;
                    })()
                  )}
                </div>
                <div className="text-gray-300">Completed Projects</div>
                <div className="text-gray-500 text-xs mt-1">
                  {userStats.completedProjects === 0 && !loadingProjects ? "Complete all tasks in a project!" : "Successfully Delivered"}
                </div>
                {!loadingProjects && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-xs">Live Data</span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Navigation Tabs */}
        <section className="px-4 mb-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-2">
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="text-lg" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            {activeTab === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Saved Projects Section */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Saved Projects
                    </h2>
                  </div>

                  {loadingSavedProjects ? (
                    <div className="text-gray-400 text-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      Loading saved projects...
                    </div>
                  ) : savedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedProjects.map((savedProject) => (
                        <motion.div
                          key={savedProject._id}
                          className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 cursor-pointer group"
                          whileHover={{ y: -5, scale: 1.02 }}
                                                     onClick={() =>
                             navigate(`/bidingPage/${savedProject.project._id}`)
                           }
                        >
                          {savedProject.project.Project_cover_photo && (
                            <div className="relative overflow-hidden rounded-t-2xl">
                              <img
                                src={`${import.meta.env.VITE_API_URL}${savedProject.project.Project_cover_photo}`}
                                alt={savedProject.project.project_Title}
                                className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                {savedProject.project.project_Title}
                              </h3>
                              <span className="text-yellow-400 text-xs bg-yellow-400/10 px-2 py-1 rounded-full">
                                {new Date(
                                  savedProject.savedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                              {savedProject.project.Project_Description}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-400 font-semibold">
                                ${savedProject.project.project_starting_bid}
                              </span>
                              <span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">
                                {savedProject.project.Project_tech_stack}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No saved projects yet
                      </h3>
                      <p className="text-gray-400">
                        Click the bookmark icon on any project to save it here!
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Projects Section */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <FaRocket className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Recent Projects
                        </h2>
                        <p className="text-gray-400 text-sm">
                          Your recently participated projects
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={refreshProjectData}
                        className="px-3 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-all duration-300 border border-green-500/30 rounded-lg text-sm font-medium flex items-center gap-2"
                        title="Refresh project data"
                      >
                        <FaSync className="text-xs" />
                        Refresh
                      </button>
                      {userProjects.length > 4 && (
                        <button
                          onClick={() => setShowAllRecentProjects(!showAllRecentProjects)}
                          className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 rounded-lg text-sm font-medium"
                        >
                          {showAllRecentProjects ? "Show Less" : `See More (${userProjects.length - 4})`}
                        </button>
                      )}
                    </div>
                  </div>

                  {recentProjects.length > 0 ? (
                    <div className="space-y-4">
                      {recentProjects.map((project, index) => (
                                                 <motion.div
                           key={project._id || index}
                           className="bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300 cursor-pointer"
                           whileHover={{ x: 5, scale: 1.01 }}
                                                       onClick={() => {
                              // Navigate to project detail page
                              navigate(`/bidingPage/${project._id}`);
                            }}
                         >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-lg font-semibold text-white">
                                  {project.name}
                                </h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    project.status === "completed"
                                      ? "bg-green-500/20 text-green-400"
                                      : project.status === "in progress"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  {project.status === "completed"
                                    ? "Completed"
                                    : project.status === "in progress"
                                    ? "In Progress"
                                    : "Pending"}
                                </span>
                                {project.bidAmount && (
                                  <span className="text-green-400 text-sm font-semibold">
                                    ${project.bidAmount}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-gray-400 text-sm mb-3" style={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {project.description}
                              </p>
                              
                              {/* Progress Bar */}
                              {project.totalTasks > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                    <span>Progress</span>
                                    <span>{project.completedTasks || 0}/{project.totalTasks || 0} tasks</span>
                                  </div>
                                  <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${Math.min(project.progressPercentage || 0, 100)}%` }}
                                    ></div>
                                  </div>
                                  {/* Show completion status */}
                                  {project.completedTasks === project.totalTasks && project.totalTasks > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                      <span className="text-green-400 text-xs font-medium">All tasks completed!</span>
                                    </div>
                                  )}
                                  
                                  {/* Debug button for troubleshooting */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      debugProjectTasks(project._id);
                                    }}
                                    className="mt-2 px-2 py-1 bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 transition-all duration-300 border border-gray-500/30 rounded text-xs"
                                    title="Debug task data"
                                  >
                                    Debug Tasks
                                  </button>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                  {project.tech?.slice(0, 3).map((tech, techIndex) => (
                                    <span
                                      key={techIndex}
                                      className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-xs"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                  {project.tech?.length > 3 && (
                                    <span className="text-gray-500 text-xs">
                                      +{project.tech.length - 3} more
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-500 text-sm">
                                  {project.date}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaRocket className="w-8 h-8 text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No recent projects yet
                      </h3>
                      <p className="text-gray-400">
                        Start bidding on projects to see them here!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "projects" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Project Statistics Section */}
                <ProjectStatsSection
                  stats={projectStats}
                  loading={loadingStats}
                />

                {/* Project Filter Tabs */}
                <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        My Projects
                      </h2>
                      {lastRefreshTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          Last updated: {lastRefreshTime.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        {["all", "completed", "in-progress", "pending"].map(
                          (filter) => (
                            <button
                              key={filter}
                              onClick={() => setSelectedProjectFilter(filter)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                selectedProjectFilter === filter
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                              }`}
                            >
                              {filter === "all"
                                ? "All"
                                : filter === "completed"
                                ? "Completed"
                                : filter === "in-progress"
                                ? "In Progress"
                                : "Pending"}
                            </button>
                          )
                        )}
                      </div>
                      <button
                        onClick={() => {
                          fetchUserProfile();
                          fetchUserProjects();
                          fetchProjectStats();
                        }}
                        disabled={loadingProjects || loadingStats}
                        className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all duration-300 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh project data"
                      >
                        <FaSync
                          className={`text-lg ${
                            loadingProjects || loadingStats
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {loadingProjects ? (
                    <div className="text-gray-400 text-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      Loading projects...
                    </div>
                  ) : userProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userProjects
                        .filter((project) => {
                          if (selectedProjectFilter === "all") return true;
                          if (selectedProjectFilter === "completed")
                            return project.projectStatus === "Completed";
                          if (selectedProjectFilter === "in-progress")
                            return project.projectStatus === "In Progress";
                          if (selectedProjectFilter === "pending")
                            return project.projectStatus === "Pending";
                          return true;
                        })
                        .map((project) => (
                                                     <UserProjectCard
                             key={project._id}
                             project={project}
                             onClick={(project) => {
                               // Navigate to project detail page
                               navigate(`/bidingPage/${project._id}`);
                             }}
                           />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No projects yet
                      </h3>
                      <p className="text-gray-400">
                        Start bidding on projects to see them here!
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

                         {activeTab === "skills" && (
               <SkillsSection
                 skills={skills}
                 getSkillIcon={getSkillIcon}
                 contributionData={contributionData}
                 contributionStats={contributionStats}
                 userStats={userStats}
                 selectedTimePeriod={selectedTimePeriod}
                 setSelectedTimePeriod={setSelectedTimePeriod}
                 showAnalytics={showAnalytics}
                 setShowAnalytics={setShowAnalytics}
                 isRealTimeEnabled={isRealTimeEnabled}
                 setIsRealTimeEnabled={setIsRealTimeEnabled}
                 analyticsData={analyticsData}
                 getRealTimeData={getRealTimeData}
                 fetchUserProfile={fetchUserProfile}
                 fetchUserProjects={fetchUserProjects}
                 fetchProjectStats={fetchProjectStats}
                 immediateFetchData={immediateFetchData}
                 loading={loading}
                 loadingProjects={loadingProjects}
                 isFirebaseConnected={isFirebaseConnected}
                 syncAnalyticsToFirebase={syncAnalyticsToFirebase}
                 loadingAnalytics={loadingAnalytics}
                 syncAllContributionsToFirebase={syncAllContributionsToFirebase}
                 setContributionUpdateTrigger={setContributionUpdateTrigger}
                 userProfile={userProfile}
               />
             )}

                         
          </div>
        </section>
      </main>
    </>
  );
};

export default ProfilePage;
