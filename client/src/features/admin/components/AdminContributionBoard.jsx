/* eslint-disable no-unused-vars */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  Component,
} from "react";
import {
  FaCheck,
  FaEdit,
  FaRegStickyNote,
  FaPaperPlane,
  FaComments,
  FaBars,
  FaUser,
  FaTrash,
  FaPlus,
  FaPen,
  FaFolderOpen,
  FaChevronDown,
  FaRobot,
  FaUsers,
  FaChartBar,
  FaCalendar,
  FaClock,
  FaExclamationTriangle,
  FaEye,
  FaUpload,
  FaDownload,
  FaFileAlt,
  FaLink,
  FaStar,
  FaTrophy,
  FaCog,
  FaShieldAlt,
  FaBell,
  FaSync,
  FaPlay,
  FaPause,
  FaStop,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaHistory,
  FaUndo,
} from "react-icons/fa";
import axios from "axios";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@shared/config/firebase";
import { useAuth } from "@app/providers/AuthProvider";
import { useChat } from "@features/chat/context/ChatContext";
import { projectTaskApi } from "@features/tasks/services/projectTaskApi";
import { notificationService } from "@shared/services/notificationService";
import { projectSelectionApi } from "@features/project-selection/services/projectSelectionApi";
import ProjectChat from "@features/chat/components/ProjectChat";
const Socket_URl =
  import.meta.env.VITE_SOCKET_SERVER || `${import.meta.env.VITE_API_URL}`;

