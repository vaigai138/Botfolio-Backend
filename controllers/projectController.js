import Project from '../models/Project.js';
import Task from '../models/Task.js';
import mongoose from 'mongoose';

export const createProject = async (req, res) => {
  try {
    // Only destructure clientName and description
    const { clientName, description } = req.body;

    // Debug Logs 🚀
    console.log("📦 Incoming request body:", req.body);
    console.log("👤 Authenticated user:", req.user);

    const project = await Project.create({
      user: req.user.id,
      clientName,
      description,
      // title, status, deadline are no longer expected or saved
    });

    res.status(201).json(project);
  } catch (err) {
    console.error("❌ Error in createProject:", err); // Log full error
    res.status(500).json({ message: 'Failed to create project' });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    // Project will now only have clientName and description
    const project = await Project.findOne({ _id: req.params.id, user: req.user.id });

    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch project' });
  }
};

export const updateProject = async (req, res) => {
  try {
    // Mongoose's findOneAndUpdate will automatically apply updates to clientName and description
    // if present in req.body. The 'title' field is no longer in the schema.
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body, // req.body will now contain clientName and description from frontend
      { new: true }
    );

    if (!project) return res.status(404).json({ message: 'Project not found' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project' });
  }
};


export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Convert project ID string to ObjectId before deletion
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    // 💣 Delete tasks with matching project ObjectId
    const deletedTasks = await Task.deleteMany({ project: projectId });
    console.log(`🗑️ Deleted ${deletedTasks.deletedCount} tasks related to project ${req.params.id}`);

    res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (err) {
    console.error('❌ Failed to delete project:', err);
    res.status(500).json({ message: 'Server error during deletion' });
  }
};
