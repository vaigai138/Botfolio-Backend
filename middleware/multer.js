import multer from 'multer';

// Use memory storage (you can switch to disk or cloud later)
const storage = multer.memoryStorage();

// Optional: file filter (only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const limits = {
  fileSize: 1 * 1024 * 1024, // 1 MB
};


const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024 // 1 MB max
  }
});

export default upload;
