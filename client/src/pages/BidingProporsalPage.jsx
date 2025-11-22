/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAuth } from '@app/providers/AuthProvider';
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Navbar from "@shared/components/layout/NavBar";
import RazorpayPaymentModal from "../components/payment/RazorpayPaymentModal";

// Animation variants
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
      staggerChildren: 0.1,
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
  scale: 1.02,
  transition: { duration: 0.2 },
};

const BidingProporsalPage = () => {
  const { _id } = useParams();
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState(500);
  const [motivation, setMotivation] = useState("");
  const [skills, setSkills] = useState([
    // Frontend Technologies
    { name: "React", selected: false },
    { name: "Vue.js", selected: false },
    { name: "Angular", selected: false },
    { name: "JavaScript", selected: false },
    { name: "TypeScript", selected: false },
    { name: "HTML/CSS", selected: false },
    { name: "Sass/SCSS", selected: false },
    { name: "Tailwind CSS", selected: false },
    { name: "Bootstrap", selected: false },
    { name: "Next.js", selected: false },
    { name: "Nuxt.js", selected: false },
    
    // Backend Technologies
    { name: "Node.js", selected: false },
    { name: "Express.js", selected: false },
    { name: "Python", selected: false },
    { name: "Django", selected: false },
    { name: "Flask", selected: false },
    { name: "Java", selected: false },
    { name: "Spring Boot", selected: false },
    { name: "C#", selected: false },
    { name: ".NET", selected: false },
    { name: "PHP", selected: false },
    { name: "Laravel", selected: false },
    { name: "Ruby", selected: false },
    { name: "Ruby on Rails", selected: false },
    { name: "Go", selected: false },
    { name: "Rust", selected: false },
    
    // Databases
    { name: "MongoDB", selected: false },
    { name: "PostgreSQL", selected: false },
    { name: "MySQL", selected: false },
    { name: "SQLite", selected: false },
    { name: "Redis", selected: false },
    { name: "Firebase", selected: false },
    { name: "Supabase", selected: false },
    { name: "DynamoDB", selected: false },
    
    // Cloud & DevOps
    { name: "AWS", selected: false },
    { name: "Azure", selected: false },
    { name: "Google Cloud", selected: false },
    { name: "Docker", selected: false },
    { name: "Kubernetes", selected: false },
    { name: "CI/CD", selected: false },
    { name: "Jenkins", selected: false },
    { name: "GitHub Actions", selected: false },
    { name: "Terraform", selected: false },
    { name: "Ansible", selected: false },
    
    // Mobile Development
    { name: "React Native", selected: false },
    { name: "Flutter", selected: false },
    { name: "Swift", selected: false },
    { name: "Kotlin", selected: false },
    { name: "Ionic", selected: false },
    { name: "Xamarin", selected: false },
    
    // AI & Machine Learning
    { name: "AI/ML", selected: false },
    { name: "TensorFlow", selected: false },
    { name: "PyTorch", selected: false },
    { name: "Scikit-learn", selected: false },
    { name: "OpenAI API", selected: false },
    { name: "Computer Vision", selected: false },
    { name: "NLP", selected: false },
    { name: "Data Science", selected: false },
    { name: "Deep Learning", selected: false },
    
    // Testing & Quality
    { name: "Unit Testing", selected: false },
    { name: "Integration Testing", selected: false },
    { name: "E2E Testing", selected: false },
    { name: "Jest", selected: false },
    { name: "Cypress", selected: false },
    { name: "Selenium", selected: false },
    { name: "Playwright", selected: false },
    { name: "Security Testing", selected: false },
    { name: "Penetration Testing", selected: false },
    
    // Design & UX
    { name: "UI/UX Design", selected: false },
    { name: "Figma", selected: false },
    { name: "Adobe XD", selected: false },
    { name: "Sketch", selected: false },
    { name: "Adobe Photoshop", selected: false },
    { name: "Adobe Illustrator", selected: false },
    { name: "Prototyping", selected: false },
    { name: "User Research", selected: false },
    
    // Blockchain & Web3
    { name: "Blockchain", selected: false },
    { name: "Solidity", selected: false },
    { name: "Web3", selected: false },
    { name: "Ethereum", selected: false },
    { name: "Smart Contracts", selected: false },
    { name: "DeFi", selected: false },
    { name: "NFTs", selected: false },
    
    // Data & Analytics
    { name: "Data Analysis", selected: false },
    { name: "Power BI", selected: false },
    { name: "Tableau", selected: false },
    { name: "Apache Spark", selected: false },
    { name: "Hadoop", selected: false },
    { name: "ETL", selected: false },
    { name: "Data Engineering", selected: false },
    { name: "Business Intelligence", selected: false },
    
    // Game Development
    { name: "Unity", selected: false },
    { name: "Unreal Engine", selected: false },
    { name: "Game Development", selected: false },
    { name: "C++", selected: false },
    { name: "C# (Unity)", selected: false },
    
    // Other Technologies
    { name: "GraphQL", selected: false },
    { name: "REST APIs", selected: false },
    { name: "Microservices", selected: false },
    { name: "Serverless", selected: false },
    { name: "WebRTC", selected: false },
    { name: "WebSocket", selected: false },
    { name: "PWA", selected: false },
    { name: "WordPress", selected: false },
    { name: "Shopify", selected: false },
    { name: "Magento", selected: false },
    { name: "SAP", selected: false },
    { name: "Salesforce", selected: false },
    { name: "Zapier", selected: false },
    { name: "API Integration", selected: false },
    { name: "System Architecture", selected: false },
    { name: "Performance Optimization", selected: false },
    { name: "SEO", selected: false },
    { name: "Digital Marketing", selected: false },
    { name: "Content Management", selected: false },
    { name: "Project Management", selected: false },
    { name: "Agile/Scrum", selected: false },
    { name: "Technical Writing", selected: false },
    { name: "Documentation", selected: false },
    { name: "Code Review", selected: false },
    { name: "Mentoring", selected: false },
    { name: "Team Leadership", selected: false },
  ]);
  const [project, setProject] = useState({});
  const [yearsExperience, setYearsExperience] = useState(1);
  const [availableHours, setAvailableHours] = useState(10);
  const [bidError, setBidError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [bidEligibility, setBidEligibility] = useState(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/project/getlistproject/${_id}`
        );
        const projectData = response.data.project;
        setProject(projectData);
        
        // Set initial bid amount to starting bid + 100
        const startingBid = Number(projectData.project_starting_bid) || 500;
        setBidAmount(startingBid + 100);
      } catch (error) {
        console.error("Error fetching project details:", error);
        setError("Failed to fetch project details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetails();
  }, [_id]);

  // Fetch user's bid eligibility
  const fetchBidEligibility = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/bid/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        console.log("Bid eligibility data:", response.data.data);
        const data = response.data.data;
        // Normalize into a single object so UI can access both eligibility and freeBids easily
        setBidEligibility({
          ...data.eligibility,
          freeBids: data.freeBids || { remaining: 0, used: 0 },
          bids: data.bids || {},
          subscription: data.subscription || { isActive: false }
        });
      }
    } catch (error) {
      console.error("Error fetching bid eligibility:", error);
      // Don't show error to user for background sync
    }
  };

  const { refreshUser } = useAuth();

  useEffect(() => {
    fetchBidEligibility();
  }, []);

  // Auto-refresh bid eligibility data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBidEligibility();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Refresh data when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBidEligibility();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Update bid validation when project data changes
  useEffect(() => {
    if (project && Object.keys(project).length > 0) {
      const startingBid = Number(project.project_starting_bid) || 0;

      if (bidAmount <= startingBid) {
        setBidError(
          `Bid amount must be greater than the starting bid (₹${startingBid.toLocaleString('en-IN')})`
        );
      } else {
        setBidError("");
      }
    }
  }, [project, bidAmount]);

  const toggleSkill = (index) => {
    const updatedSkills = [...skills];
    updatedSkills[index].selected = !updatedSkills[index].selected;
    setSkills(updatedSkills);
  };

  const handleBidAmountChange = (e) => {
    const value = Number(e.target.value);
    setBidAmount(value);

    // Check against starting bid only
    const startingBid = Number(project.project_starting_bid) || 0;

    if (value <= startingBid) {
      setBidError(
        `Bid amount must be greater than the starting bid (₹${startingBid.toLocaleString('en-IN')})`
      );
    } else {
      setBidError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError("");
    
    const selectedSkills = skills
      .filter((skill) => skill.selected)
      .map((skill) => skill.name);

    if (selectedSkills.length === 0) {
      setError("Please select at least one skill.");
      setIsSubmitting(false);
      return;
    }

    if (motivation.trim().length < 50) {
      setError("Please provide a more detailed motivation (at least 50 characters).");
      setIsSubmitting(false);
      return;
    }

    // Calculate bid amounts based on eligibility
    const originalBidAmount = bidAmount;
    const bidFee = getBidFee();
    const totalBidAmount = originalBidAmount + bidFee;

    console.log("Bid submission details:", {
      originalBidAmount,
      bidFee,
      totalBidAmount,
      isFreeBid: isFreeBid(),
      hasActiveSubscription: hasActiveSubscription(),
      isFeeWaived: isFeeWaived(),
      bidEligibility
    });

    const payload = {
      bid_amount: originalBidAmount, // Original bid amount (without fee)
      year_of_experience: yearsExperience,
      bid_description: motivation,
      hours_avilable_per_week: availableHours,
      skills: selectedSkills,
    };

    try {
      // Always call createBid endpoint first. Backend will either create the bid (free/subscription)
      // or return paymentData (intent/order) for paid bids.
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found. Please log in.");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/bid/createBid/${_id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log('createBid response:', response.data);

      // If backend indicates payment required, show payment modal using returned paymentData
      if (response.data.paymentRequired && response.data.paymentData) {
        setPaymentData({
          ...response.data.paymentData,
          bidDetails: payload
        });
        setShowPaymentModal(true); // Open payment modal
      } else {
        // Bid created successfully (free or subscription)
        const bidInfo = response.data.bidInfo || {};
        const successMessage = `Bid submitted successfully!\n\nYour Bid Details:\n• Original Bid: ₹${bidInfo.originalAmount || bidAmount}\n• Bidding Fee: ₹${bidInfo.fee || 0}\n• Total Amount: ₹${bidInfo.totalAmount || bidAmount}\n• Payment Type: ${bidInfo.paymentType === 'free_bid' ? 'Free Bid' : bidInfo.paymentType === 'subscription' ? 'Subscription' : 'Paid Bid'}`;
        alert(successMessage);
        // Refresh user data so freeBids count and eligibility update immediately
        try { await refreshUser(); } catch (e) { /* ignore */ }
        navigate(`/bidingPage/${_id}`, { 
          state: { success: true, message: "Bid submitted successfully!" } 
        });
      }
    } catch (error) {
      console.error("Error creating bid:", error);
      setError(error.response?.data?.message || "Failed to create bid. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (result) => {
    setShowPaymentModal(false);
    try {
      // Verify payment with backend which will create/activate the bid
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in.');

      const orderId = result?.razorpay_order_id || paymentData?.order?.order_id || paymentData?.order_id;
      if (!orderId) throw new Error('Order ID not available for verification');

      // Retry logic with exponential backoff for 429 errors
      let verifyResponse;
      let retries = 0;
      const maxRetries = 3;
      let retryAfterSeconds = null;

      while (retries <= maxRetries) {
        try {
          verifyResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/payments/verify-razorpay/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break; // Success, exit retry loop
        } catch (error) {
          if (error.response?.status === 429 && retries < maxRetries) {
            retryAfterSeconds = error.response?.data?.retryAfterSeconds || 
                               parseInt(error.response?.headers['retry-after']) || 
                               5; // Default to 5 seconds
            console.log(`Rate limited. Retrying after ${retryAfterSeconds} seconds... (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryAfterSeconds * 1000));
            retries++;
            continue;
          }
          throw error; // Re-throw if not 429 or max retries reached
        }
      }

      if (verifyResponse && verifyResponse.data && verifyResponse.data.success) {
        // Bid should be created/activated by backend during verification
        const bidId = verifyResponse.data.bidId;
        const successMessage = `Payment successful! Your bid has been submitted and activated.\n\nYour Bid Details:\n• Original Bid: ₹${bidAmount}\n• Bidding Fee: ₹${getBidFee()}\n• Total Amount: ₹${bidAmount + getBidFee()}\n\nYour bid is now visible to the project owner.`;
        alert(successMessage);
        // Refresh user details (free bids / subscription) and then navigate
        try { await refreshUser(); } catch (e) { /* ignore */ }
        navigate(`/bidingPage/${_id}`, { 
          state: { 
            success: true, 
            message: 'Payment successful! Bid submitted and activated.',
            bidId: bidId 
          } 
        });
      } else {
        console.warn('Payment verification did not return success, response:', verifyResponse?.data);
        setError('Payment completed but verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error handling payment success:', error);
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfterSeconds || 
                         parseInt(error.response?.headers['retry-after']) || 
                         'a few';
        setError(`Too many requests. Please wait ${retryAfter} seconds and try again. Your payment was successful, but verification is pending.`);
      } else {
        setError(error.response?.data?.message || 'Payment successful but there was an issue. Please contact support.');
      }
    }
  };

  const handlePaymentError = (error) => {
    setShowPaymentModal(false);
    setError("Payment failed. Please try again.");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const hasActiveSubscription = () => {
    // Check if user has active subscription
    return bidEligibility?.reason === 'subscription';
  };

  const isFreeBid = () => {
    return bidEligibility?.reason === 'free_bid';
  };

  const requiresPayment = () => {
    // All bids require payment, but fee amounts vary
    return true;
  };

  const getBidFee = () => {
    return bidEligibility?.feeAmount || 9; // Default to ₹9 if not set
  };

  const isFeeWaived = () => {
    return bidEligibility?.feeAmount === 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Loading project details...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />

      <motion.main 
        className="container mx-auto px-4 py-8 flex justify-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="w-full max-w-4xl">
          {/* Header Section */}
          <motion.header 
            className="mb-8 text-center relative"
            variants={fadeInUp}
          >
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#00A8E8]/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#0062E6]/20 rounded-full blur-xl"></div>
            <h1 className="text-4xl  mt-[6vmin] md:text-4xl font-bold text-white mb-4 relative z-10 ">
              Submit Your Proposal
            </h1>
            <p className="text-xl text-gray-300 mb-2">{project.project_Title}</p>
            <div className="h-1 w-32 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] mx-auto rounded-full"></div>
          </motion.header>

          {/* Project Summary Card */}
          <motion.div 
            className="mb-8"
            variants={itemFadeIn}
          >
            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-6 border border-[#00A8E8]/20 shadow-lg shadow-[#00A8E8]/10">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                 <div className="relative">
                   <img
                     src={project.Project_cover_photo ? `${import.meta.env.VITE_API_URL}${project.Project_cover_photo}` : "https://techvidvan.com/tutorials/wp-content/uploads/2021/12/python-chatbot-project-nltk-ai.webp"}
                     alt={project.project_Title || "Project"}
                     className="w-20 h-20 rounded-xl object-cover shadow-lg"
                     onError={(e) => {
                       e.target.src = "https://techvidvan.com/tutorials/wp-content/uploads/2021/12/python-chatbot-project-nltk-ai.webp";
                     }}
                   />
                   <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                 </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6] mb-2">
                    {project.project_Title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                      </svg>
                      Starting: {formatCurrency(project.project_starting_bid)}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      {project.Project_Contributor || 0} Contributors
                    </div>
                    <div className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Active Project
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bid Form Container */}
          <motion.div 
            className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl shadow-lg border border-[#00A8E8]/20 overflow-hidden"
            variants={itemFadeIn}
          >
            <div className="p-8">
              <form className="space-y-8" onSubmit={handleSubmit}>
                {/* Bid Amount Section */}
                <motion.div 
                  className="space-y-4"
                  variants={itemFadeIn}
                >
                  <label className="text-lg font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                    </svg>
                    Your Bid Amount
                  </label>
                   <div className="relative">
                     <span className="absolute left-4 top-4 text-gray-400 text-lg">₹</span>
                     <input
                       type="number"
                       value={bidAmount}
                       onChange={handleBidAmountChange}
                       className="w-full bg-[#2A2A2A] border border-[#00A8E8]/30 rounded-xl py-4 pl-12 pr-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:border-transparent transition-all placeholder-gray-400"
                       placeholder="Enter your bid amount"
                       min={Number(project.project_starting_bid) + 1 || 501}
                       step="1"
                       inputMode="numeric"
                       pattern="[0-9]*"
                     />
                   </div>
                  {bidError && (
                    <motion.p 
                      className="text-red-400 text-sm flex items-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {bidError}
                    </motion.p>
                  )}
                  
                  {/* Bid Fee Information */}
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-blue-300">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Bid Fee Information
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-gray-300">
                      <div className="flex justify-between">
                        <span>Your Bid Amount:</span>
                        <span>₹{bidAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bidding Fee:</span>
                        <span className={isFeeWaived() ? 'text-green-400' : 'text-yellow-400'}>
                          {isFeeWaived() ? 'FREE' : formatCurrency(getBidFee())}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-blue-300 border-t border-blue-500/30 pt-1">
                        <span>Total Amount:</span>
                        <span>₹{isFeeWaived() ? bidAmount : bidAmount + getBidFee()}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-200">
                      {isFreeBid() ? (
                        <p>🎉 You have {bidEligibility?.remaining} free bids remaining! (No fee)</p>
                      ) : hasActiveSubscription() ? (
                        <p>🎉 Unlimited bids with your subscription! (₹3 fee)</p>
                      ) : (
                        <p>🎉 The ₹9 bidding fee will be charged when you place your bid.</p>
                      )}
                    </div>
                    
                    {/* Eligibility Status */}
                    <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs">
                      <p className="font-semibold text-blue-300 mb-2">Eligibility Status:</p>
                      <div className="space-y-1">
                        <p><strong>Type:</strong> {bidEligibility?.reason === 'free_bid' ? 'Free Bid' : bidEligibility?.reason === 'subscription' ? 'Subscription' : 'Paid Bid'}</p>
                        <p><strong>Fee Amount:</strong> ₹{bidEligibility?.feeAmount || 0}</p>
                        <p><strong>Free Bids Remaining:</strong> {bidEligibility?.remaining || 0}</p>
                        <p><strong>Can Bid:</strong> {bidEligibility?.canBid ? 'Yes' : 'No'}</p>
                        <p><strong>Total Bids Placed:</strong> {bidEligibility?.bids?.totalBids || 0}</p>
                        <p><strong>Paid Bids:</strong> {bidEligibility?.bids?.acceptedBids || 0}</p>
                        <p><strong>Pending Bids:</strong> {bidEligibility?.bids?.pendingBids || 0}</p>
                      </div>
                      
                      {/* Status Indicators */}
                      <div className="mt-2 space-y-1">
                        <div className={`text-xs px-2 py-1 rounded ${bidEligibility?.reason === 'free_bid' ? 'bg-green-900/50 text-green-300' : bidEligibility?.reason === 'subscription' ? 'bg-blue-900/50 text-blue-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                          {bidEligibility?.reason === 'free_bid' ? '🎉 Using Free Bid' : bidEligibility?.reason === 'subscription' ? '🎉 Using Subscription' : '💰 Paid Bid Required'}
                        </div>
                        {bidEligibility?.freeBids?.remaining === 0 && (
                          <div className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-300">
                            ⚠️ No Free Bids Remaining
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Skills Section */}
                <motion.div 
                  className="space-y-4"
                  variants={itemFadeIn}
                >
                  <label className="text-lg font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                    </svg>
                    Your Relevant Skills
                  </label>
                  
                  {/* Skills Summary */}
                  <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#00A8E8]/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-300 text-sm">
                        Selected: {skills.filter(skill => skill.selected).length} skills
                      </span>
                      <button
                        type="button"
                        onClick={() => setSkills(skills.map(skill => ({ ...skill, selected: false })))}
                        className="text-[#00A8E8] text-sm hover:text-[#0062E6] transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    {/* Selected Skills Display */}
                    {skills.filter(skill => skill.selected).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {skills.filter(skill => skill.selected).map((skill, index) => (
                          <span
                            key={skill.name}
                            className="px-3 py-1 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white text-sm rounded-full flex items-center"
                          >
                            {skill.name}
                            <button
                              type="button"
                              onClick={() => toggleSkill(skills.findIndex(s => s.name === skill.name))}
                              className="ml-2 hover:text-red-200 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Skills Categories */}
                  <div className="space-y-4">
                    {/* Frontend & Backend */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-[#00A8E8] font-medium mb-2 text-sm">Frontend & Backend</h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(0, 30).map((skill, index) => (
                            <motion.button
                              key={skill.name}
                              type="button"
                              onClick={() => toggleSkill(index)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                skill.selected
                                  ? "bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg shadow-[#00A8E8]/25"
                                  : "bg-[#2A2A2A] text-gray-300 hover:bg-[#00A8E8]/20 border border-[#00A8E8]/30"
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {skill.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-[#00A8E8] font-medium mb-2 text-sm">Databases & Cloud</h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(30, 60).map((skill, index) => (
                            <motion.button
                              key={skill.name}
                              type="button"
                              onClick={() => toggleSkill(index + 30)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                skill.selected
                                  ? "bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg shadow-[#00A8E8]/25"
                                  : "bg-[#2A2A2A] text-gray-300 hover:bg-[#00A8E8]/20 border border-[#00A8E8]/30"
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {skill.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mobile & AI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-[#00A8E8] font-medium mb-2 text-sm">Mobile & AI/ML</h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(60, 90).map((skill, index) => (
                            <motion.button
                              key={skill.name}
                              type="button"
                              onClick={() => toggleSkill(index + 60)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                skill.selected
                                  ? "bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg shadow-[#00A8E8]/25"
                                  : "bg-[#2A2A2A] text-gray-300 hover:bg-[#00A8E8]/20 border border-[#00A8E8]/30"
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {skill.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-[#00A8E8] font-medium mb-2 text-sm">Testing & Design</h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(90, 120).map((skill, index) => (
                            <motion.button
                              key={skill.name}
                              type="button"
                              onClick={() => toggleSkill(index + 90)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                                skill.selected
                                  ? "bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg shadow-[#00A8E8]/25"
                                  : "bg-[#2A2A2A] text-gray-300 hover:bg-[#00A8E8]/20 border border-[#00A8E8]/30"
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {skill.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Specialized & Other */}
                    <div>
                      <h4 className="text-[#00A8E8] font-medium mb-2 text-sm">Specialized & Other Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.slice(120).map((skill, index) => (
                          <motion.button
                            key={skill.name}
                            type="button"
                            onClick={() => toggleSkill(index + 120)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                              skill.selected
                                ? "bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white shadow-lg shadow-[#00A8E8]/25"
                                : "bg-[#2A2A2A] text-gray-300 hover:bg-[#00A8E8]/20 border border-[#00A8E8]/30"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {skill.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Experience and Availability */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={itemFadeIn}
                >
                  <div className="space-y-4">
                    <label className="text-lg font-semibold text-white flex items-center">
                      <svg className="w-6 h-6 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"></path>
                      </svg>
                      Years of Experience
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(e.target.value)}
                          className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer slider"
                        />
                        <span className="ml-4 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white px-3 py-1 rounded-lg min-w-12 text-center font-semibold">
                          {yearsExperience}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0 years</span>
                        <span>10+ years</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-lg font-semibold text-white flex items-center">
                      <svg className="w-6 h-6 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Hours Available Weekly
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <input
                          type="range"
                          min="5"
                          max="40"
                          step="5"
                          value={availableHours}
                          onChange={(e) => setAvailableHours(e.target.value)}
                          className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer slider"
                        />
                        <span className="ml-4 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white px-3 py-1 rounded-lg min-w-12 text-center font-semibold">
                          {availableHours}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>5 hours</span>
                        <span>40 hours</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Motivation Section */}
                <motion.div 
                  className="space-y-4"
                  variants={itemFadeIn}
                >
                  <label className="text-lg font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2 text-[#00A8E8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    Why You Want to Contribute
                  </label>
                  <div className="relative">
                    <textarea
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      className="w-full bg-[#2A2A2A] border border-[#00A8E8]/30 rounded-xl py-4 px-4 min-h-40 text-white focus:outline-none focus:ring-2 focus:ring-[#00A8E8] focus:border-transparent transition-all placeholder-gray-400 resize-none"
                      placeholder="Describe why you're the perfect match for this project, your relevant experience, and how you can contribute to its success..."
                      maxLength={500}
                    />
                    <div className="absolute bottom-3 right-3 text-gray-400 text-sm bg-black/20 px-2 py-1 rounded">
                      {motivation.length}/500
                    </div>
                  </div>
                </motion.div>

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div className="flex items-center text-red-400">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tips Section */}
                <motion.div 
                  className="bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 border border-[#00A8E8]/30 rounded-xl p-6"
                  variants={itemFadeIn}
                >
                  <h3 className="font-semibold text-[#00A8E8] mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Tips to Increase Your Chances
                  </h3>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li className="flex items-start">
                      <span className="text-[#00A8E8] mr-2">•</span>
                      Highlight your experience with similar technologies and projects
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#00A8E8] mr-2">•</span>
                      Be specific about how you can contribute to the project's success
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#00A8E8] mr-2">•</span>
                      Mention any relevant certifications or achievements
                    </li>
                    <li className="flex items-start">
                      <span className="text-[#00A8E8] mr-2">•</span>
                      Show enthusiasm and commitment to the project goals
                    </li>
                  </ul>
                </motion.div>

                {/* Submit and Cancel Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 pt-6"
                  variants={itemFadeIn}
                >
                  <motion.button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-[#0090c9] hover:to-[#0052cc] transition-all duration-300 shadow-lg hover:shadow-[#00A8E8]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    disabled={!!bidError || isSubmitting || motivation.length < 50}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                        Submit Your Proposal
                      </>
                    )}
                  </motion.button>
                  <Link to={`/bidingPage/${_id}`} className="flex-1">
                    <motion.button
                      type="button"
                      className="w-full bg-[#2A2A2A] text-gray-300 py-4 px-8 rounded-xl font-semibold text-lg hover:bg-[#00A8E8]/20 transition-all duration-300 border border-[#00A8E8]/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                  </Link>
                </motion.div>

                                 {/* Button Status Indicator */}
                 <AnimatePresence>
                   {(!!bidError || motivation.length < 50) && (
                     <motion.div 
                       className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -10 }}
                     >
                       <div className="flex items-center text-yellow-400">
                         <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                         </svg>
                         <div>
                           <p className="font-medium">Please fix the following to submit your proposal:</p>
                           <ul className="text-sm mt-1 space-y-1">
                             {bidError && (
                               <li className="flex items-center">
                                 <span className="text-red-400 mr-2">•</span>
                                 {bidError}
                               </li>
                             )}
                             {motivation.length < 50 && (
                               <li className="flex items-center">
                                 <span className="text-red-400 mr-2">•</span>
                                 Motivation text must be at least 50 characters (currently {motivation.length}/50)
                               </li>
                             )}
                           </ul>
                         </div>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </form>
            </div>
          </motion.div>

          {/* Footer Section */}
          <motion.footer 
            className="mt-8 text-center text-gray-400 text-sm"
            variants={itemFadeIn}
          >
            <p className="flex items-center justify-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Your proposal will be visible to the project owner immediately
            </p>
          </motion.footer>
        </div>
      </motion.main>

      {/* Custom CSS for slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00A8E8, #0062E6);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 168, 232, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00A8E8, #0062E6);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 168, 232, 0.3);
        }
      `}</style>

      {/* Payment Modal */}
              <RazorpayPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={paymentData}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
};

export default BidingProporsalPage;
