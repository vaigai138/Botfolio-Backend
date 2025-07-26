import multer from 'multer';

// Storage in memory (ideal for base64 or uploading to Cloudinary)
const storage = multer.memoryStorage();

// Limit file size to 1MB per image
const limits = {
  fileSize: 1 * 1024 * 1024, // 1 MB
};

// Only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits,
  fileFilter
});

export default upload;
