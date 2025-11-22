/* eslint-disable no-unused-vars */
import { Link, useNavigate } from "react-router-dom";
import { FaGithub, FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@app/providers/AuthProvider";
import { auth, githubProvider, signInWithPopup } from "@shared/config/firebase";

const LoginPage = () => {
  const [formdata, setformdata] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
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

  const handelChange = (e) => {
    setformdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const Login_Api = `${import.meta.env.VITE_LOGIN_API}`;
      const response = await axios.post(
        Login_Api,
        {
          email: formdata.email,
          password: formdata.password,
        },
        {
          withCredentials: true,
        }
      );

      if (response.data.token) {
        await loginUser(response.data.token);
      } else {
        setError("Invalid response from server");
        setLoading(false);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Invalid email or password");
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const firebasetoken = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_GITHUB_LOGIN_API}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebasetoken }),
      });

      const data = await response.json();

      if (data.token) {
        alert("GitHub Login Successful!");
        loginUser(data.token);
      } else {
        setError("GitHub login failed. Please try again.");
      }
    } catch (error) {
      setError("GitHub authentication failed. Try again.");
      console.error("GitHub login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-20">
      <div className="relative w-full max-w-md">
        {/* Animated background elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative bg-gray-900 border border-cyan-500/30 rounded-2xl shadow-xl shadow-cyan-500/5 backdrop-blur-sm p-8">
          {/* Header with animated icon */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-cyan-500/10 rounded-full border border-cyan-500/30">
                <FaSignInAlt className="text-3xl text-cyan-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Welcome Back
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Sign in to access your account</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <FaEnvelope className="text-cyan-400" /> Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formdata.email}
                  onChange={handelChange}
                  required
                  placeholder="Enter your email"
                  className="w-full bg-gray-800/50 border border-gray-700 focus:border-cyan-500 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <FaLock className="text-cyan-400" /> Password
                </label>
                <a href="#" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formdata.password}
                  onChange={handelChange}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-gray-800/50 border border-gray-700 focus:border-cyan-500 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Remember me
              </label>
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
                "Sign In"
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
            onClick={handleGitHubLogin}
            className="w-full bg-gray-800 text-white border border-gray-700 hover:border-gray-600 font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all flex items-center justify-center gap-3"
          >
            <FaGithub className="text-xl" /> Sign in with GitHub
          </button>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/createaccount" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
