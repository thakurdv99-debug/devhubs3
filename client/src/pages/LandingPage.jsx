import Navbar from "@shared/components/layout/NavBar";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import ProjectCard from "../components/ProjectCard";
import { useState, useEffect } from "react";
import axios from "axios";
// Animation variants with more sophisticated effects
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const hoverScale = {
  scale: 1.05,
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
  transition: { duration: 0.3 },
};

const LandingPage = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isScrolled, setIsScrolled] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(null);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Handle scroll for navbar effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Fetch featured projects data
  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        setProjectsLoading(true);
        setProjectsError(null);
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/project/getlistproject`
        );
        
        if (response.data.projects && response.data.projects.length > 0) {
          // Sort projects by multiple criteria to get the best featured projects
          const sortedProjects = response.data.projects
            .filter(project => project.Project_Number_Of_Bids > 0) // Only projects with bids
            .sort((a, b) => {
              // Primary sort: Number of bids (descending)
              const bidComparison = (b.Project_Number_Of_Bids || 0) - (a.Project_Number_Of_Bids || 0);
              if (bidComparison !== 0) return bidComparison;
              
              // Secondary sort: Budget (descending)
              const budgetComparison = (b.project_starting_bid || 0) - (a.project_starting_bid || 0);
              if (budgetComparison !== 0) return budgetComparison;
              
              // Tertiary sort: Creation date (newest first)
              return new Date(b.createdAt) - new Date(a.createdAt);
            });
          
                     // Take top 3 projects for featured section
           setFeaturedProjects(sortedProjects.slice(0, 3));
        } else {
          setFeaturedProjects([]);
        }
      } catch (error) {
        console.error("Error fetching featured projects:", error);
        setProjectsError("Failed to load featured projects");
        setFeaturedProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };
    
    fetchFeaturedProjects();
  }, []);

  // Determine if mobile view
  const isMobile = windowWidth < 768;

  return (
    <>
      <motion.div
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#121212] shadow-lg" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Navbar />
      </motion.div>

      <div className="bg-[#121212] text-white font-sans overflow-hidden">
        {/* Hero Section with Parallax Effect */}
        <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden">
          {/* Background animated particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-blue-500 opacity-10"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: Math.random() * 0.5 + 0.5,
                }}
                animate={{
                  x: [
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerWidth,
                  ],
                  y: [
                    Math.random() * window.innerHeight,
                    Math.random() * window.innerHeight,
                  ],
                  transition: {
                    duration: Math.random() * 20 + 10,
                    repeat: Infinity,
                    repeatType: "reverse",
                  },
                }}
                style={{
                  width: `${Math.random() * 100 + 20}px`,
                  height: `${Math.random() * 100 + 20}px`,
                }}
              />
            ))}
          </div>

          {/* Main Content Container */}
          <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center min-h-screen">
            {/* Trust badges */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8 text-sm text-gray-400 mb-12"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>500+ Projects Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>2,000+ Developers</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>95% Success Rate</span>
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Trusted by 2,000+ developers worldwide
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 leading-tight mb-8 text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              Where Junior Developers
              <br />
              <span className="text-white">Become Senior</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              Join the ultimate platform where junior developers collaborate with experienced mentors, 
              contribute to real-world projects, and <span className="text-blue-400 font-semibold">earn while learning</span>.
            </motion.p>

            {/* Value propositions */}
            <motion.div
              className="flex flex-wrap justify-center gap-6 mb-12 text-gray-400"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.8 }}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Real-world projects</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Expert mentorship</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure payments</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16" 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              <Link to="/loginaccount">
                <motion.button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transform transition-all duration-300"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(59, 130, 246, 0.4)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Earning Today
                </motion.button>
              </Link>
              
              <Link to="/dashboard">
                <motion.button
                  className="bg-transparent border-2 border-gray-600 hover:border-blue-500 text-gray-300 hover:text-blue-400 px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(59, 130, 246, 0.2)"
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Browse Projects
                </motion.button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div 
              className="text-center mb-16" 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.8 }}
            >
              <p className="text-gray-400 text-sm mb-4">Trusted by college students</p>
            
            </motion.div>

            {/* Scroll indicator */}
            <motion.div 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 0.8 }}
            >
              <motion.div
                className="animate-bounce"
              >
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Who Can Use DevHubs Section */}
        <motion.section
          className="py-20 px-4 md:px-8 text-center relative"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-12 relative inline-block text-white"
              variants={itemFadeIn}
            >
              Who Can Use DevHubs
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
            </motion.h2>

            <motion.p
              className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto"
              variants={itemFadeIn}
            >
              DevHubs is designed for developers at every stage of their journey. Whether you're just starting out or looking to scale your development team, our platform provides the perfect environment for growth and collaboration.
            </motion.p>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {[
                {
                  title: "Junior Developers",
                  description: "Students, bootcamp graduates, and entry-level developers looking to gain real-world experience and build their portfolios.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  ),
                  features: ["Learn from mentors", "Build portfolio", "Earn while learning", "Gain real experience"]
                },
                {
                  title: "Project Owners",
                  description: "Startups, businesses, and individuals who need quality development work done efficiently and cost-effectively.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  ),
                  features: ["Find talented developers", "Cost-effective solutions", "Quality assurance", "Flexible hiring"]
                },
                {
                  title: "Mentors & Seniors",
                  description: "Experienced developers who want to give back to the community and help shape the next generation of developers.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  ),
                  features: ["Share knowledge", "Build reputation", "Earn extra income", "Network with peers"]
                },
                {
                  title: "Freelancers",
                  description: "Independent developers seeking flexible work opportunities and diverse project experiences.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  ),
                  features: ["Flexible schedules", "Diverse projects", "Secure payments", "Professional growth"]
                }
              ].map((userType, index) => (
                <motion.div
                  key={index}
                  className="p-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-800 relative group"
                  variants={itemFadeIn}
                  whileHover={{ 
                    y: -8,
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                    borderColor: "#3B82F6"
                  }}
                >
                  {userType.icon}
                  <h3 className="text-xl font-bold mb-3 text-white">
                    {userType.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    {userType.description}
                  </p>
                  
                  {/* Features list */}
                  <ul className="space-y-2">
                    {userType.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-xs text-gray-300">
                        <svg className="w-3 h-3 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>

            {/* Call to action for user types */}
            <motion.div className="mt-12" variants={itemFadeIn}>
              <Link to="/createaccount">
                <motion.button
                  className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 rounded-lg text-lg font-medium shadow-lg"
                  whileHover={hoverScale}
                  whileTap={{ scale: 0.95 }}
                >
                  Join DevHubs Today
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works Section - Card Hover Effects */}
        <motion.section
          className="py-20 px-4 md:px-8 text-center relative"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-12 relative inline-block"
              variants={itemFadeIn}
            >
              How DevHubs Works
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {[
                {
                  title: "List Projects",
                  description:
                    "Project owners list their projects and find contributors.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Bid & Collaborate",
                  description:
                    "Junior developers bid to contribute and gain experience.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  ),
                },
                {
                  title: "Earn & Learn",
                  description:
                    "Contributors earn for their work and build their portfolios.",
                  icon: (
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="p-8 bg-gray-900 rounded-2xl shadow-lg"
                  variants={itemFadeIn}
                  whileHover={hoverScale}
                >
                  {item.icon}
                  <h3 className="text-xl md:text-2xl font-bold mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-400">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Projects Section - Enhanced with Loading States */}
        <motion.section
          className="py-20 px-4 md:px-8 relative"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.div className="text-center mb-12" variants={itemFadeIn}>
              <motion.h2
                className="text-3xl md:text-4xl font-bold mb-4 relative inline-block"
                variants={itemFadeIn}
              >
                Featured Projects
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  viewport={{ once: true }}
                />
              </motion.h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Discover the most popular and high-impact projects on DevHubs. These projects have attracted the most interest from our developer community.
              </p>
            </motion.div>

            {projectsLoading ? (
              // Loading state
              <motion.div 
                className="flex justify-center items-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <p className="text-gray-400">Loading featured projects...</p>
                </div>
              </motion.div>
            ) : projectsError ? (
              // Error state
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 max-w-md mx-auto">
                  <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-400 mb-2">Failed to load projects</p>
                  <p className="text-gray-400 text-sm">{projectsError}</p>
                </div>
              </motion.div>
            ) : featuredProjects.length > 0 ? (
              <>
                {isMobile ? (
                  // Mobile carousel view
                  <div className="relative overflow-hidden px-4">
                    <AnimatePresence>
                      <motion.div
                        className="flex snap-x snap-mandatory overflow-x-auto pb-8 -mx-4 px-4 space-x-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {featuredProjects.slice(0, 3).map((proj) => (
                          <motion.div
                            key={proj._id}
                            className="snap-center shrink-0 w-full"
                            whileHover={hoverScale}
                          >
                            <ProjectCard project={proj} />
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>

                    <div className="flex justify-center space-x-2 mt-4">
                      {featuredProjects.slice(0, 3).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-gray-600"
                          whileHover={{ scale: 1.5, backgroundColor: "#3B82F6" }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  // Desktop grid view
                  <motion.div
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                  >
                                         {featuredProjects.map((proj) => (
                      <motion.div
                        key={proj._id}
                        variants={itemFadeIn}
                        whileHover={hoverScale}
                      >
                        <ProjectCard project={proj} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                <motion.div className="text-center mt-12" variants={itemFadeIn}>
                  <Link to="/dashboard">
                    <motion.button
                      className="bg-transparent border-2 border-blue-500 text-blue-500 px-6 py-3 rounded-lg hover:bg-blue-500 hover:text-white transition duration-300"
                      whileHover={hoverScale}
                      whileTap={{ scale: 0.95 }}
                    >
                      View All Projects
                    </motion.button>
                  </Link>
                </motion.div>
              </>
            ) : (
              // Empty state
              <motion.div 
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
                  <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-400 mb-2">No featured projects yet</p>
                  <p className="text-gray-500 text-sm">Be the first to list a project and get featured!</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Enhanced Testimonials Section */}
        <motion.section
          className="py-20 px-4 md:px-8 text-center relative"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-6xl mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-12 relative inline-block text-white"
              style={{ color: 'white' }}
              variants={itemFadeIn}
            >
              What Our Community Says
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
            </motion.h2>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                {
                  text: "As a 3rd year CSE student, I was struggling to find real projects for my portfolio. DevHubs changed everything! I've completed 3 projects and earned ₹25,000 while learning from experienced developers. The mentorship is incredible!",
                  name: "Priya Sharma",
                  role: "Computer Science Student",
                  company: "Delhi Technological University",
                  rating: 5,
                  avatar: "PS"
                },
                {
                  text: "I'm a final year student from VIT and was worried about job prospects. DevHubs helped me build a strong portfolio with real-world projects. I got placed at TCS with a 6.5 LPA package! The platform is a game-changer for students.",
                  name: "Rahul Verma",
                  role: "Final Year Student",
                  company: "VIT Vellore",
                  rating: 5,
                  avatar: "RV"
                },
                {
                  text: "Being from a tier-3 college, I thought getting good opportunities would be tough. DevHubs proved me wrong! I've worked on 5 projects, earned ₹40,000, and learned more than my entire college curriculum. Highly recommended!",
                  name: "Anjali Patel",
                  role: "Information Technology Student",
                  company: "Gujarat Technical University",
                  rating: 5,
                  avatar: "AP"
                },
                {
                  text: "As a 2nd year student, I wanted to start earning and learning early. DevHubs is perfect! I've completed 2 projects, earned ₹15,000, and the mentors are so helpful. The payment system is reliable and secure.",
                  name: "Arjun Singh",
                  role: "Computer Engineering Student",
                  company: "Punjab Engineering College",
                  rating: 5,
                  avatar: "AS"
                },
                {
                  text: "I'm from a small town in UP and was struggling with coding. DevHubs connected me with amazing mentors who guided me through my first project. Now I'm confident and have a portfolio to show!",
                  name: "Kavya Gupta",
                  role: "Computer Science Student",
                  company: "Bundelkhand University",
                  rating: 5,
                  avatar: "KG"
                },
                {
                  text: "Final year student here! DevHubs helped me transition from theory to practical coding. I've worked on 4 projects, earned ₹35,000, and got placed at Infosys. The community is so supportive!",
                  name: "Vikram Reddy",
                  role: "Final Year Student",
                  company: "JNTU Hyderabad",
                  rating: 5,
                  avatar: "VR"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg border border-gray-700 relative group"
                  variants={itemFadeIn}
                  whileHover={{ 
                    y: -10,
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                    borderColor: "#3B82F6"
                  }}
                  animate={{
                    y: [0, -5, 0],
                    transition: {
                      duration: 6,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: index * 0.3,
                    },
                  }}
                >
                  {/* Quote icon */}
                  <div className="absolute -top-4 left-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M14.017 18L14.017 10.609C14.017 4.905 17.748 1.039 23 0L23.995 2.151C21.563 3.068 20 5.789 20 8H24V18H14.017ZM0 18V10.609C0 4.905 3.748 1.038 9 0L9.996 2.151C7.563 3.068 6 5.789 6 8H9.983L9.983 18L0 18Z" />
                    </svg>
                  </div>

                  {/* Rating stars */}
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Testimonial text */}
                  <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                    "{testimonial.text}"
                  </p>

                  {/* Author info */}
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-blue-400 text-sm">{testimonial.role}</p>
                      <p className="text-gray-500 text-xs">{testimonial.company}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Community stats */}
            <motion.div 
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                { number: "500+", label: "Active Projects" },
                { number: "2,000+", label: "Developers" },
                { number: "95%", label: "Success Rate" },
                { number: "₹50L+", label: "Total Earnings" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  variants={itemFadeIn}
                >
                  <motion.div
                    className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                    viewport={{ once: true }}
                  >
                    {stat.number}
                  </motion.div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* FAQ Section - Accordion Style */}
        <motion.section
          className="py-20 px-4 md:px-8"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-12 text-center relative inline-block mx-auto"
              variants={itemFadeIn}
            >
              Frequently Asked Questions
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              />
            </motion.h2>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {[
                {
                  question: "How do I start bidding?",
                  answer:
                    "Simply sign up, browse projects, and place your bid. You can specify your rate, delivery timeline, and how your skills match the project requirements.",
                },
                {
                  question: "Are payments secure?",
                  answer:
                    "Yes! We use escrow to ensure secure transactions. Funds are only released to you when the project owner is satisfied with your work.",
                },
                {
                  question: "How is the mentorship structured?",
                  answer:
                    "Project owners can choose to offer mentorship as part of their projects. You'll receive code reviews, feedback, and guidance throughout the development process.",
                },
                {
                  question: "Can I work on projects part-time?",
                  answer:
                    "Absolutely! Many projects on DevHubs are flexible and can be completed on a part-time basis. You can set your availability when placing bids.",
                },
              ].map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  index={index}
                />
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Call to Action - Gradient Background */}
        <motion.section
          className="py-20 px-4 md:px-8 relative overflow-hidden"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30" />

          <motion.div
            className="relative z-10 max-w-4xl mx-auto text-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
              variants={itemFadeIn}
            >
              Start Your Journey Today!
            </motion.h2>

            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              variants={itemFadeIn}
            >
              Join DevHubs and take your career to the next level. Connect with
              mentors, build your portfolio, and earn while you learn.
            </motion.p>

            <motion.div
              className="flex flex-col md:flex-row gap-4 justify-center"
              variants={itemFadeIn}
            >
              <Link to="/createaccount">
                <motion.button
                  className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 rounded-lg text-lg font-medium shadow-lg"
                  whileHover={hoverScale}
                  whileTap={{ scale: 0.95 }}
                >
                  Join Now
                </motion.button>
              </Link>

              <Link to="/projects">
                <motion.button></motion.button>
              </Link>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Footer */}
        <footer className="py-12 px-4 md:px-8 bg-[#0a0a0a] text-gray-400">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">DevHubs</h3>
              <p className="mb-4">
                Connecting junior developers with real-world projects and
                mentorship opportunities.
              </p>
              <div className="flex space-x-4">
                <a href="https://www.linkedin.com/company/devhubs2-0/?viewAsMember=true" className="hover:text-blue-400">
                  LinkedIn
                </a>
                <a href="#" className="hover:text-blue-400">
                  GitHub
                </a>
                <a href="https://youtube.com/@devhubs-yt?si=aKGZbo0r03R_q-dO" className="hover:text-blue-400">
                  YouTube
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/dashboard" className="hover:text-blue-400">
                    Explore Projects
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-blue-400">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/createaccount" className="hover:text-blue-400">
                    Join as Developer
                  </Link>
                </li>
                <li>
                  <Link to="/createaccount" className="hover:text-blue-400">
                    Join as Project Owner
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="hover:text-blue-400">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="hover:text-blue-400">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-blue-400">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-blue-400">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy-policy" className="hover:text-blue-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-service" className="hover:text-blue-400">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/cookie-policy" className="hover:text-blue-400">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/community-guidelines" className="hover:text-blue-400">
                    Community Guidelines
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-10 border-t border-gray-800 pt-6 text-center text-gray-500">
            <p>
              © 2025 DevHubs. All rights reserved. Built with  for developers.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

// FAQ Accordion Component
const FAQItem = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900"
      variants={itemFadeIn}
    >
      <motion.button
        className="w-full p-4 text-left flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
      >
        <h3 className="text-xl font-semibold">{question}</h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            className="w-6 h-6 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 pt-0 border-t border-gray-800 text-gray-400">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LandingPage;