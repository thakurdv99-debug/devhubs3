import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaUser,
  FaCalendar,
  FaChartBar,
  FaSync,
  FaFilter,
  FaSearch,
  FaRegStickyNote,
  FaUsers,
  FaBell
} from 'react-icons/fa';
import { notificationService } from '@shared/services/notificationService';
import { projectTaskApi } from '@features/tasks/services/projectTaskApi';

// Firebase imports for real-time updates
// import { db } from "../Config/firebase";
// import { 
//   collection, 
//   onSnapshot, 
//   query, 
//   where,
//   orderBy
// } from "firebase/firestore";

const AdminTaskManager = ({ projectId, teamMembers = [] }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updatingTask, setUpdatingTask] = useState(false);
  
  // Task filters
  const [taskFilters, setTaskFilters] = useState({
    status: 'all',
    priority: 'all',
    assignedTo: 'all',
    search: ''
  });

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assignedTo: '',
    estimatedHours: 0
  });

  // Load tasks on component mount
  useEffect(() => {
    if (projectId) {
      loadTasks();
      // Temporarily disable Firebase listener to use API data
      // setupRealtimeListener();
    }
  }, [projectId]);

  // Setup real-time task listener (temporarily disabled)
  // const setupRealtimeListener = () => {
  //   try {
  //     const tasksQuery = query(
  //       collection(db, 'project_tasks'),
  //       where('projectId', '==', projectId),
  //       where('deleted', '!=', true),
  //       orderBy('createdAt', 'desc')
  //     );

  //     const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
  //       const updatedTasks = [];
  //       snapshot.forEach((doc) => {
  //         const data = doc.data();
  //         updatedTasks.push({
  //           id: data.id,
  //           title: data.title,
  //           description: data.description,
  //           status: data.status,
  //           priority: data.priority,
  //           assignedTo: data.assignedTo,
  //           createdBy: data.createdBy,
  //           createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
  //           dueDate: data.dueDate?.toDate?.() || data.dueDate,
  //           estimatedHours: data.estimatedHours || 0,
  //           actualHours: data.actualHours || 0,
  //           completionNotes: data.completionNotes,
  //           completedAt: data.completedAt?.toDate?.() || data.completedAt,
  //           progress: data.progress || 0
  //         });
  //       });
  //       setTasks(updatedTasks);
  //       setLoading(false);
  //     }, (error) => {
  //       console.error('Firebase task listener error:', error);
  //       setError('Failed to load real-time task updates');
  //       setLoading(false);
  //     });

  //     return unsubscribe;
  //   } catch (error) {
  //     console.error('Error setting up task listener:', error);
  //     setError('Failed to setup real-time updates');
  //     setLoading(false);
  //   }
  // };

  // Load tasks from API
  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await projectTaskApi.getProjectTasks(projectId);
      setTasks(data.tasks || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on current filters
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = taskFilters.status === 'all' || task.status === taskFilters.status;
    const matchesPriority = taskFilters.priority === 'all' || task.priority === taskFilters.priority;
    const matchesAssignedTo = taskFilters.assignedTo === 'all' || task.assignedTo === taskFilters.assignedTo;
    const matchesSearch = taskFilters.search === '' || 
      task.title.toLowerCase().includes(taskFilters.search.toLowerCase()) ||
      task.description.toLowerCase().includes(taskFilters.search.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesAssignedTo && matchesSearch;
  });

  // Create new task
  const handleCreateTask = async () => {
    try {
      setUpdatingTask(true);
      setError(null);
      
      await projectTaskApi.createTask(projectId, taskForm);
      notificationService.success('Task created successfully!');
      setShowAddModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        assignedTo: '',
        estimatedHours: 0
      });
    } catch (err) {
      setError(err.message || 'Failed to create task');
      notificationService.error(err.message || 'Failed to create task');
    } finally {
      setUpdatingTask(false);
    }
  };

  // Review task (Admin only)
  const handleReviewTask = async (taskId, reviewNotes = "", approved = true) => {
    try {
      setUpdatingTask(true);
      setError(null);
      
      await projectTaskApi.reviewTask(projectId, taskId, { reviewNotes, approved });
      notificationService.success("Task reviewed successfully!");
      
      // Refresh tasks
      await loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to review task');
      notificationService.error(err.message || 'Failed to review task');
    } finally {
      setUpdatingTask(false);
    }
  };

  // Edit task
  const handleEditTask = async () => {
    try {
      setUpdatingTask(true);
      setError(null);
      
      await projectTaskApi.updateTask(projectId, selectedTask.id, taskForm);
      notificationService.success('Task updated successfully!');
      setShowEditModal(false);
      setSelectedTask(null);
    } catch (err) {
      setError(err.message || 'Failed to update task');
      notificationService.error(err.message || 'Failed to update task');
    } finally {
      setUpdatingTask(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setUpdatingTask(true);
      setError(null);
      
      await projectTaskApi.deleteTask(projectId, taskId);
      notificationService.success('Task deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete task');
      notificationService.error(err.message || 'Failed to delete task');
    } finally {
      setUpdatingTask(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', icon: FaClock },
      in_progress: { color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: FaSync },
      completed: { color: 'bg-green-500/20 text-green-400 border border-green-500/30', icon: FaCheckCircle },
      reviewed: { color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: FaCheckCircle },
      cancelled: { color: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: FaExclamationTriangle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
      medium: { color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
      high: { color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
      urgent: { color: 'bg-red-500/20 text-red-400 border border-red-500/30' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  // Enhanced Task Card Component
  const EnhancedTaskCard = ({ task, onDelete }) => {
    const assignedMember = teamMembers.find(member => member.id === task.assignedTo);
    
    return (
      <div className="bg-[#181b23] border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:border-blue-500/30 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-white text-lg">{task.title}</h3>
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
            
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
              {assignedMember && (
                <div className="flex items-center">
                  <FaUser className="w-3 h-3 mr-1" />
                  <span>{assignedMember.name}</span>
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
            
            {/* Progress Bar */}
            {task.progress > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Completion Notes */}
            {task.completionNotes && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-2 mb-3">
                <p className="text-xs text-green-300">
                  <strong>Notes:</strong> {task.completionNotes}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedTask(task);
                setTaskForm({
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                  assignedTo: task.assignedTo,
                  estimatedHours: task.estimatedHours
                });
                setShowEditModal(true);
              }}
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
            {/* Admin can only review completed tasks */}
            {task.status === 'completed' && (
              <button
                onClick={() => handleReviewTask(task.id)}
                disabled={updatingTask}
                className="flex items-center px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-500/30 disabled:opacity-50 transition-colors text-sm"
                title="Review Task"
              >
                <FaCheckCircle className="w-3 h-3 mr-1" />
                Review Task
              </button>
            )}
            
            {/* Show current status info */}
            <span className="text-xs text-gray-400">
              {task.status === 'pending' && 'Waiting for user to start'}
              {task.status === 'in_progress' && 'User is working on this task'}
              {task.status === 'completed' && 'User has completed the task'}
              {task.status === 'reviewed' && 'Task has been reviewed'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        <FaExclamationTriangle className="text-4xl mx-auto mb-4" />
        <p className="font-semibold mb-2">Error loading tasks</p>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={loadTasks}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Project Tasks</h2>
          <p className="text-gray-400 mt-1">Real-time task management and progress tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">Live Updates</span>
          </div>
          <button
            onClick={loadTasks}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
            title="Refresh Tasks"
          >
            <FaSync className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaPlus />
            Add Task
          </button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20 text-center">
          <div className="text-2xl font-bold text-blue-400">{tasks.length}</div>
          <div className="text-sm text-gray-400">Total Tasks</div>
        </div>
        <div className="bg-[#181b23] rounded-lg p-4 border border-yellow-500/20 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {tasks.filter(t => t.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className="bg-[#181b23] rounded-lg p-4 border border-purple-500/20 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-400">In Progress</div>
        </div>
        <div className="bg-[#181b23] rounded-lg p-4 border border-green-500/20 text-center">
          <div className="text-2xl font-bold text-green-400">
            {tasks.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
        <div className="bg-[#181b23] rounded-lg p-4 border border-emerald-500/20 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {tasks.filter(t => t.status === 'reviewed').length}
          </div>
          <div className="text-sm text-gray-400">Reviewed</div>
        </div>
      </div>

      {/* Project Progress Overview */}
      <div className="bg-[#181b23] rounded-lg p-4 border border-blue-500/20">
        <h3 className="text-lg font-semibold text-white mb-3">Project Progress</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Overall Progress</span>
              <span>{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Tasks Completed</div>
            <div className="text-lg font-bold text-white">
              {tasks.filter(t => t.status === 'completed').length} / {tasks.length}
            </div>
          </div>
        </div>
      </div>

      {/* Task Filters */}
      <div className="bg-[#181b23] rounded-lg p-4 border border-gray-600">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Task Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select
              value={taskFilters.status}
              onChange={(e) => setTaskFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
            <select
              value={taskFilters.priority}
              onChange={(e) => setTaskFilters(prev => ({ ...prev, priority: e.target.value }))}
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Assigned To</label>
            <select
              value={taskFilters.assignedTo}
              onChange={(e) => setTaskFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskFilters.search}
                onChange={(e) => setTaskFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <EnhancedTaskCard 
            key={task.id} 
            task={task} 
            onDelete={handleDeleteTask}
            teamMembers={teamMembers}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <FaRegStickyNote className="text-4xl mx-auto mb-4" />
          <p>No tasks found matching your filters.</p>
          <p className="text-sm">Try adjusting your search criteria or create a new task.</p>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Team Member</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateTask}
                disabled={updatingTask || !taskForm.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingTask ? 'Creating...' : 'Create Task'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Assign To</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Team Member</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleEditTask}
                disabled={updatingTask || !taskForm.title.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingTask ? 'Updating...' : 'Update Task'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTask(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaskManager;
