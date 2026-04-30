const Project = require('../models/Project');

/**
 * Check if the user is a member of the project
 * Attaches the project and member info to the request
 */
const projectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.project;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required.',
      });
    }

    const project = await Project.findById(projectId).populate('members.user', 'name email avatarColor');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.',
      });
    }

    const member = project.members.find(
      (m) => m.user._id.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project.',
      });
    }

    req.project = project;
    req.memberRole = member.role;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error checking project membership.',
    });
  }
};

/**
 * Check if the user has admin role in the project
 * Must be used AFTER projectMember middleware
 */
const projectAdmin = (req, res, next) => {
  if (req.memberRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required for this action.',
    });
  }
  next();
};

module.exports = { projectMember, projectAdmin };