// Error Boundary Component to catch initialization errors
class AdminContributionBoardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error("AdminContributionBoard Error:", error, errorInfo);

    // Check if this is the 'Me' initialization error or temporal dead zone error
    if (
      (error.message && error.message.includes("Cannot access") && error.message.includes("before initialization")) ||
      (error.message && error.message.includes("temporal dead zone")) ||
      (error.message && error.message.includes("Me"))
    ) {
      console.error(
        "Detected temporal dead zone error - likely minified variable issue or auth initialization problem"
      );
      // Add additional logging for debugging
      console.error("Error stack:", error.stack);
      console.error("Component stack:", errorInfo.componentStack);
      
      // Try to recover by reloading the page after a delay
      setTimeout(() => {
        console.log("Attempting to recover from temporal dead zone error...");
        window.location.reload();
      }, 2000);
    }

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <div className="text-red-400 text-lg mb-3">Component Error</div>
              <p className="text-gray-300 mb-4">
                An error occurred while loading the Project Management
                component. This is likely due to an initialization issue.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                >
                  <FaSync className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={() =>
                    this.setState({
                      hasError: false,
                      error: null,
                      errorInfo: null,
                    })
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                >
                  Try Again
                </button>
              </div>
              {this.state.error && (
                <details className="mt-4 text-xs text-gray-400">
                  <summary className="cursor-pointer">Error Details</summary>
                  <pre className="mt-2 p-2 bg-black/20 rounded text-red-300 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminContributionBoard = ({
  tasks: initialTasks = [],
  team = [],
  notes: initialNotes = "",
  onTaskStatusChange,
  onNotesChange,
  onTaskAdd,
  onTaskEdit,
  onTaskDelete,
}) => {
  // Initialize auth hook first - must be called unconditionally
  const authContext = useAuth();
  const user = authContext?.user || null;
  const { joinProject, getOnlineUsersCount, onlineUsers, isConnected } = useChat();

  // State
  const [tasks, setTasks] = useState(initialTasks);
  const [notes, setNotes] = useState(initialNotes);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showAiTaskModal, setShowAiTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    desc: "",
    priority: "medium",
    dueDate: "",
    assignedTo: "",
    estimatedHours: 0,
  });

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);

  // Add loading state for component initialization
  const [componentLoading, setComponentLoading] = useState(true);
  const [componentError, setComponentError] = useState(null);

  // Initialize component safely with proper error handling
  useEffect(() => {
    const initializeComponent = () => {
      try {
        // Ensure all dependencies are loaded and valid
        if (authContext !== undefined && authContext !== null) {
          setComponentLoading(false);
          setComponentError(null);
        } else {
          // Still loading or auth context is not ready
          setComponentLoading(true);
        }
      } catch (error) {
        console.error("Component initialization error:", error);
        setComponentError(error.message);
        setComponentLoading(false);
      }
    };

    // Use setTimeout to ensure proper initialization order and avoid temporal dead zone
    // Increased delay to prevent 'Me' initialization issues
    const timeoutId = setTimeout(initializeComponent, 1000);
    return () => clearTimeout(timeoutId);
  }, [authContext, user]);

  // Enhanced Contribution State
  const [activeTab, setActiveTab] = useState("tasks");
  const [workspace, setWorkspace] = useState(null);
  const [userAccess, setUserAccess] = useState(null);
  const [resources, setResources] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    name: "",
    type: "file",
    url: "",
    description: "",
    file: null,
  });
  const [selectedResource, setSelectedResource] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState(null);

  // Real-time Firebase listeners
  const [firebaseListeners, setFirebaseListeners] = useState([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState(null);
  const [taskComments, setTaskComments] = useState({});
  const [taskFiles, setTaskFiles] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Task filters state
  const [taskFilters, setTaskFilters] = useState({
    status: "all",
    priority: "all",
    assignedTo: "all",
    search: "",
  });

  // Time tracking state
  const [activeTimeTracking, setActiveTimeTracking] = useState({});
  const [timeTrackingData, setTimeTrackingData] = useState({});

  // Load resources from API (memoized to prevent infinite loops)
  const loadResourcesFromAPI = useCallback(async () => {
    if (!selectedProjectId || resourcesLoading) return;

    try {
      setResourcesLoading(true);
      setResourcesError(null);
      console.log("🔄 Loading resources from API for project:", selectedProjectId);
      const response = await projectTaskApi.getProjectResources(selectedProjectId);
      if (response.resources) {
        setResources(response.resources);
        console.log("✅ Loaded", response.resources.length, "resources from API");
      }
    } catch (error) {
      console.error("❌ Failed to load resources from API:", error);
      setResourcesError(
        "Failed to load resources: " + (error.message || "Unknown error")
      );
    } finally {
      setResourcesLoading(false);
    }
  }, [selectedProjectId, resourcesLoading]);

  // Fallback function to load tasks from API when Firebase fails (memoized)
  const loadTasksFromAPI = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      console.log("🔄 Loading tasks from API for project:", selectedProjectId);
      const response = await projectTaskApi.getProjectTasks(selectedProjectId);
      if (response.tasks) {
        setTasks(response.tasks);
        console.log("✅ Loaded", response.tasks.length, "tasks from API");
      }
    } catch (error) {
      console.error("❌ Failed to load tasks from API:", error);
    }
  }, [selectedProjectId]);

  // Fetch projects from API
  useEffect(() => {
    setProjectsLoading(true);
    setProjectsError(null);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/myproject`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        // Only use id, title, description
        const fetchedProjects = (res.data.projects || []).map((proj) => ({
          id: proj._id,
          title: proj.project_Title,
          description: proj.Project_Description,
        }));
        console.log("Fetched Projects:", fetchedProjects);
        setProjects(fetchedProjects);
        // Set selected project to first if not already set or if current is not in list
        if (
          fetchedProjects.length > 0 &&
          !fetchedProjects.find((p) => p.id === selectedProjectId)
        ) {
          setSelectedProjectId(fetchedProjects[0].id);
        }
        if (fetchedProjects.length === 0) setSelectedProjectId("");
      })
      .catch(() => setProjectsError("Failed to fetch projects"))
      .finally(() => setProjectsLoading(false));
  }, [selectedProjectId]);

  // Enhanced Firebase real-time listeners setup
  useEffect(() => {
    if (!selectedProjectId) return;

    console.log(
      "Setting up enhanced Firebase listeners for project:",
      selectedProjectId
    );

    const listeners = [];

    // 1. Real-time tasks listener (simplified query)
    const tasksQuery = query(
      collection(db, "project_tasks"),
      where("projectId", "==", selectedProjectId)
    );

    const tasksUnsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        console.log(
          "🔄 Firebase tasks update:",
          snapshot.docChanges().length,
          "changes"
        );
        const tasksData = [];
        snapshot.forEach((doc) => {
          tasksData.push({ id: doc.id, ...doc.data() });
        });
        // Sort tasks by createdAt in JavaScript instead of Firebase
        tasksData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
        });
        setTasks(tasksData);

        // Update real-time updates state
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          setRealTimeUpdates((prev) => ({
            ...prev,
            [`task_${change.doc.id}`]: {
              type: change.type,
              data: data,
              timestamp: new Date(),
            },
          }));
        });
      },
      (error) => {
        console.error("❌ Firebase tasks listener error:", error);
        // Fallback to API if Firebase fails
        loadTasksFromAPI();
      }
    );
    listeners.push(tasksUnsubscribe);

    // 2. Real-time team members listener
    const teamQuery = query(
      collection(db, "project_contributors"),
      where("projectId", "==", selectedProjectId)
    );

    const teamUnsubscribe = onSnapshot(
      teamQuery,
      (snapshot) => {
        console.log(
          "🔄 Firebase team update:",
          snapshot.docChanges().length,
          "changes"
        );
        const teamData = [];
        snapshot.forEach((doc) => {
          teamData.push({ id: doc.id, ...doc.data() });
        });
        setTeamMembers(teamData);
      },
      (error) => {
        console.error("❌ Firebase team listener error:", error);
      }
    );
    listeners.push(teamUnsubscribe);

    // 3. Real-time task comments listener (simplified query)
    const commentsQuery = query(
      collection(db, "task_comments"),
      where("projectId", "==", selectedProjectId)
    );

    const commentsUnsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        console.log(
          "🔄 Firebase comments update:",
          snapshot.docChanges().length,
          "changes"
        );
        const commentsData = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!commentsData[data.taskId]) {
            commentsData[data.taskId] = [];
          }
          commentsData[data.taskId].push({ id: doc.id, ...data });
        });
        // Sort comments by createdAt in JavaScript instead of Firebase
        Object.keys(commentsData).forEach((taskId) => {
          commentsData[taskId].sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB - dateA;
          });
        });
        setTaskComments(commentsData);
      },
      (error) => {
        console.error("❌ Firebase comments listener error:", error);
      }
    );
    listeners.push(commentsUnsubscribe);

    // 4. Real-time task files listener (simplified query)
    const filesQuery = query(
      collection(db, "task_files"),
      where("projectId", "==", selectedProjectId)
    );

    const filesUnsubscribe = onSnapshot(
      filesQuery,
      (snapshot) => {
        console.log(
          "🔄 Firebase files update:",
          snapshot.docChanges().length,
          "changes"
        );
        const filesData = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!filesData[data.taskId]) {
            filesData[data.taskId] = [];
          }
          filesData[data.taskId].push({ id: doc.id, ...data });
        });
        // Sort files by uploadedAt in JavaScript instead of Firebase
        Object.keys(filesData).forEach((taskId) => {
          filesData[taskId].sort((a, b) => {
            const dateA = a.uploadedAt?.toDate?.() || new Date(a.uploadedAt);
            const dateB = b.uploadedAt?.toDate?.() || new Date(b.uploadedAt);
            return dateB - dateA;
          });
        });
        setTaskFiles(filesData);
      },
      (error) => {
        console.error("❌ Firebase files listener error:", error);
      }
    );
    listeners.push(filesUnsubscribe);

    // 5. Socket.IO online users tracking (replaces Firebase)
    // This will be handled by the Socket.IO connection setup below

    // 6. Real-time notifications listener (simplified query)
    const notificationsQuery = query(
      collection(db, "project_notifications"),
      where("projectId", "==", selectedProjectId)
    );

    const notificationsUnsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        console.log(
          "🔄 Firebase notifications update:",
          snapshot.docChanges().length,
          "changes"
        );
        const notificationsData = [];
        snapshot.forEach((doc) => {
          notificationsData.push({ id: doc.id, ...doc.data() });
        });
        // Sort and limit notifications in JavaScript instead of Firebase
        notificationsData
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB - dateA;
          })
          .slice(0, 50); // Limit to 50 most recent
        setNotifications(notificationsData);
      },
      (error) => {
        console.error("❌ Firebase notifications listener error:", error);
      }
    );
    listeners.push(notificationsUnsubscribe);

    // 7. Real-time workspace updates listener
    const workspaceRef = doc(db, "project_workspaces", selectedProjectId);
    const workspaceUnsubscribe = onSnapshot(
      workspaceRef,
      (doc) => {
        if (doc.exists()) {
          console.log("🔄 Firebase workspace update");
          setWorkspace({ id: doc.id, ...doc.data() });
        }
      },
      (error) => {
        console.error("❌ Firebase workspace listener error:", error);
      }
    );
    listeners.push(workspaceUnsubscribe);

    // 8. Real-time project resources listener
    const resourcesQuery = query(
      collection(db, "project_resources"),
      where("projectId", "==", selectedProjectId)
    );

    const resourcesUnsubscribe = onSnapshot(
      resourcesQuery,
      (snapshot) => {
        console.log(
          "🔄 Firebase resources update:",
          snapshot.docChanges().length,
          "changes"
        );
        const resourcesData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          resourcesData.push({
            id: doc.id,
            ...data,
            uploadedAt:
              data.uploadedAt?.toDate?.() || new Date(data.uploadedAt),
          });
        });
        // Sort resources by uploadedAt in JavaScript instead of Firebase
        resourcesData.sort((a, b) => {
          const dateA = a.uploadedAt?.toDate?.() || new Date(a.uploadedAt);
          const dateB = b.uploadedAt?.toDate?.() || new Date(b.uploadedAt);
          return dateB - dateA;
        });
        setResources(resourcesData);
      },
      (error) => {
        console.error("❌ Firebase resources listener error:", error);
        // Fallback to API if Firebase fails (only if not already loading)
        if (!resourcesLoading) {
          loadResourcesFromAPI();
        }
      }
    );
    listeners.push(resourcesUnsubscribe);

    // Store listeners for cleanup
    setFirebaseListeners(listeners);

    return () => {
      console.log(
        "🧹 Cleaning up Firebase listeners for project:",
        selectedProjectId
      );
      listeners.forEach((unsubscribe) => unsubscribe());
    };
  }, [
    selectedProjectId,
    loadResourcesFromAPI,
    loadTasksFromAPI,
    resourcesLoading,
  ]);

  // Socket.IO connection and online status management
  useEffect(() => {
    if (!selectedProjectId || !user?._id) return;

    let cleanupFunction = null;

    const initializeSocketConnection = async () => {
      try {
        // Add safety check to prevent temporal dead zone errors
        if (!user || !user._id || !selectedProjectId) {
          console.error("❌ Missing required data for socket connection");
          return;
        }

        // Connect to socket if not already connected
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("❌ No authentication token found");
          return;
        }

        // Join project room using shared chat context
        await joinProject(selectedProjectId);

        // Set up user activity tracking with optimized frequency
        const activityInterval = setInterval(() => {
          try {
            // Only send activity if connected to chat
            if (isConnected) {
              // User activity is handled by the ChatContext automatically
              console.log("✅ User activity tracked");
            }
          } catch (error) {
            console.error("❌ Error sending user activity:", error);
          }
        }, 20000); // Send activity every 20 seconds (optimized frequency)

        cleanupFunction = () => {
          try {
            clearInterval(activityInterval);
          } catch (error) {
            console.error("❌ Error during socket cleanup:", error);
          }
        };
      } catch (error) {
        console.error("❌ Error initializing socket connection:", error);
        // Don't throw the error to prevent component crash
      }
    };

    // Initialize socket connection with a small delay to ensure proper initialization order
    const timeoutId = setTimeout(() => {
      initializeSocketConnection();
    }, 100);

    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, [selectedProjectId, user, joinProject, isConnected]);

  // Enhanced task management with Firebase real-time updates
  const handleEnhancedTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !selectedProjectId) return;

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.desc,
        priority: taskForm.priority || "medium",
        dueDate: taskForm.dueDate || null,
        assignedTo: taskForm.assignedTo || user._id,
        estimatedHours: taskForm.estimatedHours || 0,
        status: "pending",
      };

      if (editTask) {
        // Update existing task
        await projectTaskApi.updateTask(
          selectedProjectId,
          editTask.id,
          taskData
        );
        notificationService.success("Task updated successfully");
      } else {
        // Create new task
        const result = await projectTaskApi.createTask(
          selectedProjectId,
          taskData
        );
        notificationService.success("Task created successfully");

        // Create notification
        await addDoc(collection(db, "project_notifications"), {
          projectId: selectedProjectId,
          type: "task_created",
          title: "New Task Created",
          message: `Task "${taskForm.title}" has been created`,
          createdBy: user._id,
          createdAt: serverTimestamp(),
          readBy: [],
        });
      }

      setShowTaskModal(false);
      setEditTask(null);
      setTaskForm({
        title: "",
        desc: "",
        priority: "medium",
        dueDate: "",
        assignedTo: "",
        estimatedHours: 0,
      });
    } catch (error) {
      console.error("Error handling task:", error);
      notificationService.error("Failed to save task");
    }
  };

  // Enhanced task status change with Firebase updates
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await projectTaskApi.updateTask(selectedProjectId, taskId, {
        status: newStatus,
      });

      // Create notification for status change
      await addDoc(collection(db, "project_notifications"), {
        projectId: selectedProjectId,
        type: "task_status_changed",
        title: "Task Status Updated",
        message: `Task status changed to ${newStatus}`,
        taskId: taskId,
        createdBy: user._id,
        createdAt: serverTimestamp(),
        readBy: [],
      });

      notificationService.success("Task status updated");
    } catch (error) {
      console.error("Error updating task status:", error);
      notificationService.error("Failed to update task status");
    }
  };

  // Time tracking functionality
  const startTimeTracking = async (taskId) => {
    try {
      const trackingRef = doc(
        db,
        "time_tracking",
        `${selectedProjectId}_${taskId}_${user._id}`
      );
      await setDoc(trackingRef, {
        projectId: selectedProjectId,
        taskId: taskId,
        userId: user._id,
        startTime: serverTimestamp(),
        isActive: true,
      });

      setActiveTimeTracking((prev) => ({
        ...prev,
        [taskId]: {
          startTime: new Date(),
          taskId: taskId,
        },
      }));

      notificationService.success("Time tracking started");
    } catch (error) {
      console.error("Error starting time tracking:", error);
      notificationService.error("Failed to start time tracking");
    }
  };

  const stopTimeTracking = async (taskId) => {
    try {
      const trackingRef = doc(
        db,
        "time_tracking",
        `${selectedProjectId}_${taskId}_${user._id}`
      );
      const trackingDoc = await trackingRef.get();

      if (trackingDoc.exists()) {
        const data = trackingDoc.data();
        const startTime = data.startTime.toDate();
        const endTime = new Date();
        const hours = (endTime - startTime) / (1000 * 60 * 60);

        await updateDoc(trackingRef, {
          endTime: serverTimestamp(),
          isActive: false,
          duration: hours,
        });

        // Add time log to task
        await projectTaskApi.completeTask(selectedProjectId, taskId, {
          actualHours: hours,
          completionNotes: `Time logged: ${hours.toFixed(2)} hours`,
        });
      }

      setActiveTimeTracking((prev) => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });

      notificationService.success("Time tracking stopped");
    } catch (error) {
      console.error("Error stopping time tracking:", error);
      notificationService.error("Failed to stop time tracking");
    }
  };

  // Enhanced resource management with Firebase
  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      const resourceData = {
        name: resourceForm.name,
        type: resourceForm.type,
        description: resourceForm.description,
      };

      if (resourceForm.type === "file" && resourceForm.file) {
        resourceData.file = resourceForm.file;
      } else if (resourceForm.type === "link" && resourceForm.url) {
        resourceData.url = resourceForm.url;
      } else if (resourceForm.type === "document" && resourceForm.file) {
        resourceData.file = resourceForm.file;
      } else {
        notificationService.error(
          "Please provide a file or URL based on the resource type"
        );
        return;
      }

      await projectTaskApi.uploadProjectResource(
        selectedProjectId,
        resourceData
      );
      notificationService.success("Resource added successfully");

      setShowResourceModal(false);
      setResourceForm({
        name: "",
        type: "file",
        url: "",
        description: "",
        file: null,
      });
    } catch (error) {
      console.error("Error uploading resource:", error);
      notificationService.error(
        "Failed to add resource: " + (error.message || "Unknown error")
      );
    }
  };

  // Delete resource
  const handleDeleteResource = async (resourceId) => {
    if (!selectedProjectId || !resourceId) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete this resource? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await projectTaskApi.deleteProjectResource(selectedProjectId, resourceId);
      notificationService.success("Resource deleted successfully");
    } catch (error) {
      console.error("Error deleting resource:", error);
      notificationService.error(
        "Failed to delete resource: " + (error.message || "Unknown error")
      );
    }
  };

  // Update resource
  const handleUpdateResource = async (resourceId, updateData) => {
    if (!selectedProjectId || !resourceId) return;

    try {
      await projectTaskApi.updateProjectResource(
        selectedProjectId,
        resourceId,
        updateData
      );
      notificationService.success("Resource updated successfully");
    } catch (error) {
      console.error("Error updating resource:", error);
      notificationService.error(
        "Failed to update resource: " + (error.message || "Unknown error")
      );
    }
  };


  // Enhanced Tab Configuration
  const tabs = [
    { id: "tasks", label: "Tasks", icon: FaRegStickyNote, color: "blue" },
    { id: "team", label: "Team", icon: FaUsers, color: "purple" },
    { id: "resources", label: "Resources", icon: FaFolderOpen, color: "green" },
    { id: "progress", label: "Progress", icon: FaChartBar, color: "yellow" },
    { id: "chat", label: "Chat", icon: FaComments, color: "indigo" },
    { id: "notifications", label: "Notifications", icon: FaBell, color: "red" },
  ];

  // Load workspace data for enhanced features (memoized to prevent infinite loops)
  const loadWorkspace = useCallback(async () => {
    if (!selectedProjectId || resourcesLoading) return;

    try {
      const data = await projectTaskApi.getWorkspace(selectedProjectId);
      setWorkspace(data.workspace);
      setUserAccess(data.userAccess);

      // Load resources
      if (data.workspace.resources) {
        setResources(data.workspace.resources);
      }

      // Load statistics directly here to avoid circular dependency
      try {
        console.log(
          "🔄 Loading enhanced statistics for project:",
          selectedProjectId
        );

        // Load from API
        const response = await projectTaskApi.getProjectStatistics(
          selectedProjectId
        );

        if (response.statistics) {
          // Enhance statistics with real-time data
          const enhancedStats = {
            ...response.statistics,
            tasks: {
              ...response.statistics.tasks,
              // Add real-time task counts from local state
              total: tasks.length,
              completed: tasks.filter(
                (t) => t.status === "completed" || t.task_status === "done"
              ).length,
              inProgress: tasks.filter(
                (t) =>
                  t.status === "in_progress" || t.task_status === "inprogress"
              ).length,
              pending: tasks.filter(
                (t) => t.status === "pending" || t.task_status === "todo"
              ).length,
              review: tasks.filter(
                (t) => t.status === "review" || t.task_status === "review"
              ).length,
              progressPercentage:
                tasks.length > 0
                  ? Math.round(
                      (tasks.filter(
                        (t) =>
                          t.status === "completed" || t.task_status === "done"
                      ).length /
                        tasks.length) *
                        100
                    )
                  : 0,
            },
            team: {
              ...response.statistics.team,
              // Add real-time team data
              totalMembers: teamMembers.length,
              activeContributors: teamMembers.filter(
                (member) => member.status === "active"
              ).length,
            },
            time: {
              ...response.statistics.time,
              // Add real-time time tracking data
              totalEstimatedHours: tasks.reduce(
                (sum, t) => sum + (t.estimatedHours || 0),
                0
              ),
              totalActualHours: tasks.reduce(
                (sum, t) => sum + (t.actualHours || 0),
                0
              ),
              efficiency: 0,
            },
          };

          setStatistics(enhancedStats);
          console.log("✅ Enhanced statistics loaded:", enhancedStats);
        } else {
          // Set default statistics if no data from API
          setStatistics({
            project: { id: selectedProjectId, title: "Project", description: "" },
            tasks: {
              total: tasks.length,
              completed: tasks.filter(
                (t) => t.status === "completed" || t.task_status === "done"
              ).length,
              inProgress: tasks.filter(
                (t) =>
                  t.status === "in_progress" || t.task_status === "inprogress"
              ).length,
              pending: tasks.filter(
                (t) => t.status === "pending" || t.task_status === "todo"
              ).length,
              review: tasks.filter(
                (t) => t.status === "review" || t.task_status === "review"
              ).length,
              progressPercentage:
                tasks.length > 0
                  ? Math.round(
                      (tasks.filter(
                        (t) =>
                          t.status === "completed" || t.task_status === "done"
                      ).length /
                        tasks.length) *
                        100
                    )
                  : 0,
            },
            team: {
              totalMembers: teamMembers.length,
              activeContributors: teamMembers.filter(
                (member) => member.status === "active"
              ).length,
            },
            time: {
              totalEstimatedHours: tasks.reduce(
                (sum, t) => sum + (t.estimatedHours || 0),
                0
              ),
              totalActualHours: tasks.reduce(
                (sum, t) => sum + (t.actualHours || 0),
                0
              ),
              efficiency: 0,
            },
          });
        }
      } catch (statsError) {
        console.error("Failed to load statistics:", statsError);
        // Set default statistics if API fails
        setStatistics({
          project: { id: selectedProjectId, title: "Project", description: "" },
          tasks: {
            total: tasks.length,
            completed: tasks.filter(
              (t) => t.status === "completed" || t.task_status === "done"
            ).length,
            inProgress: tasks.filter(
              (t) =>
                t.status === "in_progress" || t.task_status === "inprogress"
            ).length,
            pending: tasks.filter(
              (t) => t.status === "pending" || t.task_status === "todo"
            ).length,
            review: tasks.filter(
              (t) => t.status === "review" || t.task_status === "review"
            ).length,
            progressPercentage:
              tasks.length > 0
                ? Math.round(
                    (tasks.filter(
                      (t) =>
                        t.status === "completed" || t.task_status === "done"
                    ).length /
                      tasks.length) *
                      100
                  )
                : 0,
          },
          team: {
            totalMembers: teamMembers.length,
            activeContributors: teamMembers.filter(
              (member) => member.status === "active"
            ).length,
          },
          time: {
            totalEstimatedHours: tasks.reduce(
              (sum, t) => sum + (t.estimatedHours || 0),
              0
            ),
            totalActualHours: tasks.reduce(
              (sum, t) => sum + (t.actualHours || 0),
              0
            ),
            efficiency: 0,
          },
        });
      }
    } catch (err) {
      console.error("Failed to load workspace:", err);
      // Don't show error for workspace loading as it's optional
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, resourcesLoading]); // Removed tasks and teamMembers to prevent circular dependency

  // Load team members from API (memoized to prevent infinite loops)
  const loadTeamMembers = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      setTeamMembersLoading(true);
      setTeamMembersError(null);
      console.log("🔄 Loading team members for project:", selectedProjectId);
      const response = await projectSelectionApi.getProjectTeamMembers(
        selectedProjectId
      );

      if (response.teamMembers) {
        setTeamMembers(response.teamMembers);
        console.log("✅ Loaded", response.teamMembers.length, "team members");
      }
    } catch (error) {
      console.error("❌ Failed to load team members:", error);
      setTeamMembersError(error.message || "Failed to load team members");
      // Set empty array if API fails
      setTeamMembers([]);
    } finally {
      setTeamMembersLoading(false);
    }
  }, [selectedProjectId]);


  // Fallback function to load statistics from API when Firebase fails
  const loadStatisticsFromAPI = async () => {
    if (!selectedProjectId) return;

    try {
      console.log("🔄 Loading statistics from API as Firebase fallback...");
      const response = await projectTaskApi.getProjectStatistics(
        selectedProjectId
      );
      if (response.statistics) {
        setStatistics(response.statistics);
        console.log("✅ Loaded statistics from API");
      }
    } catch (error) {
      console.error("❌ Failed to load statistics from API:", error);
      // Set default statistics if API fails
      setStatistics({
        project: { id: selectedProjectId, title: "Project", description: "" },
        tasks: {
          total: tasks.length,
          completed: tasks.filter((t) => t.status === "completed").length,
          inProgress: tasks.filter((t) => t.status === "in_progress").length,
          pending: tasks.filter((t) => t.status === "pending").length,
          review: tasks.filter((t) => t.status === "review").length,
          progressPercentage:
            tasks.length > 0
              ? (tasks.filter((t) => t.status === "completed").length /
                  tasks.length) *
                100
              : 0,
        },
        team: {
          totalMembers: teamMembers.length,
          activeContributors: teamMembers.length,
        },
        time: {
          totalEstimatedHours: tasks.reduce(
            (sum, t) => sum + (t.estimatedHours || 0),
            0
          ),
          totalActualHours: tasks.reduce(
            (sum, t) => sum + (t.actualHours || 0),
            0
          ),
          efficiency: 0,
        },
      });
      notificationService.error(
        "Failed to load statistics: " + (error.message || "Unknown error")
      );
    }
  };


  // Load workspace when project changes
  useEffect(() => {
    if (selectedProjectId) {
      loadWorkspace();
      loadTeamMembers(); // Load team members when project changes
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]); // Removed loadWorkspace and loadTeamMembers from dependencies to prevent infinite loop

  // Real-time statistics updates
  useEffect(() => {
    if (selectedProjectId && activeTab === "progress") {
      // Update statistics when tasks, team members, or online users change
      const updateStats = () => {
        const updatedStats = {
          ...statistics,
          tasks: {
            total: tasks.length,
            completed: tasks.filter(
              (t) => t.status === "completed" || t.task_status === "done"
            ).length,
            inProgress: tasks.filter(
              (t) =>
                t.status === "in_progress" || t.task_status === "inprogress"
            ).length,
            pending: tasks.filter(
              (t) => t.status === "pending" || t.task_status === "todo"
            ).length,
            review: tasks.filter(
              (t) => t.status === "review" || t.task_status === "review"
            ).length,
            progressPercentage:
              tasks.length > 0
                ? (tasks.filter(
                    (t) => t.status === "completed" || t.task_status === "done"
                  ).length /
                    tasks.length) *
                  100
                : 0,
          },
          team: {
            totalMembers: teamMembers.length,
            activeContributors: teamMembers.length,
            onlineUsers: getOnlineUsersCount(selectedProjectId),
          },
          realTime: {
            lastUpdated: new Date(),
            onlineUsers: getOnlineUsersCount(selectedProjectId),
            recentNotifications: notifications.length,
            activeTimeTracking: Object.keys(activeTimeTracking).length,
          },
        };
        setStatistics(updatedStats);
      };

      updateStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, activeTab, tasks, teamMembers, getOnlineUsersCount, notifications, activeTimeTracking]); // Removed statistics to prevent infinite loop

  // Update selected project if projects change
  useEffect(() => {
    if (
      projects.length > 0 &&
      !projects.find((p) => p.id === selectedProjectId)
    ) {
      setSelectedProjectId(projects[0].id);
    }
    if (projects.length === 0) setSelectedProjectId("");
  }, [projects, selectedProjectId]);

  // Add/Edit Task
  const handleTaskFormSubmit = async (e) => {
    e.preventDefault();

    // Debug logging
    console.log("🔍 Task form submission debug:");
    console.log("  taskForm:", taskForm);
    console.log("  selectedProjectId:", selectedProjectId);
    console.log("  user:", user);
    console.log("  user._id:", user?._id);

    if (!taskForm.title.trim() || !selectedProjectId) {
      console.error("❌ Validation failed:");
      console.error("  title:", taskForm.title);
      console.error("  selectedProjectId:", selectedProjectId);
      return;
    }

    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.desc,
        priority: taskForm.priority || "medium",
        dueDate: taskForm.dueDate || null,
        assignedTo: taskForm.assignedTo || user._id,
        estimatedHours: taskForm.estimatedHours || 0,
        status: "pending",
      };

      console.log("🔍 Task data being sent:", taskData);

      if (editTask) {
        // Update existing task using new API
        const result = await projectTaskApi.updateTask(
          selectedProjectId,
          editTask.id,
          taskData
        );
        console.log("Updated Task:", result);

        setTasks((prev) =>
          prev.map((t) =>
            t.id === (editTask.id || editTask._id)
              ? {
                  ...t,
                  title: taskForm.title,
                  description: taskForm.desc,
                }
              : t
          )
        );

        if (onTaskEdit)
          onTaskEdit(editTask.id || editTask._id, {
            ...taskForm,
            projectId: selectedProjectId,
          });

        notificationService.success("Task updated successfully");
      } else {
        // Create new task using new API
        console.log("🔍 About to call projectTaskApi.createTask with:");
        console.log("  projectId:", selectedProjectId);
        console.log("  taskData:", taskData);

        const result = await projectTaskApi.createTask(
          selectedProjectId,
          taskData
        );
        console.log("Created Task:", result);

        // Add the new task to the local state
        const newTask = {
          id: result.task._id,
          title: result.task.title,
          description: result.task.description,
          status: result.task.status,
          priority: result.task.priority,
          assignedTo: result.task.assignedTo,
          createdBy: result.task.createdBy,
          createdAt: result.task.createdAt,
        };

        setTasks((prev) => [newTask, ...prev]);
        if (onTaskAdd) onTaskAdd(newTask);

        notificationService.success("Task created successfully");
      }
    } catch (error) {
      console.error("❌ Error handling task:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      // More specific error messages
      if (error.response?.status === 404) {
        notificationService.error(
          "API endpoint not found. Please check server configuration."
        );
      } else if (error.response?.status === 401) {
        notificationService.error(
          "Authentication failed. Please log in again."
        );
      } else if (error.response?.status === 403) {
        notificationService.error(
          "Access denied. You may not have permission for this project."
        );
      } else {
        notificationService.error(
          "Failed to save task: " +
            (error.response?.data?.message || error.message)
        );
      }
      return;
    }

    setShowTaskModal(false);
    setEditTask(null);
    setTaskForm({
      title: "",
      desc: "",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
      estimatedHours: 0,
    });
  };

  // Dummy AI Task Add
  const handleAiTaskAdd = () => {
    const aiTask = {
      id: Date.now(),
      title: "AI Suggested Task",
      desc: "This task was generated by AI for your project.",
      status: "todo",
      projectId: selectedProjectId,
    };
    setTasks((prev) => [aiTask, ...prev]);
    setShowAiTaskModal(false);
    if (onTaskAdd) onTaskAdd(aiTask);
  };

  // Delete Task
  const handleTaskDelete = async (id) => {
    if (!id || !selectedProjectId) return;
    try {
      await projectTaskApi.deleteTask(selectedProjectId, id);
      console.log("Deleted Task:", id);
      setTasks((prev) => prev.filter((t) => t.id !== id && t._id !== id));
      if (onTaskDelete) onTaskDelete(id);
      setEditTask(null);
      setTaskForm({
        title: "",
        desc: "",
        priority: "medium",
        dueDate: "",
        assignedTo: "",
        estimatedHours: 0,
      });
      notificationService.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      notificationService.error("Failed to delete task");
    }
  };

  // Open modal for edit/add
  const openEditModal = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.task_title || task.title,
      desc: task.task_description || task.description,
      priority: task.priority || "medium",
      dueDate: task.dueDate || "",
      assignedTo: task.assignedTo || "",
      estimatedHours: task.estimatedHours || 0,
    });
    setShowTaskModal(true);
  };
  const openAddModal = () => {
    setEditTask(null);
    setTaskForm({
      title: "",
      desc: "",
      priority: "medium",
      dueDate: "",
      assignedTo: "",
      estimatedHours: 0,
    });
    setShowTaskModal(true);
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      taskFilters.status === "all" ||
      task.status === taskFilters.status ||
      task.task_status === taskFilters.status;
    const matchesPriority =
      taskFilters.priority === "all" || task.priority === taskFilters.priority;
    const matchesAssignedTo =
      taskFilters.assignedTo === "all" ||
      task.assignedTo === taskFilters.assignedTo;
    const matchesSearch =
      taskFilters.search === "" ||
      (task.title || task.task_title || "")
        .toLowerCase()
        .includes(taskFilters.search.toLowerCase()) ||
      (task.description || task.task_description || "")
        .toLowerCase()
        .includes(taskFilters.search.toLowerCase());

    return (
      matchesStatus && matchesPriority && matchesAssignedTo && matchesSearch
    );
  });

  // Task status update handler
  const handleTaskStatusUpdate = async (taskId, newStatus) => {
    try {
      const result = await projectTaskApi.updateTask(
        selectedProjectId,
        taskId,
        { status: newStatus }
      );
      if (result.success) {
        notificationService.success(`Task status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      notificationService.error("Failed to update task status");
    }
  };

  // Task edit handler
  const handleEditTask = async (taskId, updatedData) => {
    try {
      const result = await projectTaskApi.updateTask(
        selectedProjectId,
        taskId,
        updatedData
      );
      if (result.success) {
        notificationService.success("Task updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      notificationService.error("Failed to update task");
    }
  };

  // Task delete handler
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }
    try {
      const result = await projectTaskApi.deleteTask(selectedProjectId, taskId);
      if (result.success) {
        notificationService.success("Task deleted successfully!");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      notificationService.error("Failed to delete task");
    }
  };

  // Enhanced Task Card Component for the new task management interface
  const EnhancedTaskCard = ({ task, onStatusUpdate, onDelete }) => {
    const assignedMember = teamMembers.find(
      (member) => member.id === task.assignedTo
    );

    return (
      <div className="bg-[#181b23] border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-blue-500/30 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-white text-lg">
                {task.title || task.task_title}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  task.status === "pending" || task.task_status === "pending"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : task.status === "in_progress" ||
                      task.task_status === "inprogress"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : task.status === "review" || task.task_status === "review"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : task.status === "completed" || task.task_status === "done"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {(task.status || task.task_status || "pending")
                  .replace("_", " ")
                  .toUpperCase()}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  task.priority === "low"
                    ? "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                    : task.priority === "medium"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : task.priority === "high"
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    : task.priority === "urgent"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {(task.priority || "medium").toUpperCase()}
              </span>
            </div>

            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {task.description || task.task_description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
              {assignedMember && (
                <div className="flex items-center">
                  <FaUser className="w-3 h-3 mr-1" />
                  <span>{assignedMember.name || assignedMember.username}</span>
                </div>
              )}

              {task.dueDate && (
                <div className="flex items-center">
                  <FaCalendar className="w-3 h-3 mr-1" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}

              {task.estimatedHours > 0 && (
                <div className="flex items-center">
                  <FaClock className="w-3 h-3 mr-1" />
                  <span>Est: {task.estimatedHours}h</span>
                </div>
              )}

              {task.actualHours > 0 && (
                <div className="flex items-center">
                  <FaChartBar className="w-3 h-3 mr-1" />
                  <span>Actual: {task.actualHours}h</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openEditModal(task)}
              className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
              title="Edit Task"
            >
              <FaEdit className="w-3 h-3" />
            </button>

            <button
              onClick={() => onDelete(task.id)}
              className="p-2 text-red-400 hover:text-red-300 transition-colors"
              title="Delete Task"
            >
              <FaTrash className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center space-x-1">
            {(task.status === "pending" || task.task_status === "pending") && (
              <button
                onClick={() => onStatusUpdate(task.id, "in_progress")}
                className="p-2 text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                title="Start Task"
              >
                <FaSync className="w-3 h-3" />
              </button>
            )}

            {/* Show review buttons for tasks in review status */}
            {(task.status === "review" || task.task_status === "review") && (
              <>
                <button
                  onClick={() => onStatusUpdate(task.id, "completed")}
                  className="p-2 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
                  title="Approve Task"
                >
                  <FaCheckCircle className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onStatusUpdate(task.id, "in_progress")}
                  className="p-2 text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors"
                  title="Reject and Send Back"
                >
                  <FaUndo className="w-3 h-3" />
                </button>
              </>
            )}

            {/* Show complete button for in-progress tasks */}
            {(task.status === "in_progress" ||
              task.task_status === "inprogress") && (
              <button
                onClick={() => onStatusUpdate(task.id, "completed")}
                className="p-2 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
                title="Complete Task"
              >
                <FaCheckCircle className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Notes
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    if (onNotesChange) onNotesChange(e.target.value);
  };

  // Progress
  const doneCount = tasks.filter((t) => t.task_status === "done").length;
  const totalCount = tasks.length;
  const progress =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Enhanced Task Card Component with Real-time Features
  const TaskCard = ({ task }) => {
    const isTimeTracking = activeTimeTracking[task.id];
    const taskCommentsList = taskComments[task.id] || [];
    const taskFilesList = taskFiles[task.id] || [];

    return (
      <div className="bg-[#181b23] rounded-xl p-4 border border-blue-500/10 hover:border-blue-400/30 transition-all group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
              {task.task_title || task.title}
            </h4>
            <p className="text-gray-400 text-sm line-clamp-2">
              {task.task_description || task.description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {/* Priority Badge */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold ${
                task.priority === "urgent"
                  ? "bg-red-900/40 text-red-400"
                  : task.priority === "high"
                  ? "bg-orange-900/40 text-orange-400"
                  : task.priority === "medium"
                  ? "bg-yellow-900/40 text-yellow-400"
                  : "bg-blue-900/40 text-blue-400"
              }`}
            >
              {task.priority?.toUpperCase() || "MEDIUM"}
            </span>

            {/* Status Badge */}
            <span
              className={`px-2 py-1 rounded-full text-xs font-bold ${
                task.task_status === "done" || task.status === "completed"
                  ? "bg-green-900/40 text-green-400"
                  : task.task_status === "inprogress" ||
                    task.status === "in_progress"
                  ? "bg-purple-900/40 text-purple-400"
                  : "bg-blue-900/40 text-blue-400"
              }`}
            >
              {task.task_status?.toUpperCase() ||
                task.status?.toUpperCase() ||
                "TODO"}
            </span>
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-400">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <FaCalendar className="text-blue-400" />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {task.estimatedHours > 0 && (
            <div className="flex items-center gap-1">
              <FaClock className="text-yellow-400" />
              <span>Est: {task.estimatedHours}h</span>
            </div>
          )}
          {task.actualHours > 0 && (
            <div className="flex items-center gap-1">
              <FaClock className="text-green-400" />
              <span>Actual: {task.actualHours}h</span>
            </div>
          )}
        </div>

        {/* Time Tracking Controls */}
        <div className="flex items-center gap-2 mb-3">
          {!isTimeTracking ? (
            <button
              onClick={() => startTimeTracking(task.id)}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <FaPlay className="text-xs" />
              Start Timer
            </button>
          ) : (
            <button
              onClick={() => stopTimeTracking(task.id)}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <FaStop className="text-xs" />
              Stop Timer
            </button>
          )}

          {/* Comments Count */}
          {taskCommentsList.length > 0 && (
            <span className="flex items-center gap-1 text-blue-400 text-xs">
              <FaComments />
              {taskCommentsList.length}
            </span>
          )}

          {/* Files Count */}
          {taskFilesList.length > 0 && (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <FaFileAlt />
              {taskFilesList.length}
            </span>
          )}
        </div>

        {/* Task Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(task)}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
          >
            <FaEdit />
            Edit
          </button>

          <button
            onClick={() => handleTaskDelete(task.id)}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
          >
            <FaTrash />
            Delete
          </button>

          {/* Status Change Buttons */}
          {task.task_status !== "done" && task.status !== "completed" && (
            <button
              onClick={() => handleTaskStatusChange(task.id, "completed")}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <FaCheck />
              Complete
            </button>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Team Member Card Component
  const TeamMemberCard = ({ member }) => {
    const isOnline = onlineUsers.some(
      (user) => user.userId === member.userId || user.userId === member._id
    );

    return (
      <div className="bg-[#181b23] rounded-xl p-4 border border-purple-500/10 hover:border-purple-400/30 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <img
              src={
                member.avatar ||
                `https://ui-avatars.com/api/?name=${member.username}`
              }
              alt={member.username}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#181b23] ${
                isOnline ? "bg-green-400" : "bg-gray-400"
              }`}
            ></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-white">{member.username}</h4>
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${
                  member.role === "project_owner"
                    ? "bg-blue-900/40 text-blue-400"
                    : member.role === "contributor"
                    ? "bg-green-900/40 text-green-400"
                    : "bg-gray-900/40 text-gray-400"
                }`}
              >
                {member.role === "project_owner" ? "Owner" : "Contributor"}
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              {member.bio || "No bio available"}
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-400 space-y-1 mb-3">
          {member.email && <div>Email: {member.email}</div>}
          <div>
            Joined:{" "}
            {new Date(
              member.selectedAt || member.joinedAt
            ).toLocaleDateString()}
          </div>
          {member.bidAmount && <div>Bid Amount: ₹{member.bidAmount}</div>}
          {member.experience && (
            <div>Experience: {member.experience} years</div>
          )}
          {member.hoursPerWeek && <div>Hours/Week: {member.hoursPerWeek}</div>}
          {member.selectionScore && (
            <div>Selection Score: {member.selectionScore}/100</div>
          )}
          {member.selectionReason && (
            <div>Selection: {member.selectionReason}</div>
          )}
        </div>

        {/* Skills */}
        {member.skills && member.skills.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">Skills:</div>
            <div className="flex flex-wrap gap-1">
              {member.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-blue-900/40 text-blue-200 px-2 py-1 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
              {member.skills.length > 3 && (
                <span className="text-gray-400 text-xs">
                  +{member.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(member.github ||
          member.linkedIn ||
          member.website ||
          member.instagram) && (
          <div className="flex gap-2">
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs"
              >
                GitHub
              </a>
            )}
            {member.linkedIn && (
              <a
                href={member.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs"
              >
                LinkedIn
              </a>
            )}
            {member.website && (
              <a
                href={member.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs"
              >
                Website
              </a>
            )}
            {member.instagram && (
              <a
                href={member.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-xs"
              >
                Instagram
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  // Notification Card Component
  const NotificationCard = ({ notification }) => {
    const isUnread = !notification.readBy?.includes(user?._id);

    return (
      <div
        className={`bg-[#181b23] rounded-xl p-4 border transition-all ${
          isUnread ? "border-red-500/30 bg-red-900/10" : "border-gray-500/10"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-2 h-2 rounded-full mt-2 ${
              isUnread ? "bg-red-400" : "bg-gray-400"
            }`}
          ></div>
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">
              {notification.title}
            </h4>
            <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
            <div className="text-xs text-gray-500">
              {notification.createdAt?.toDate?.()
                ? new Date(notification.createdAt.toDate()).toLocaleString()
                : new Date(notification.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Early return if component is not ready to prevent initialization errors
  if (typeof window === "undefined") {
    return null;
  }

  // Add global error handler to catch any remaining initialization issues
  try {
    // Ensure all critical variables are properly initialized
    if (authContext === undefined || authContext === null) {
      throw new Error("Auth context not properly initialized");
    }

    // Additional check for user object
    if (user === undefined) {
      throw new Error("User object not properly initialized");
    }

    // Additional safety check for any undefined variables
    if (typeof authContext === "undefined") {
      throw new Error("Auth context is undefined - temporal dead zone issue");
    }

    // Additional safety check for any other potential undefined variables
    if (typeof user === "undefined") {
      throw new Error("User object is undefined - temporal dead zone issue");
    }

    // Check for potential 'Me' variable issues in minified code
    if (typeof window !== 'undefined' && window.location) {
      // Additional safety check to prevent minified variable access issues
      const currentUrl = window.location.href;
      if (currentUrl.includes('admin') && !authContext) {
        throw new Error("Admin context not properly initialized - potential 'Me' variable issue");
      }
    }
  } catch (error) {
    console.error("Critical initialization error:", error);
    
    // Check if this is the specific 'Me' initialization error
    if (error.message && error.message.includes('Me') || 
        error.message && error.message.includes('temporal dead zone')) {
      console.error("❌ Detected 'Me' initialization error - implementing recovery");
      
      // Try to recover by delaying the component render
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="text-red-400 text-lg mb-3">
              Initialization Error
            </div>
            <p className="text-gray-300 mb-4">
              Failed to initialize the Project Management component. This may be due to a 'Me' variable initialization issue. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
            >
              <FaSync className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Show loading state during initialization
  if (componentLoading || !authContext || authContext === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-blue-400 text-lg">
                Initializing Project Management...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (componentError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="text-red-400 text-lg mb-3">
              Initialization Error
            </div>
            <p className="text-gray-300 mb-4">{componentError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
            >
              <FaSync className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            Project Management
          </h1>
          <p className="text-gray-300">
            Manage your project tasks, team, and resources in real-time
          </p>
        </div>

        {/* Project Selector */}
        <div className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Select Project</h2>
            <div className="flex items-center gap-2">
              <FaSync className="text-blue-400" />
              <span className="text-sm text-gray-400">
                Real-time updates enabled
              </span>
            </div>
          </div>

          {projectsLoading ? (
            <div className="text-blue-300">Loading projects...</div>
          ) : projectsError ? (
            <div className="text-red-400">{projectsError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    selectedProjectId === project.id
                      ? "border-blue-400 bg-blue-900/20"
                      : "border-gray-600 hover:border-blue-400/50 bg-[#181b23]"
                  }`}
                >
                  <h3 className="font-semibold text-white mb-1">
                    {project.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {project.description}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedProjectId && (
          <>
            {/* Real-time Status Bar */}
            <div className="bg-[#232a34] rounded-2xl p-4 border border-blue-500/10 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {getOnlineUsersCount(selectedProjectId)} team members online
                  </div>
                  <div className="text-sm text-gray-400">
                    {
                      notifications.filter(
                        (n) => !n.readBy?.includes(user?._id)
                      ).length
                    }{" "}
                    unread notifications
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FaBell className="text-yellow-400" />
                  <span className="text-sm text-gray-400">
                    Real-time notifications
                  </span>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-[#232a34] rounded-2xl p-2 border border-blue-500/10 mb-6">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? "bg-blue-500 text-white"
                        : "text-gray-400 hover:text-white hover:bg-blue-500/10"
                    }`}
                  >
                    <tab.icon />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-[#232a34] rounded-2xl p-6 border border-blue-500/10">
              {/* Tasks Tab */}
              {activeTab === "tasks" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Project Tasks
                      </h2>
                      <p className="text-gray-400 mt-1">
                        Real-time task management and progress tracking
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400">
                          Live Updates
                        </span>
                      </div>
                      <button
                        onClick={loadTasksFromAPI}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaSync />
                        Load Tasks
                      </button>
                      <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaPlus />
                        Add Task
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Task Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {tasks.length}
                      </div>
                      <div className="text-sm text-gray-400">Total Tasks</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {tasks.filter((t) => t.status === "pending").length}
                      </div>
                      <div className="text-sm text-gray-400">Pending</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {tasks.filter((t) => t.status === "in_progress").length}
                      </div>
                      <div className="text-sm text-gray-400">In Progress</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {tasks.filter((t) => t.status === "completed").length}
                      </div>
                      <div className="text-sm text-gray-400">Completed</div>
                    </div>
                  </div>

                  {/* Task Progress Overview */}
                  <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">
                      Project Progress
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Overall Progress</span>
                          <span>
                            {tasks.length > 0
                              ? Math.round(
                                  (tasks.filter((t) => t.status === "completed")
                                    .length /
                                    tasks.length) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                tasks.length > 0
                                  ? (tasks.filter(
                                      (t) => t.status === "completed"
                                    ).length /
                                      tasks.length) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">
                          Tasks Completed
                        </div>
                        <div className="text-lg font-bold text-white">
                          {tasks.filter((t) => t.status === "completed").length}{" "}
                          / {tasks.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task Filters */}
                  <div className="bg-[#181b23] rounded-lg p-4 border border-gray-600 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          value={taskFilters?.status || "all"}
                          onChange={(e) =>
                            setTaskFilters((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Priority
                        </label>
                        <select
                          value={taskFilters?.priority || "all"}
                          onChange={(e) =>
                            setTaskFilters((prev) => ({
                              ...prev,
                              priority: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          value={taskFilters?.assignedTo || "all"}
                          onChange={(e) =>
                            setTaskFilters((prev) => ({
                              ...prev,
                              assignedTo: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Users</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Search
                        </label>
                        <input
                          type="text"
                          placeholder="Search tasks..."
                          value={taskFilters?.search || ""}
                          onChange={(e) =>
                            setTaskFilters((prev) => ({
                              ...prev,
                              search: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Tasks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTasks.map((task) => (
                      <EnhancedTaskCard
                        key={task.id}
                        task={task}
                        onStatusUpdate={handleTaskStatusUpdate}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        teamMembers={teamMembers}
                      />
                    ))}
                  </div>

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FaRegStickyNote className="text-4xl mx-auto mb-4" />
                      <p>No tasks found matching your filters.</p>
                      <p className="text-sm">
                        Try adjusting your search criteria or create a new task.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Team Tab */}
              {activeTab === "team" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Team Members
                    </h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={loadTeamMembers}
                        disabled={teamMembersLoading}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        <FaSync
                          className={`text-xs ${
                            teamMembersLoading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </button>
                      <div className="flex items-center gap-2">
                        <FaSync className="text-blue-400" />
                        <span className="text-sm text-gray-400">
                          Real-time updates
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Team Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {teamMembers.length}
                      </div>
                      <div className="text-sm text-gray-400">Total Members</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {
                          teamMembers.filter((m) => m.role === "contributor")
                            .length
                        }
                      </div>
                      <div className="text-sm text-gray-400">Contributors</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {
                          teamMembers.filter((m) => m.role === "project_owner")
                            .length
                        }
                      </div>
                      <div className="text-sm text-gray-400">Project Owner</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {getOnlineUsersCount(selectedProjectId)}
                      </div>
                      <div className="text-sm text-gray-400">Online Now</div>
                    </div>
                  </div>

                  {/* Team Members Grid */}
                  {teamMembersLoading ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p>Loading team members...</p>
                    </div>
                  ) : teamMembersError ? (
                    <div className="text-center py-8 text-red-400">
                      <FaExclamationTriangle className="text-4xl mx-auto mb-4" />
                      <p className="font-semibold mb-2">
                        Error loading team members
                      </p>
                      <p className="text-sm mb-4">{teamMembersError}</p>
                      <button
                        onClick={loadTeamMembers}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {teamMembers.map((member) => (
                        <TeamMemberCard key={member.id} member={member} />
                      ))}
                    </div>
                  )}

                  {!teamMembersLoading &&
                    !teamMembersError &&
                    teamMembers.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <FaUsers className="text-4xl mx-auto mb-4" />
                        <p>No team members found.</p>
                        <p className="text-sm">
                          Team members will appear here once they're selected
                          for the project.
                        </p>
                      </div>
                    )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Notifications
                  </h2>

                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </div>

                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FaBell className="text-4xl mx-auto mb-4" />
                      <p>No notifications yet.</p>
                      <p className="text-sm">
                        Notifications will appear here as project activities
                        occur.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === "resources" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Project Resources
                    </h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={loadResourcesFromAPI}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        <FaSync className="text-xs" />
                        Refresh
                      </button>
                      <button
                        onClick={() => setShowResourceModal(true)}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <FaPlus />
                        Add Resource
                      </button>
                    </div>
                  </div>

                  {/* Resource Statistics */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {resources.length}
                      </div>
                      <div className="text-sm text-gray-400">
                        Total Resources
                      </div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {resources.filter((r) => r.type === "file").length}
                      </div>
                      <div className="text-sm text-gray-400">Files</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {resources.filter((r) => r.type === "link").length}
                      </div>
                      <div className="text-sm text-gray-400">Links</div>
                    </div>
                    <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {resources.filter((r) => r.type === "document").length}
                      </div>
                      <div className="text-sm text-gray-400">Documents</div>
                    </div>
                  </div>

                  {/* Resource Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Files Section */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-blue-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <FaFileAlt className="text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Files
                        </h3>
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {resources.filter((r) => r.type === "file").length}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Live</span>
                        </div>
                      </div>
                      {resourcesLoading ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                          <p>Loading resources...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {resources
                            .filter((r) => r.type === "file")
                            .map((resource, index) => (
                              <div
                                key={resource.id}
                                className="bg-[#232a34] rounded-lg p-3 border border-blue-500/20"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-white truncate">
                                    {resource.name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        window.open(
                                          `${import.meta.env.VITE_API_URL}${
                                            resource.url
                                          }`,
                                          "_blank"
                                        )
                                      }
                                      className="text-blue-400 hover:text-blue-300 text-xs"
                                      title="View"
                                    >
                                      <FaEye />
                                    </button>
                                    <button
                                      onClick={() =>
                                        window.open(
                                          `${import.meta.env.VITE_API_URL}${
                                            resource.url
                                          }`,
                                          "_blank"
                                        )
                                      }
                                      className="text-green-400 hover:text-green-300 text-xs"
                                      title="Download"
                                    >
                                      <FaDownload />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteResource(resource.id)
                                      }
                                      className="text-red-400 hover:text-red-300 text-xs"
                                      title="Delete"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-1">
                                  {resource.description}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {resource.size &&
                                    `${(resource.size / 1024 / 1024).toFixed(
                                      2
                                    )} MB • `}
                                  Added:{" "}
                                  {new Date(
                                    resource.uploadedAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          {resources.filter((r) => r.type === "file").length ===
                            0 && (
                            <div className="text-center py-4 text-gray-400">
                              <FaFileAlt className="text-2xl mx-auto mb-2" />
                              <p className="text-sm">No files uploaded yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Links Section */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-purple-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <FaLink className="text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Links
                        </h3>
                        <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                          {resources.filter((r) => r.type === "link").length}
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Live</span>
                        </div>
                      </div>
                      {resourcesLoading ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
                          <p>Loading resources...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {resources
                            .filter((r) => r.type === "link")
                            .map((resource, index) => (
                              <div
                                key={resource.id}
                                className="bg-[#232a34] rounded-lg p-3 border border-purple-500/20"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-white truncate">
                                    {resource.name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        window.open(resource.url, "_blank")
                                      }
                                      className="text-purple-400 hover:text-purple-300 text-xs"
                                      title="Open Link"
                                    >
                                      <FaExternalLinkAlt />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteResource(resource.id)
                                      }
                                      className="text-red-400 hover:text-red-300 text-xs"
                                      title="Delete"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-1">
                                  {resource.description}
                                </p>
                                <div className="text-xs text-gray-500 truncate">
                                  {resource.url}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Added:{" "}
                                  {new Date(
                                    resource.uploadedAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          {resources.filter((r) => r.type === "link").length ===
                            0 && (
                            <div className="text-center py-4 text-gray-400">
                              <FaLink className="text-2xl mx-auto mb-2" />
                              <p className="text-sm">No links added yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Documents Section */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-yellow-500/10">
                      <div className="flex items-center gap-2 mb-4">
                        <FaFileAlt className="text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Documents
                        </h3>
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          {
                            resources.filter((r) => r.type === "document")
                              .length
                          }
                        </span>
                        <div className="flex items-center gap-1 ml-auto">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400">Live</span>
                        </div>
                      </div>
                      {resourcesLoading ? (
                        <div className="text-center py-8 text-gray-400">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                          <p>Loading resources...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {resources
                            .filter((r) => r.type === "document")
                            .map((resource, index) => (
                              <div
                                key={resource.id}
                                className="bg-[#232a34] rounded-lg p-3 border border-yellow-500/20"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-white truncate">
                                    {resource.name}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        window.open(
                                          `${import.meta.env.VITE_API_URL}${
                                            resource.url
                                          }`,
                                          "_blank"
                                        )
                                      }
                                      className="text-yellow-400 hover:text-yellow-300 text-xs"
                                      title="View"
                                    >
                                      <FaEye />
                                    </button>
                                    <button
                                      onClick={() =>
                                        window.open(
                                          `${import.meta.env.VITE_API_URL}${
                                            resource.url
                                          }`,
                                          "_blank"
                                        )
                                      }
                                      className="text-green-400 hover:text-green-300 text-xs"
                                      title="Download"
                                    >
                                      <FaDownload />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteResource(resource.id)
                                      }
                                      className="text-red-400 hover:text-red-300 text-xs"
                                      title="Delete"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-1">
                                  {resource.description}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {resource.size &&
                                    `${(resource.size / 1024 / 1024).toFixed(
                                      2
                                    )} MB • `}
                                  Added:{" "}
                                  {new Date(
                                    resource.uploadedAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          {resources.filter((r) => r.type === "document")
                            .length === 0 && (
                            <div className="text-center py-4 text-gray-400">
                              <FaFileAlt className="text-2xl mx-auto mb-2" />
                              <p className="text-sm">No documents added yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {resources.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FaFolderOpen className="text-4xl mx-auto mb-4" />
                      <p>No resources found for this project.</p>
                      <p className="text-sm">
                        Add files, links, and documents to help your team.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Tab */}
              {activeTab === "progress" && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Progress Analytics
                    </h2>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={loadWorkspace}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                      >
                        <FaSync className="text-xs" />
                        Refresh Data
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-400">
                          Live Updates
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-900/60 to-blue-700/40 rounded-2xl p-6 border border-blue-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <FaChartBar className="text-3xl text-blue-400" />
                        <span className="text-2xl font-bold text-blue-400">
                          {statistics?.tasks?.progressPercentage || 0}%
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Overall Progress
                      </h3>
                      <div className="w-full bg-blue-900/40 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              statistics?.tasks?.progressPercentage || 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        {statistics?.tasks?.completed || 0} of{" "}
                        {statistics?.tasks?.total || 0} tasks completed
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/60 to-green-700/40 rounded-2xl p-6 border border-green-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <FaCheckCircle className="text-3xl text-green-400" />
                        <span className="text-2xl font-bold text-green-400">
                          {statistics?.tasks?.completed || 0}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Completed Tasks
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {statistics?.tasks?.total || 0} total tasks
                      </p>
                      <div className="mt-2 text-xs text-green-300">
                        {statistics?.tasks?.total > 0
                          ? `${Math.round(
                              (statistics.tasks.completed /
                                statistics.tasks.total) *
                                100
                            )}% completion rate`
                          : "No tasks yet"}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900/60 to-yellow-700/40 rounded-2xl p-6 border border-yellow-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <FaClock className="text-3xl text-yellow-400" />
                        <span className="text-2xl font-bold text-yellow-400">
                          {statistics?.time?.totalActualHours || 0}h
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Time Spent
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {statistics?.time?.totalEstimatedHours || 0}h estimated
                      </p>
                      <div className="mt-2 text-xs text-yellow-300">
                        {statistics?.time?.efficiency !== undefined
                          ? `${Math.round(
                              statistics.time.efficiency
                            )}% efficiency`
                          : "No time data"}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/60 to-purple-700/40 rounded-2xl p-6 border border-purple-500/10">
                      <div className="flex items-center justify-between mb-4">
                        <FaUsers className="text-3xl text-purple-400" />
                        <span className="text-2xl font-bold text-purple-400">
                          {statistics?.team?.activeContributors || 0}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Active Contributors
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {statistics?.team?.totalMembers || 0} total members
                      </p>
                      <div className="mt-2 text-xs text-purple-300">
                        {getOnlineUsersCount(selectedProjectId)} currently online
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analytics Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Task Status Distribution */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-blue-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Task Status Distribution
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                            <span className="text-gray-300">Pending</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">
                              {statistics?.tasks?.pending || 0}
                            </span>
                            <span className="text-xs text-gray-400">
                              {statistics?.tasks?.total > 0
                                ? `${Math.round(
                                    (statistics.tasks.pending /
                                      statistics.tasks.total) *
                                      100
                                  )}%`
                                : "0%"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                            <span className="text-gray-300">In Progress</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">
                              {statistics?.tasks?.inProgress || 0}
                            </span>
                            <span className="text-xs text-gray-400">
                              {statistics?.tasks?.total > 0
                                ? `${Math.round(
                                    (statistics.tasks.inProgress /
                                      statistics.tasks.total) *
                                      100
                                  )}%`
                                : "0%"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <span className="text-gray-300">Completed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">
                              {statistics?.tasks?.completed || 0}
                            </span>
                            <span className="text-xs text-gray-400">
                              {statistics?.tasks?.total > 0
                                ? `${Math.round(
                                    (statistics.tasks.completed /
                                      statistics.tasks.total) *
                                      100
                                  )}%`
                                : "0%"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Review Tasks */}
                      <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                            <span className="text-gray-300">Review</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold">
                              {statistics?.tasks?.review || 0}
                            </span>
                            <span className="text-xs text-gray-400">
                              {statistics?.tasks?.total > 0
                                ? `${Math.round(
                                    (statistics.tasks.review /
                                      statistics.tasks.total) *
                                      100
                                  )}%`
                                : "0%"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-6">
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                          <span>Progress</span>
                          <span>
                            {statistics?.tasks?.progressPercentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                statistics?.tasks?.progressPercentage || 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Time Efficiency Analysis */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-green-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Time Efficiency Analysis
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Estimated Hours</span>
                          <span className="text-white font-semibold">
                            {statistics?.time?.totalEstimatedHours || 0}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Actual Hours</span>
                          <span className="text-white font-semibold">
                            {statistics?.time?.totalActualHours || 0}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Efficiency</span>
                          <span
                            className={`font-semibold ${
                              (statistics?.time?.efficiency || 0) > 100
                                ? "text-green-400"
                                : (statistics?.time?.efficiency || 0) > 80
                                ? "text-yellow-400"
                                : "text-red-400"
                            }`}
                          >
                            {statistics?.time?.efficiency !== undefined
                              ? `${Math.round(statistics.time.efficiency)}%`
                              : "N/A"}
                          </span>
                        </div>

                        {/* Efficiency Bar */}
                        <div className="mt-6">
                          <div className="flex justify-between text-xs text-gray-400 mb-2">
                            <span>Efficiency</span>
                            <span>
                              {statistics?.time?.efficiency !== undefined
                                ? `${Math.round(statistics.time.efficiency)}%`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                (statistics?.time?.efficiency || 0) > 100
                                  ? "bg-green-500"
                                  : (statistics?.time?.efficiency || 0) > 80
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  Math.max(
                                    statistics?.time?.efficiency || 0,
                                    0
                                  ),
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Performance Metrics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Team Activity */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-purple-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Team Activity
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">
                            Total Team Members
                          </span>
                          <span className="text-white font-semibold">
                            {statistics?.team?.totalMembers || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">
                            Active Contributors
                          </span>
                          <span className="text-white font-semibold">
                            {statistics?.team?.activeContributors || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">
                            Currently Online
                          </span>
                          <span className="text-green-400 font-semibold">
                            {getOnlineUsersCount(selectedProjectId)}
                          </span>
                        </div>

                        {/* Online Users */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">
                            Online Team Members
                          </h4>
                          <div className="space-y-2">
                            {onlineUsers.slice(0, 5).map((user, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-sm text-white">
                                  {user.username}
                                </span>
                              </div>
                            ))}
                            {getOnlineUsersCount(selectedProjectId) === 0 && (
                              <span className="text-sm text-gray-400">
                                No team members online
                              </span>
                            )}
                            {getOnlineUsersCount(selectedProjectId) > 5 && (
                              <span className="text-sm text-gray-400">
                                +{getOnlineUsersCount(selectedProjectId) - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task Priority Distribution */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-yellow-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Task Priority Distribution
                      </h3>
                      <div className="space-y-4">
                        {(() => {
                          const priorityStats = {
                            urgent: tasks.filter((t) => t.priority === "urgent")
                              .length,
                            high: tasks.filter((t) => t.priority === "high")
                              .length,
                            medium: tasks.filter((t) => t.priority === "medium")
                              .length,
                            low: tasks.filter((t) => t.priority === "low")
                              .length,
                          };

                          return Object.entries(priorityStats).map(
                            ([priority, count]) => (
                              <div
                                key={priority}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      priority === "urgent"
                                        ? "bg-red-400"
                                        : priority === "high"
                                        ? "bg-orange-400"
                                        : priority === "medium"
                                        ? "bg-yellow-400"
                                        : "bg-blue-400"
                                    }`}
                                  ></div>
                                  <span className="text-gray-300 capitalize">
                                    {priority}
                                  </span>
                                </div>
                                <span className="text-white font-semibold">
                                  {count}
                                </span>
                              </div>
                            )
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Project Timeline and Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Recent Activity Timeline */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-purple-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Recent Activity Timeline
                      </h3>
                      <div className="space-y-4">
                        {notifications
                          .slice(0, 8)
                          .map((notification, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-4 p-4 bg-[#232a34] rounded-lg border border-purple-500/20"
                            >
                              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-white">
                                    {notification.title}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      notification.type === "task_created"
                                        ? "bg-green-900/40 text-green-400"
                                        : notification.type ===
                                          "task_status_changed"
                                        ? "bg-blue-900/40 text-blue-400"
                                        : notification.type === "task_completed"
                                        ? "bg-purple-900/40 text-purple-400"
                                        : "bg-gray-900/40 text-gray-400"
                                    }`}
                                  >
                                    {notification.type
                                      ?.replace("_", " ")
                                      .toUpperCase() || "ACTIVITY"}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-sm mb-2">
                                  {notification.message}
                                </p>
                                <div className="text-xs text-gray-500">
                                  {notification.createdAt?.toDate?.()
                                    ? new Date(
                                        notification.createdAt.toDate()
                                      ).toLocaleString()
                                    : new Date(
                                        notification.createdAt
                                      ).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        {notifications.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <FaChartBar className="text-3xl mx-auto mb-4" />
                            <p className="text-lg font-medium mb-2">
                              No Recent Activity
                            </p>
                            <p className="text-sm">
                              Activity will appear here as team members work on
                              tasks
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Project Milestones */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-yellow-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Project Milestones
                      </h3>
                      <div className="space-y-4">
                        {/* Project Start */}
                        <div className="flex items-center gap-4 p-4 bg-[#232a34] rounded-lg border border-green-500/20">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">
                                Project Started
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-400">
                                COMPLETED
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">
                              Project workspace created and team assembled
                            </p>
                            <div className="text-xs text-gray-500 mt-1">
                              {statistics?.realTime?.lastUpdated
                                ? new Date(
                                    statistics.realTime.lastUpdated
                                  ).toLocaleDateString()
                                : "Recently"}
                            </div>
                          </div>
                        </div>

                        {/* First Task Completed */}
                        {statistics?.tasks?.completed > 0 && (
                          <div className="flex items-center gap-4 p-4 bg-[#232a34] rounded-lg border border-green-500/20">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">
                                  First Task Completed
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-400">
                                  COMPLETED
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">
                                Project development officially began
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 25% Progress */}
                        {statistics?.tasks?.progressPercentage >= 25 && (
                          <div className="flex items-center gap-4 p-4 bg-[#232a34] rounded-lg border border-green-500/20">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">
                                  25% Progress Milestone
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-400">
                                  COMPLETED
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">
                                Quarter of the project completed
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 50% Progress */}
                        {statistics?.tasks?.progressPercentage >= 50 && (
                          <div className="flex items-center gap-4 p-4 bg-[#232a34] rounded-lg border border-green-500/20">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">
                                  50% Progress Milestone
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-400">
                                  COMPLETED
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">
                                Halfway through the project
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 75% Progress */}
                        {statistics?.tasks?.progressPercentage >= 75 && (
                          <div className="flex items-center gap-4 p-4 bg-[#232a34] rounded-lg border border-green-500/20">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">
                                  75% Progress Milestone
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-400">
                                  COMPLETED
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">
                                Project nearing completion
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 100% Progress */}
                        {statistics?.tasks?.progressPercentage >= 100 && (
                          <div className="flex items-center gap-4 p-4 bg-[#232a34] rounded-lg border border-green-500/20">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">
                                  Project Completed
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-900/40 text-green-400">
                                  COMPLETED
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">
                                All tasks finished successfully
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Next Milestone */}
                        {statistics?.tasks?.progressPercentage < 100 && (
                          <div className="flex items-center gap-4 p-4 bg-[#232a34] rounded-lg border border-yellow-500/20">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">
                                  Next Milestone
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-900/40 text-yellow-400">
                                  IN PROGRESS
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">
                                {statistics?.tasks?.progressPercentage < 25
                                  ? "25% Progress"
                                  : statistics?.tasks?.progressPercentage < 50
                                  ? "50% Progress"
                                  : statistics?.tasks?.progressPercentage < 75
                                  ? "75% Progress"
                                  : "100% Completion"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance Insights and Recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quick Actions */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-blue-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Quick Actions
                      </h3>
                      <div className="space-y-3">
                        <button
                          onClick={openAddModal}
                          className="w-full flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <FaPlus className="text-sm" />
                          Create New Task
                        </button>
                        <button
                          onClick={() => setShowResourceModal(true)}
                          className="w-full flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <FaUpload className="text-sm" />
                          Add Resource
                        </button>
                        <button
                          onClick={loadWorkspace}
                          className="w-full flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <FaSync className="text-sm" />
                          Refresh Data
                        </button>
                      </div>
                    </div>

                    {/* Project Health */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-green-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Project Health
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Overall Status</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              (statistics?.tasks?.progressPercentage || 0) >= 80
                                ? "bg-green-900/40 text-green-400"
                                : (statistics?.tasks?.progressPercentage ||
                                    0) >= 50
                                ? "bg-yellow-900/40 text-yellow-400"
                                : "bg-red-900/40 text-red-400"
                            }`}
                          >
                            {statistics?.tasks?.progressPercentage >= 80
                              ? "HEALTHY"
                              : statistics?.tasks?.progressPercentage >= 50
                              ? "MODERATE"
                              : "NEEDS ATTENTION"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Team Activity</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              getOnlineUsersCount(selectedProjectId) > 0
                                ? "bg-green-900/40 text-green-400"
                                : "bg-gray-900/40 text-gray-400"
                            }`}
                          >
                            {getOnlineUsersCount(selectedProjectId) > 0 ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Time Efficiency</span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              (statistics?.time?.efficiency || 0) > 100
                                ? "bg-green-900/40 text-green-400"
                                : (statistics?.time?.efficiency || 0) > 80
                                ? "bg-yellow-900/40 text-yellow-400"
                                : "bg-red-900/40 text-red-400"
                            }`}
                          >
                            {statistics?.time?.efficiency > 100
                              ? "EXCELLENT"
                              : statistics?.time?.efficiency > 80
                              ? "GOOD"
                              : "NEEDS IMPROVEMENT"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights & Recommendations */}
                    <div className="bg-[#181b23] rounded-xl p-6 border border-purple-500/10">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        AI Insights
                      </h3>
                      <div className="space-y-3">
                        {/* Progress Insights */}
                        {statistics?.tasks?.progressPercentage < 30 && (
                          <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FaExclamationTriangle className="text-yellow-400 text-sm" />
                              <span className="text-sm font-medium text-yellow-400">
                                Low Progress
                              </span>
                            </div>
                            <p className="text-xs text-gray-300">
                              Consider breaking down tasks into smaller,
                              manageable pieces
                            </p>
                          </div>
                        )}

                        {statistics?.tasks?.progressPercentage > 70 && (
                          <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FaCheckCircle className="text-green-400 text-sm" />
                              <span className="text-sm font-medium text-green-400">
                                Great Progress
                              </span>
                            </div>
                            <p className="text-xs text-gray-300">
                              Project is on track! Keep up the momentum
                            </p>
                          </div>
                        )}

                        {/* Team Insights */}
                        {getOnlineUsersCount(selectedProjectId) === 0 && (
                          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FaUsers className="text-blue-400 text-sm" />
                              <span className="text-sm font-medium text-blue-400">
                                Team Activity
                              </span>
                            </div>
                            <p className="text-xs text-gray-300">
                              No team members online. Consider scheduling team
                              meetings
                            </p>
                          </div>
                        )}

                        {/* Time Management Insights */}
                        {(statistics?.time?.efficiency || 0) < 80 && (
                          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FaClock className="text-red-400 text-sm" />
                              <span className="text-sm font-medium text-red-400">
                                Time Management
                              </span>
                            </div>
                            <p className="text-xs text-gray-300">
                              Tasks are taking longer than estimated. Review
                              task complexity
                            </p>
                          </div>
                        )}

                        {/* General Recommendations */}
                        <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <FaRobot className="text-purple-400 text-sm" />
                            <span className="text-sm font-medium text-purple-400">
                              Recommendations
                            </span>
                          </div>
                          <ul className="text-xs text-gray-300 space-y-1">
                            <li>
                              • Regular team check-ins improve collaboration
                            </li>
                            <li>• Break complex tasks into smaller subtasks</li>
                            <li>
                              • Set realistic deadlines for better time
                              management
                            </li>
                            <li>
                              • Use the chat feature for quick communication
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Status Footer */}
                  <div className="mt-8 bg-[#181b23] rounded-xl p-4 border border-blue-500/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-400">
                            Live Updates Active
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Last updated:{" "}
                          {statistics?.realTime?.lastUpdated
                            ? new Date(
                                statistics.realTime.lastUpdated
                              ).toLocaleTimeString()
                            : "Just now"}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{getOnlineUsersCount(selectedProjectId)} team members online</span>
                        <span>{notifications.length} total activities</span>
                        <span>
                          {Object.keys(activeTimeTracking).length} active timers
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat Tab */}
              {activeTab === "chat" && (
                <div className="h-[600px]">
                  {selectedProjectId ? (
                    <ProjectChat
                      projectId={selectedProjectId}
                      projectTitle={
                        projects.find((p) => p._id === selectedProjectId)
                          ?.title || "Project Chat"
                      }
                      onClose={() => setActiveTab("tasks")}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FaComments className="text-6xl text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No Project Selected
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Please select a project to start chatting with your team
                      </p>
                      <button
                        onClick={() => setActiveTab("tasks")}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Select Project
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Resource Modal */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-md border border-blue-500/20">
              <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">
                Add New Resource
              </h2>
              <form onSubmit={handleResourceSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Resource Name
                    </label>
                    <input
                      type="text"
                      value={resourceForm.name}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      placeholder="Enter resource name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Resource Type
                    </label>
                    <select
                      value={resourceForm.type}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          type: e.target.value,
                          file: null,
                          url: "",
                        })
                      }
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                    >
                      <option value="file">File</option>
                      <option value="link">Link</option>
                      <option value="document">Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {resourceForm.type === "link" ? "URL" : "File Upload"}
                    </label>
                    {resourceForm.type === "link" ? (
                      <input
                        type="url"
                        value={resourceForm.url}
                        onChange={(e) =>
                          setResourceForm({
                            ...resourceForm,
                            url: e.target.value,
                          })
                        }
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                        placeholder="Enter URL"
                        required
                      />
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="file"
                          onChange={(e) =>
                            setResourceForm({
                              ...resourceForm,
                              file: e.target.files[0],
                            })
                          }
                          className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                          required
                          accept={
                            resourceForm.type === "document"
                              ? ".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                              : "image/*,.pdf,.doc,.docx,.txt,.csv,.zip,.rar"
                          }
                        />
                        {resourceForm.file && (
                          <div className="text-xs text-gray-400">
                            Selected: {resourceForm.file.name} (
                            {(resourceForm.file.size / 1024 / 1024).toFixed(2)}{" "}
                            MB)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={resourceForm.description}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      rows="3"
                      placeholder="Enter resource description"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Resource
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResourceModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#232a34] rounded-2xl p-8 w-full max-w-md border border-blue-500/20">
              <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">
                {editTask ? "Edit Task" : "Create New Task"}
              </h2>
              <form onSubmit={handleEnhancedTaskSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, title: e.target.value })
                      }
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={taskForm.desc}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, desc: e.target.value })
                      }
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      rows="3"
                      placeholder="Enter task description"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, priority: e.target.value })
                        }
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) =>
                          setTaskForm({ ...taskForm, dueDate: e.target.value })
                        }
                        className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      value={taskForm.estimatedHours}
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          estimatedHours: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none"
                      min="0"
                      step="0.5"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {editTask ? "Update Task" : "Create Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Create a safer wrapper component to prevent initialization issues
const AdminContributionBoardWrapper = (props) => {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState(null);
  
  useEffect(() => {
    // Use a more robust initialization check
    const initializeComponent = () => {
      try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
          setInitError('Not in browser environment');
          return;
        }
        
        // Check if required globals are available
        if (!window.location || !window.document) {
          setInitError('Required browser APIs not available');
          return;
        }
        
        // Additional delay to ensure all modules are loaded
        setTimeout(() => {
      setIsReady(true);
    }, 500);
    
      } catch (error) {
        console.error("Component wrapper initialization error:", error);
        setInitError(error.message);
      }
    };
    
    // Start initialization
    initializeComponent();
  }, []);
  
  // Add additional safety check to prevent initialization errors
  try {
    if (initError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <div className="text-red-400 text-lg mb-3">Initialization Error</div>
              <p className="text-gray-300 mb-4">{initError}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
              >
                <FaSync className="w-4 h-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    if (!isReady) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-blue-400 text-lg">Initializing Project Management...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <AdminContributionBoardErrorBoundary>
        <AdminContributionBoard {...props} />
      </AdminContributionBoardErrorBoundary>
    );
  } catch (error) {
    console.error("Critical error in AdminContributionBoard wrapper:", error);

    // Check if this is the 'Me' initialization error
    if (
      error.message &&
      error.message.includes("Cannot access") &&
      error.message.includes("before initialization")
    ) {
      console.error(
        "Detected temporal dead zone error in wrapper - likely minified variable issue"
      );
      console.error("Error details:", error);
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0f0f] to-[#1a1a2e] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="text-red-400 text-lg mb-3">Critical Error</div>
            <p className="text-gray-300 mb-4">
              A critical error occurred while loading the Project Management
              component. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
            >
              <FaSync className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default AdminContributionBoardWrapper;
