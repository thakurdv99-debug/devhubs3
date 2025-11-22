import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Edit, 
  Trash2, 
  User, 
  Crown, 
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Image,
  Download,
  X
} from 'lucide-react';
import { useAuth } from '@app/providers/AuthProvider';
import { useChat } from '../context/ChatContext';
import chatService from '../services/chatService';
import { notificationService } from '@shared/services/notificationService';
import ChatErrorBoundary from './ChatErrorBoundary';

const ProjectChat = ({ projectId, projectTitle, onClose }) => {
  // Initialize auth hook - must be called unconditionally
  const { user } = useAuth();
  const { joinProject, onlineUsers, isConnected } = useChat();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageMenu, setMessageMenu] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle new messages
  const handleNewMessage = useCallback((message, type = 'new') => {
    if (type === 'edited') {
      setMessages(prev => prev.map(msg => 
        msg._id === message._id ? message : msg
      ));
    } else if (type === 'deleted') {
      setMessages(prev => prev.filter(msg => msg._id !== message.messageId));
    } else {
      setMessages(prev => [...prev, message]);
    }
  }, []);

  // Handle typing indicators
  const handleTyping = useCallback((data) => {
    if (data.isTyping) {
      setTypingUsers(prev => new Set(prev).add(data.username));
    } else {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    }
  }, []);

  // Handle user events with optimized updates
  const handleUserEvent = useCallback((data, eventType) => {
    console.log('🔄 ProjectChat: User event received:', { data, eventType });
    if (eventType === 'joined') {
      notificationService.success(`${data.username} joined the chat`);
    } else if (eventType === 'left') {
      notificationService.info(`${data.username} left the chat`);
    }
    // Online status is now handled by the shared ChatContext
  }, []);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize chat with retry logic
  useEffect(() => {
    if (!projectId || !user) return;

    const initializeChat = async (retryCount = 0) => {
      try {
        setLoading(true);
        console.log(`🔄 Initializing chat for project ${projectId} (attempt ${retryCount + 1})`);
        
        // Join project room using shared context
        await joinProject(projectId);
        
        // Load existing messages
        const response = await chatService.getProjectMessages(projectId);
        setMessages(response.messages || []);
        
        // Set up event listeners
        const unsubscribeMessage = chatService.onMessage(handleNewMessage);
        const unsubscribeTyping = chatService.onTyping(handleTyping);
        const unsubscribeUser = chatService.onUserEvent(handleUserEvent);
        
        // Set up error handler
        chatService.onError((error) => {
          console.error('Chat service error:', error);
          notificationService.error(error.message || 'Chat connection error');
        });
        
        setLoading(false);
        console.log(`✅ Chat initialized successfully for project ${projectId}`);
        
        return () => {
          unsubscribeMessage();
          unsubscribeTyping();
          unsubscribeUser();
        };
      } catch (error) {
        console.error(`❌ Failed to initialize chat (attempt ${retryCount + 1}):`, error);
        
        if (retryCount < 2) {
          console.log(`🔄 Retrying chat initialization in 3 seconds...`);
          setTimeout(() => {
            initializeChat(retryCount + 1);
          }, 3000);
        } else {
          setConnectionError(error.message || 'Failed to connect to chat');
          notificationService.error('Failed to connect to chat after multiple attempts');
          setLoading(false);
        }
      }
    };

    initializeChat();

    // Listen for retry events
    const handleRetry = () => {
      if (connectionError) {
        initializeChat();
      }
    };

    window.addEventListener('retry-chat-connection', handleRetry);

    return () => {
      window.removeEventListener('retry-chat-connection', handleRetry);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user, joinProject, handleNewMessage, handleTyping, handleUserEvent]); // Removed connectionError to prevent infinite loop

  // Handle typing
  const handleTypingChange = useCallback((e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      chatService.sendTypingIndicator(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      chatService.sendTypingIndicator(false);
    }, 1000);
  }, [isTyping]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    
    try {
      setSending(true);
      
      let messageType = 'text';
      let fileData = null;
      
      if (selectedFile) {
        messageType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
        fileData = {
          fileName: selectedFile.name,
          fileSize: selectedFile.size
        };
      }
      
      await chatService.sendMessage(newMessage, messageType, fileData);
      
      setNewMessage('');
      setSelectedFile(null);
      setIsTyping(false);
      chatService.sendTypingIndicator(false);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      notificationService.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        notificationService.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Edit message
  const editMessage = async (messageId, newText) => {
    try {
      await chatService.editMessage(messageId, newText);
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
      notificationService.error('Failed to edit message');
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessageMenu(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      notificationService.error('Failed to delete message');
    }
  };

  // Get user role icon
  const getUserRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get message type icon
  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Connection Failed</h3>
          <p className="text-gray-400 mb-4">{connectionError}</p>
          <button
            onClick={() => {
              setConnectionError(null);
              setLoading(true);
              // Re-trigger initialization by calling the effect again
              const event = new Event('retry-chat-connection');
              window.dispatchEvent(event);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <ChatErrorBoundary>
      <div className="flex flex-col h-full bg-[#0f1419] border border-blue-500/20 rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 bg-[#181b23] border-b border-blue-500/10">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            isConnected 
              ? 'bg-green-400 animate-pulse' 
              : connectionError 
                ? 'bg-red-400' 
                : 'bg-yellow-400 animate-pulse'
          }`}></div>
          <div>
            <h3 className="text-lg font-semibold text-white">{projectTitle}</h3>
            <p className="text-sm text-gray-400">
              {isConnected 
                ? `${onlineUsers.length} online • ${messages.length} messages`
                : connectionError 
                  ? 'Connection failed'
                  : 'Connecting...'
              }
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#232a34] rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Online Users */}
      <div className="px-4 py-2 bg-[#181b23] border-b border-blue-500/10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Online:</span>
          <div className="flex flex-wrap gap-1">
            {onlineUsers.map((user, index) => (
              <div key={index} className="flex items-center gap-1 bg-[#232a34] px-2 py-1 rounded-md">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white">{user.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.senderID === user._id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md relative group ${
              message.senderID === user._id ? 'order-2' : 'order-1'
            }`}>
              {/* Message Content */}
              <div className={`px-4 py-2 rounded-lg ${
                message.senderID === user._id
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#232a34] text-white border border-blue-500/20'
              }`}>
                {/* Message Header */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1">
                    {getUserRoleIcon(message.senderRole)}
                    <span className="text-xs font-medium opacity-75">
                      {message.senderName}
                    </span>
                  </div>
                  <span className="text-xs opacity-50">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.isEdited && (
                    <span className="text-xs opacity-50">(edited)</span>
                  )}
                </div>

                {/* Message Text */}
                {editingMessage === message._id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      defaultValue={message.text}
                      className="w-full bg-[#181b23] border border-blue-500/20 rounded px-2 py-1 text-white text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          editMessage(message._id, e.target.value);
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => editMessage(message._id, editingMessage)}
                        className="text-xs bg-green-500 hover:bg-green-600 px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMessage(null)}
                        className="text-xs bg-gray-500 hover:bg-gray-600 px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm">{message.text}</p>
                    
                    {/* File Attachment */}
                    {message.messageType !== 'text' && (
                      <div className="mt-2 p-2 bg-[#181b23] rounded border border-blue-500/20">
                        <div className="flex items-center gap-2">
                          {getMessageTypeIcon(message.messageType)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{message.fileName}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(message.fileSize)}</p>
                          </div>
                          <button className="p-1 hover:bg-[#232a34] rounded">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Menu */}
                {message.senderID === user._id && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setMessageMenu(message._id)}
                      className="p-1 hover:bg-[#232a34] rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {messageMenu === message._id && (
                      <div className="absolute right-0 top-8 bg-[#232a34] border border-blue-500/20 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => setEditingMessage(message._id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[#181b23]"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMessage(message._id)}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[#181b23] text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-[#232a34] text-gray-400 px-4 py-2 rounded-lg text-sm">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="px-4 py-2 bg-[#181b23] border-t border-blue-500/10">
          <div className="flex items-center gap-2 p-2 bg-[#232a34] rounded border border-blue-500/20">
            {getMessageTypeIcon(selectedFile.type.startsWith('image/') ? 'image' : 'file')}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-1 hover:bg-[#181b23] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 bg-[#181b23] border-t border-blue-500/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTypingChange}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            className="flex-1 bg-[#232a34] border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:border-blue-400 focus:outline-none disabled:opacity-50"
            disabled={sending || !isConnected}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-[#232a34] hover:bg-[#2a2f3a] border border-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
            disabled={sending || !isConnected}
          >
            <Paperclip className="w-5 h-5 text-gray-400" />
          </button>
          
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 bg-[#232a34] hover:bg-[#2a2f3a] border border-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
            disabled={sending || !isConnected}
          >
            <Smile className="w-5 h-5 text-gray-400" />
          </button>
          
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || sending || !isConnected}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send
          </button>
        </div>
      </div>
      </div>
    </ChatErrorBoundary>
  );
};

export default ProjectChat;
