import Navbar from "@shared/components/layout/NavBar";
import axios from "axios";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import userProjectsApi from "../utils/userProjectsApi";
import ProjectStatsSection from "../components/ProjectStatsSection";
import UserProjectCard from "../components/UserProjectCard";
import PremiumBadge, { SubscriptionStatusBadge } from "../components/PremiumBadge";
import { db } from "../Config/firebase";
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  collection,
  query,
  where
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
    <div className="group relative bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-xl border border-gray-700/50 p-5 hover:border-blue-500/40 transition-all duration-300 cursor-pointer">
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
    </div>
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

// Optimized ProfilePage Component
const ProfilePageOptimized = () => {
  const navigate = useNavigate();
  
  // Core state
  const [userProfile, setUserProfile] = useState({});
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Firebase state
  const [firebaseContributionData, setFirebaseContributionData] = useState(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [contributionUpdateTrigger, setContributionUpdateTrigger] = useState(0);
  
  // Contribution data
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("1Y");
  
  // Refs for cleanup
  const fetchTimeoutRef = useRef(null);
  const firebaseUnsubscribeRef = useRef(null);

  // Firebase contribution reference
  const contributionRef = useMemo(() => {
    if (userProfile._id && db) {
      return doc(db, 'userContributions', userProfile._id);
    }
    return null;
  }, [userProfile._id]);

  // Fetch user profile data - OPTIMIZED
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 [ProfilePage] Fetching user profile...");
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.data.profile) {
        setUserProfile(response.data.profile);
        console.log("✅ [ProfilePage] Profile loaded:", response.data.profile._id);
      } else {
        setError("No profile data available");
      }
    } catch (err) {
      console.error("❌ [ProfilePage] Error fetching profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user projects - OPTIMIZED
  const fetchUserProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      console.log("🔄 [ProfilePage] Fetching user projects...");
      
      const response = await userProjectsApi.getUserAssignedProjects();
      
      if (response.success && response.projects) {
        setUserProjects(response.projects);
        console.log("✅ [ProfilePage] Projects loaded:", response.projects.length);
      }
    } catch (err) {
      console.error("❌ [ProfilePage] Error fetching projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Initialize Firebase real-time listener for contributions
  useEffect(() => {
    if (contributionRef) {
      console.log("🔥 [Firebase] Setting up real-time listener for contributions");
      
      const unsubscribe = onSnapshot(
        contributionRef,
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setFirebaseContributionData(data);
            setIsFirebaseConnected(true);
            console.log("🔥 [Firebase] Real-time contribution data updated:", data);
          } else {
            console.log("🔥 [Firebase] No contribution data found, will sync from projects");
            setFirebaseContributionData(null);
            setIsFirebaseConnected(false);
          }
        },
        (error) => {
          console.error("🔥 [Firebase] Error listening to contributions:", error);
          setIsFirebaseConnected(false);
        }
      );
      
      firebaseUnsubscribeRef.current = unsubscribe;
      
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [contributionRef]);

  // Calculate contribution data - OPTIMIZED
  const contributionData = useMemo(() => {
    const data = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1);
    
    const contributionMap = new Map();
    
    const getDateKey = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    // Priority 1: Use Firebase data if available
    if (firebaseContributionData && Object.keys(firebaseContributionData).length > 0) {
      Object.entries(firebaseContributionData).forEach(([dateKey, count]) => {
        if (dateKey !== 'lastUpdated' && dateKey !== 'totalContributions' && typeof count === 'number') {
          contributionMap.set(dateKey, count);
        }
      });
    } else if (userProjects && userProjects.length > 0) {
      // Priority 2: Fallback to project data
      userProjects.forEach(project => {
        if (project.assignedDate) {
          const assignedDate = new Date(project.assignedDate);
          const assignedDateKey = getDateKey(assignedDate);
          const existingCount = contributionMap.get(assignedDateKey) || 0;
          contributionMap.set(assignedDateKey, existingCount + 1);
        }
        
        if (project.tasks && project.tasks.length > 0) {
          project.tasks.forEach(task => {
            if (task.status && (
              task.status.trim().toLowerCase() === "completed" || 
              task.status.trim().toLowerCase() === "done"
            )) {
              const completionDate = task.completedAt ? new Date(task.completedAt) : new Date(task.createdAt);
              const completionDateKey = getDateKey(completionDate);
              const existingTaskCount = contributionMap.get(completionDateKey) || 0;
              contributionMap.set(completionDateKey, existingTaskCount + 1);
            }
          });
        }
      });
    }
    
    // Generate data for the year
    for (let i = 0; i < 364; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = getDateKey(date);
      
      const realContributions = contributionMap.get(dateKey) || 0;
      
      let contributionLevel;
      if (realContributions === 0) {
        contributionLevel = 0;
      } else if (realContributions <= 2) {
        contributionLevel = 1;
      } else if (realContributions <= 4) {
        contributionLevel = 2;
      } else if (realContributions <= 6) {
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
    
    return data;
  }, [userProjects, firebaseContributionData, contributionUpdateTrigger]);

  // Calculate contribution statistics - OPTIMIZED
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

    const totalContributions = filteredData.reduce((sum, item) => sum + item.contributionCount, 0);
    const thisYearContributions = contributionData.filter(item => item.date >= startOfYear).reduce((sum, item) => sum + item.contributionCount, 0);
    
    let currentStreak = 0;
    for (let i = contributionData.length - 1; i >= 0; i--) {
      if (contributionData[i].contributionCount > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    const bestDay = Math.max(...filteredData.map(item => item.contributionCount));
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

  // Get skill icon function
  const getSkillIcon = useCallback((skillName) => {
    const skillIcons = {
      'HTML': FaHtml5,
      'CSS': FaCss3Alt,
      'JavaScript': FaJs,
      'React': FaReact,
      'Node.js': FaNodeJs,
      'Python': FaPython,
      'Git': FaGitAlt,
      'AWS': FaAws,
      'Docker': FaDocker,
      'Database': FaDatabase,
      'Default': FaCode
    };
    
    return skillIcons[skillName] || skillIcons['Default'];
  }, []);

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchUserProfile();
      await fetchUserProjects();
    };
    
    initializeData();
  }, [fetchUserProfile, fetchUserProjects]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (firebaseUnsubscribeRef.current) {
        firebaseUnsubscribeRef.current();
      }
    };
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Get skills from profile
  const skills = useMemo(() => {
    if (userProfile.user_profile_skills && Array.isArray(userProfile.user_profile_skills)) {
      return userProfile.user_profile_skills;
    }
    return [];
  }, [userProfile.user_profile_skills]);

  // Get user stats
  const userStats = useMemo(() => {
    return {
      totalContributions: userProfile.user_project_contribution || 0,
      completedProjects: userProfile.user_completed_projects || 0,
      skills: skills.length,
      experience: userProfile.user_profile_experience || "0 years"
    };
  }, [userProfile, skills]);

  // Get recent projects
  const recentProjects = useMemo(() => {
    if (userProjects && userProjects.length > 0) {
      return userProjects
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))
        .slice(0, 4)
        .map(project => ({
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
          progressPercentage: project.progressPercentage || 0,
          totalTasks: project.totalTasks || 0,
          completedTasks: project.completedTasks || 0
        }));
    }
    return [];
  }, [userProjects]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Profile</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={userProfile.user_profile_cover_photo || "/default-avatar.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-blue-500/50 object-cover"
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900"></div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">
                {userProfile.user_profile_name || "Developer"}
              </h1>
              <p className="text-gray-400 mb-4">
                {userProfile.user_profile_bio || "Passionate developer building amazing projects"}
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 text-gray-300">
                  <FaMapMarkerAlt className="text-blue-400" />
                  <span>{userProfile.user_profile_location || "Remote"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <FaCalendar className="text-green-400" />
                  <span>{userProfile.user_profile_experience || "0 years"} experience</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <FaTrophy className="text-yellow-400" />
                  <span>{userStats.completedProjects} projects completed</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <FaEdit />
                Edit Profile
              </button>
              <button className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2">
                <FaDownload />
                Download CV
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 rounded-xl border border-blue-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <FaCode className="text-2xl text-blue-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{userStats.totalContributions}</h3>
                <p className="text-blue-400 text-sm">Total Contributions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-xl border border-green-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FaRocket className="text-2xl text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{userStats.completedProjects}</h3>
                <p className="text-green-400 text-sm">Projects Completed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <FaChartBar className="text-2xl text-purple-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{userStats.skills}</h3>
                <p className="text-purple-400 text-sm">Skills Mastered</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 rounded-xl border border-yellow-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <FaTrophy className="text-2xl text-yellow-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{contributionStats.currentStreak}</h3>
                <p className="text-yellow-400 text-sm">Day Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Activity */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Contribution Activity
              </h3>
              <p className="text-gray-400">
                Your coding activity over the past year
              </p>
            </div>
            <div className="flex items-center gap-2">
              {["7D", "30D", "90D", "1Y"].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedTimePeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTimePeriod === period
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Contribution Heatmap */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">
                Activity Heatmap
              </h4>
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
                            ? "#374151"
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

            {/* Contribution Squares */}
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

          {/* Contribution Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{contributionStats.totalContributions}</div>
              <div className="text-sm text-gray-400">Total Contributions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{contributionStats.currentStreak}</div>
              <div className="text-sm text-gray-400">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{contributionStats.bestDay}</div>
              <div className="text-sm text-gray-400">Best Day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{contributionStats.consistency}%</div>
              <div className="text-sm text-gray-400">Consistency</div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        {skills.length > 0 && (
          <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6">Skills & Technologies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map((skill, index) => (
                <SkillCard key={index} skill={skill} getSkillIcon={getSkillIcon} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentProjects.map((project) => (
                <div key={project._id} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">{project.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400' 
                        : project.status === 'in progress'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {project.tech.slice(0, 3).map((tech, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Progress</div>
                      <div className="text-lg font-semibold text-white">{project.progressPercentage}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePageOptimized;
