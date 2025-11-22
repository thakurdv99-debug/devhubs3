import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@shared/components/layout/NavBar";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";
import { useChat } from "@features/chat/context/ChatContext";
import { projectTaskApi } from "@features/tasks/services/projectTaskApi";
import { escrowWalletApi } from "@features/escrow/services/escrowWalletApi";
import { notificationService } from "@shared/services/notificationService";
import ProjectChat from "@features/chat/components/ProjectChat";
import {
  CheckSquare,
  Users,
  FolderOpen,
  BarChart3,
  MessageSquare,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Send,
  Upload,
  Download,
  Calendar,
  User,
  Wallet,
  Trophy,
  Target,
  GitBranch,
  FileText,
  Shield,
  DollarSign,
  TrendingUp,
  Award,
  Star,
  Zap,
  Briefcase,
  Users2,
  MessageCircle,
  Settings,
  Bell,
  X,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";

// Firebase imports for workspace access and real-time updates
import { db } from "../Config/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  collection, // eslint-disable-line no-unused-vars
  query, // eslint-disable-line no-unused-vars
  where, // eslint-disable-line no-unused-vars
} from "firebase/firestore";

const ContributionPage = () => {
  const { _id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinProject } = useChat();

  // Core state
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [userAccess, setUserAccess] = useState(null);

  // Project overview and financial data
  const [projectOverview, setProjectOverview] = useState(null);
  const [bonusPool, setBonusPool] = useState({
    totalAmount: 200,
    distributedAmount: 0,
    remainingAmount: 200,
  });

  // Escrow wallet data
  const [escrowWallet, setEscrowWallet] = useState(null);
  const [userEarnings, setUserEarnings] = useState(null);

  // Task management
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
    estimatedHours: 0,
    chunk: "general",
  });

  // Task filtering and search
  const [taskFilters, setTaskFilters] = useState({
    status: "all",
    priority: "all",
    assignedTo: "all",
    search: "",
  });

  // Task status update
  const [updatingTaskStatus, setUpdatingTaskStatus] = useState(false);

  // Task filtering and computed values
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      taskFilters.status === "all" || task.status === taskFilters.status;
    const matchesPriority =
      taskFilters.priority === "all" || task.priority === taskFilters.priority;

    // Handle assignedTo filter - task.assignedTo can be an object or string
    const taskAssignedToId =
      typeof task.assignedTo === "object"
        ? task.assignedTo._id
        : task.assignedTo;
    const matchesAssignedTo =
      taskFilters.assignedTo === "all" ||
      taskAssignedToId === taskFilters.assignedTo;

    const matchesSearch =
      taskFilters.search === "" ||
      task.title.toLowerCase().includes(taskFilters.search.toLowerCase()) ||
      task.description.toLowerCase().includes(taskFilters.search.toLowerCase());

    return (
      matchesStatus && matchesPriority && matchesAssignedTo && matchesSearch
    );
  });

  // Get tasks assigned to current user
  const myTasks = tasks.filter((task) => {
    const taskAssignedToId =
      typeof task.assignedTo === "object"
        ? task.assignedTo._id
        : task.assignedTo;
    return taskAssignedToId === user?._id;
  });

  // Resources and files
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState(null);

  // Team collaboration
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState(null);

  // Debug state
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  // Tab configuration
  // Check if project is free
  const isFreeProject = projectOverview?.project_category === 'free' || projectOverview?.is_free_project;

  // Redirect to overview if user tries to access hidden tabs for free projects
  useEffect(() => {
    if (isFreeProject && (activeTab === 'team' || activeTab === 'resources' || activeTab === 'earnings')) {
      setActiveTab('overview');
    }
  }, [isFreeProject, activeTab]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Target, color: "blue" },
    {
      id: "repository",
      label: "Repository Setup",
      icon: GitBranch,
      color: "indigo",
    },
    { id: "tasks", label: "Tasks", icon: CheckSquare, color: "green" },
    // Hide Team, Resources, and Earnings tabs for free projects
    ...(isFreeProject ? [] : [
      { id: "team", label: "Team", icon: Users2, color: "indigo" },
      { id: "resources", label: "Resources", icon: FolderOpen, color: "orange" },
      { id: "earnings", label: "Earnings", icon: DollarSign, color: "emerald" },
    ]),
    { id: "chat", label: "Chat", icon: MessageCircle, color: "yellow" },
    { id: "how-to-work", label: "How to Work", icon: FileText, color: "cyan" },
  ];

  // Check Firebase workspace access
  const checkWorkspaceAccess = useCallback(async () => {
    try {
      if (!user?._id) {
        throw new Error("User not authenticated");
      }

      if (!projectId) {
        throw new Error("Project ID is required");
      }

      console.log(
        `🔍 Checking workspace access for user ${user._id} on project ${projectId}`
      );

      // First check workspace_access collection
      const workspaceAccessRef = doc(
        db,
        "workspace_access",
        `${projectId}_${user._id}`
      );
      const accessDoc = await getDoc(workspaceAccessRef);

      if (accessDoc.exists()) {
        const accessData = accessDoc.data();
        console.log("📋 Workspace access data:", accessData);

        if (
          accessData.status === "active" &&
          accessData.accessLevel === "contributor"
        ) {
          console.log("✅ User has workspace access as contributor");
          return true;
        } else {
          console.log(
            "⚠️ Workspace access exists but status/level incorrect:",
            accessData
          );
        }
      } else {
        console.log("❌ No workspace_access document found");
      }

      // Check project_contributors collection
      const projectContributorRef = doc(
        db,
        "project_contributors",
        `${projectId}_${user._id}`
      );
      const contributorDoc = await getDoc(projectContributorRef);

      if (contributorDoc.exists()) {
        const contributorData = contributorDoc.data();
        console.log("📋 Project contributor data:", contributorData);

        if (
          contributorData.status === "active" &&
          contributorData.role === "contributor"
        ) {
          console.log("✅ User has project contributor access");
          return true;
        } else {
          console.log(
            "⚠️ Project contributor exists but status/role incorrect:",
            contributorData
          );
        }
      } else {
        console.log("❌ No project_contributors document found");
      }

      // Check if user is project owner by making a backend call
      try {
        console.log("🔍 Checking backend access...");
        const data = await projectTaskApi.checkWorkspaceAccess(projectId);
        console.log("📋 Backend response data:", data);
        if (data.hasAccess) {
          console.log("✅ User has access via backend check");
          return true;
        } else {
          console.log("❌ Backend denied access:", data.message);
        }
      } catch (error) {
        console.log("❌ Backend access check failed:", error.message);
      }

      // If we reach here, user doesn't have access
      throw new Error(
        "Access denied: User is not a selected contributor or project owner"
      );
    } catch (error) {
      console.error("Workspace access check failed:", error);
      throw new Error("Access denied: " + error.message);
    }
  }, [user?._id, projectId]);

  // Load project overview and financial data (memoized)
  const loadProjectOverview = useCallback(async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/project/getlistproject/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjectOverview(data.project);
        setBonusPool({
          totalAmount: data.project.bonus_pool_amount || 200,
          distributedAmount: 0,
          remainingAmount: data.project.bonus_pool_amount || 200,
        });
      }
    } catch (error) {
      console.error("Failed to load project overview:", error);
    }
  }, [projectId]);

  // Load escrow wallet data (memoized)
  const loadEscrowWalletData = useCallback(async () => {
    const maxRetries = 2;
    let retryCount = 0;
    
    const attemptLoad = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔍 Loading escrow wallet data for project: ${projectId} (attempt ${retryCount + 1})`);
        console.log('🔍 User ID:', user?._id);
        console.log('🔍 Auth token present:', !!localStorage.getItem('token'));
        console.log('🔍 Auth token value:', localStorage.getItem('token') ? `${localStorage.getItem('token').substring(0, 20)}...` : 'Missing');
        
        // Debug: Check if user has access to this project first
        try {
          const accessCheck = await projectTaskApi.checkWorkspaceAccess(projectId);
          console.log('🔍 Workspace access check:', accessCheck);
        } catch (accessError) {
          console.log('🔍 Workspace access check failed:', accessError.message);
        }
        
        const data = await escrowWalletApi.getUserEscrowWallet(projectId);
        console.log('🔍 Escrow wallet data response:', data);
        
        if (data.escrowWallet && data.userEarnings) {
          setEscrowWallet(data.escrowWallet);
          setUserEarnings(data.userEarnings);
          console.log('🔍 Escrow wallet set:', data.escrowWallet);
          console.log('🔍 User earnings set:', data.userEarnings);
          
          // Show success notification if funds are released
          if (data.userEarnings.status === 'released') {
            notificationService.success('Your payment has been released and is ready for withdrawal!');
          }
        } else {
          console.log('🔍 No escrow wallet data found, setting defaults');
          setEscrowWallet(null);
          setUserEarnings(null);
        }
        
        // Success - no need to retry
        return true;
      } catch (error) {
        console.error(`Failed to load escrow wallet data (attempt ${retryCount + 1}):`, error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.response?.config?.url,
          headers: error.response?.config?.headers
        });
        
        // Handle specific error cases
        if (error.response?.status === 404) {
          const errorData = error.response?.data;
          console.log('🔍 404 - Error details:', errorData);
          
          if (errorData?.errorType === 'NO_ESCROW_WALLET') {
            // No escrow wallet found - this is normal for new projects
            console.log('🔍 No escrow wallet found for this project - this is normal for new projects');
            setEscrowWallet(null);
            setUserEarnings(null);
            setError(null); // Don't show error as it's expected for new projects
            return true; // Success - no need to retry
          } else if (errorData?.errorType === 'NO_USER_FUNDS') {
            // Escrow wallet exists but user has no funds
            console.log('🔍 Escrow wallet exists but user has no funds');
            console.log('🔍 Available users in escrow:', errorData?.availableUsers);
            setEscrowWallet(null);
            setUserEarnings(null);
            setError("You don't have any escrow funds for this project. This usually means you haven't been selected as a contributor yet.");
            return true; // Success - no need to retry
          } else {
            // Generic 404
            console.log('🔍 Generic 404 error');
            setEscrowWallet(null);
            setUserEarnings(null);
            setError("No escrow data found for this project.");
            return true; // Success - no need to retry
          }
        } else if (error.response?.status === 401) {
          // Authentication error - don't trigger automatic logout
          console.log('🔍 401 - Authentication error - preventing automatic logout');
          setError("Authentication error. Please check your login status and try again.");
          setEscrowWallet(null);
          setUserEarnings(null);
          
          // Don't retry on auth errors
          return false;
        } else if (error.response?.status === 403) {
          // Authorization error
          console.log('🔍 403 - Authorization error');
          setError("You don't have access to this project's escrow data.");
          setEscrowWallet(null);
          setUserEarnings(null);
          
          // Don't retry on auth errors
          return false;
        } else if (error.response?.status === 500) {
          // Server error - retry
          console.log('🔍 500 - Server error');
          setError("Server error. Please try again later.");
          setEscrowWallet(null);
          setUserEarnings(null);
          
          // Retry on server errors
          return false;
        } else {
          // Other errors - retry
          console.log('🔍 Other error:', error.response?.status);
          setError("Failed to load escrow wallet data. Please try again.");
          setEscrowWallet(null);
          setUserEarnings(null);
          
          // Retry on other errors
          return false;
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Attempt to load with retries
    while (retryCount < maxRetries) {
      const success = await attemptLoad();
      if (success) {
        break; // Success - exit retry loop
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`🔍 Retrying escrow wallet load (attempt ${retryCount + 1}/${maxRetries})`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
  }, [projectId, user?._id]);

  // Load team members (memoized)
  const loadTeamMembers = useCallback(async () => {
    try {
      console.log('🔍 Loading team members for project:', projectId);
      console.log('🔍 API endpoint:', `${import.meta.env.VITE_API_URL}/api/project-tasks/${projectId}/team`);
      console.log('🔍 Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      setTeamMembersLoading(true);
      setTeamMembersError(null);
      const data = await projectTaskApi.getProjectTeamMembers(projectId);
      console.log('✅ Team members loaded:', data);
      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error("Failed to load team members:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setTeamMembersError(error.message || "Failed to load team members");
      setTeamMembers([]);
    } finally {
      setTeamMembersLoading(false);
    }
  }, [projectId]);

  // Load project resources (memoized to prevent infinite loops)
  const loadProjectResources = useCallback(async () => {
    try {
      console.log('🔍 Loading project resources for project:', projectId);
      console.log('🔍 API endpoint:', `${import.meta.env.VITE_API_URL}/api/project-tasks/${projectId}/resources`);
      console.log('🔍 Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      setResourcesLoading(true);
      setResourcesError(null);
      
      // Add a small delay to ensure proper loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data = await projectTaskApi.getProjectResources(projectId);
      console.log('✅ Project resources loaded:', data);
      console.log('🔍 Resources array:', data.resources);
      console.log('🔍 Resources length:', data.resources?.length || 0);
      
      if (data.resources && data.resources.length > 0) {
        console.log('🔍 Setting resources:', data.resources);
        setResources(data.resources);
      } else {
        console.log('🔍 No resources found, setting empty array');
        setResources([]);
      }
    } catch (error) {
      console.error("Failed to load project resources:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setResourcesError(error.message || "Failed to load project resources");
      setResources([]);
    } finally {
      setResourcesLoading(false);
    }
  }, [projectId]);

  const loadWorkspace = useCallback(async () => {
    try {
      if (!projectId) {
        setError("Project ID is required");
        return;
      }

      setLoading(true);
      setError(null);

      // First check Firebase workspace access
      await checkWorkspaceAccess();

      const data = await projectTaskApi.getWorkspace(projectId);
      setWorkspace(data.workspace);
      setUserAccess(data.userAccess);

      // Load tasks
      if (data.workspace.tasks) {
        setTasks(data.workspace.tasks);
      }

      // Skip loading resources from workspace - we use dedicated resources API instead
      console.log('🔍 Skipping workspace resources - using dedicated resources API');

    } catch (err) {
      if (err.message?.includes("not found")) {
        setError(
          "Project workspace not found. Please contact the project owner."
        );
      } else {
        setError(err.message || "Failed to load workspace");
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, checkWorkspaceAccess]);

  // Load tasks from API (memoized)
  const loadTasks = useCallback(async () => {
    try {
      console.log('🔍 Loading tasks for projectId:', projectId);
      const responseData = await projectTaskApi.getProjectTasks(projectId);
      console.log('✅ Tasks loaded successfully:', responseData);
      setTasks(responseData.tasks || []);
    } catch (error) {
      console.error("❌ Failed to load tasks:", error);
      console.error("❌ Error message:", error.message);
      if (error.response) {
        console.error("❌ Error response:", error.response.data);
      }
      setTasks([]);
    }
  }, [projectId]);

  // Load workspace data
  useEffect(() => {
    if (projectId) {
      // Load resources first to ensure they're not overwritten
      loadProjectResources();
      loadWorkspace();
      loadProjectOverview();
      loadEscrowWalletData();
      loadTeamMembers();
      
      // Join project chat room
      joinProject(projectId);
    }
  }, [projectId, loadProjectResources, loadWorkspace, loadProjectOverview, loadEscrowWalletData, loadTeamMembers, joinProject]);

  // Monitor resources state changes
  useEffect(() => {
    console.log('🔍 Resources state changed:', resources);
    console.log('🔍 Resources length:', resources.length);
    if (resources.length > 0) {
      console.log('🔍 First resource:', resources[0]);
    }
  }, [resources]);

  // Load resources when resources tab is selected (only for non-free projects)
  useEffect(() => {
    if (activeTab === "resources" && projectId && !isFreeProject) {
      console.log('🔍 Resources tab selected, ensuring resources are loaded');
      if (resources.length === 0 && !resourcesLoading) {
        console.log('🔍 No resources loaded, loading them now');
        loadProjectResources();
      }
    }
  }, [activeTab, projectId, resources.length, resourcesLoading, isFreeProject, loadProjectResources]);

  // Load tasks from API only (Firebase temporarily disabled)
  useEffect(() => {
    if (projectId && user?._id) {
      // Load tasks from API
      loadTasks();
      // Firebase listener temporarily disabled to prevent overriding API data
      // const timer = setTimeout(() => {
      //   setupTaskRealtimeListener();
      // }, 1000);

      // return () => clearTimeout(timer);
    }
  }, [projectId, user?._id, loadTasks]);

  // Setup real-time task listener (temporarily disabled)
  // const setupTaskRealtimeListener = () => {
  //   try {
  //     console.log('🔍 Setting up Firebase task listener for project:', projectId);

  //     const tasksQuery = query(
  //       collection(db, 'project_tasks'),
  //       where('projectId', '==', projectId),
  //       where('deleted', '!=', true)
  //     );

  //     const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
  //       console.log('🔍 Firebase snapshot received, docs count:', snapshot.size);

  //       // Only update tasks from Firebase if we have data AND current tasks are empty
  //       // This prevents Firebase from overriding API data when API has tasks but Firebase doesn't
  //       if (snapshot.size > 0) {
  //         const updatedTasks = [];
  //         snapshot.forEach((doc) => {
  //           const data = doc.data();
  //           console.log('🔍 Firebase task data:', data);
  //           updatedTasks.push({
  //               _id: data.id,
  //               title: data.title,
  //               description: data.description,
  //               status: data.status,
  //               priority: data.priority,
  //               assignedTo: data.assignedTo,
  //               createdBy: data.createdBy,
  //               createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
  //               dueDate: data.dueDate?.toDate?.() || data.dueDate,
  //               estimatedHours: data.estimatedHours || 0,
  //               actualHours: data.actualHours || 0,
  //               completionNotes: data.completionNotes,
  //               completedAt: data.completedAt?.toDate?.() || data.completedAt,
  //               progress: data.progress || 0
  //             });
  //           });
  //           console.log('🔍 Setting tasks from Firebase:', updatedTasks);
  //           setTasks(updatedTasks);
  //         } else {
  //           console.log('🔍 Firebase returned empty snapshot, keeping API tasks');
  //           // Don't override tasks if Firebase is empty - this prevents API data from being cleared
  //         }
  //       }, (error) => {
  //         console.error('🔍 Firebase task listener error:', error);
  //         // On error, don't override the API tasks
  //       });

  //       return unsubscribe;
  //     } catch (error) {
  //       console.error('🔍 Error setting up task listener:', error);
  //     }
  //   };

  // Handle project completion status changes
  const handleProjectCompletionChange = useCallback((escrowData) => {
    if (escrowData.projectCompletion?.isCompleted && !escrowWallet?.projectCompletion?.isCompleted) {
      notificationService.info(
        "🎯 Project has been completed! Your payment will be released soon."
      );
    }
  }, [escrowWallet]);

  // Real-time escrow updates
  useEffect(() => {
    if (escrowWallet?.id) {
      const escrowRef = doc(db, "escrow_wallets", escrowWallet.id);
      const unsubscribe = onSnapshot(
        escrowRef,
        (doc) => {
          if (doc.exists()) {
            const updatedWallet = { id: doc.id, ...doc.data() };
            const previousWallet = escrowWallet;
            setEscrowWallet(updatedWallet);

            // Handle project completion status changes
            handleProjectCompletionChange(updatedWallet);

            // Update user earnings if user data is available
            if (user?._id) {
              const userFunds = updatedWallet.lockedFunds?.find(
                (fund) => fund.userId === user._id
              );
              const previousUserFunds = previousWallet?.lockedFunds?.find(
                (fund) => fund.userId === user._id
              );

              if (userFunds) {
                const newUserEarnings = {
                  bidAmount: userFunds.bidAmount,
                  bonusAmount: userFunds.bonusAmount,
                  totalAmount: userFunds.totalAmount,
                  status: userFunds.lockStatus,
                  lockedAt: userFunds.lockedAt,
                  releasedAt: userFunds.releasedAt,
                  refundedAt: userFunds.refundedAt,
                  releaseReason: userFunds.releaseReason,
                  releaseNotes: userFunds.releaseNotes,
                };

                setUserEarnings(newUserEarnings);

                // Show notifications for status changes
                if (
                  previousUserFunds &&
                  userFunds.lockStatus !== previousUserFunds.lockStatus
                ) {
                  if (userFunds.lockStatus === "released") {
                    notificationService.success(
                      "🎉 Your funds have been released! You can now withdraw your earnings."
                    );
                  } else if (userFunds.lockStatus === "locked") {
                    notificationService.info(
                      "🔒 Your funds have been locked in escrow. They will be released upon project completion."
                    );
                  } else if (userFunds.lockStatus === "refunded") {
                    notificationService.info(
                      "ℹ️ Your funds have been refunded by the project owner."
                    );
                  } else if (userFunds.lockStatus === "withdrawn") {
                    notificationService.success(
                      "✅ Your withdrawal has been processed successfully!"
                    );
                  }
                }
              }
            }
          }
        },
        (error) => {
          console.error("Firebase escrow listener error:", error);
        }
      );

      return () => unsubscribe();
    }
  }, [escrowWallet?.id, user?._id, handleProjectCompletionChange, escrowWallet]);

  // Add sample resources for testing
  const addSampleResources = async () => {
    try {
      console.log('🔍 Adding sample resources for project:', projectId);
      setResourcesLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/project-tasks/test-add-resources/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sample resources added:', data);
        notificationService.success('Sample resources added successfully!');
        
        // Reload resources to show the new ones
        await loadProjectResources();
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to add sample resources:', errorData);
        notificationService.error('Failed to add sample resources');
      }
    } catch (error) {
      console.error('❌ Error adding sample resources:', error);
      notificationService.error('Error adding sample resources');
    } finally {
      setResourcesLoading(false);
    }
  };

  // Debug function
  const loadDebugInfo = async () => {
    try {
      const data = await projectTaskApi.debugProjectAccess(projectId);
      setDebugInfo(data);
      console.log("🔍 Debug info:", data);
    } catch (error) {
      console.error("❌ Error loading debug info:", error);
    }
  };

  // Create Firebase access manually
  const createFirebaseAccess = async () => {
    try {
      const data = await projectTaskApi.createFirebaseAccess(projectId);
      console.log("✅ Firebase access created:", data);
      notificationService.success("Firebase access created successfully");
      await loadDebugInfo(); // Refresh debug info
    } catch (error) {
      console.error("❌ Error creating Firebase access:", error);
      notificationService.error("Error creating Firebase access");
    }
  };

  // Load bid debug info
  const loadBidDebugInfo = async () => {
    try {
      const data = await projectTaskApi.debugProjectBids(projectId);
      console.log("🔍 Bid debug info:", data);
      setDebugInfo((prev) => ({ ...prev, bidDebug: data }));
    } catch (error) {
      console.error("❌ Error loading bid debug info:", error);
    }
  };

  // Create new task
  const handleCreateTask = async () => {
    try {
      setLoading(true);
      setError(null);

      await projectTaskApi.createTask(projectId, taskForm);
      await loadWorkspace();
      setShowTaskModal(false);
      setTaskForm({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
      });
    } catch (err) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      setUpdatingTaskStatus(true);
      setError(null);

      await projectTaskApi.updateTask(projectId, taskId, { status: newStatus });
      notificationService.success(`Task status updated to ${newStatus}`);

      // Reload tasks to get updated state
      await loadTasks();
      
    } catch (err) {
      setError(err.message || "Failed to update task status");
      notificationService.error(err.message || "Failed to update task status");
    } finally {
      setUpdatingTaskStatus(false);
    }
  };

  // Complete task with notes
  const handleCompleteTask = async (taskId, completionNotes = "") => {
    try {
      console.log('🔍 Starting handleCompleteTask for taskId:', taskId);
      console.log('🔍 ProjectId:', projectId);
      
      setLoading(true);
      setError(null);

      console.log('🔍 Calling projectTaskApi.completeTask...');
      await projectTaskApi.completeTask(projectId, taskId, { completionNotes });
      console.log('✅ Task completed successfully!');
      
      notificationService.success("Task completed successfully!");

      console.log('🔍 Reloading tasks...');
      await loadTasks();
      console.log('✅ Tasks reloaded successfully!');

    } catch (err) {
      console.error('❌ Error in handleCompleteTask:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      if (err.response) {
        console.error('❌ Error response:', err.response.data);
        console.error('❌ Error status:', err.response.status);
      }
      
      setError(err.message || "Failed to complete task");
      notificationService.error(err.message || "Failed to complete task");
    } finally {
      setLoading(false);
    }
  };



  // Handle withdrawal request - Step 1: Move funds to available balance
  const handleWithdrawalRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate that user has released funds
      if (!userEarnings || userEarnings.status !== 'released') {
        throw new Error('No released funds available for withdrawal');
      }

      console.log('🔍 Moving funds to available balance for amount:', userEarnings.totalAmount);
      
      const result = await escrowWalletApi.moveFundsToBalance(projectId);
      
      console.log('🔍 Move to balance result:', result);
      
      notificationService.success(
        result.message || `Successfully moved ₹${userEarnings.totalAmount} to your available balance. You can now withdraw from the Withdrawal page.`
      );

      // Refresh escrow data to get updated status
      await loadEscrowWalletData();
      
    } catch (err) {
      console.error('Move to balance error:', err);
      const errorMessage = err.message || "Failed to move funds to available balance";
      setError(errorMessage);
      notificationService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        icon: Clock,
      },
      in_progress: {
        color: "bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/30",
        icon: Loader2,
      },
      completed: {
        color: "bg-green-500/20 text-green-400 border border-green-500/30",
        icon: CheckCircle,
      },
      reviewed: {
        color: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        icon: CheckCircle,
      },
      cancelled: {
        color: "bg-red-500/20 text-red-400 border border-red-500/30",
        icon: AlertCircle,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: "bg-gray-500/20 text-gray-400 border border-gray-500/30" },
      medium: {
        color: "bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/30",
      },
      high: {
        color: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
      },
      urgent: { color: "bg-red-500/20 text-red-400 border border-red-500/30" },
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading && !workspace) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => setShowDebug(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Debug Access Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug section
  if (showDebug) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Navbar />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Debug Information
              </h2>
              <div className="space-x-2">
                <button
                  onClick={loadDebugInfo}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Refresh Debug Info
                </button>
                <button
                  onClick={createFirebaseAccess}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Firebase Access
                </button>
                <button
                  onClick={loadBidDebugInfo}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Load Bid Debug Info
                </button>
                <button
                  onClick={() => setShowDebug(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close Debug
                </button>
              </div>
            </div>

            {debugInfo && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Project Info</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(debugInfo.project, null, 2)}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">User Access</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(debugInfo.user, null, 2)}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Selection Info</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(debugInfo.selection, null, 2)}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Bids</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(debugInfo.bids, null, 2)}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2">Firebase Access</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(debugInfo.firebase, null, 2)}
                  </pre>
                </div>

                {debugInfo.bidDebug && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-semibold mb-2">Bid Debug Info</h3>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(debugInfo.bidDebug, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">
                  {projectOverview?.project_Title ||
                    workspace?.projectId ||
                    "Project Workspace"}
                </h1>
              </div>
              {userAccess && (
                <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                  {userAccess.isProjectOwner ? "Project Owner" : "Team Member"}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>

              <button className="p-2 text-gray-300 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-64">
            <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/30"
                          : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                  <span className="text-red-300">{error}</span>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Project Overview Card */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">
                      Project Overview
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-medium text-green-400 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#00A8E8]/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#00A8E8]">
                            Project Title
                          </p>
                          <p className="text-lg font-semibold text-white">
                            {projectOverview?.project_Title || "Loading..."}
                          </p>
                        </div>
                        <Target className="w-8 h-8 text-[#00A8E8]" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-400">
                            Tech Stack
                          </p>
                          <p className="text-lg font-semibold text-white">
                            {projectOverview?.Project_tech_stack ||
                              "Loading..."}
                          </p>
                        </div>
                        <Zap className="w-8 h-8 text-purple-400" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-400">
                            Contributors
                          </p>
                          <p className="text-lg font-semibold text-white">
                            {projectOverview?.Project_Contributor || 0} Required
                          </p>
                        </div>
                        <Users2 className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">
                      Project Description
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {projectOverview?.Project_Description ||
                        "Loading project description..."}
                    </p>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Escrow Wallet Status */}
                  <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">
                        Escrow Wallet
                      </h3>
                      <Wallet className="w-6 h-6 text-[#00A8E8]" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">
                          Total Locked Amount:
                        </span>
                        <span className="font-semibold text-white">
                          ₹{escrowWallet?.totalEscrowAmount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">
                          Your Locked Amount:
                        </span>
                        <span className="font-semibold text-green-400">
                          ₹{userEarnings?.totalAmount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            escrowWallet?.status === "locked"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          }`}
                        >
                          {escrowWallet?.status || "Active"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bonus Pool */}
                  <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-yellow-500/20 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">
                        Bonus Pool
                      </h3>
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Pool:</span>
                        <span className="font-semibold text-white">
                          ₹{bonusPool?.totalAmount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Your Share:</span>
                        <span className="font-semibold text-yellow-400">
                          ₹{userEarnings?.bonusAmount || 0}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Remaining:</span>
                        <span className="font-semibold text-[#00A8E8]">
                          ₹{bonusPool?.remainingAmount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab("repository")}
                      className="flex flex-col items-center p-4 bg-[#1A1A1A] border border-indigo-500/20 rounded-lg hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-colors"
                    >
                      <GitBranch className="w-6 h-6 text-indigo-400 mb-2" />
                      <span className="text-sm font-medium text-indigo-400">
                        Repository
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab("tasks")}
                      className="flex flex-col items-center p-4 bg-[#1A1A1A] border border-[#00A8E8]/20 rounded-lg hover:bg-[#00A8E8]/10 hover:border-[#00A8E8]/40 transition-colors"
                    >
                      <CheckSquare className="w-6 h-6 text-[#00A8E8] mb-2" />
                      <span className="text-sm font-medium text-[#00A8E8]">
                        View Tasks
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab("chat")}
                      className="flex flex-col items-center p-4 bg-[#1A1A1A] border border-green-500/20 rounded-lg hover:bg-green-500/10 hover:border-green-500/40 transition-colors"
                    >
                      <MessageCircle className="w-6 h-6 text-green-400 mb-2" />
                      <span className="text-sm font-medium text-green-400">
                        Team Chat
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab("earnings")}
                      className="flex flex-col items-center p-4 bg-[#1A1A1A] border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-colors"
                    >
                      <DollarSign className="w-6 h-6 text-yellow-400 mb-2" />
                      <span className="text-sm font-medium text-yellow-400">
                        Earnings
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Repository Setup Tab */}
            {activeTab === "repository" && (
              <div className="space-y-6">
                {/* Main Repository Link */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">
                      Repository Setup
                    </h2>
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-6 h-6 text-indigo-400" />
                      <span className="text-sm text-gray-400">Get Started</span>
                    </div>
                  </div>

                  {/* Main Project Repository */}
                  <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">
                        Main Project Repository
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-green-400">Active</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-300">
                            Repository URL:
                          </span>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                projectOverview?.Project_gitHub_link ||
                                  "https://github.com/project-repo"
                              )
                            }
                            className="text-[#00A8E8] hover:text-[#0062E6] text-sm transition-colors flex items-center space-x-1"
                          >
                            <span>Copy URL</span>
                          </button>
                        </div>
                        <div className="flex items-center space-x-3">
                          <GitBranch className="w-4 h-4 text-green-400" />
                          <code className="text-sm text-green-400 font-mono break-all">
                            {projectOverview?.Project_gitHub_link ||
                              "https://github.com/project-repo"}
                          </code>
                        </div>
                      </div>

                      <div className="bg-gray-900 border border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-300">
                            Git Clone Command:
                          </span>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `git clone ${
                                  projectOverview?.Project_gitHub_link ||
                                  "https://github.com/project-repo"
                                }`
                              )
                            }
                            className="text-[#00A8E8] hover:text-[#0062E6] text-sm transition-colors flex items-center space-x-1"
                          >
                            <span>Copy Command</span>
                          </button>
                        </div>
                        <code className="text-sm text-green-400 font-mono break-all">
                          git clone{" "}
                          {projectOverview?.Project_gitHub_link ||
                            "https://github.com/project-repo"}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Setup Instructions */}
                  <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6 mb-6">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Setup Instructions
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                          1
                        </div>
                        <div>
                          <h4 className="text-gray-300 font-medium mb-2">
                            Clone the Repository
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Open your terminal and run the git clone command
                            above to download the project to your local machine.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                          2
                        </div>
                        <div>
                          <h4 className="text-gray-300 font-medium mb-2">
                            Install Dependencies
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Navigate to the project directory and run{" "}
                            <code className="bg-gray-800 px-2 py-1 rounded text-green-400">
                              npm install
                            </code>{" "}
                            or{" "}
                            <code className="bg-gray-800 px-2 py-1 rounded text-green-400">
                              yarn install
                            </code>{" "}
                            to install project dependencies.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                          3
                        </div>
                        <div>
                          <h4 className="text-gray-300 font-medium mb-2">
                            Setup Environment
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Configure environment variables, database
                            connections, and any required API keys as specified
                            in the project documentation.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                          4
                        </div>
                        <div>
                          <h4 className="text-gray-300 font-medium mb-2">
                            Start Development
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Run the development server with{" "}
                            <code className="bg-gray-800 px-2 py-1 rounded text-green-400">
                              npm run dev
                            </code>{" "}
                            or{" "}
                            <code className="bg-gray-800 px-2 py-1 rounded text-green-400">
                              yarn dev
                            </code>{" "}
                            to ensure everything works correctly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        window.open(
                          projectOverview?.Project_gitHub_link ||
                            "https://github.com/project-repo",
                          "_blank"
                        )
                      }
                      className="flex items-center justify-center p-4 bg-[#1A1A1A] border border-[#00A8E8]/20 rounded-lg hover:bg-[#00A8E8]/10 hover:border-[#00A8E8]/40 transition-colors"
                    >
                      <GitBranch className="w-5 h-5 text-[#00A8E8] mr-2" />
                      <span className="text-[#00A8E8] font-medium">
                        Open Repository
                      </span>
                    </button>

                    <button
                      onClick={() => setActiveTab("how-to-work")}
                      className="flex items-center justify-center p-4 bg-[#1A1A1A] border border-green-500/20 rounded-lg hover:bg-green-500/10 hover:border-green-500/40 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-green-400 font-medium">
                        View Work Guide
                      </span>
                    </button>
                  </div>
                </div>

                {/* Important Notes */}
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-300 text-lg mb-3">
                        Important Development Guidelines
                      </h4>
                      <ul className="text-sm text-yellow-200 space-y-2">
                        <li>
                          • <strong>Always create a new branch</strong> for your
                          work:{" "}
                          <code className="bg-gray-800 px-2 py-1 rounded text-green-400">
                            git checkout -b feature/your-feature-name
                          </code>
                        </li>
                        <li>
                          •{" "}
                          <strong>Follow the project's coding standards</strong>{" "}
                          and conventions as specified in the codebase
                        </li>
                        <li>
                          • <strong>Test your changes thoroughly</strong> before
                          committing and pushing
                        </li>
                        <li>
                          • <strong>Write descriptive commit messages</strong>{" "}
                          that explain what you've changed
                        </li>
                        <li>
                          • <strong>Communicate with team members</strong>{" "}
                          through the chat when working on shared components
                        </li>
                        <li>
                          • <strong>Update task status</strong> in the Tasks tab
                          as you progress
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Project Structure Info */}
                <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Project Structure
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-[#00A8E8] font-medium mb-2">
                        Tech Stack
                      </h4>
                      <p className="text-gray-400">
                        {projectOverview?.Project_tech_stack || "Loading..."}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-[#00A8E8] font-medium mb-2">
                        Project Type
                      </h4>
                      <p className="text-gray-400">
                        {projectOverview?.project_Title
                          ? "Full-stack Application"
                          : "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="space-y-6">
                {/* Task Management Header */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">
                        Project Tasks
                      </h2>
                      <p className="text-gray-400 mt-1">
                        Manage and track project tasks with real-time updates
                      </p>
                    </div>
                    {(userAccess?.isProjectOwner ||
                      userAccess?.userRole === "admin") && (
                      <button
                        onClick={() => setShowTaskModal(true)}
                        className="px-4 py-2 bg-[#00A8E8] text-white rounded-md hover:bg-[#0062E6] flex items-center transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                      </button>
                    )}
                  </div>

                  {/* Task Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckSquare className="w-6 h-6 text-[#00A8E8] mr-3" />
                        <div>
                          <p className="text-sm font-medium text-[#00A8E8]">
                            Total Tasks
                          </p>
                          <p className="text-xl font-bold text-white">
                            {tasks.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-400">
                            Completed
                          </p>
                          <p className="text-xl font-bold text-white">
                            {
                              tasks.filter((t) => t.status === "completed")
                                .length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Eye className="w-6 h-6 text-purple-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-purple-400">
                            Review
                          </p>
                          <p className="text-xl font-bold text-white">
                            {
                              tasks.filter((t) => t.status === "review")
                                .length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <Loader2 className="w-6 h-6 text-yellow-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-yellow-400">
                            In Progress
                          </p>
                          <p className="text-xl font-bold text-white">
                            {
                              tasks.filter((t) => t.status === "in_progress")
                                .length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#1A1A1A] border border-purple-500/20 rounded-lg p-4">
                      <div className="flex items-center">
                        <User className="w-6 h-6 text-purple-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-purple-400">
                            My Tasks
                          </p>
                          <p className="text-xl font-bold text-white">
                            {myTasks.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Filters */}
                  <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={taskFilters.status}
                          onChange={(e) =>
                            setTaskFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Priority
                        </label>
                        <select
                          value={taskFilters.priority}
                          onChange={(e) =>
                            setTaskFilters((prev) => ({
                              ...prev,
                              priority: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
                        >
                          <option value="all">All Priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Assigned To
                        </label>
                        <select
                          value={taskFilters.assignedTo}
                          onChange={(e) =>
                            setTaskFilters((prev) => ({
                              ...prev,
                              assignedTo: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
                        >
                          <option value="all">All Users</option>
                          <option value={user?._id}>My Tasks</option>
                          <option value="">Unassigned</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Search
                        </label>
                        <input
                          type="text"
                          placeholder="Search tasks..."
                          value={taskFilters.search}
                          onChange={(e) =>
                            setTaskFilters((prev) => ({
                              ...prev,
                              search: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00A8E8]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] border border-gray-700 rounded-lg p-6 hover:shadow-lg hover:border-[#00A8E8]/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-white">
                              {task.title}
                            </h3>
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                            {(typeof task.assignedTo === "object"
                              ? task.assignedTo._id
                              : task.assignedTo) === user?._id && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                                ASSIGNED TO ME
                              </span>
                            )}
                          </div>

                          <p className="text-gray-400 mb-4 leading-relaxed">
                            {task.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-4">
                            {task.assignedTo && (
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                <span>
                                  Assigned to:{" "}
                                  {(typeof task.assignedTo === "object"
                                    ? task.assignedTo._id
                                    : task.assignedTo) === user?._id
                                    ? "You"
                                    : typeof task.assignedTo === "object"
                                    ? task.assignedTo.username
                                    : "Team Member"}
                                </span>
                              </div>
                            )}

                            {task.dueDate && (
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>
                                  Due:{" "}
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}

                            {task.estimatedHours > 0 && (
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                <span>Est: {task.estimatedHours}h</span>
                              </div>
                            )}

                            {task.actualHours > 0 && (
                              <div className="flex items-center">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                <span>Actual: {task.actualHours}h</span>
                              </div>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {task.progress > 0 && (
                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>{task.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-[#00A8E8] to-[#0062E6] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Completion Notes */}
                          {task.completionNotes && (
                            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
                              <p className="text-sm text-green-300">
                                <strong>Completion Notes:</strong>{" "}
                                {task.completionNotes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowTaskDetailModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Status Update Buttons */}
                          <div className="flex items-center space-x-2">
                            {/* User can start pending tasks */}
                            {task.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateTaskStatus(
                                      task._id,
                                      "in_progress"
                                    )
                                  }
                                  disabled={updatingTaskStatus}
                                  className="flex items-center px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-500/30 disabled:opacity-50 transition-colors text-sm"
                                  title="Start Task"
                                >
                                  <Loader2 className="w-3 h-3 mr-1" />
                                  Start
                                </button>
                                <button
                                  onClick={() => handleCompleteTask(task._id)}
                                  disabled={updatingTaskStatus}
                                  className="flex items-center px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/30 disabled:opacity-50 transition-colors text-sm"
                                  title="Complete Task"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Complete
                                </button>
                              </>
                            )}

                            {/* User can complete in-progress tasks */}
                            {task.status === "in_progress" && (
                              <button
                                onClick={() => handleCompleteTask(task._id)}
                                disabled={updatingTaskStatus}
                                className="flex items-center px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/30 disabled:opacity-50 transition-colors text-sm"
                                title="Complete Task"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Complete
                              </button>
                            )}

                            {/* Show status info for review/completed tasks */}
                            {(task.status === "review" || task.status === "completed") && (
                              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-500/20 border border-gray-500/30 rounded-md">
                                {task.status === "review" ? "Waiting for review" : "Task completed"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-12">
                      <CheckSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg mb-2">
                        No tasks found
                      </p>
                      <p className="text-gray-500 mb-4">
                        Try adjusting your filters or create a new task
                      </p>

                      {tasks.length === 0 && (
                        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                          <p className="text-red-300 text-sm">
                            <strong>No tasks found in database.</strong>
                            <br />
                            This could mean:
                          </p>
                          <ul className="text-red-300 text-sm mt-2 list-disc list-inside">
                            <li>No tasks have been created for this project</li>
                            <li>API connection issues</li>
                            <li>Firebase connection issues</li>
                            <li>Project ID mismatch</li>
                            <li>User access issues</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* Team Tab */}
            {activeTab === "team" && !isFreeProject && (
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Team Members
                  </h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={loadTeamMembers}
                      disabled={teamMembersLoading}
                      className="px-3 py-1 bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/30 rounded-md hover:bg-[#00A8E8]/30 disabled:opacity-50 transition-colors text-sm flex items-center"
                    >
                      <Loader2 className={`w-3 h-3 mr-1 ${teamMembersLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <div className="flex items-center space-x-2">
                      <Users2 className="w-5 h-5 text-indigo-400" />
                      <span className="text-sm text-gray-400">
                        {teamMembers.length} Contributors
                      </span>
                    </div>
                  </div>
                </div>

                {teamMembersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00A8E8] mr-3" />
                    <span className="text-gray-400">Loading team members...</span>
                  </div>
                ) : teamMembersError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 mb-2">Failed to load team members</p>
                    <p className="text-sm text-gray-500">{teamMembersError}</p>
                    <button
                      onClick={loadTeamMembers}
                      className="mt-4 px-4 py-2 bg-[#00A8E8] text-white rounded-md hover:bg-[#0062E6] transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : teamMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-[#00A8E8]/30 transition-all"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            member.role === 'owner' 
                              ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                              : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                          }`}>
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">
                              {member.username || member.userId}
                            </h3>
                            <p className={`text-sm ${
                              member.role === 'owner' 
                                ? 'text-yellow-400' 
                                : 'text-gray-400'
                            }`}>
                              {member.role === 'owner' ? 'Project Owner' : 'Contributor'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          {member.email && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Email:</span>
                              <span className="text-white truncate ml-2">
                                {member.email}
                              </span>
                            </div>
                          )}

                          {member.joinedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Joined:</span>
                              <span className="text-white">
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          {member.selectionReason && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Role:</span>
                              <span className="text-white">
                                {member.selectionReason}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No team members found.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Team members will appear here once selected for the project.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === "earnings" && !isFreeProject && (
              <div className="space-y-6">
                {/* Project & Escrow Overview */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">
                      Project Earnings Dashboard
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={loadEscrowWalletData}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-700 text-white px-3 py-1 rounded-lg transition flex items-center gap-2 text-sm"
                      >
                        <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                      <DollarSign className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>

                  {/* Project Information */}
                  {escrowWallet && (
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        Project Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Project Status:</span>
                          <span className="ml-2 text-white font-medium">
                            {escrowWallet.projectCompletion?.isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Escrow Status:</span>
                          <span className={`ml-2 font-medium ${
                            escrowWallet.status === 'active' ? 'text-green-400' : 
                            escrowWallet.status === 'locked' ? 'text-yellow-400' : 
                            escrowWallet.status === 'released' ? 'text-blue-400' : 'text-gray-400'
                          }`}>
                            {escrowWallet.status?.toUpperCase()}
                          </span>
                        </div>
                        {escrowWallet.projectCompletion?.completedAt && (
                          <div>
                            <span className="text-gray-400">Completed:</span>
                            <span className="ml-2 text-white">
                              {new Date(escrowWallet.projectCompletion.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {escrowWallet.projectCompletion?.qualityScore && (
                          <div>
                            <span className="text-gray-400">Quality Score:</span>
                            <span className="ml-2 text-white flex items-center">
                              {escrowWallet.projectCompletion.qualityScore}/10
                              <Star className="w-4 h-4 text-yellow-500 ml-1" />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Earnings Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-emerald-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-400">
                            Bid Amount
                          </p>
                          <p className="text-2xl font-bold text-white">
                            ₹{userEarnings?.bidAmount || 0}
                          </p>
                        </div>
                        <Wallet className="w-8 h-8 text-emerald-400" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-400">
                            Bonus Pool Share
                          </p>
                          <p className="text-2xl font-bold text-white">
                            ₹{userEarnings?.bonusAmount || 0}
                          </p>
                        </div>
                        <Trophy className="w-8 h-8 text-yellow-400" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#00A8E8]/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#00A8E8]">
                            Total Earnings
                          </p>
                          <p className="text-2xl font-bold text-white">
                            ₹{userEarnings?.totalAmount || 0}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-[#00A8E8]" />
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      Payment Status
                    </h3>
                    <div className="flex items-center space-x-3 mb-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          userEarnings?.status === "released"
                            ? "bg-green-400"
                            : userEarnings?.status === "locked"
                            ? "bg-yellow-400"
                            : userEarnings?.status === "refunded"
                            ? "bg-red-400"
                            : "bg-gray-500"
                        }`}
                      ></div>
                      <span className="text-gray-300 font-medium">
                        {userEarnings?.status === "released"
                          ? "Payment Released - Available for Withdrawal"
                          : userEarnings?.status === "locked"
                          ? "Payment Locked - Will be released upon project completion"
                          : userEarnings?.status === "refunded"
                          ? "Payment Refunded"
                          : "Payment Pending"}
                      </span>
                    </div>
                    
                    {/* Additional Status Details */}
                    {userEarnings?.lockedAt && (
                      <div className="text-sm text-gray-400">
                        <span>Locked: {new Date(userEarnings.lockedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {userEarnings?.releasedAt && (
                      <div className="text-sm text-gray-400">
                        <span>Released: {new Date(userEarnings.releasedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {userEarnings?.releaseReason && (
                      <div className="text-sm text-gray-400">
                        <span>Reason: {userEarnings.releaseReason.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Withdrawal Section */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    Withdraw Earnings
                  </h3>
                  
                  {userEarnings?.status === "released" ? (
                    <div className="space-y-4">
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-300">
                              Payment Ready for Withdrawal
                            </h4>
                            <p className="text-sm text-green-200 mt-1">
                              Your earnings have been released and are ready to be moved to your available balance.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleWithdrawalRequest}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing Withdrawal...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4" />
                            Move ₹{userEarnings?.totalAmount || 0} to Available Balance
                          </>
                        )}
                      </button>
                    </div>
                  ) : userEarnings?.status === "locked" ? (
                    <div className="space-y-4">
                      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-300">
                              Payment Currently Locked
                            </h4>
                            <p className="text-sm text-yellow-200 mt-1">
                              Your earnings will be automatically released once the project is completed and approved by the project owner.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Project Completion Status</h4>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            escrowWallet?.projectCompletion?.isCompleted ? 'bg-green-400' : 'bg-yellow-400'
                          }`}></div>
                          <span className="text-sm text-gray-400">
                            {escrowWallet?.projectCompletion?.isCompleted 
                              ? 'Project completed - waiting for owner approval' 
                              : 'Project in progress'}
                          </span>
                        </div>
                      </div>

                      <button
                        disabled={true}
                        className="w-full px-4 py-3 bg-gray-600 text-gray-300 rounded-lg cursor-not-allowed"
                      >
                        Payment Locked - Complete Project First
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-900/20 border border-gray-500/30 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-300">
                              No Payment Available
                            </h4>
                            <p className="text-sm text-gray-200 mt-1">
                              No escrow funds have been allocated for your account in this project.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        disabled={true}
                        className="w-full px-4 py-3 bg-gray-600 text-gray-300 rounded-lg cursor-not-allowed"
                      >
                        No Payment Available
                      </button>
                    </div>
                  )}
                </div>

                {/* Transaction History */}
                {userEarnings && (
                  <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Transaction History
                    </h3>
                    
                    <div className="space-y-3">
                      {userEarnings.lockedAt && (
                        <div className="flex items-center justify-between bg-[#1A1A1A] border border-gray-700 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                              <Lock className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Funds Locked</p>
                              <p className="text-xs text-gray-400">
                                {new Date(userEarnings.lockedAt).toLocaleDateString()} at {new Date(userEarnings.lockedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">₹{userEarnings.totalAmount}</p>
                            <p className="text-xs text-gray-400">Total Amount</p>
                          </div>
                        </div>
                      )}

                      {userEarnings.releasedAt && (
                        <div className="flex items-center justify-between bg-[#1A1A1A] border border-gray-700 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                              <Unlock className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Funds Released</p>
                              <p className="text-xs text-gray-400">
                                {new Date(userEarnings.releasedAt).toLocaleDateString()} at {new Date(userEarnings.releasedAt).toLocaleTimeString()}
                              </p>
                              {userEarnings.releaseReason && (
                                <p className="text-xs text-gray-400">Reason: {userEarnings.releaseReason.replace('_', ' ')}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">₹{userEarnings.totalAmount}</p>
                            <p className="text-xs text-gray-400">Released Amount</p>
                          </div>
                        </div>
                      )}

                      {userEarnings.refundedAt && (
                        <div className="flex items-center justify-between bg-[#1A1A1A] border border-gray-700 rounded-lg p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-center">
                              <RefreshCw className="w-4 h-4 text-red-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Funds Refunded</p>
                              <p className="text-xs text-gray-400">
                                {new Date(userEarnings.refundedAt).toLocaleDateString()} at {new Date(userEarnings.refundedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-white">₹{userEarnings.totalAmount}</p>
                            <p className="text-xs text-gray-400">Refunded Amount</p>
                          </div>
                        </div>
                      )}

                      {!userEarnings.lockedAt && !userEarnings.releasedAt && !userEarnings.refundedAt && (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                          <p className="text-gray-400">No transaction history available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Debug Information (only show in development) */}
                {import.meta.env.DEV && (
                  <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-yellow-500/20 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-yellow-400" />
                      Debug Information (Development Only)
                    </h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-3">
                        <h4 className="font-medium text-gray-300 mb-2">Project & User Info</h4>
                        <div className="space-y-1 text-gray-400">
                          <div>Project ID: {projectId}</div>
                          <div>User ID: {user?._id}</div>
                          <div>Auth Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</div>
                        </div>
                      </div>
                      
                      <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-3">
                        <h4 className="font-medium text-gray-300 mb-2">Escrow Wallet Status</h4>
                        <div className="space-y-1 text-gray-400">
                          <div>Escrow Wallet: {escrowWallet ? 'Found' : 'Not Found'}</div>
                          <div>User Earnings: {userEarnings ? 'Found' : 'Not Found'}</div>
                          <div>Loading: {loading ? 'Yes' : 'No'}</div>
                          <div>Error: {error || 'None'}</div>
                        </div>
                      </div>
                      
                      <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-3">
                        <h4 className="font-medium text-gray-300 mb-2">API Endpoints</h4>
                        <div className="space-y-1 text-gray-400">
                          <div>User Escrow: {import.meta.env.VITE_API_URL}/api/escrow/user/{projectId}</div>
                          <div>User Status: {import.meta.env.VITE_API_URL}/api/escrow/user/{projectId}/status</div>
                        </div>
                      </div>

                      <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-3">
                        <h4 className="font-medium text-gray-300 mb-2">Actions</h4>
                        <button
                          onClick={loadEscrowWalletData}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                          {loading ? 'Loading...' : 'Refresh Escrow Data'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === "resources" && !isFreeProject && (
              <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Project Resources
                  </h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={loadProjectResources}
                      disabled={resourcesLoading}
                      className="px-3 py-1 bg-[#00A8E8]/20 text-[#00A8E8] border border-[#00A8E8]/30 rounded-md hover:bg-[#00A8E8]/30 disabled:opacity-50 transition-colors text-sm flex items-center"
                    >
                      <Loader2 className={`w-3 h-3 mr-1 ${resourcesLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                    <button 
                      onClick={addSampleResources}
                      disabled={resourcesLoading}
                      className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500/30 disabled:opacity-50 transition-colors text-sm flex items-center"
                    >
                      Add Sample Resources
                    </button>
                    <button className="px-4 py-2 bg-[#00A8E8] text-white rounded-md hover:bg-[#0062E6] flex items-center transition-colors">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </button>
                  </div>
                </div>

                {resourcesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00A8E8] mr-3" />
                    <span className="text-gray-400">Loading resources...</span>
                  </div>
                ) : resourcesError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 mb-2">{resourcesError}</p>
                    <p className="text-sm text-gray-500">{resourcesError}</p>
                    <button
                      onClick={loadProjectResources}
                      className="mt-4 px-4 py-2 bg-[#00A8E8] text-white rounded-md hover:bg-[#0062E6] transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : resources && resources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource) => (
                      <div
                        key={resource.id || resource._id}
                        className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-[#00A8E8]/30 transition-all"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-white">
                              {resource.name || resource.title}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {resource.type || 'File'}
                            </p>
                          </div>
                        </div>

                        {resource.description && (
                          <p className="text-sm text-gray-400 mb-3">
                            {resource.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {resource.url && (
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                                title="Download/View"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>

                          <span className="text-xs text-gray-500">
                            {resource.uploadedAt ? new Date(resource.uploadedAt).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No resources uploaded yet.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Project resources will appear here once uploaded by the admin.
                    </p>
                  </div>
                )}
              </div>
            )}



            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="h-96">
                <ProjectChat
                  projectId={projectId}
                  projectTitle={projectOverview?.title || "Project Chat"}
                  onClose={() => setActiveTab("overview")}
                />
              </div>
            )}

            {/* How to Work Tab */}
            {activeTab === "how-to-work" && (
              <div className="space-y-6">
                {/* Complete Process Guide */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00A8E8] to-[#0062E6]">
                      How to Work on This Project
                    </h2>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-6 h-6 text-cyan-400" />
                      <span className="text-sm text-gray-400">
                        Complete Guide
                      </span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Step 1: Repository Setup */}
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white font-bold">
                          1
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                          Repository Setup
                        </h3>
                      </div>
                      <div className="space-y-3 text-gray-300">
                        <p>
                          • Clone the project repository using the git command
                          from the Overview tab
                        </p>
                        <p>
                          • Install project dependencies with{" "}
                          <code className="bg-gray-800 px-2 py-1 rounded text-green-400">
                            npm install
                          </code>
                        </p>
                        <p>
                          • Set up environment variables and database
                          connections
                        </p>
                        <p>
                          • Run the development server to ensure everything
                          works
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Understanding Project Structure */}
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white font-bold">
                          2
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                          Understanding Project Structure
                        </h3>
                      </div>
                      <div className="space-y-3 text-gray-300">
                        <p>
                          • Review the{" "}
                          <strong className="text-white">Tasks</strong>{" "}
                          tab to understand different development sections
                        </p>
                        <p>
                          • Check the{" "}
                          <strong className="text-white">Tasks</strong> tab to
                          see your assigned work
                        </p>
                        <p>
                          • Familiarize yourself with the tech stack and project
                          requirements
                        </p>
                        <p>• Review existing codebase and documentation</p>
                      </div>
                    </div>

                    {/* Step 3: Development Workflow */}
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white font-bold">
                          3
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                          Development Workflow
                        </h3>
                      </div>
                      <div className="space-y-3 text-gray-300">
                        <p>
                          • Create a new branch for each task:{" "}
                          <code className="bg-gray-800 px-2 py-1 rounded text-green-400">
                            git checkout -b feature/task-name
                          </code>
                        </p>
                        <p>
                          • Work on your assigned tasks following the project's
                          coding standards
                        </p>
                        <p>• Test your changes thoroughly before committing</p>
                        <p>
                          • Commit your work with descriptive commit messages
                        </p>
                        <p>• Push your branch and create a pull request</p>
                      </div>
                    </div>

                    {/* Step 4: Communication & Collaboration */}
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white font-bold">
                          4
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                          Communication & Collaboration
                        </h3>
                      </div>
                      <div className="space-y-3 text-gray-300">
                        <p>
                          • Use the{" "}
                          <strong className="text-white">Team Chat</strong> to
                          communicate with other contributors
                        </p>
                        <p>
                          • Update task status in the{" "}
                          <strong className="text-white">Tasks</strong> tab
                        </p>
                        <p>• Report progress and ask questions when needed</p>
                        <p>
                          • Coordinate with team members on shared components
                        </p>
                      </div>
                    </div>

                    {/* Step 5: Quality Assurance */}
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white font-bold">
                          5
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                          Quality Assurance
                        </h3>
                      </div>
                      <div className="space-y-3 text-gray-300">
                        <p>• Write unit tests for your code</p>
                        <p>
                          • Ensure your code follows the project's style
                          guidelines
                        </p>
                        <p>
                          • Test your changes across different browsers/devices
                        </p>
                        <p>• Document any new features or changes</p>
                      </div>
                    </div>

                    {/* Step 6: Completion & Payment */}
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-[#00A8E8] rounded-full flex items-center justify-center text-white font-bold">
                          6
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                          Completion & Payment
                        </h3>
                      </div>
                      <div className="space-y-3 text-gray-300">
                        <p>
                          • Mark your tasks as completed in the{" "}
                          <strong className="text-white">Tasks</strong> tab
                        </p>
                        <p>• Ensure all code reviews are approved</p>
                        <p>
                          • Wait for project owner approval and final testing
                        </p>
                        <p>
                          • Once project is completed, your earnings will be
                          automatically released
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings Process */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    How You Earn Money
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-[#00A8E8] mb-3">
                        Bid Amount
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Your original bid amount (₹
                        {userEarnings?.bidAmount || 0}) is locked in escrow when
                        you're selected for the project. This amount is
                        guaranteed upon successful completion.
                      </p>
                    </div>
                    <div className="bg-[#1A1A1A] border border-gray-700 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-yellow-400 mb-3">
                        Bonus Pool
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Equal share of the bonus pool (₹
                        {userEarnings?.bonusAmount || 0}) is distributed among
                        all contributors upon project completion.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-300">
                          Payment Process
                        </h4>
                        <p className="text-green-200 text-sm mt-1">
                          Your total earnings (₹{userEarnings?.totalAmount || 0}
                          ) will be automatically released to your wallet once
                          the project is completed and approved by the project
                          owner. You can then withdraw these funds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best Practices */}
                <div className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-lg shadow-lg border border-[#00A8E8]/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Best Practices
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-[#00A8E8] mb-3">
                        Code Quality
                      </h4>
                      <ul className="text-gray-300 text-sm space-y-2">
                        <li>• Write clean, readable, and maintainable code</li>
                        <li>• Follow the project's coding conventions</li>
                        <li>• Add proper comments and documentation</li>
                        <li>• Write comprehensive tests</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-[#00A8E8] mb-3">
                        Communication
                      </h4>
                      <ul className="text-gray-300 text-sm space-y-2">
                        <li>• Keep the team updated on your progress</li>
                        <li>• Ask questions when you're unsure</li>
                        <li>• Report issues or blockers immediately</li>
                        <li>• Be responsive to feedback and reviews</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Task
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) =>
                    setTaskForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateTask}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Create Task"
                )}
              </button>
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskDetailModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Task Details</h3>
              <button
                onClick={() => setShowTaskDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Task Header */}
              <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <h4 className="text-lg font-semibold text-white">
                    {selectedTask.title}
                  </h4>
                  {getStatusBadge(selectedTask.status)}
                  {getPriorityBadge(selectedTask.priority)}
                </div>
                <p className="text-gray-400">{selectedTask.description}</p>
              </div>

              {/* Task Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">
                    Task Information
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-white">{selectedTask.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Priority:</span>
                      <span className="text-white">
                        {selectedTask.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">
                        {new Date(selectedTask.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedTask.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Due Date:</span>
                        <span className="text-white">
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#2A2A2A] border border-gray-700 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">
                    Time Tracking
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Hours:</span>
                      <span className="text-white">
                        {selectedTask.estimatedHours || 0}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Actual Hours:</span>
                      <span className="text-white">
                        {selectedTask.actualHours || 0}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Progress:</span>
                      <span className="text-white">
                        {selectedTask.progress || 0}%
                      </span>
                    </div>
                    {selectedTask.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Completed:</span>
                        <span className="text-white">
                          {new Date(
                            selectedTask.completedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Completion Notes */}
              {selectedTask.completionNotes && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-green-300 mb-2">
                    Completion Notes
                  </h5>
                  <p className="text-green-200">
                    {selectedTask.completionNotes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
                {selectedTask.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        handleUpdateTaskStatus(selectedTask._id, "in_progress");
                        setShowTaskDetailModal(false);
                      }}
                      disabled={updatingTaskStatus}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Start Task
                    </button>
                    <button
                      onClick={() => {
                        handleCompleteTask(selectedTask._id);
                        setShowTaskDetailModal(false);
                      }}
                      disabled={updatingTaskStatus}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Complete Task
                    </button>
                  </>
                )}
              
                {selectedTask.status === "in_progress" && (
                  <button
                    onClick={() => {
                      handleCompleteTask(selectedTask._id);
                      setShowTaskDetailModal(false);
                    }}
                    disabled={updatingTaskStatus}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Complete Task
                  </button>
                )}

                {(selectedTask.status === "review" || selectedTask.status === "completed") && (
                  <span className="text-sm text-gray-400 px-3 py-2 bg-gray-500/20 border border-gray-500/30 rounded-md">
                    {selectedTask.status === "review" ? "Waiting for admin review" : "Task has been completed"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributionPage;
