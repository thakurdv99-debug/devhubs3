import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDb } from "./config/connectionDB.js";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { logger } from "./utils/logger.js";
import { initSentry } from "./utils/sentry.js";
import { handleError } from "./utils/error.js";

// Initialize Sentry before anything else
const Sentry = initSentry();
import userRoute from "./Routes/userRoutes.js";
import projectRoutes from "./Routes/ProjectListingRoutes.js";
import biddingRoutes from "./Routes/BiddingRoutes.js";
import adminDashboardRoutes from "./Routes/AdminDashboardRoute.js";
import http from "http";
import { Server } from "socket.io";
import chatSocket from "./sockets/chatSockte.js"; // Import the chat socket
import chatRoutes from "./Routes/ChatRoutes.js";
import userNoteRoute from "./Routes/UserNotesRoute.js";
import uploadRoutes from "./Routes/upload.routes.js";
import savedProjectRoutes from "./Routes/SavedProjectRoutes.js";
import userProjectsRoutes from "./Routes/UserProjectsRoutes.js";
import paymentsRoutes from "./Routes/paymentsRoutes.js";
import webhooksRoutes from "./Routes/webhooksRoutes.js";
import projectsPaymentRoutes from "./Routes/projectsPaymentRoutes.js";
import projectSelectionRoutes from "./Routes/ProjectSelectionRoutes.js";
import escrowWalletRoutes from "./Routes/EscrowWalletRoutes.js";
import projectTaskRoutes from "./Routes/ProjectTaskRoutes.js";
import platformAdminRoutes from "./Routes/PlatformAdminRoutes.js";
import path from "path";


dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    // Fail fast in production with helpful error message
    console.error('❌ Missing required environment variables:', missingEnvVars);
    console.error('\n📋 To fix this error:');
    console.error('   1. Set the following environment variables in your deployment platform:');
    missingEnvVars.forEach(varName => {
      console.error(`      - ${varName}`);
    });
    console.error('\n   2. For deployment platforms:');
    console.error('      - Railway: Go to Variables tab and add each variable');
    console.error('      - Render: Go to Environment tab and add each variable');
    console.error('      - Heroku: Use "heroku config:set KEY=value" command');
    console.error('      - Docker: Add to docker-compose.yml or use -e flags');
    console.error('\n   3. See .env.example file for all required variables');
    console.error('\n   4. After setting variables, restart your deployment\n');
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}. ` +
      'Server cannot start without these variables. Please set them in your deployment platform.'
    );
  } else {
    logger.error('Missing required environment variables:', { missing: missingEnvVars });
    logger.warn('Server may not function properly without these variables');
  }
}

// Log environment status (only in development)
if (process.env.NODE_ENV !== 'production') {
  logger.info('Environment Variables Status:', {
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing',
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5001
  });
}

// Initialize express app and server
const app = express();

// Add Sentry request handler (must be before other middleware)
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

const server = http.createServer(app);

// CORS Configuration - MUST BE FIRST (before Helmet and all other middleware)
const getAllowedOrigins = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    const envOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['https://devhubs.in', 'https://www.devhubs.in'];
    return envOrigins;
  } else {
    return [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5001',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
  }
};

const CorsOption = {
  origin: function (origin, callback) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      return callback(null, true); // Allow all origins in development
    }
    const allowedOrigins = getAllowedOrigins();
    if (!origin) {
      return callback(new Error('CORS: Origin header required in production'));
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Apply CORS FIRST - Manual handler to ensure it works
// This MUST be the first middleware after Sentry
// FOR DEVELOPMENT: Always allow CORS from localhost origins
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // ALWAYS set CORS headers for localhost origins (development)
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Handle OPTIONS preflight requests immediately
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  } else {
    // For non-localhost origins, check production settings
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      // In development, allow all origins
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
    } else {
      // Production: use allowed origins
      const allowedOrigins = getAllowedOrigins();
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '86400');
      }
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
    }
  }
  
  next();
});

// Security headers with Helmet (CSP disabled in development to avoid CORS issues)
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // Disable CSP in development
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for OPTIONS (CORS preflight)
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per 5 minutes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for OPTIONS (CORS preflight)
});

const paymentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({
      success: false,
      message: 'Too many payment requests, please try again later.',
      error: 'Rate limit exceeded',
      retryAfter: retryAfter,
      retryAfterSeconds: retryAfter
    });
  }
});

// Socket.IO CORS configuration
const socketOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['https://devhubs.in', 'https://www.devhubs.in'])
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const io = new Server(server, {
  cors: {
    origin: socketOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ensure CORS headers are added to all responses (including errors)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Add CORS headers to all responses
  if (origin && (!isProduction || getAllowedOrigins().includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// Apply general rate limiter to all API requests (after CORS, but skip OPTIONS)
app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next(); // Skip rate limiting for OPTIONS preflight requests
  }
  generalLimiter(req, res, next);
});

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`, { timestamp: new Date().toISOString() });
  next();
});

