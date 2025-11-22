import React, { useState, useEffect } from "react";
import Navbar from "@shared/components/layout/NavBar";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCode,
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaGlobe,
  FaCamera,
  FaUpload,
  FaSave,
  FaEye,
  FaEdit,
  FaCheck,
  FaTimes,
  FaPlus,
  FaTrash,
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
  FaRocket,
  FaTrophy,
  FaCalendar,
  FaPhone,
} from "react-icons/fa";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isNewProfile = location.pathname.includes('createprofile') || location.pathname.includes('create');

  // Enhanced form state with better structure
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    bio: "",
    location: "",
    experience: "",
    github: "",
    linkedin: "",
    instagram: "",
    website: "",
    skills: [],
    skillExperience: {}, // New: Detailed skill experience tracking
    avatar: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("saved");
  const [formProgress, setFormProgress] = useState(0);

  // Skill categories with icons
  const skillCategories = [
    {
      name: "Frontend",
      icon: FaHtml5,
      skills: ["HTML", "CSS", "JavaScript", "React", "Vue.js", "Angular", "TypeScript", "Tailwind CSS", "Bootstrap"],
      color: "blue"
    },
    {
      name: "Backend",
      icon: FaNodeJs,
      skills: ["Node.js", "Express", "Python", "Django", "Flask", "Java", "Spring", "PHP", "Laravel"],
      color: "green"
    },
    {
      name: "Database",
      icon: FaDatabase,
      skills: ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "Supabase", "SQLite"],
      color: "purple"
    },
    {
      name: "DevOps",
      icon: FaDocker,
      skills: ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "Jenkins", "Git", "CI/CD"],
      color: "orange"
    },
    {
      name: "Mobile",
      icon: FaRocket,
      skills: ["React Native", "Flutter", "Swift", "Kotlin", "Ionic", "Xamarin"],
      color: "pink"
    },
    {
      name: "AI/ML",
      icon: FaTrophy,
      skills: ["TensorFlow", "PyTorch", "Scikit-learn", "OpenAI", "Hugging Face", "Pandas", "NumPy"],
      color: "yellow"
    }
  ];

  // Load existing profile data if editing
  useEffect(() => {
    if (!isNewProfile) {
      loadExistingProfile();
    }
  }, [isNewProfile]);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (formProgress > 0 && !isNewProfile) {
        handleAutoSave();
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [form, formProgress]);

  // Calculate form progress
  useEffect(() => {
    const filledFields = Object.values(form).filter(value => 
      value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '')
    ).length;
    const totalFields = Object.keys(form).length;
    setFormProgress((filledFields / totalFields) * 100);
  }, [form]);

  const loadExistingProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      const profile = response.data.profile;
      // Process skills to extract names and build skillExperience
      const processedSkills = [];
      const processedSkillExperience = {};
      
      if (profile.user_profile_skills && Array.isArray(profile.user_profile_skills)) {
        profile.user_profile_skills.forEach(skill => {
          if (typeof skill === 'string') {
            processedSkills.push(skill);
            processedSkillExperience[skill] = { years: 1, projects: 1, proficiency: "Beginner" };
          } else if (skill && typeof skill === 'object' && skill.name) {
            processedSkills.push(skill.name);
            processedSkillExperience[skill.name] = {
              years: skill.experience || 1,
              projects: skill.projects || 1,
              proficiency: skill.proficiency || "Beginner"
            };
          }
        });
      }

      setForm({
        name: profile.username?.username || "",
        username: profile.username?.username || "",
        email: profile.username?.email || "",
        phone: profile.user_profile_phone || "",
        role: profile.username?.usertype || "",
        bio: profile.user_profile_bio || "",
        location: profile.user_profile_location || "",
        experience: profile.user_profile_experience || "",
        github: profile.user_profile_github || "",
        linkedin: profile.user_profile_linkedIn || "",
        instagram: profile.user_profile_instagram || "",
        website: profile.user_profile_website || "",
        skills: processedSkills,
        skillExperience: processedSkillExperience,
        avatar: null,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setAutoSaveStatus("saving");
  };

  const handleSkillToggle = (skill) => {
    setForm(prev => {
      // Ensure skill is a string for comparison
      const skillName = typeof skill === 'string' ? skill : (skill?.name || skill);
      const isSkillSelected = prev.skills.includes(skillName);
      const newSkills = isSkillSelected
        ? prev.skills.filter(s => s !== skillName)
        : [...prev.skills, skillName];
      
      // Update skill experience when adding/removing skills
      const newSkillExperience = { ...prev.skillExperience };
      if (isSkillSelected) {
        // Remove skill experience when deselecting
        delete newSkillExperience[skillName];
      } else {
        // Initialize skill experience when selecting
        newSkillExperience[skillName] = {
          years: 1,
          projects: 1,
          proficiency: "Beginner"
        };
      }
      
      return {
        ...prev,
        skills: newSkills,
        skillExperience: newSkillExperience
      };
    });
    setAutoSaveStatus("saving");
  };

  const handleSkillExperienceChange = (skill, field, value) => {
    setForm(prev => ({
      ...prev,
      skillExperience: {
        ...prev.skillExperience,
        [skill]: {
          ...prev.skillExperience[skill],
          [field]: value
        }
      }
    }));
    setAutoSaveStatus("saving");
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB for avatar)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setMessage(`File too large. Maximum size for avatar is 5MB`);
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setMessage('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.');
        return;
      }

      setForm(prev => ({ ...prev, [type]: file }));
      setAutoSaveStatus("saving");
      setMessage(""); // Clear any previous error messages
    }
  };

  const uploadFile = async (file, type) => {
    try {
      const formData = new FormData();
      formData.append(type, file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/uploads/single/${type}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.files && response.data.files.length > 0) {
        const uploadedFile = response.data.files[0];
        return uploadedFile.url; // Return the file URL
      }
      return null;
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      setMessage(`Error uploading ${type}: ${error.response?.data?.message || error.message}`);
      return null;
    }
  };

  const handleAutoSave = async () => {
    if (isNewProfile) return;
    
    try {
      setAutoSaveStatus("saving");
      const payload = {
        user_profile_skills: form.skills,
        user_profile_bio: form.bio,
        user_profile_linkedIn: form.linkedin,
        user_profile_github: form.github,
        user_profile_website: form.website,
        user_profile_instagram: form.instagram,
        user_profile_location: form.location,
        user_profile_phone: form.phone,
        user_profile_experience: form.experience,
        username: form.username,
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/api/editprofile`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAutoSaveStatus("saved");
    } catch (error) {
      setAutoSaveStatus("error");
      console.error("Auto-save error:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Upload avatar if it exists
      let avatarUrl = null;

      if (form.avatar) {
        avatarUrl = await uploadFile(form.avatar, 'avatar');
        if (!avatarUrl) {
          setLoading(false);
          return; // Stop if avatar upload failed
        }
      }

      const payload = {
        user_profile_skills: form.skills,
        user_profile_bio: form.bio,
        user_profile_linkedIn: form.linkedin,
        user_profile_github: form.github,
        user_profile_website: form.website,
        user_profile_instagram: form.instagram,
        user_profile_location: form.location,
        user_profile_phone: form.phone,
        user_profile_experience: form.experience,
        skillExperience: form.skillExperience,
        username: form.username,
        // Add avatar URL if uploaded
        ...(avatarUrl && { user_profile_avatar: avatarUrl }),
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/api/editprofile`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setMessage("Profile saved successfully!");
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      setMessage("Error saving profile: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getSkillIcon = (skillName) => {
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
  };

  const renderFormSection = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Personal Information Section */}
            <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FaUser className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                    placeholder="Choose a unique username"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Email</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Phone</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Professional Role</label>
                  <input
                    type="text"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                    placeholder="e.g., Full Stack Developer"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Location</label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <FaCode className="text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Professional Bio</h2>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2 font-medium">About You</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300 resize-none"
                  placeholder="Tell us about your passion for development, your journey, and what drives you..."
                />
                <div className="text-right text-sm text-gray-400 mt-2">
                  {form.bio.length}/500 characters
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Skills Section */}
            <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <FaCode className="text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Skills & Technologies</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skillCategories.map((category) => (
                  <div
                    key={category.name}
                    className="bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-2xl border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 bg-${category.color}-500/20 rounded-lg`}>
                        <category.icon className={`text-${category.color}-400`} />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {category.skills.map((skill) => {
                        // Ensure skill is a string
                        const skillName = typeof skill === 'string' ? skill : (skill?.name || 'Unknown Skill');
                        const isSelected = form.skills.includes(skillName);
                        const SkillIcon = getSkillIcon(skillName);
                        
                        return (
                          <button
                            key={skillName}
                            type="button"
                            onClick={() => handleSkillToggle(skillName)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
                              isSelected
                                ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                : "bg-[#1a1a1a] border-gray-700/50 text-gray-300 hover:border-blue-500/30 hover:text-white"
                            }`}
                          >
                            <SkillIcon className="text-lg" />
                            <span className="font-medium">{skillName}</span>
                            {isSelected && <FaCheck className="ml-auto text-blue-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              
              {form.skills.length > 0 && (
                <div className="mt-6 space-y-6">
                  {/* Selected Skills Summary */}
                  <div className="p-4 bg-[#2a2a2a] rounded-xl border border-blue-500/20">
                    <h4 className="text-white font-semibold mb-3">Selected Skills ({form.skills.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {form.skills.map((skill) => {
                        // Ensure skill is a string
                        const skillName = typeof skill === 'string' ? skill : (skill?.name || 'Unknown Skill');
                        return (
                          <span
                            key={skillName}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium"
                          >
                            {skillName}
                            <button
                              type="button"
                              onClick={() => handleSkillToggle(skillName)}
                              className="hover:text-red-400 transition-colors"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skill Experience Details */}
                  <div className="p-6 bg-[#2a2a2a] rounded-xl border border-blue-500/20">
                    <h4 className="text-white font-semibold mb-4">Skill Experience Details</h4>
                    <p className="text-gray-400 text-sm mb-6">
                      Specify your experience level and project count for each selected skill
                    </p>
                    
                    <div className="space-y-4">
                      {form.skills.map((skill) => {
                        const skillExp = form.skillExperience[skill] || { years: 1, projects: 1, proficiency: "Beginner" };
                        
                        return (
                          <div
                            key={skill}
                            className="p-4 bg-[#1a1a1a] rounded-xl border border-gray-700/50"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-blue-500/20 rounded-lg">
                                {React.createElement(getSkillIcon(skill), { className: "text-blue-400" })}
                              </div>
                              <h5 className="text-white font-medium">{skill}</h5>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Years of Experience */}
                              <div>
                                <label className="block text-gray-300 text-sm mb-2">Years of Experience</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="20"
                                  value={skillExp.years}
                                  onChange={(e) => handleSkillExperienceChange(skill, 'years', parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                              
                              {/* Project Count */}
                              <div>
                                <label className="block text-gray-300 text-sm mb-2">Projects Completed</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={skillExp.projects}
                                  onChange={(e) => handleSkillExperienceChange(skill, 'projects', parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                              
                              {/* Proficiency Level */}
                              <div>
                                <label className="block text-gray-300 text-sm mb-2">Proficiency Level</label>
                                <select
                                  value={skillExp.proficiency}
                                  onChange={(e) => handleSkillExperienceChange(skill, 'proficiency', e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                >
                                  <option value="Beginner">Beginner (Under 1 year)</option>
                                  <option value="Intermediate">Intermediate (1-2 years)</option>
                                  <option value="Experienced">Experienced (3+ years)</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Experience Summary */}
                            <div className="mt-3 p-3 bg-[#2a2a2a] rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">
                                  {skillExp.years} year{skillExp.years !== 1 ? 's' : ''} experience
                                </span>
                                <span className="text-gray-400">
                                  {skillExp.projects} project{skillExp.projects !== 1 ? 's' : ''} completed
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  skillExp.proficiency === 'Experienced' ? 'bg-green-500/20 text-green-400' :
                                  skillExp.proficiency === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {skillExp.proficiency}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            {/* Social Links Section */}
            <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <FaGlobe className="text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Social Links & Portfolio</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">GitHub Profile</label>
                  <div className="relative">
                    <FaGithub className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      name="github"
                      value={form.github}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">LinkedIn Profile</label>
                  <div className="relative">
                    <FaLinkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      name="linkedin"
                      value={form.linkedin}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Instagram</label>
                  <div className="relative">
                    <FaInstagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      name="instagram"
                      value={form.instagram}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                      placeholder="https://instagram.com/yourusername"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-2 font-medium">Personal Website</label>
                  <div className="relative">
                    <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white border border-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Media Section */}
            <div className="bg-[#1a1a1a]/80 backdrop-blur-xl rounded-3xl border border-blue-500/20 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <FaCamera className="text-pink-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Profile Avatar</h2>
              </div>
              
              <div className="max-w-md">
                <label className="block text-gray-300 mb-2 font-medium">Profile Avatar</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'avatar')}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
                      form.avatar 
                        ? 'border-green-500/50 bg-green-500/10' 
                        : 'border-blue-500/30 hover:border-blue-500/50'
                    }`}
                  >
                    {form.avatar ? (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden border-2 border-green-500/50">
                          <img
                            src={URL.createObjectURL(form.avatar)}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-green-400 text-sm font-medium">Avatar selected</p>
                        <p className="text-gray-500 text-xs">{form.avatar.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FaUpload className="mx-auto text-2xl text-blue-400 mb-2" />
                        <p className="text-gray-400 text-sm">Click to upload avatar</p>
                        <p className="text-gray-500 text-xs">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* File Upload Status */}
              {form.avatar && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-medium">Avatar Ready for Upload</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Your selected avatar will be uploaded when you save the profile.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#0f0f0f] to-[#1a1a2e]">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-green-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                {isNewProfile ? "Create Your Profile" : "Edit Your Profile"}
              </h1>
              <p className="text-xl text-gray-400 mb-6">
                {isNewProfile 
                  ? "Set up your professional developer profile to showcase your skills and experience"
                  : "Update your profile information and keep it current"
                }
              </p>
              
              {/* Progress Bar */}
              <div className="w-full max-w-2xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm text-blue-400 font-medium">{Math.round(formProgress)}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${formProgress}%` }}
                  />
                </div>
              </div>

              {/* Auto-save Status */}
              {!isNewProfile && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    autoSaveStatus === 'saved' ? 'bg-green-400' :
                    autoSaveStatus === 'saving' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></div>
                  <span className={`${
                    autoSaveStatus === 'saved' ? 'text-green-400' :
                    autoSaveStatus === 'saving' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {autoSaveStatus === 'saved' ? 'All changes saved' :
                     autoSaveStatus === 'saving' ? 'Saving...' : 'Save failed'}
                  </span>
                </div>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`max-w-2xl mx-auto mb-8 p-4 rounded-xl text-center ${
                  message.startsWith("Error") 
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "bg-green-500/10 border border-green-500/20 text-green-400"
                }`}
              >
                {message}
              </div>
            )}

            {/* Step Navigation */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <button
                      onClick={() => setCurrentStep(step)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                        currentStep === step
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50"
                      }`}
                    >
                      {step}
                    </button>
                    {step < 3 && (
                      <div className={`w-16 h-1 mx-2 rounded ${
                        currentStep > step ? "bg-blue-600" : "bg-gray-700/50"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit}>
                <div>
                  {renderFormSection()}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-8">
                  <div className="flex gap-4">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                      >
                        Previous
                      </button>
                    )}
                    
                    {currentStep < 3 && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                      >
                        Next
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(!previewMode)}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                    >
                      {previewMode ? <FaEdit /> : <FaEye />}
                      {previewMode ? "Edit Mode" : "Preview"}
                    </button>
                    
                    {currentStep === 3 && (
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave />
                            {isNewProfile ? "Create Profile" : "Save Changes"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default EditProfilePage;
