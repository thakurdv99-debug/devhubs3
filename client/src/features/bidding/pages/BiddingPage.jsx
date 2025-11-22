/* eslint-disable no-unused-vars */
import Navbar from "@shared/components/layout/NavBar";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { db } from "@shared/config/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { usePayment } from "@features/payments/context/PaymentContext";
import { PAYMENT_TYPES } from "@features/payments/constants/paymentConstants";
import { LightbulbIcon } from "@shared/utils/iconUtils";

const BidingPage = () => {
  const { _id } = useParams();
  const { projectId } = useParams();
  const [project, setProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isProjectEnded, setIsProjectEnded] = useState(false);
  const [countdownInitialized, setCountdownInitialized] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasBid, setHasBid] = useState(null);
  const [savingProject, setSavingProject] = useState(false);
  const [bidEligibility, setBidEligibility] = useState(null);
  
  // Payment context
  const { hasActiveSubscription } = usePayment();

  // Real-time listener for project data updates
  useEffect(() => {
    if (!_id) return;
    const unsub = onSnapshot(doc(db, "project_summaries", _id), (docSnap) => {
      const data = docSnap.data();
      if (data) {
        setProject((prevProject) => ({
          ...prevProject,
          Project_Bid_Amount: data.current_bid_amount,
          Project_Number_Of_Bids: data.total_bids,
        }));
      }
    });
    return () => unsub();
  }, [_id]);

  // Check if the user has already placed a bid and if project is bookmarked
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        // Check bid status
        const bidRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/bid/getBid/${_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setHasBid(bidRes.data.existingBid || null);
        setBidEligibility(bidRes.data.eligibility || null);
        
        // Check if project is saved/bookmarked
        const savedRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/saved-projects/check/${_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setIsBookmarked(savedRes.data.isSaved);
        
      } catch (error) {
        console.error("Error checking user status:", error);
        setError("Failed to check user status.");
        setHasBid(false);
        setIsBookmarked(false);
      }
    };
    checkUserStatus();
  }, [_id]);

  // Fetch project data based on project ID
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/project/getlistproject/${_id}`
        );
        const projectData = response.data.project;
        setProject(projectData);
        setLoading(false);
        console.log("_id:", _id);
        console.log(projectData);
        
        // Calculate countdown based on project end date
        if (response.data.project.project_duration) {
          const endDate = new Date(response.data.project.project_duration);
          const now = new Date();
          
          if (endDate > now) {
            setTimeLeft(Math.floor((endDate - now) / 1000));
            setCountdownInitialized(true);
          } else {
            setIsProjectEnded(true);
            setCountdownInitialized(true);
          }
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        setError("Failed to load project details.");
        setLoading(false);
      }
    };
    fetchProject();
  }, [_id]);

  // Countdown timer
  useEffect(() => {
    if (!countdownInitialized || isProjectEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          setIsProjectEnded(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownInitialized, isProjectEnded]);

  const handleBookmarkToggle = async () => {
    if (savingProject) return;
    
    setSavingProject(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to save projects.");
        return;
      }

      const endpoint = isBookmarked ? "remove" : "add";
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/saved-projects/${endpoint}`,
        { projectId: _id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      setError("Failed to update bookmark.");
    } finally {
      setSavingProject(false);
    }
  };

  const formatTime = () => {
    if (timeLeft <= 0) return "00:00:00";
    
    const days = Math.floor(timeLeft / (24 * 3600));
    const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getBidButtonText = () => {
    if (hasActiveSubscription()) {
      return "Place a Bid Now";
    }
    
    if (bidEligibility?.reason === 'free_bid') {
      return `Place Bid (Free - ${bidEligibility.remaining} left)`;
    }
    
    return "Place Bid (₹9 payment required)";
  };

  const getBidInfoText = () => {
    if (hasActiveSubscription()) {
      return "Unlimited bids with subscription";
    }
    
    if (bidEligibility?.reason === 'free_bid') {
      return `You have ${bidEligibility.remaining} free bids remaining`;
    }
    
    return "₹9 bidding fee will be charged when you place your bid";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#0a0a20]">
      {/* Navbar */}
      <Navbar />

      {/* Main Section */}
      <main className="w-full min-h-screen flex flex-col items-center p-4 overflow-auto">
        {/* Bidding Page Container */}
        <section className="w-full max-w-4xl bg-[#1a1a1a]/80 backdrop-blur-md text-white rounded-xl shadow-2xl p-8 relative mt-8 border border-blue-500/20">
          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-600/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-600/20 rounded-full blur-xl"></div>

          {/* Header with Bookmark and Timer */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              {countdownInitialized && (
                <>
                  <span className={`px-3 py-1 text-white text-sm rounded-full ${
                    isProjectEnded 
                      ? 'bg-red-600' 
                      : 'bg-blue-600 animate-pulse'
                  }`}>
                    {isProjectEnded ? 'Ended' : 'Live'}
                  </span>
                  <span className="text-gray-300">
                    {isProjectEnded ? 'Project ended' : `Ends in: ${formatTime()}`}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={handleBookmarkToggle}
              disabled={savingProject}
              className={`text-gray-300 hover:text-yellow-400 transition-colors ${
                savingProject ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={isBookmarked ? "Remove from saved projects" : "Save project"}
            >
              {savingProject ? (
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isBookmarked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 fill-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
              )}
            </button>
          </div>

          {/* Project Image with Overlay */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg mb-6">
            <img
              src={project.Project_cover_photo ? `${import.meta.env.VITE_API_URL}${project.Project_cover_photo}` : "/api/placeholder/800/400"}
              alt={project.project_Title || "Project Cover"}
              className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-80"></div>
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-3xl font-bold text-white tracking-wide">
                {project.project_Title}
              </h1>
              <div className="flex items-center mt-2">
                <div className="flex -space-x-2">
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-black"
                    src="/api/placeholder/32/32"
                    alt="Contributor"
                  />
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-black"
                    src="/api/placeholder/32/32"
                    alt="Contributor"
                  />
                  <img
                    className="h-8 w-8 rounded-full ring-2 ring-black"
                    src="/api/placeholder/32/32"
                    alt="Contributor"
                  />
                </div>
                <span className="ml-2 text-white text-sm">
                  {project.Project_Contributor} Contributors
                </span>
              </div>
            </div>
          </div>

          {/* Bid Details Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-[#252525] p-4 rounded-lg border border-blue-500/30 shadow-lg hover:shadow-blue-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Starting Bid</p>
              <p className="text-2xl font-bold text-white">
                ₹{project.project_starting_bid}
              </p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-green-500/30 shadow-lg hover:shadow-green-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Current Bid</p>
              <p className="text-2xl font-bold text-green-400">
                ₹{project.Project_Bid_Amount}
              </p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-purple-500/30 shadow-lg hover:shadow-purple-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Contributors</p>
              <p className="text-2xl font-bold text-white">
                {project.Project_Contributor}
              </p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-yellow-500/30 shadow-lg hover:shadow-yellow-500/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Total Bids</p>
              <p className="text-2xl font-bold text-white">
                {project.Project_Number_Of_Bids}
              </p>
            </div>
            <div className="bg-[#252525] p-4 rounded-lg border border-[#00A8E8]/30 shadow-lg hover:shadow-[#00A8E8]/20 transition-all hover:-translate-y-1">
              <p className="text-gray-400 text-sm">Bonus Pool</p>
              <p className="text-2xl font-bold text-[#00A8E8]">
                {project.bonus_pool_amount && project.bonus_pool_contributors 
                  ? `₹${(parseInt(project.bonus_pool_amount) * parseInt(project.bonus_pool_contributors)).toLocaleString('en-IN')}`
                  : "₹0"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {project.bonus_pool_amount && project.bonus_pool_contributors 
                  ? `₹${project.bonus_pool_amount}/contributor`
                  : "Not set"}
              </p>
            </div>
          </div>

          {/* Bonus Pool Section */}
          {project.bonus_pool_amount && project.bonus_pool_contributors && (
            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-xl p-6 border border-[#00A8E8]/20 shadow-lg shadow-[#00A8E8]/10 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#00A8E8] to-[#0062E6] rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Bonus Pool Available</h3>
                    <p className="text-sm text-gray-400">Extra rewards for contributors</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#00A8E8]">
                    ₹{(parseInt(project.bonus_pool_amount) * parseInt(project.bonus_pool_contributors)).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-400">Total Pool</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{project.bonus_pool_amount}</p>
                  <p className="text-xs text-gray-400">Per Contributor</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#00A8E8]">{project.bonus_pool_contributors}</p>
                  <p className="text-xs text-gray-400">Contributors</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#0062E6]">
                    ₹{parseInt(project.bonus_pool_amount) * parseInt(project.bonus_pool_contributors)}
                  </p>
                  <p className="text-xs text-gray-400">Total Amount</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-400 text-sm text-center">
                  💰 Earn up to ₹{project.bonus_pool_amount} bonus by contributing to this project
                </p>
              </div>
            </div>
          )}

          {/* Project Description */}
          <div className="bg-[#232323] rounded-xl p-6 border border-gray-700/50 mb-8">
            <h2 className="text-xl font-bold text-blue-400 mb-4">
              Project Description
            </h2>
            <p className="text-gray-300 leading-relaxed mb-6">
              {project.Project_Description || "No description available"}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Features
                </h3>
                <ul className="space-y-2 list-none">
                  {project.Project_Features ? (
                    project.Project_Features.split("\n")
                      .filter((feature) => feature.trim() !== "")
                      .map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="h-6 w-6 text-green-400 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <span className="text-gray-300">
                              {feature.trim()}
                            </span>
                          </div>
                        </li>
                      ))
                  ) : (
                    <span className="text-gray-400">No features available</span>
                  )}
                </ul>
              </div>

              <div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Looking For
                  </h3>
                  <ul className="mt-2 space-y-2 list-none">
                    {project.Project_looking ? (
                      project.Project_looking.split("\n")
                        .filter((item) => item.trim() !== "")
                        .map((item, index) => (
                          <li key={index} className="flex items-start">
                            <svg
                              className="h-6 w-6 text-green-400 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div>
                              <span className="text-gray-300">
                                {item.trim()}
                              </span>
                            </div>
                          </li>
                        ))
                    ) : (
                      <span className="text-gray-400">
                        No requirements available
                      </span>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Project Images */}
          {project.Project_images?.length > 0 && (
            <div className="bg-[#232323] rounded-xl p-6 border border-gray-700/50 mb-8">
              <h2 className="text-xl font-bold text-blue-400 mb-4">
                Project Images
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {project.Project_images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={`${import.meta.env.VITE_API_URL}${image.url}`}
                      alt={image.originalName}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(`${import.meta.env.VITE_API_URL}${image.url}`, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                      <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity text-center px-2">
                        {image.originalName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-20 rounded-full blur-xl"></div>
            <h2 className="text-xl font-bold text-white mb-2">
              Ready to contribute?
            </h2>
            <p className="text-gray-300 mb-4">
              Your expertise in bug hunting can help shape this project. Join
              the team and earn rewards!
            </p>
            {hasBid && hasBid.bid_status === "Accepted" ? (
              <Link to={`/contributionPage/${_id}`}>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-800 text-white text-lg rounded-lg hover:from-green-700 hover:to-green-900 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-green-500/30"
                  onClick={() =>
                    alert("You are now participating in this project!")
                  }
                >
                  Participate
                </button>
              </Link>
            ) : hasBid && hasBid.bid_status === "Rejected" ? (
              <div className="p-4 bg-red-900/40 border border-red-500/30 rounded-lg text-red-300 font-semibold text-center">
                Your bid was{" "}
                <span className="text-red-400 font-bold">rejected</span> by the
                project owner.
                <br />
                You can bid for the next project.
              </div>
            ) : (
              <div>
                {hasBid ? (
                  <div className="p-4 bg-yellow-900/40 border border-yellow-500/30 rounded-lg text-yellow-300 font-semibold text-center">
                    You already placed a bid for this project. Wait for the bid completion.
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        // Direct redirect to bid proposal - no payment modal needed
                        window.location.href = `/bidingproposal/${_id}`;
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-lg rounded-lg hover:from-blue-700 hover:to-blue-900 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-blue-500/30"
                    >
                      {getBidButtonText()}
                    </button>
                    
                    {/* Bid info notice */}
                    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-300 text-sm text-center flex items-center justify-center">
                        <LightbulbIcon className="w-4 h-4 mr-2" />
                        {getBidInfoText()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default BidingPage;
