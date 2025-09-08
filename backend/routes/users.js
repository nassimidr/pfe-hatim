import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/userController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { validateUser } from '../middleware/validate.js';

const router = express.Router();

// Appliquer l'authentification et les permissions admin à toutes les routes
router.use(protect);
router.use(requireAdmin);

// Routes principales
router.route('/')
  .get(getUsers)
  .post(validateUser, createUser);

// Routes avec ID
router.route('/:id')
  .get(getUser)
  .put(validateUser, updateUser)
  .delete(deleteUser);

// Routes spéciales
router.patch('/:id/toggle-status', toggleUserStatus);

export default router; 