// controllers/taskController.js
import Task from '../models/Task.js';
import mongoose from 'mongoose'; // Ensure mongoose is imported for ObjectId

// Create Task
export const createTask = async (req, res) => {
  try {
    // Destructure all new fields
    const { projectName, givenDate, submissionDate, approvedDate, payment, received } = req.body;
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid Project ID' });
    }

    const task = await Task.create({
      user: req.user.id,
      project: projectId,
      projectName,
      givenDate,
      submissionDate,
      approvedDate,
      payment,
      received,
    });

    res.status(201).json(task);
  } catch (err) {
    console.error("Error creating task:", err); // More detailed error logging
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// Get all tasks for a project (matches your existing `getTasks` naming)
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.projectId,
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err); // More detailed error logging
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, user: req.user.id },
      req.body, // req.body will contain the new fields for update
      { new: true, runValidators: true } // Added runValidators for consistency
    );

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (err) {
    console.error("Error updating task:", err); // More detailed error logging
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      user: req.user.id,
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error("Error deleting task:", err); // More detailed error logging
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// New function for Dashboard summary
export const getTaskSummary = async (req, res) => {
  try {
    const summary = await Task.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id), // Match tasks for the logged-in user
        },
      },
      {
        $group: {
          _id: null, // Group all matching documents into a single group
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $ne: ["$approvedDate", null] }, 1, 0] }, // Count if approvedDate exists
          },
          totalRevenue: { $sum: "$payment" },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ["$received", false] }, "$payment", 0] }, // Sum payment if not received
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field from the output
          totalTasks: 1,
          completedTasks: 1,
          totalRevenue: 1,
          pendingPayments: 1,
        },
      },
    ]);

    // If no tasks are found, aggregate will return an empty array.
    // Provide default values in that case.
    const result = summary.length > 0 ? summary[0] : {
      totalTasks: 0,
      completedTasks: 0,
      totalRevenue: 0,
      pendingPayments: 0,
    };

    res.json(result);
  } catch (err) {
    console.error('Error fetching task summary:', err);
    res.status(500).json({ message: 'Failed to fetch task summary' });
  }
};
