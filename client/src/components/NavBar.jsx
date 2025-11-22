import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import PremiumBadge from "./PremiumBadge";


const Navbar = () => {
  // Default fallback values
  const defaultAuth = {
    user: null,
    logoutUser: () => {},
    loading: false,
    loginUser: async () => {},
    refreshUser: async () => {}
  };

  // Safely get auth context
  let authContext = defaultAuth;
  try {
    if (useAuth && typeof useAuth === 'function') {
      const result = useAuth();
      if (result && typeof result === 'object') {
        authContext = result;
      }
    }
  } catch (error) {
    console.error('Error getting auth context:', error);
  }
  
  // Safely destructure with fallback values
  const user = authContext?.user ?? null;
  const logoutUser = authContext?.logoutUser ?? (() => {});
  const [profileExsist, setProfileExist] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasListedProjects, setHasListedProjects] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const dropdownRef = useRef(null);


  // Fetch user profile existence and subscription status
  useEffect(() => {
    async function fetchUserData() {
      // Fetch profile data
      try {
        const profileResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        // Check if profile exists and is not null
        console.log("Profile data received:", profileResponse.data);
        if (profileResponse.data.profile && profileResponse.data.profile !== null) {
          setProfileExist(true);
          setUserProfile(profileResponse.data.profile);
        } else {
          setProfileExist(false);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfileExist(false);
        setUserProfile(null);
      }

      // Fetch subscription data
      try {
        const subscriptionResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/payments/subscription/status`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        if (subscriptionResponse.data.success) {
          console.log("Subscription data received:", subscriptionResponse.data.data);
          setSubscriptionStatus(subscriptionResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscriptionStatus(null);
      }

      // Fetch user projects data
      try {
        const projectsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/myproject`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        // Check if user has listed any projects
        console.log("Projects data received:", projectsResponse.data);
        if (projectsResponse.data.projects && projectsResponse.data.projects.length > 0) {
          setHasListedProjects(true);
        } else {
          setHasListedProjects(false);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        setHasListedProjects(false);
      }
    }
    fetchUserData();
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    logoutUser();
    setDropdownOpen(false);
  };

  // Animation variants
  const navbarVariants = {
    initial: { y: -100 },
    animate: { y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  const linkVariants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    hover: { scale: 1.1, color: "#00A8E8" },
  };

  const logoVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    hover: {
      scale: 1.05,
      textShadow: "0px 0px 8px rgba(0, 168, 232, 0.7)",
      color: "#00A8E8",
    },
  };

  const buttonVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    hover: {
      scale: 1.05,
      backgroundColor: "#0090c9",
      boxShadow: "0px 0px 15px rgba(0, 168, 232, 0.7)",
    },
    tap: { scale: 0.95 },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, pointerEvents: "none" },
    visible: {
      opacity: 1,
      y: 0,
      pointerEvents: "auto",
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      y: -10,
      pointerEvents: "none",
      transition: { duration: 0.15 },
    },
  };

  return (
    <motion.nav
      initial="initial"
      animate="animate"
      variants={navbarVariants}
      className={`fixed top-0 w-full ${
        scrolled ? "bg-opacity-95 backdrop-blur-sm shadow-lg" : "bg-opacity-100"
      } bg-[#1E1E1E] h-[8vmin] flex justify-between items-center z-50 transition-all duration-300`}
    >
      <motion.div variants={logoVariants} whileHover="hover">
        <Link to="/" className="flex items-center">
          <h1 className="text-white text-[4vmin] font-bold ml-[3vmin] transition-colors duration-300">
            <span className="text-[#00A8E8]">Dev</span>Hubs
          </h1>
        </Link>
      </motion.div>

      <div className="flex items-center">
        <ul className="flex items-center gap-[4vmin] text-white mr-[3vmin]">
          {["dashboard", "listproject", "payments", "about"].map((item, index) => (
            <motion.li
              key={item}
              variants={linkVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <Link
                to={`/${item}`}
                className="text-[2vmin] font-medium tracking-wide"
              >
                {item === "dashboard"
                  ? "Explore Projects"
                  : item === "listproject"
                  ? "List Project"
                  : item === "payments"
                  ? "Payments"
                  : "About"}
              </Link>
              <motion.div
                className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#00A8E8]"
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.li>
          ))}

          {/* Profile Dropdown for logged-in users */}
          {user ? (
            <motion.div
              ref={dropdownRef}
              className="relative"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => setDropdownOpen((open) => !open)}
                className="h-[5vmin] w-[5vmin] bg-[#00A8E8] rounded-full text-[2.3vmin] font-medium transition-all duration-300 flex items-center justify-center focus:outline-none overflow-hidden"
              >
                {userProfile?.user_profile_avatar ? (
                  <img 
                    src={userProfile.user_profile_avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-white">
                    {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    key="dropdown"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={dropdownVariants}
                    className="absolute right-0 mt-2 w-64 bg-[#232323] rounded-lg shadow-xl border border-[#00A8E8]/30 z-50 overflow-hidden"
                  >
                    {/* User Profile Section */}
                    <div className="px-6 py-4 border-b border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden bg-[#00A8E8] flex items-center justify-center">
                          {userProfile?.user_profile_avatar ? (
                            <img 
                              src={userProfile.user_profile_avatar} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-lg font-medium">
                              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">
                            {userProfile?.user_profile_bio ? userProfile.user_profile_bio.split(' ').slice(0, 2).join(' ') : (user?.name || user?.email || 'User')}
                          </p>
                          <p className="text-gray-400 text-sm truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    
                    {/* Debug Info */}
                    {console.log("Dropdown render - profileExsist:", profileExsist, "subscriptionStatus:", subscriptionStatus, "hasListedProjects:", hasListedProjects)}
                    
                    {/* Subscription Status */}
                    {subscriptionStatus && subscriptionStatus.isActive && (
                      <div className="px-6 py-3 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Premium Status</span>
                          <PremiumBadge 
                            planName={subscriptionStatus.subscription?.planName || subscriptionStatus.planName || 'starter'}
                            planType={subscriptionStatus.subscription?.planType || subscriptionStatus.planType || 'monthly'}
                            size="small"
                          />
                        </div>
                      </div>
                    )}
                    
                    {profileExsist ? (
                      <Link
                        to="/profile"
                        className="flex items-center px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                    ) : (
                      <Link
                        to="/editprofile"
                        className="flex items-center px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Profile
                      </Link>
                    )}
                    
                    {/* Subscription Management */}
                    <Link
                      to="/subscription"
                      className="flex items-center px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      {subscriptionStatus?.isActive ? 'Manage Subscription' : 'Upgrade to Premium'}
                    </Link>
                    
                    {/* Payment Center */}
                    <Link
                      to="/payments"
                      className="flex items-center px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Payment Center
                    </Link>
                    
                    {/* Withdrawals */}
                    <Link
                      to="/withdrawals"
                      className="flex items-center px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Withdrawals
                    </Link>
                    
                    {/* Platform Administrator Options */}
                    {user?.isPlatformAdmin && (
                      <Link
                        to="/listfreeproject"
                        className="flex items-center px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        List Free Project
                      </Link>
                    )}
                    
                    {/* Admin Panel - Show for users who have listed projects or are platform admins */}
                    {(hasListedProjects || user?.isPlatformAdmin) && (
                      <Link
                        to={`/admin`}
                        className="flex items-center px-6 py-3 text-white hover:bg-[#00A8E8] hover:text-white transition-colors text-[2vmin]"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-6 py-3 text-white hover:bg-red-500 hover:text-white transition-colors text-[2vmin]"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              transition={{ delay: 0.3 }}
            >
              <Link to="/createaccount">
                <button className="h-[5vmin] w-[22vmin] bg-[#00A8E8] rounded-[2vmin] text-[2.3vmin] font-medium transition-all duration-300 flex items-center justify-center">
                  Create Account
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                  >
                    →
                  </motion.span>
                </button>
              </Link>
            </motion.div>
          )}
        </ul>
      </div>
    </motion.nav>
  );
};

export default Navbar;
