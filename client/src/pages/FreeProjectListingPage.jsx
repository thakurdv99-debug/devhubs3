import Navbar from "@shared/components/layout/NavBar";
import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUploadField from "../components/FileUploadField";
import { useAuth } from "@app/providers/AuthProvider";
import axios from "axios";

const FreeProjectListingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const editingProject = location.state?.editingProject || null;
  
  const [formData, setFormData] = useState({
    project_Title: "",
    Project_Description: "",
    Project_tech_stack: "",
    Project_gitHub_link: "",
    Project_cover_photo: "",
    project_category: "free",
  });
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [coverImage, setCoverImage] = useState(null);
  
  // Auth context
  const { user } = useAuth();

  useEffect(() => {
    if (!editingProject && params.id) {
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/project/getlistproject/${params.id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
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
    if (fieldName === "Project_cover_photo") {
      setCoverImage(files[0] || null);
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
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Form validation function
  const validateForm = () => {
    const errors = {};
    
    if (!formData.project_Title?.trim()) {
      errors.project_Title = "Project title is required";
    }
    if (!formData.Project_Description?.trim()) {
      errors.Project_Description = "Project description is required";
    }
    if (!formData.Project_tech_stack) {
      errors.Project_tech_stack = "Technology stack is required";
    }
    if (!formData.Project_gitHub_link?.trim()) {
      errors.Project_gitHub_link = "GitHub repository link is required";
    } else if (!formData.Project_gitHub_link.includes('github.com')) {
      errors.Project_gitHub_link = "Please enter a valid GitHub repository URL";
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    setError(null);
    setValidationErrors({});

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("project_Title", formData.project_Title);
      formDataToSend.append("Project_Description", formData.Project_Description);
      formDataToSend.append("Project_tech_stack", formData.Project_tech_stack);
      formDataToSend.append("Project_gitHub_link", formData.Project_gitHub_link);
      formDataToSend.append("project_category", "free");
      
      // Set default values for free projects
      formDataToSend.append("project_starting_bid", "0");
      formDataToSend.append("Project_Contributor", "1");
      formDataToSend.append("Project_Number_Of_Bids", "1");
      formDataToSend.append("Project_Features", "Free project for resume building");
      formDataToSend.append("Project_looking", "Open to all developers");
      formDataToSend.append("project_duration", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days from now
      formDataToSend.append("bonus_pool_amount", "0");
      formDataToSend.append("bonus_pool_contributors", "0");

      // Append cover image
      if (coverImage) {
        formDataToSend.append("Project_cover_photo", coverImage);
      }

      // Use params.id if editingProject is not available
      const projectId = editingProject?._id || params.id;

      if (projectId) {
        // EDIT MODE - Use JSON data for edit mode
        const editData = {
          project_Title: formData.project_Title,
          Project_Description: formData.Project_Description,
          Project_tech_stack: formData.Project_tech_stack,
          Project_gitHub_link: formData.Project_gitHub_link,
          project_category: "free",
          project_starting_bid: "0",
          Project_Contributor: "1",
          Project_Number_Of_Bids: "1",
          Project_Features: "Free project for resume building",
          Project_looking: "Open to all developers",
          project_duration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bonus_pool_amount: "0",
          bonus_pool_contributors: "0",
        };
        
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/admin/updateproject/${projectId}`,
          editData,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        navigate("/admin");
        alert("Free project updated successfully!");
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
          navigate("/admin");
          alert("Free project created successfully!");
        }
      }
    } catch (error) {
      console.error("Error submitting free project:", error);
      setError(error.response?.data?.message || "Failed to submit free project");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="max-w-4xl mx-auto mt-10">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              <span className="text-[#00A8E8]">Create</span> Free Project
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
              Create a free project for developers to build their resume and gain experience.
            </p>
            
            {/* Free Project Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">No Payment</div>
                <div className="text-sm text-gray-400">Completely Free to Create</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">Resume Building</div>
                <div className="text-sm text-gray-400">Help Developers Grow</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] p-6 rounded-xl border border-gray-700 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">Simple Setup</div>
                <div className="text-sm text-gray-400">Just Basic Info Required</div>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#232323] rounded-xl shadow-2xl overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0062E6]/20 to-[#00A8E8]/20 px-8 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-white font-medium">Free Project Creation</span>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
                    No Payment Required
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Live</span>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 md:p-12">
              <div className="space-y-8">
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
                      className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                        validationErrors.project_Title 
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                          : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                      }`}
                      placeholder="Enter a catchy title for your free project..."
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {validationErrors.project_Title && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.project_Title}</p>
                  )}
                </div>

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
                      className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors resize-none ${
                        validationErrors.Project_Description 
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                          : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                      }`}
                      placeholder="Describe what developers will build and learn from this project..."
                      rows="6"
                    ></textarea>
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {validationErrors.Project_Description && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.Project_Description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Tip: Explain what skills developers will gain and what they'll build
                  </p>
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
                      <option value="" className="bg-gray-800">Select technology...</option>
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
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                  {validationErrors.Project_tech_stack && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.Project_tech_stack}</p>
                  )}
                </div>

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
                      className={`w-full bg-[#2A2A2A] border rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none transition-colors ${
                        validationErrors.Project_gitHub_link 
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                          : "border-gray-600 focus:border-[#00A8E8] focus:ring-1 focus:ring-[#00A8E8]"
                      }`}
                      placeholder="https://github.com/yourusername/your-repo"
                    />
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#00A8E8]/10 to-[#0062E6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                  </div>
                  {validationErrors.Project_gitHub_link && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.Project_gitHub_link}</p>
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

                {/* Free Project Info */}
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-6 rounded-lg border border-green-500/20">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-2">Free Project Benefits</h3>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• No payment required - completely free to create</li>
                        <li>• Helps developers build their resume and portfolio</li>
                        <li>• Simple setup with just basic project information</li>
                        <li>• Perfect for learning projects and skill development</li>
                        <li>• Developers can start building immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-[#0062E6] to-[#00A8E8] text-white rounded-lg font-semibold hover:from-[#00A8E8] hover:to-[#0062E6] transition-all shadow-lg shadow-blue-500/20 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Free Project...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Free Project</span>
                      <svg
                        className="w-5 h-5 ml-2"
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
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center animate-pulse">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FreeProjectListingPage;
