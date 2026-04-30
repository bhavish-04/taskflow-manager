const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { projectMember, projectAdmin } = require('../middleware/rbac');
const {
  createProject, getProjects, getProject,
  updateProject, deleteProject, addMember, removeMember,
} = require('../controllers/projectController');

const router = express.Router();

router.use(auth); // All project routes require auth

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Project name is required').isLength({ min: 2, max: 100 })],
  createProject
);

router.get('/', getProjects);
router.get('/:id', projectMember, getProject);
router.put('/:id', projectMember, projectAdmin, [body('name').optional().trim().isLength({ min: 2, max: 100 })], updateProject);
router.delete('/:id', projectMember, projectAdmin, deleteProject);

// Member management
router.post('/:id/members', projectMember, projectAdmin, addMember);
router.delete('/:id/members/:userId', projectMember, projectAdmin, removeMember);

module.exports = router;
