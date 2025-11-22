/* eslint-disable no-unused-vars */
import Navbar from "@shared/components/layout/NavBar";
import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUploadField from "../components/FileUploadField";
import { usePayment } from "../context/PaymentContext";
import { PAYMENT_TYPES } from "../constants/paymentConstants";
import BonusPoolPaymentModal from "../components/payment/BonusPoolPaymentModal";
import { useAuth } from "@app/providers/AuthProvider";

import axios from "axios";

const ProjectListingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const editingProject = location.state?.editingProject || null;
  const [formData, setFormData] = useState({
    project_Title: "",
    project_duration: "",
    Project_Bid_Amount: "",
    Project_Contributor: "",
    Project_Number_Of_Bids: "",
    Project_Description: "",
    Project_tech_stack: "",
    Project_Features: "",
    Project_looking: "",
    Project_gitHub_link: "",
    Project_cover_photo: "",
    project_starting_bid: "",
    // Bonus pool fields
    bonus_pool_amount: "200",
    bonus_pool_contributors: "1",
    // Category field
    project_category: "funded",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [coverImage, setCoverImage] = useState(null);
  const [projectImages, setProjectImages] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [submitButtonClicked, setSubmitButtonClicked] = useState(false);

  // Security information toggle states
  const [showSSLInfo, setShowSSLInfo] = useState(false);
  const [showNDAInfo, setShowNDAInfo] = useState(false);
  const [showVerifiedInfo, setShowVerifiedInfo] = useState(false);

  // Bonus pool funding states
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusPoolStatus, setBonusPoolStatus] = useState(null);
  const [bonusPoolFunded, setBonusPoolFunded] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [paymentVerificationLoading, setPaymentVerificationLoading] =
    useState(false);

  // Payment context
  const { hasActiveSubscription } = usePayment();

  // Auth context
  const { user } = useAuth();

  useEffect(() => {
    if (!editingProject && params.id) {
      axios
        .get(
          `${import.meta.env.VITE_API_URL}/api/project/getlistproject/${
            params.id
          }`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        )
        .then((res) => {
          setFormData({
            ...formData,
            ...res.data.project,
          });
        })
        .catch(() => setError("Failed to load project for editing."));
    } else if (editingProject) {
      setFormData({
        ...formData,
        ...editingProject,
      });
    }
    // eslint-disable-next-line
  }, [editingProject, params.id]);

  const handleFilesChange = (files, fieldName) => {
    switch (fieldName) {
      case "Project_cover_photo":
        setCoverImage(files[0] || null);
        break;
      case "Project_images":
        setProjectImages(files);
        break;
      default:
        break;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Verify payment status with backend
  const verifyPaymentStatus = async (intentId) => {
    if (!intentId) return false;

    setPaymentVerificationLoading(true);
    try {
      const token = localStorage.getItem("token");

      // First try to get payment status using the intent ID
      let response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payments/status/${intentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // If the payment is already marked as paid, return true
      if (response.data.success && response.data.data.status === "paid") {
        console.log("✅ Payment already verified as paid");
        return true;
      }

      // If payment is not paid, try to verify with Razorpay using the order ID
      if (response.data.success && response.data.data.orderId) {
        const orderId = response.data.data.orderId;

        // Use the webhook check endpoint as fallback
        try {
          const checkResponse = await axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/api/webhooks/check-payment/${orderId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (
            checkResponse.data.success &&
            checkResponse.data.paymentStatus === "paid"
          ) {
            console.log("✅ Payment verified via webhook check");
            return true;
          }
        } catch (webhookError) {
          console.warn(
            "⚠️ Webhook check failed, trying alternative verification:",
            webhookError.message
          );
        }
      }

      // If we have an orderId, try to verify directly with Razorpay
      if (response.data.success && response.data.data.orderId) {
        const orderId = response.data.data.orderId;

        // Try to verify with Razorpay directly (this would require a backend endpoint)
        try {
          const razorpayResponse = await axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/api/payments/verify-razorpay/${orderId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (razorpayResponse.data.success) {
            console.log("✅ Payment verified via Razorpay API");
            return true;
          }
        } catch (razorpayError) {
          console.warn(
            "⚠️ Razorpay verification failed:",
            razorpayError.message
          );
        }
      }

      return false;
    } catch (error) {
      console.error("Payment verification failed:", error);

      // If the first endpoint fails, try the webhook check endpoint directly
      try {
        const token = localStorage.getItem("token");
        const checkResponse = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/webhooks/check-payment/${intentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (
          checkResponse.data.success &&
          checkResponse.data.paymentStatus === "paid"
        ) {
          console.log("✅ Payment verified via fallback webhook check");
          return true;
        }
      } catch (fallbackError) {
        console.error(
          "Fallback payment verification also failed:",
          fallbackError
        );
      }

      return false;
    } finally {
      setPaymentVerificationLoading(false);
    }
  };

  // Handle payment retry
  const handlePaymentRetry = () => {
    setBonusPoolStatus(null);
    setBonusPoolFunded(false);
    setPaymentIntentId(null);
    setError(null);
    setShowBonusModal(true);
  };

  // Prevent form submission on Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  // Form validation function
  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 1:
        if (!formData.project_Title?.trim()) {
          errors.project_Title = "Project title is required";
        }
        if (
          !formData.project_starting_bid ||
          formData.project_starting_bid <= 0
        ) {
          errors.project_starting_bid = "Starting bid must be greater than 0";
        }
        if (!formData.project_duration) {
          errors.project_duration = "Project end date is required";
        }
        if (
          !formData.Project_Contributor ||
          formData.Project_Contributor <= 0
        ) {
          errors.Project_Contributor =
            "Number of contributors must be greater than 0";
        }
        if (
          !formData.Project_Number_Of_Bids ||
          formData.Project_Number_Of_Bids <= 0
        ) {
          errors.Project_Number_Of_Bids = "Maximum bids must be greater than 0";
        }
        if (!formData.Project_tech_stack) {
          errors.Project_tech_stack = "Technology stack is required";
        }
        if (!formData.project_category) {
          errors.project_category = "Project category is required";
        }
        break;

      case 2:
        if (!formData.Project_Description?.trim()) {
          errors.Project_Description = "Project description is required";
        }
        if (!formData.Project_Features?.trim()) {
          errors.Project_Features = "Key features are required";
        }
        if (!formData.Project_looking?.trim()) {
          errors.Project_looking = "Team requirements are required";
        }
        break;

      case 3:
        if (!formData.Project_gitHub_link?.trim()) {
          errors.Project_gitHub_link = "GitHub repository link is required";
        } else if (!formData.Project_gitHub_link.includes("github.com")) {
          errors.Project_gitHub_link =
            "Please enter a valid GitHub repository URL";
        }
        break;

      case 4:
        if (!formData.bonus_pool_amount || formData.bonus_pool_amount < 200) {
          errors.bonus_pool_amount = "Bonus pool amount must be at least ₹200";
        }
        if (
          !formData.bonus_pool_contributors ||
          formData.bonus_pool_contributors < 1
        ) {
          errors.bonus_pool_contributors =
            "Number of contributors must be at least 1";
        }
        if (!bonusPoolFunded) {
          errors.bonusPoolFunded =
            "Bonus pool must be funded before listing the project";
        }
        break;

      default:
        break;
    }

    return errors;
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep);

    if (Object.keys(stepErrors).length > 0) {
      setValidationErrors(stepErrors);
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      setValidationErrors({});
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setValidationErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow submission if we're on the final step AND the submit button was clicked
    if (currentStep !== totalSteps) {
      return;
    }

    // Check if the submit button was actually clicked
    if (!submitButtonClicked) {
      return;
    }

    // Reset the flag
    setSubmitButtonClicked(false);

    setLoading(true);
    setError(null);
    setValidationErrors({});

    // Validate all steps before submission
    const allErrors = {};
    for (let step = 1; step <= totalSteps; step++) {
      const stepErrors = validateStep(step);
      Object.assign(allErrors, stepErrors);
    }

    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("project_Title", formData.project_Title);
      formDataToSend.append("Project_Bid_Amount", formData.Project_Bid_Amount);
      formDataToSend.append(
        "project_starting_bid",
        formData.project_starting_bid
      );
      formDataToSend.append(
        "Project_Contributor",
        formData.Project_Contributor
      );
      formDataToSend.append(
        "Project_Number_Of_Bids",
        formData.Project_Number_Of_Bids
      );
      formDataToSend.append(
        "Project_Description",
        formData.Project_Description
      );
      formDataToSend.append("Project_tech_stack", formData.Project_tech_stack);
      formDataToSend.append("Project_Features", formData.Project_Features);
      formDataToSend.append("Project_looking", formData.Project_looking);
      formDataToSend.append("project_duration", formData.project_duration);
      formDataToSend.append(
        "Project_gitHub_link",
        formData.Project_gitHub_link
      );

      // Append cover image
      if (coverImage) {
        formDataToSend.append("Project_cover_photo", coverImage);
      }

      // Append project images
      projectImages.forEach((file) => {
        formDataToSend.append("Project_images", file);
      });

      // Append bonus pool data
      formDataToSend.append("bonus_pool_amount", formData.bonus_pool_amount);
      formDataToSend.append(
        "bonus_pool_contributors",
        formData.bonus_pool_contributors
      );

      // Append category data
      formDataToSend.append("project_category", formData.project_category);

      // Use params.id if editingProject is not available
      const projectId = editingProject?._id || params.id;

      if (projectId) {
        // EDIT MODE - Use JSON data for edit mode
        const editData = {
          project_Title: formData.project_Title,
          Project_Bid_Amount: formData.Project_Bid_Amount,
          project_starting_bid: formData.project_starting_bid,
          Project_Contributor: formData.Project_Contributor,
          Project_Number_Of_Bids: formData.Project_Number_Of_Bids,
          Project_Description: formData.Project_Description,
          Project_tech_stack: formData.Project_tech_stack,
          Project_Features: formData.Project_Features,
          Project_looking: formData.Project_looking,
          project_duration: formData.project_duration,
          Project_gitHub_link: formData.Project_gitHub_link,
          bonus_pool_amount: formData.bonus_pool_amount,
          bonus_pool_contributors: formData.bonus_pool_contributors,
          project_category: formData.project_category,
        };

        await axios.put(
          `${
            import.meta.env.VITE_API_URL
          }/api/admin/updateproject/${projectId}`,
          editData,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        navigate("/admin");
        alert("Project updated successfully!");
      } else {
        // CREATE MODE - Use FormData for file uploads
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/project/listproject`,
          formDataToSend,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.status === 201) {
          // Navigate directly to dashboard after successful project creation
          navigate("/dashboard");
          alert("Project created successfully with bonus pool!");
        }
      }
    } catch (error) {
      console.error("Error submitting project:", error);
      setError(error.response?.data?.message || "Failed to submit project");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Project Basics",
      subtitle: "Let's start with the fundamentals",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
      ),
    },
    {
      id: 2,
      title: "Project Details",
      subtitle: "Tell us more about your vision",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          ></path>
        </svg>
      ),
    },
    {
      id: 3,
      title: "Final Details",
      subtitle: "Almost there! Just a few more things",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      ),
    },
    {
      id: 4,
      title: "Bonus Pool (Required)",
      subtitle: "Fund rewards for contributors to list your project",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          ></path>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#00A8E8] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0062E6] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-[#00A8E8] rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto py-8 px-4 md:px-8 lg:px-16">
        <div className="max-w-5xl mx-auto mt-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              <span className="text-[#00A8E8]">List</span> Your Project
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
              Transform your ideas into reality. Find the perfect team to bring
              your vision to life.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-8">
              <div
                className="flex items-center space-x-2 bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-700 cursor-pointer hover:bg-[#232323] transition-all duration-300 group"
                onClick={() => setShowSSLInfo(!showSSLInfo)}
              >
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-300 group-hover:text-white">
                  SSL Secured
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div
                className="flex items-center space-x-2 bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-700 cursor-pointer hover:bg-[#232323] transition-all duration-300 group"
                onClick={() => setShowNDAInfo(!showNDAInfo)}
              >
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-300 group-hover:text-white">
                  NDA Protected
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div
                className="flex items-center space-x-2 bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-700 cursor-pointer hover:bg-[#232323] transition-all duration-300 group"
                onClick={() => setShowVerifiedInfo(!showVerifiedInfo)}
              >
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-300 group-hover:text-white">
                  Verified Teams
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            </div>

            {/* Security Information Cards */}
            <div className="max-w-4xl mx-auto space-y-4 mb-8">
              {/* SSL Security Info */}
              {showSSLInfo && (
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-6 rounded-xl border border-green-500/20 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-8 h-8 text-green-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-3">
                          SSL Security & Data Protection
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>
                            <h4 className="font-medium text-green-400 mb-2">
                              Encryption Standards
                            </h4>
                            <ul className="space-y-1">
                              <li>
                                • TLS 1.3 encryption for all data transmission
                              </li>
                              <li>• 256-bit AES encryption for stored data</li>
                              <li>
                                • End-to-end encryption for sensitive
                                communications
                              </li>
                              <li>
                                • Regular security audits and penetration
                                testing
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-400 mb-2">
                              Infrastructure Security
                            </h4>
                            <ul className="space-y-1">
                              <li>
                                • Cloud-based infrastructure with
                                enterprise-grade security
                              </li>
                              <li>
                                • Multi-factor authentication for all user
                                accounts
                              </li>
                              <li>
                                • Real-time threat detection and monitoring
                              </li>
                              <li>
                                • Automated backup systems with encryption
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSSLInfo(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* NDA Protection Info */}
              {showNDAInfo && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-500/20 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-8 h-8 text-blue-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-3">
                          NDA Protection & Legal Safeguards
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>
                            <h4 className="font-medium text-blue-400 mb-2">
                              Automatic NDA System
                            </h4>
                            <ul className="space-y-1">
                              <li>
                                • Legally binding NDAs generated automatically
                              </li>
                              <li>• Customizable confidentiality terms</li>
                              <li>• Digital signature verification system</li>
                              <li>
                                • Legal compliance with international standards
                              </li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-purple-400 mb-2">
                              Intellectual Property Protection
                            </h4>
                            <ul className="space-y-1">
                              <li>• Clear IP ownership definitions</li>
                              <li>• Built-in copyright protection measures</li>
                              <li>• Legal framework for dispute resolution</li>
                              <li>
                                • Professional legal review of all agreements
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNDAInfo(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Verified Teams Info */}
              {showVerifiedInfo && (
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-6 rounded-xl border border-purple-500/20 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <svg
                          className="w-8 h-8 text-purple-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-3">
                          Team Verification & Quality Assurance
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>
                            <h4 className="font-medium text-purple-400 mb-2">
                              Verification Process
                            </h4>
                            <ul className="space-y-1">
                              <li>
                                • Identity verification and background checks
                              </li>
                              <li>• Skills assessment and portfolio review</li>
                              <li>• Professional references validation</li>
                              <li>• Ongoing performance monitoring</li>
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-medium text-pink-400 mb-2">
                              Quality Standards
                            </h4>
                            <ul className="space-y-1">
                              <li>• Minimum experience requirements</li>
                              <li>• Code quality and best practices review</li>
                              <li>• Communication and collaboration skills</li>
                              <li>• Regular performance evaluations</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowVerifiedInfo(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Platform Launch Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-3xl font-bold text-[#00A8E8] mb-2">
                  Launch Ready
                </div>
                <div className="text-sm text-gray-400">
                  Platform Fully Developed
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-3xl font-bold text-[#00A8E8] mb-2">
                  Beta Tested
                </div>
                <div className="text-sm text-gray-400">Security Verified</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-3xl font-bold text-[#00A8E8] mb-2">
                  Live Support
                </div>
                <div className="text-sm text-gray-400">Ready to Help You</div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                        currentStep >= step.id
                          ? "bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/50 scale-110"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="mt-3 text-center">
                      <h3
                        className={`text-sm font-semibold transition-colors duration-300 ${
                          currentStep >= step.id
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p
                        className={`text-xs mt-1 transition-colors duration-300 ${
                          currentStep >= step.id
                            ? "text-gray-300"
                            : "text-gray-500"
                        }`}
                      >
                        {step.subtitle}
                      </p>
                      {step.id === 4 && (
                        <div className="mt-1">
                          
                        </div>
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 transition-all duration-500 ${
                        currentStep > step.id
                          ? "bg-gradient-to-r from-[#0062E6] to-[#00A8E8]"
                          : "bg-gray-700"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] rounded-xl shadow-2xl overflow-hidden border border-gray-700">
            {/* Security Header */}
            <div className="bg-gradient-to-r from-[#0062E6]/20 to-[#00A8E8]/20 px-8 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-white font-medium">
                    Secure Project Submission
                  </span>
                  {currentStep === 4 && (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30 ml-2">
                      Bonus Pool Required
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Live</span>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              className="p-8 md:p-12"
            >
              {/* Step 1: Project Basics */}
              {currentStep === 1 && (
                <div className="animate-slide-in-right space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Project Basics
                    </h2>
                    <p className="text-gray-300">
                      Let's start with the fundamentals of your project
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Project Title */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Project Title *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="project_Title"
                          value={formData.project_Title}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                            validationErrors.project_Title
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                          placeholder="Enter a catchy title for your project..."
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                      {validationErrors.project_Title && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.project_Title}
                        </p>
                      )}
                    </div>

                    {/* Budget and Duration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                          Starting Bid ($) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="project_starting_bid"
                            value={formData.project_starting_bid}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            min="1"
                            className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                              validationErrors.project_starting_bid
                                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                            }`}
                            placeholder="Enter your project budget..."
                          />
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        {validationErrors.project_starting_bid && (
                          <p className="text-red-400 text-sm mt-1">
                            {validationErrors.project_starting_bid}
                          </p>
                        )}
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                          Project End Date *
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            name="project_duration"
                            value={formData.project_duration}
                            onChange={handleChange}
                            min={new Date().toISOString().split("T")[0]}
                            className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                              validationErrors.project_duration
                                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                            }`}
                          />
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        {validationErrors.project_duration && (
                          <p className="text-red-400 text-sm mt-1">
                            {validationErrors.project_duration}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Team Requirements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                          Contributors Needed *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="Project_Contributor"
                            value={formData.Project_Contributor}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            min="1"
                            className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                              validationErrors.Project_Contributor
                                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                            }`}
                            placeholder="How many people do you need?"
                          />
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        {validationErrors.Project_Contributor && (
                          <p className="text-red-400 text-sm mt-1">
                            {validationErrors.Project_Contributor}
                          </p>
                        )}
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                          Max Bids to Accept *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name="Project_Number_Of_Bids"
                            value={formData.Project_Number_Of_Bids}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            min="1"
                            className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                              validationErrors.Project_Number_Of_Bids
                                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                            }`}
                            placeholder="Maximum bids to accept..."
                          />
                          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                        {validationErrors.Project_Number_Of_Bids && (
                          <p className="text-red-400 text-sm mt-1">
                            {validationErrors.Project_Number_Of_Bids}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Technology Stack */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Technology Stack *
                      </label>
                      <div className="relative">
                        <select
                          name="Project_tech_stack"
                          value={formData.Project_tech_stack}
                          onChange={handleChange}
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white focus:outline-none transition-colors appearance-none ${
                            validationErrors.Project_tech_stack
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                        >
                          <option value="" className="bg-gray-800">
                            Select technology...
                          </option>
                          <option className="bg-gray-800">MERN Stack</option>
                          <option className="bg-gray-800">MEAN Stack</option>
                          <option className="bg-gray-800">MEVN Stack</option>
                          <option className="bg-gray-800">Next.js</option>
                          <option className="bg-gray-800">NestJS</option>
                          <option className="bg-gray-800">Django</option>
                          <option className="bg-gray-800">Flask</option>
                          <option className="bg-gray-800">Spring Boot</option>
                          <option className="bg-gray-800">ASP.NET</option>
                          <option className="bg-gray-800">React Native</option>
                          <option className="bg-gray-800">Flutter</option>
                          <option className="bg-gray-800">Swift</option>
                          <option className="bg-gray-800">Kotlin</option>
                          <option className="bg-gray-800">TensorFlow</option>
                          <option className="bg-gray-800">PyTorch</option>
                          <option className="bg-gray-800">Apache Spark</option>
                          <option className="bg-gray-800">Solidity</option>
                          <option className="bg-gray-800">Rust</option>
                          <option className="bg-gray-800">Docker</option>
                          <option className="bg-gray-800">Kubernetes</option>
                          <option className="bg-gray-800">AWS</option>
                          <option className="bg-gray-800">GCP</option>
                          <option className="bg-gray-800">MySQL</option>
                          <option className="bg-gray-800">MongoDB</option>
                          <option className="bg-gray-800">PostgreSQL</option>
                          <option className="bg-gray-800">Firebase</option>
                          <option className="bg-gray-800">Redis</option>
                          <option className="bg-gray-800">Unity</option>
                          <option className="bg-gray-800">Unreal Engine</option>
                          <option className="bg-gray-800">IoT</option>
                          <option className="bg-gray-800">C++</option>
                          <option className="bg-gray-800">Go</option>
                          <option className="bg-gray-800">Cybersecurity</option>
                          <option className="bg-gray-800">Other</option>
                        </select>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>
                      {validationErrors.Project_tech_stack && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.Project_tech_stack}
                        </p>
                      )}
                    </div>

                    {/* Project Category */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Project Category *
                      </label>
                      <div className="relative">
                        <select
                          name="project_category"
                          value={formData.project_category}
                          onChange={handleChange}
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white focus:outline-none transition-colors ${
                            validationErrors.project_category
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                        >
                          <option value="funded" className="bg-gray-800">
                            Funded Projects - Bid on projects and get selected
                            by owners
                          </option>
                          {user?.isPlatformAdmin && (
                            <option value="basic" className="bg-gray-800">
                              Basic Projects - For resume building and practice
                              (Platform Only)
                            </option>
                          )}
                          <option
                            value="capsule"
                            className="bg-gray-800"
                            disabled
                          >
                            Capsule Projects - Advanced company projects (Coming
                            Soon)
                          </option>
                        </select>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>
                      {validationErrors.project_category && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.project_category}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-2">
                        {user?.isPlatformAdmin
                          ? "Note: As a platform administrator, you can create both funded and basic projects."
                          : "Note: Basic projects are only available for platform administrators. Regular users can only create funded projects."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Project Details */}
              {currentStep === 2 && (
                <div className="animate-slide-in-right space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Project Details
                    </h2>
                    <p className="text-gray-300">
                      Tell us more about your vision and requirements
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Project Description */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Project Description *
                      </label>
                      <div className="relative">
                        <textarea
                          name="Project_Description"
                          value={formData.Project_Description}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors resize-none ${
                            validationErrors.Project_Description
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                          placeholder="Provide a detailed overview of your project..."
                          rows="5"
                        ></textarea>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                      {validationErrors.Project_Description && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.Project_Description}
                        </p>
                      )}
                    </div>

                    {/* Project Features */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Key Features *
                      </label>
                      <div className="relative">
                        <textarea
                          name="Project_Features"
                          value={formData.Project_Features}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors resize-none ${
                            validationErrors.Project_Features
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                          placeholder="List the key features of your project..."
                          rows="4"
                        ></textarea>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                      {validationErrors.Project_Features && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.Project_Features}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2 flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        Tip: Use bullet points for better readability
                      </p>
                    </div>

                    {/* Team Requirements */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Ideal Team Members *
                      </label>
                      <div className="relative">
                        <textarea
                          name="Project_looking"
                          value={formData.Project_looking}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors resize-none ${
                            validationErrors.Project_looking
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                          placeholder="Describe the ideal contributors for your project..."
                          rows="4"
                        ></textarea>
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                      {validationErrors.Project_looking && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.Project_looking}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Additional Information */}
              {currentStep === 3 && (
                <div className="animate-slide-in-right space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Final Details
                    </h2>
                    <p className="text-gray-300">
                      Almost there! Just a few more things to complete
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* GitHub Link */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        GitHub Repository *
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          name="Project_gitHub_link"
                          value={formData.Project_gitHub_link}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                            validationErrors.Project_gitHub_link
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                          placeholder="https://github.com/yourusername/your-repo"
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <svg
                            className="w-6 h-6 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </div>
                      </div>
                      {validationErrors.Project_gitHub_link && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.Project_gitHub_link}
                        </p>
                      )}
                    </div>

                    {/* Cover Image Upload */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Project Cover Image (Optional)
                      </label>
                      <div className="relative">
                        <FileUploadField
                          label=""
                          name="Project_cover_photo"
                          multiple={false}
                          accept="image/*"
                          maxSize={2}
                          onFilesChange={handleFilesChange}
                          showPreview={true}
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                    </div>

                    {/* Trust & Security Section */}
                    <div className="space-y-4">
                      {/* Data Protection */}
                      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-4 rounded-lg border border-green-500/20">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-6 h-6 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white mb-2">
                              Your Data is Protected
                            </h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                              <li>
                                • Industry-standard encryption for all project
                                data
                              </li>
                              <li>
                                • Secure data handling practices implemented
                              </li>
                              <li>
                                • Reliable cloud infrastructure for data storage
                              </li>
                              <li>
                                • Built with security best practices from day
                                one
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Intellectual Property */}
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-6 h-6 text-purple-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white mb-2">
                              Intellectual Property Protection
                            </h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                              <li>
                                • Built-in NDA system for all project
                                collaborations
                              </li>
                              <li>
                                • Your IP rights are clearly defined and
                                protected
                              </li>
                              <li>
                                • Confidentiality agreements integrated into the
                                platform
                              </li>
                              <li>
                                • Legal framework designed to protect your
                                innovations
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Terms and Conditions */}
                      <div className="bg-[#1a1a1a] p-4 rounded-lg border border-gray-700">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 mr-2 text-[#00A8E8]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium mb-2 flex items-center">
                              <svg
                                className="w-5 h-5 mr-2 text-[#00A8E8]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                              Terms & Conditions
                            </h3>
                            <p className="text-sm text-gray-400">
                              By submitting this project, you agree to our terms
                              and conditions. Your project will be reviewed by
                              our expert team before going live to ensure
                              quality and security standards.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Bonus Pool */}
              {currentStep === 4 && (
                <div className="animate-slide-in-right space-y-8">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Bonus Pool (Required)
                    </h2>
                    <p className="text-gray-300">
                      Fund rewards for contributors to list your project
                    </p>
                    <div className="mt-4 p-4 bg-[#2A2A2A] rounded-lg border border-gray-600">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-[#00A8E8] mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          ></path>
                        </svg>
                        <span className="text-gray-300 text-sm">
                          <strong>What is a Bonus Pool?</strong>
                          <br />
                          A bonus pool is a reward fund that contributors can
                          earn by adding to their bidding money. This
                          incentivizes quality contributions and helps you
                          attract the best developers.
                          <br />
                          <br />
                          <strong className="text-[#00A8E8]">
                            ⚠️ Bonus pool funding is mandatory to list your
                            project.
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Bonus Pool Amount */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Bonus Pool Amount ($) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="bonus_pool_amount"
                          value={formData.bonus_pool_amount}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          min="1"
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                            validationErrors.bonus_pool_amount
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                          placeholder="Enter the bonus pool amount..."
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                      {validationErrors.bonus_pool_amount && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.bonus_pool_amount}
                        </p>
                      )}
                    </div>

                    {/* Number of Contributors */}
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 group-hover:text-blue-400 transition-colors">
                        Number of Contributors *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="bonus_pool_contributors"
                          value={formData.bonus_pool_contributors}
                          onChange={handleChange}
                          onKeyDown={handleKeyDown}
                          min="1"
                          className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                            validationErrors.bonus_pool_contributors
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                          }`}
                          placeholder="Enter the number of contributors..."
                        />
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      </div>
                      {validationErrors.bonus_pool_contributors && (
                        <p className="text-red-400 text-sm mt-1">
                          {validationErrors.bonus_pool_contributors}
                        </p>
                      )}
                    </div>

                    {/* Bonus Pool Funding Requirement Error */}
                    {validationErrors.bonusPoolFunded && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-4">
                        <div className="flex items-center text-red-400">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {validationErrors.bonusPoolFunded}
                        </div>
                      </div>
                    )}

                    {/* Total Bonus Pool Calculation */}
                    <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-semibold">
                          Bonus Pool Summary
                        </h4>
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
                          Required
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            Per Contributor:
                          </span>
                          <span className="text-white font-medium">
                            ₹{formData.bonus_pool_amount || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">
                            Number of Contributors:
                          </span>
                          <span className="text-white font-medium">
                            {formData.bonus_pool_contributors || 0}
                          </span>
                        </div>
                        <div className="border-t border-gray-600 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-semibold">
                              Total Bonus Pool:
                            </span>
                            <span className="gradient-text font-bold text-lg">
                              ₹
                              {(parseInt(formData.bonus_pool_amount) || 0) *
                                (parseInt(formData.bonus_pool_contributors) ||
                                  0)}
                            </span>
                          </div>
                        </div>

                        {/* Fund Bonus Pool Button */}
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          {paymentVerificationLoading ? (
                            <div className="text-center">
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-center text-blue-400">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-2"></div>
                                  <span className="font-semibold">
                                    Verifying Payment...
                                  </span>
                                </div>
                                <p className="text-xs text-blue-300 mt-1">
                                  Please wait while we verify your payment with
                                  our servers
                                </p>
                              </div>
                            </div>
                          ) : bonusPoolFunded ? (
                            <div className="text-center">
                              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-center text-green-400">
                                  <svg
                                    className="w-5 h-5 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  <span className="font-semibold">
                                    Bonus Pool Funded Successfully!
                                  </span>
                                </div>
                                <p className="text-xs text-green-300 mt-1">
                                  Your project is ready to be listed with a
                                  funded bonus pool
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowBonusModal(true)}
                                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
                                >
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                  </svg>
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  onClick={handlePaymentRetry}
                                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center"
                                >
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                  Retry
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {bonusPoolStatus?.funded === false && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                                  <div className="flex items-center text-red-400 mb-2">
                                    <svg
                                      className="w-4 h-4 mr-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Payment verification failed
                                  </div>
                                  <p className="text-xs text-red-300 mb-3">
                                    Your payment was not verified. Please try
                                    again or contact support if the issue
                                    persists.
                                  </p>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={handlePaymentRetry}
                                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-all duration-300 flex items-center justify-center"
                                    >
                                      <svg
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                      </svg>
                                      Retry
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowBonusModal(true)}
                                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center"
                                    >
                                      <svg
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                      </svg>
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowBonusModal(true)}
                                disabled={
                                  !formData.project_Title ||
                                  !formData.bonus_pool_amount ||
                                  !formData.bonus_pool_contributors
                                }
                                className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0062E6] text-white py-3 px-4 rounded-lg font-semibold hover:from-[#0090c9] hover:to-[#0052cc] transition-all duration-300 shadow-lg hover:shadow-[#00A8E8]/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                  />
                                </svg>
                                Fund Bonus Pool - ₹
                                {(parseInt(formData.bonus_pool_amount) || 0) *
                                  (parseInt(formData.bonus_pool_contributors) ||
                                    0)}
                              </button>
                              <p className="text-xs text-gray-400 mt-2 text-center">
                                {!formData.project_Title ||
                                !formData.bonus_pool_amount ||
                                !formData.bonus_pool_contributors
                                  ? "Complete project details to enable funding"
                                  : "Fund your bonus pool to attract quality contributors"}
                              </p>
                              <p className="text-xs text-red-400 mt-1 text-center font-medium">
                                ⚠️ Bonus pool funding is mandatory to list your
                                project
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-2 bg-[#2A2A2A] text-white rounded-lg hover:bg-[#333] transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 19l-7-7 7-7"
                      ></path>
                    </svg>
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white rounded-lg hover:from-[#00A8E8] hover:to-[#0062E6] transition-all shadow-lg shadow-blue-500/20 flex items-center"
                  >
                    Next
                    <svg
                      className="w-4 h-4 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      loading || !bonusPoolFunded || paymentVerificationLoading
                    }
                    onClick={() => setSubmitButtonClicked(true)}
                    className={`submit-button px-6 py-2 rounded-lg transition-all shadow-lg flex items-center ${
                      bonusPoolFunded
                        ? "bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white hover:from-[#00A8E8] hover:to-[#0062E6] shadow-blue-500/20"
                        : "bg-gray-600 text-gray-300 cursor-not-allowed"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Submitting...</span>
                      </>
                    ) : paymentVerificationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Verifying Payment...</span>
                      </>
                    ) : bonusPoolFunded ? (
                      <>
                        <span>Submit Project</span>
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>Fund Bonus Pool First</span>
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          ></path>
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center animate-pulse">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Platform Features Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Built for Modern Development
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Our platform is designed with the latest technologies and
                security standards to ensure your projects succeed
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0062E6] to-[#00A8E8] rounded-full flex items-center justify-center text-white mr-4">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Secure Infrastructure
                    </h4>
                    <p className="text-sm text-gray-400">
                      Built with modern security
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Our platform is built on a secure, scalable infrastructure
                  using the latest cloud technologies and security protocols to
                  protect your data and projects.
                </p>
                <div className="flex items-center text-blue-400 text-sm">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Production Ready
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0062E6] to-[#00A8E8] rounded-full flex items-center justify-center text-white mr-4">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Real-time Collaboration
                    </h4>
                    <p className="text-sm text-gray-400">
                      Instant team coordination
                    </p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Connect with developers and teams in real-time. Our platform
                  facilitates seamless communication and project management for
                  successful outcomes.
                </p>
                <div className="flex items-center text-green-400 text-sm">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Live Platform
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#0062E6] to-[#00A8E8] rounded-full flex items-center justify-center text-white mr-4">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Legal Protection
                    </h4>
                    <p className="text-sm text-gray-400">Built-in safeguards</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  Comprehensive legal framework with built-in NDAs, IP
                  protection, and confidentiality agreements to safeguard your
                  innovative ideas and projects.
                </p>
                <div className="flex items-center text-purple-400 text-sm">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Legally Compliant
                </div>
              </div>
            </div>
          </div>

          {/* Platform Launch CTA */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-[#0062E6]/20 to-[#00A8E8]/20 p-8 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-bold text-white mb-4">
                Be Among the First to Launch Your Project
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Our platform is ready and waiting for innovative projects like
                yours. Start building your dream team today with our secure,
                professional development platform.
              </p>
              <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Platform Ready
                </span>
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Security Built-in
                </span>
                <span className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-purple-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Support Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bonus Pool Payment Modal */}
      <BonusPoolPaymentModal
        isOpen={showBonusModal}
        onClose={() => setShowBonusModal(false)}
        project={{
          _id: editingProject?._id || params.id,
          project_Title: formData.project_Title,
          bonus_pool_amount: formData.bonus_pool_amount,
          bonus_pool_contributors: formData.bonus_pool_contributors,
        }}
        onSuccess={async (result) => {
          console.log("Payment completed, verifying with backend:", result);

          // Extract payment intent ID from the result
          const intentId =
            result?.intentId || result?.razorpay_payment_id || paymentIntentId;

          if (intentId) {
            // Verify payment status with backend
            const isPaymentVerified = await verifyPaymentStatus(intentId);

            if (isPaymentVerified) {
              console.log("Payment verified successfully");
              setBonusPoolStatus({ funded: true });
              setBonusPoolFunded(true);
              setShowBonusModal(false);
            } else {
              console.error("Payment verification failed");
              setError(
                "Payment verification failed. Please try again or contact support."
              );
              setBonusPoolStatus({ funded: false });
              setBonusPoolFunded(false);
            }
          } else {
            console.error("No payment intent ID found");
            setError(
              "Payment verification failed. Please try again or contact support."
            );
            setBonusPoolStatus({ funded: false });
            setBonusPoolFunded(false);
          }
        }}
        onError={(error) => {
          console.error("Bonus pool funding failed:", error);
          setError("Payment failed. Please try again.");
          setBonusPoolStatus({ funded: false });
          setBonusPoolFunded(false);
        }}
      />
    </div>
  );
};

export default ProjectListingPage;
