import io from 'socket.io-client';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentProjectId = null;
    this.messageHandlers = new Map();
    this.typingHandlers = new Map();
    this.userHandlers = new Map();
    this.activityTimeout = null;
    this.lastActivitySent = null;
    this.onlineUsersCache = new Map(); // Cache online users per project
    this.lastOnlineUpdate = new Map(); // Track last update time per project
  }

  // Initialize socket connection with retry logic
  connect(token, retryCount = 0) {
    if (this.socket && this.isConnected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Add safety check for token
        if (!token) {
          reject(new Error('No authentication token provided'));
          return;
        }

        console.log(`🔄 Attempting socket connection (attempt ${retryCount + 1})...`);

        this.socket = io(API_BASE_URL, {
          auth: {
            token
          },
          transports: ['websocket', 'polling'],
          timeout: 15000, // 15 second timeout
          forceNew: true, // Force new connection
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        });

        // Set up connection timeout
        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            console.error('❌ Socket.IO connection timeout');
            this.socket?.disconnect();
            if (retryCount < 2) {
              console.log(`🔄 Retrying connection (${retryCount + 1}/3)...`);
              setTimeout(() => {
                this.connect(token, retryCount + 1).then(resolve).catch(reject);
              }, 2000);
            } else {
              reject(new Error('Connection timeout after 3 attempts'));
            }
          }
        }, 15000);

        this.socket.on('connect', () => {
          console.log('✅ Socket.IO connected successfully');
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('❌ Socket.IO disconnected:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection error:', error);
          clearTimeout(connectionTimeout);
          this.isConnected = false;
          
          if (retryCount < 2) {
            console.log(`🔄 Retrying connection due to error (${retryCount + 1}/3)...`);
            setTimeout(() => {
              this.connect(token, retryCount + 1).then(resolve).catch(reject);
            }, 2000);
          } else {
            reject(error);
          }
        });

        // Set up message handlers
        this.setupMessageHandlers();
      } catch (error) {
        console.error('❌ Error creating socket connection:', error);
        reject(error);
      }
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentProjectId = null;
    }
    
    // Clear timeouts and cache
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
    this.lastActivitySent = null;
    this.onlineUsersCache.clear();
    this.lastOnlineUpdate.clear();
  }

  // Join project chat room with better error handling
  joinProject(projectId, userId, username) {
    return new Promise((resolve, reject) => {
      // Add safety checks
      if (!projectId || !userId) {
        reject(new Error('Missing required parameters for joining project'));
        return;
      }

      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'));
        return;
      }

      try {
        console.log(`🔄 Joining project room: ${projectId} for user: ${userId}`);
        this.currentProjectId = projectId;
        
        // Set up a timeout for join room response
        const joinTimeout = setTimeout(() => {
          reject(new Error('Join room timeout'));
        }, 10000);

        // Listen for join confirmation
        const onJoinSuccess = () => {
          clearTimeout(joinTimeout);
          this.socket.off('joinRoomSuccess', onJoinSuccess);
          this.socket.off('error', onJoinError);
          console.log(`✅ Successfully joined project room: ${projectId}`);
          resolve();
        };

        const onJoinError = (error) => {
          clearTimeout(joinTimeout);
          this.socket.off('joinRoomSuccess', onJoinSuccess);
          this.socket.off('error', onJoinError);
          console.error('❌ Error joining project room:', error);
          reject(new Error(error.message || 'Failed to join project room'));
        };

        // Set up temporary listeners
        this.socket.once('joinRoomSuccess', onJoinSuccess);
        this.socket.once('error', onJoinError);

        // Emit join room request
        this.socket.emit('joinRoom', { projectId, userId, username });
      } catch (error) {
        console.error('❌ Error joining project room:', error);
        reject(error);
      }
    });
  }

  // Test database connection
  testConnection() {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('testConnection');
      
      const timeout = setTimeout(() => {
        reject(new Error('Connection test timeout'));
      }, 5000);

      this.socket.once('connectionTest', (result) => {
        clearTimeout(timeout);
        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(result.message));
        }
      });
    });
  }

  // Leave current project room
  leaveProject() {
    if (this.socket && this.currentProjectId) {
      this.socket.emit('leaveRoom', { projectId: this.currentProjectId });
      this.currentProjectId = null;
    }
  }

  // Send message
  sendMessage(text, messageType = 'text', fileData = null) {
    if (!this.socket || !this.isConnected || !this.currentProjectId) {
      throw new Error('Socket not connected or no project joined');
    }

    const messageData = {
      projectId: this.currentProjectId,
      text,
      messageType
    };

    if (fileData) {
      Object.assign(messageData, fileData);
    }

    this.socket.emit('sendMessage', messageData);
  }

  // Edit message
  editMessage(messageId, newText) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('editMessage', { messageId, newText });
  }

  // Delete message
  deleteMessage(messageId) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('deleteMessage', { messageId });
  }

  // Send typing indicator
  sendTypingIndicator(isTyping) {
    if (!this.socket || !this.isConnected || !this.currentProjectId) {
      return;
    }

    this.socket.emit('typing', { projectId: this.currentProjectId, isTyping });
  }

  // Send user activity with debouncing
  sendUserActivity() {
    if (!this.socket || !this.isConnected || !this.currentProjectId) {
      return;
    }

    // Clear existing timeout to debounce activity updates
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    // Send activity immediately for first call, then debounce subsequent calls
    if (!this.lastActivitySent) {
      this.socket.emit('userActivity', { projectId: this.currentProjectId });
      this.lastActivitySent = Date.now();
    } else {
      // Debounce activity updates to avoid spam
      this.activityTimeout = setTimeout(() => {
        this.socket.emit('userActivity', { projectId: this.currentProjectId });
        this.lastActivitySent = Date.now();
      }, 2000); // 2 second debounce
    }
  }

  // Set up message handlers
  setupMessageHandlers() {
    if (!this.socket) return;

    // Handle incoming messages
    this.socket.on('receiveMessage', (message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    // Handle message edits
    this.socket.on('messageEdited', (message) => {
      this.messageHandlers.forEach(handler => handler(message, 'edited'));
    });

    // Handle message deletions
    this.socket.on('messageDeleted', (data) => {
      this.messageHandlers.forEach(handler => handler(data, 'deleted'));
    });

    // Handle typing indicators
    this.socket.on('userTyping', (data) => {
      this.typingHandlers.forEach(handler => handler(data));
    });

    // Handle user join/leave events
    this.socket.on('userJoined', (data) => {
      this.userHandlers.forEach(handler => handler(data, 'joined'));
    });

    this.socket.on('userLeft', (data) => {
      this.userHandlers.forEach(handler => handler(data, 'left'));
    });

    this.socket.on('onlineUsers', (users) => {
      // Cache online users for this project
      if (this.currentProjectId) {
        this.onlineUsersCache.set(this.currentProjectId, users);
        this.lastOnlineUpdate.set(this.currentProjectId, Date.now());
      }
      this.userHandlers.forEach(handler => handler(users, 'online'));
    });

    // Handle errors
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      // Emit error to any error handlers
      if (this.errorHandler) {
        this.errorHandler(error);
      }
    });

    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (this.errorHandler) {
        this.errorHandler(error);
      }
    });
  }

  // Add message handler
  onMessage(handler) {
    const id = Date.now() + Math.random();
    this.messageHandlers.set(id, handler);
    return () => this.messageHandlers.delete(id);
  }

  // Add typing handler
  onTyping(handler) {
    const id = Date.now() + Math.random();
    this.typingHandlers.set(id, handler);
    return () => this.typingHandlers.delete(id);
  }

  // Add user handler
  onUserEvent(handler) {
    const id = Date.now() + Math.random();
    this.userHandlers.set(id, handler);
    return () => this.userHandlers.delete(id);
  }

  // Add error handler
  onError(handler) {
    this.errorHandler = handler;
  }

  // API Methods
  async getProjectMessages(projectId, page = 1, limit = 50) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/chat/${projectId}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async getOnlineUsers(projectId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/chat/${projectId}/online-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  }

  // Get cached online users for immediate display
  getCachedOnlineUsers(projectId) {
    const cached = this.onlineUsersCache.get(projectId);
    const lastUpdate = this.lastOnlineUpdate.get(projectId);
    
    // Return cached data if it's less than 10 seconds old
    if (cached && lastUpdate && (Date.now() - lastUpdate) < 10000) {
      return cached;
    }
    
    return [];
  }

  async uploadFile(file, projectId) {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      const response = await axios.post(`${API_BASE_URL}/api/upload/chat-file`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

// Create singleton instance
const chatService = new ChatService();
export default chatService;
