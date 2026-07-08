import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const uploadDirectory = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Local Storage Fallback
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    // Keep clean name and avoid special char issues in filename
    const cleanBasename = basename.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${uniqueSuffix}-${cleanBasename}${ext}`);
  }
});

let imageStorage: multer.StorageEngine = localStorage;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  
  imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'smart_lms',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    } as any
  });
  console.log('[Cloudinary] Configured for image uploads.');
} else {
  console.log('[Uploads] Cloudinary not configured. Falling back to local ephemeral disk storage.');
}

export const upload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for study materials
  }
});

export const uploadThumbnail = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for thumbnails
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.') as any, false);
    }
  }
});

export const uploadRecording = multer({
  storage: localStorage, // Keep recordings on local storage before GDrive proxy
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit for video recordings
  },
  fileFilter: (req, file, cb) => {
    // Accepts common video formats
    if (file.mimetype.startsWith('video/') || ['video/mp4', 'video/webm', 'video/x-matroska', 'video/avi'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.') as any, false);
    }
  }
});
