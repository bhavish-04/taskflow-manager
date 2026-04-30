const { validationResult } = require('express-validator');
const Task = require('../models/Task');

// POST /api/tasks - Create task
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const { title, description, assignee, priority, dueDate } = req.body;
    const projectId = req.body.project || req.params.projectId;

    const task = await Task.create({
      title, description, project: projectId,
      assignee: assignee || null, priority, dueDate,
      createdBy: req.user._id,
    });
    await task.populate('assignee', 'name email avatarColor');
    await task.populate('createdBy', 'name email avatarColor');

    res.status(201).json({ success: true, message: 'Task created', data: { task } });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ success: false, message: 'Server error creating task.' });
  }
};

// GET /api/tasks/project/:projectId - List tasks
const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email avatarColor')
      .populate('createdBy', 'name email avatarColor')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { tasks } });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tasks.' });
  }
};

// GET /api/tasks/:id - Get single task
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatarColor')
      .populate('createdBy', 'name email avatarColor')
      .populate('project', 'name');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, data: { task } });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching task.' });
  }
};

// PUT /api/tasks/:id - Update task
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const { title, description, assignee, status, priority, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee || null;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();
    await task.populate('assignee', 'name email avatarColor');
    await task.populate('createdBy', 'name email avatarColor');

    res.json({ success: true, message: 'Task updated', data: { task } });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ success: false, message: 'Server error updating task.' });
  }
};

// DELETE /api/tasks/:id - Delete task (admin only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting task.' });
  }
};

// PATCH /api/tasks/:id/status - Quick status update
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    const task = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('assignee', 'name email avatarColor')
      .populate('createdBy', 'name email avatarColor');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, message: 'Status updated', data: { task } });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating status.' });
  }
};

module.exports = { createTask, getTasksByProject, getTask, updateTask, deleteTask, updateTaskStatus };
