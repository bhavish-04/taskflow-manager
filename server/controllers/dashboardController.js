const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all projects user is part of
    const projects = await Project.find({ 'members.user': userId });
    const projectIds = projects.map((p) => p._id);

    // Aggregate task stats
    const [statusCounts, priorityCounts, overdueTasks, myTasks] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Task.find({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      })
        .populate('assignee', 'name email avatarColor')
        .populate('project', 'name')
        .sort({ dueDate: 1 })
        .limit(10),
      Task.find({ assignee: userId, status: { $ne: 'done' } })
        .populate('project', 'name')
        .sort({ dueDate: 1 })
        .limit(10),
    ]);

    const stats = { todo: 0, 'in-progress': 0, done: 0, total: 0 };
    statusCounts.forEach((s) => { stats[s._id] = s.count; stats.total += s.count; });

    const priorities = { low: 0, medium: 0, high: 0 };
    priorityCounts.forEach((p) => { priorities[p._id] = p.count; });

    res.json({
      success: true,
      data: {
        stats,
        priorities,
        projectCount: projects.length,
        overdueTasks,
        myTasks,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard.' });
  }
};

module.exports = { getStats };
