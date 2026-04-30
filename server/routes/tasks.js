const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { projectMember, projectAdmin } = require('../middleware/rbac');
const {
  createTask, getTasksByProject, getTask,
  updateTask, deleteTask, updateTaskStatus,
} = require('../controllers/taskController');

const router = express.Router();

router.use(auth);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ min: 2, max: 200 }),
    body('project').notEmpty().withMessage('Project ID is required'),
  ],
  projectMember,
  createTask
);

router.get('/project/:projectId', projectMember, getTasksByProject);
router.get('/:id', getTask);
router.put('/:id', [body('title').optional().trim().isLength({ min: 2, max: 200 })], updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);

module.exports = router;
