import express from 'express';
import {
  getPublicProfile,
  getCurrentUser,
  updateUserProfile,
  googleAuthController, // Import the new controller function
  completeGoogleSignupController, // Import the new controller function
  getAllUsers, // Make sure getAllUsers is imported if used elsewhere
} from '../controllers/userController.js';
import protect from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js'

const router = express.Router();

// 🔑 Google Auth Routes
router.post('/auth/google', googleAuthController); // Initial Google login/signup
router.post('/auth/google/complete-signup', completeGoogleSignupController); // For new Google users to set username

// 🔐 Protected Routes
router.get('/me', protect, getCurrentUser);
router.get('/profile', protect, getCurrentUser);

router.put(
  '/profile',
  protect,
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'designImages', maxCount: 25 }
  ]),
  updateUserProfile
);

// 🌍 Public Profile
router.get('/:username', getPublicProfile);
router.get('/', getAllUsers); // Route to get all users, for your user list

export default router;