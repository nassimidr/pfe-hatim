import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  addComment,
  getTaskStats,
  getTasksByPeriod,
  archiveTask,
  deleteComment
} from '../controllers/taskController.js';
import { protect, requireManager } from '../middleware/auth.js';
import {
  validateTask,
  validateTaskUpdate,
  validateComment,
  validatePagination
} from '../middleware/validate.js';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(protect);

// Routes principales
router.route('/')
  .get(validatePagination, getTasks)
  .post(validateTask, createTask);

router.route('/stats')
  .get(getTaskStats);

router.route('/period/:period')
  .get(getTasksByPeriod);

// Routes avec ID
router.route('/:id')
  .get(getTask)
  .put(validateTaskUpdate, updateTask)
  .delete(deleteTask);

// Routes spéciales
router.patch('/:id/complete', completeTask);
router.patch('/:id/archive', archiveTask);

// Routes pour les commentaires
router.post('/:id/comments', validateComment, addComment);
router.delete('/:taskId/comments/:commentId', deleteComment);

export default router; 