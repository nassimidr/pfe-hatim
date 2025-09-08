import express from 'express';
import {
  getDashboardStats,
  getTaskAnalytics,
  getUserPerformance,
  getTeamStats
} from '../controllers/statsController.js';
import { protect, requireManager } from '../middleware/auth.js';

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(protect);

// Routes publiques pour tous les utilisateurs connectés
router.get('/dashboard', getDashboardStats);
router.get('/tasks', getTaskAnalytics);

// Routes pour managers et admins
router.use(requireManager);
router.get('/users/performance', getUserPerformance);
router.get('/team', getTeamStats);

export default router; 