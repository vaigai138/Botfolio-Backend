// routes/taskRoutes.js
import express from 'express';
import {
  createTask,
  getTasks, // Your existing getTasks
  updateTask,
  deleteTask,
  getTaskSummary, // Import the new summary function
} from '../controllers/taskController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// New route for task summary (for dashboard)
router.get('/summary', protect, getTaskSummary);

// Project-specific tasks
router.route('/project/:projectId')
  .post(protect, createTask)
  .get(protect, getTasks); // This is your existing getTasks (which fetches by project ID)

// Individual task operations
router.route('/:taskId')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

export default router;
