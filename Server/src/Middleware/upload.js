import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename to prevent path traversal
    const sanitizedOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(sanitizedOriginalName);
    const name = path.basename(sanitizedOriginalName, ext);
    
    // Ensure filename is safe
    const safeFilename = `${file.fieldname}-${uniqueSuffix}-${name}${ext}`;
    cb(null, safeFilename);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

// Create multer instance with security limits
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024; // Default 10MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 10 // Maximum number of files
  }
});

// Security middleware to validate uploads
export const validateUpload = (req, res, next) => {
  try {
    const files = req.allFiles ? req.allFiles() : [];
    
    // Check file count
    if (files.length > 10) {
      return res.status(400).json({ 
        message: 'Too many files. Maximum 10 files allowed.' 
      });
    }
    
    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        return res.status(400).json({ 
          message: `File ${file.originalname} exceeds maximum size of ${process.env.MAX_FILE_SIZE_MB || 10}MB` 
        });
      }
      
      // Check for path traversal in filename
      if (file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
        logger.error('Path traversal attempt detected', { filename: file.filename });
        return res.status(400).json({ 
          message: 'Invalid filename' 
        });
      }
      
      // Validate file path is within uploads directory
      const filePath = path.resolve(uploadsDir, file.filename);
      const uploadsPath = path.resolve(uploadsDir);
      if (!filePath.startsWith(uploadsPath)) {
        logger.error('Path traversal attempt detected', { filePath, uploadsPath });
        return res.status(400).json({ 
          message: 'Invalid file path' 
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Upload validation error', error);
    res.status(500).json({ 
      message: 'File validation failed' 
    });
  }
};

// Helper function to create upload middleware for specific fields
export const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Helper function for single file upload
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Helper function for any file upload
export const uploadAny = () => {
  return upload.any();
};

// Normalization middleware to add helper methods to req
export const normalizeFiles = (req, res, next) => {
  // Add helper methods
  req.allFiles = () => {
    const files = [];
    if (req.files) {
      Object.values(req.files).forEach(fieldFiles => {
        if (Array.isArray(fieldFiles)) {
          files.push(...fieldFiles);
        } else {
          files.push(fieldFiles);
        }
      });
    }
    if (req.file) {
      files.push(req.file);
    }
    return files;
  };

  req.namedFiles = (fieldName) => {
    return req.files && req.files[fieldName] ? req.files[fieldName] : [];
  };

  req.getFile = (fieldName) => {
    if (req.files && req.files[fieldName]) {
      return Array.isArray(req.files[fieldName]) ? req.files[fieldName][0] : req.files[fieldName];
    }
    return null;
  };

  next();
};

// Combined middleware for file uploads with normalization
export const withUpload = (fieldsSpec, options = {}) => {
  const middlewares = [];
  
  // Add file upload middleware based on specification
  if (typeof fieldsSpec === 'string') {
    if (fieldsSpec === 'any') {
      middlewares.push(uploadAny());
    } else if (fieldsSpec.startsWith('single:')) {
      const fieldName = fieldsSpec.split(':')[1];
      middlewares.push(uploadSingle(fieldName));
    }
  } else if (Array.isArray(fieldsSpec)) {
    middlewares.push(uploadFields(fieldsSpec));
  }
  
  // Add normalization middleware
  middlewares.push(normalizeFiles);
  
  return middlewares;
};

export default upload;
