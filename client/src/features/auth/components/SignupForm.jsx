import { Link, useNavigate } from "react-router-dom";
import { FaGithub, FaUser, FaEnvelope, FaLock, FaCode, FaLaptopCode, FaGraduationCap } from "react-icons/fa";
import { useState } from "react";
import axiosInstance from "@shared/utils/api/axiosConfig";
import { useAuth } from "@app/providers/AuthProvider";
import { auth, githubProvider, signInWithPopup } from "@shared/config/firebase";

const CreateAccount = () => {
  const [formData, setformData] = useState({
    username: "",
    email: "",
    password: "",
    usertype: "",
  });
  
  // Safely get auth context
  const defaultAuth = {
    user: null,
    loginUser: async () => {},
    logoutUser: () => {},
    loading: false,
    refreshUser: async () => {}
  };

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
  
  const loginUser = authContext?.loginUser ?? (async () => {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setformData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);



    try {
      const response = await axiosInstance.post(
        '/api/user',
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          usertype: formData.usertype,
        }
      );
      setSuccess(true);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      navigate("/loginaccount");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignup = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const firebasetoken = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_GITHUB_LOGIN_API}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebasetoken,
          email: user.email,
          username: user.displayName,
          profilePic: user.photoURL,
        }),
      });

      const data = await response.json();

      if (data.token) {
        alert("GitHub Account Created Successfully!");
        loginUser(data.token);
      } else {
        setError("GitHub signup failed. Please try again.");
      }
    } catch (error) {
      setError("GitHub signup failed. Try again.");
    }
  };

  // Define user type options with icons and descriptions
  const userTypes = [
    {
      id: "Junior Developer",
      icon: <FaCode />,
      description: "1-2 years experience"
    },
    {
      id: "Senior Developer",
      icon: <FaLaptopCode />,
      description: "3+ years experience"
    },
    {
      id: "Fresher Developer",
      icon: <FaGraduationCap />,
      description: "New to coding"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="relative w-full max-w-md overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative bg-gray-900 border border-cyan-500/30 rounded-2xl shadow-xl shadow-cyan-500/5 backdrop-blur-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Join the Developer Community
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Create your account to start your journey</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
              Account created successfully!
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <FaUser className="text-cyan-400" /> Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                  className="w-full bg-gray-800/50 border border-gray-700 focus:border-cyan-500 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <FaEnvelope className="text-cyan-400" /> Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-gray-800/50 border border-gray-700 focus:border-cyan-500 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <FaLock className="text-cyan-400" /> Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a secure password"
                  required
                  className="w-full bg-gray-800/50 border border-gray-700 focus:border-cyan-500 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* User Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Developer Level</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {userTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`relative rounded-lg border ${
                      formData.usertype === type.id
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-gray-700 bg-gray-800/30 hover:bg-gray-800/50"
                    } transition-all p-3 cursor-pointer`}
                    onClick={() => setformData({ ...formData, usertype: type.id })}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`text-xl mb-1 ${formData.usertype === type.id ? "text-cyan-400" : "text-gray-400"}`}>
                        {type.icon}
                      </div>
                      <div className={`text-sm font-medium ${formData.usertype === type.id ? "text-white" : "text-gray-300"}`}>
                        {type.id}
                      </div>
                      <div className="text-xs mt-1 text-gray-500">{type.description}</div>
                    </div>
                    <input
                      type="radio"
                      name="usertype"
                      value={type.id}
                      checked={formData.usertype === type.id}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {formData.usertype === type.id && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transform transition-all duration-150 hover:translate-y-[-2px] flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center mt-8 mb-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="mx-4 text-sm text-gray-400">or continue with</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* GitHub Button */}
          <button
            onClick={handleGitHubSignup}
            className="w-full bg-gray-800 text-white border border-gray-700 hover:border-gray-600 font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all flex items-center justify-center gap-3"
          >
            <FaGithub className="text-xl" /> Sign up with GitHub
          </button>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/loginaccount" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
