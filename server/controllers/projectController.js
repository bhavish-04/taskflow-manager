const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// POST /api/projects - Create a new project
const createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { name, description } = req.body;
    const project = await Project.create({ name, description, owner: req.user._id });
    await project.populate('members.user', 'name email avatarColor');
    res.status(201).json({ success: true, message: 'Project created successfully', data: { project } });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, message: 'Server error creating project.' });
  }
};

// GET /api/projects - List all projects the user is a member of
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('members.user', 'name email avatarColor')
      .populate('owner', 'name email avatarColor')
      .sort({ updatedAt: -1 });

    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const counts = { todo: 0, 'in-progress': 0, done: 0, total: 0 };
        taskCounts.forEach((tc) => { counts[tc._id] = tc.count; counts.total += tc.count; });
        return { ...project.toJSON(), taskCounts: counts };
      })
    );

    res.json({ success: true, data: { projects: projectsWithCounts } });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching projects.' });
  }
};

// GET /api/projects/:id - Get a single project
const getProject = async (req, res) => {
  try {
    res.json({ success: true, data: { project: req.project } });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching project.' });
  }
};

// PUT /api/projects/:id - Update project (admin only)
const updateProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { name, description } = req.body;
    const project = req.project;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    await project.save();
    await project.populate('members.user', 'name email avatarColor');
    res.json({ success: true, message: 'Project updated successfully', data: { project } });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ success: false, message: 'Server error updating project.' });
  }
};

// DELETE /api/projects/:id - Delete project and all tasks (admin only)
const deleteProject = async (req, res) => {
  try {
    await Task.deleteMany({ project: req.project._id });
    await Project.findByIdAndDelete(req.project._id);
    res.json({ success: true, message: 'Project and all tasks deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting project.' });
  }
};

// POST /api/projects/:id/members - Add a member (admin only)
const addMember = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required to add a member.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with that email.' });
    }
    const project = req.project;
    const existingMember = project.members.find((m) => m.user._id.toString() === user._id.toString());
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project.' });
    }
    project.members.push({ user: user._id, role });
    await project.save();
    await project.populate('members.user', 'name email avatarColor');
    res.json({ success: true, message: `${user.name} added to project as ${role}`, data: { project } });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: 'Server error adding member.' });
  }
};

// DELETE /api/projects/:id/members/:userId - Remove a member (admin only)
const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = req.project;
    if (project.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner.' });
    }
    const memberIndex = project.members.findIndex((m) => m.user._id.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: 'User is not a member of this project.' });
    }
    project.members.splice(memberIndex, 1);
    await project.save();
    await project.populate('members.user', 'name email avatarColor');
    await Task.updateMany({ project: project._id, assignee: userId }, { assignee: null });
    res.json({ success: true, message: 'Member removed from project', data: { project } });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Server error removing member.' });
  }
};

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject, addMember, removeMember };
