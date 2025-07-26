import express from 'express';
import protect from '../middleware/authMiddleware.js';
import authorizeAdmin from '../middleware/adminMiddleware.js';
import {
  getAllUsersForAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  getAllPortfolioLinksForAdmin, // New import
  removePortfolioLink,          // New import
  getPlatformAnalytics,
  // Add more controller imports as you create them for Payments and Settings
  // getAllPaymentsForAdmin,
  // updatePaymentStatus,
  // revokeSubscription,
  // updateAdminPassword,
  // addPlatformNotice,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(authorizeAdmin);

// User Management
router.get('/users', getAllUsersForAdmin);
router.put('/users/:id', updateUserByAdmin);
router.delete('/users/:id', deleteUserByAdmin);

// Portfolio Links
router.get('/portfolio-links', getAllPortfolioLinksForAdmin);
router.post('/portfolio-links/remove', removePortfolioLink); // Using POST for removal action with body data

// Platform Analytics
router.get('/analytics', getPlatformAnalytics);

// Invoices & Payments (Uncomment and implement when ready)
// router.get('/payments', getAllPaymentsForAdmin);
// router.put('/payments/:id/status', updatePaymentStatus);
// router.post('/subscriptions/revoke', revokeSubscription);

// Admin Settings (Uncomment and implement when ready)
// router.put('/settings/password', updateAdminPassword);
// router.post('/settings/notice', addPlatformNotice);

export default router;