// Serve uploaded files statically
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadsDir))); 

// Health check endpoint (moved to top for faster response)
app.get('/api/health', (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      version: process.version,
      port: process.env.PORT || 5001
    };
    
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, return minimal information
    if (isProduction) {
      const minimalStatus = {
        status: 'OK',
        timestamp: new Date().toISOString()
      };
      logger.debug("Health check requested", minimalStatus);
      return res.status(200).json(minimalStatus);
    }
    
    logger.debug("Health check requested", healthStatus);
    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error("Health check error", error);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({ 
      status: 'ERROR', 
      message: isProduction ? 'Health check failed' : error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint for basic connectivity test
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'DevHubs API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});
 

// Import routes
// Apply auth rate limiter to authentication routes (OPTIONS requests are already handled by CORS middleware)
app.use("/api/user", (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // Skip rate limiting for OPTIONS
  authLimiter(req, res, next);
});
app.use("/api/login", (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // Skip rate limiting for OPTIONS
  authLimiter(req, res, next);
});
app.use("/api/github/login", (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // Skip rate limiting for OPTIONS
  authLimiter(req, res, next);
});

app.use("/api", userRoute) ; 
app.use("/api/bid", biddingRoutes) ; 
app.use("/api/admin", adminDashboardRoutes) ; 
app.use("/api/notes", userNoteRoute ) ; 
app.use("/api", uploadRoutes) ; 
app.use("/api/saved-projects", savedProjectRoutes);
app.use("/api/user-projects", userProjectsRoutes);

// Payment routes - apply payment rate limiter
app.use("/api/payments", paymentLimiter, paymentsRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/projects", paymentLimiter, projectsPaymentRoutes);

// Project selection routes
app.use("/api/project-selection", projectSelectionRoutes);
logger.debug("Project Selection routes registered at /api/project-selection");

// Escrow wallet routes
app.use("/api/escrow", escrowWalletRoutes);

// Project task routes (must come before general project routes to avoid conflicts)
app.use("/api/project-tasks", projectTaskRoutes);
logger.debug("Project Task routes registered at /api/project-tasks");

// Project routes (must come after project-tasks to avoid conflicts)
app.use("/api/project", projectRoutes) ; 

// Platform admin routes
app.use("/api/platform-admin", platformAdminRoutes);
logger.debug("Platform Admin routes registered at /api/platform-admin");

app.use("/api", chatRoutes);
logger.debug("Chat routes registered at /api/chat");

// Initialize chat socket
chatSocket(io);

// Add Sentry error handler (must be after all routes but before error middleware)
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Add global error handler middleware (must be last)
app.use(handleError);

const port = process.env.PORT || 5001;

// Add error handling for server startup
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${port} is already in use. Please:`);
    logger.error(`1. Stop the process using port ${port}`);
    logger.error(`2. Or change the PORT in your .env file`);
    logger.error(`3. On Windows, find the process: netstat -ano | findstr :${port}`);
    logger.error(`4. Kill it: taskkill /PID <PID> /F`);
  } else {
    logger.error('Server failed to start:', { message: error.message });
  }
  process.exit(1);
});

// Start server with proper error handling
const startServer = async () => {
  try {
    logger.info("Starting DevHubs API Server...", {
      environment: process.env.NODE_ENV || 'development',
      port
    });
    
    // Start the server first
    server.listen(port, () => {
      logger.info(`Server running on port ${port}`, {
        healthCheck: `http://localhost:${port}/api/health`,
        rootEndpoint: `http://localhost:${port}/`
      });
    });
    
    // Then try to connect to database with retry logic
    const maxRetries = 3;
    let retryCount = 0;
    let connected = false;
    
    while (retryCount < maxRetries && !connected) {
      try {
        await connectDb();
        connected = true;
        logger.info('Database connection established');
      } catch (dbError) {
        retryCount++;
        logger.error(`Database connection attempt ${retryCount}/${maxRetries} failed:`, { 
          message: dbError.message 
        });
        
        if (retryCount < maxRetries) {
          // Exponential backoff: wait 2^retryCount seconds
          const waitTime = Math.pow(2, retryCount) * 1000;
          logger.info(`Retrying database connection in ${waitTime/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // In production, fail if database connection fails
          if (process.env.NODE_ENV === 'production') {
            logger.error('Database connection failed after all retries. Server cannot start in production without database.');
            process.exit(1);
          } else {
            logger.warn('Server is running without database connection (development mode)');
          }
        }
      }
    }
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
