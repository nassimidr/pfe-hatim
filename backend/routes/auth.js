import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin
} from '../middleware/validate.js';

const router = express.Router();

// Routes publiques
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

// Routes protégées
router.use(protect); // Appliquer le middleware d'authentification à toutes les routes suivantes
router.post('/logout', logout);
router.get('/me', getMe);
router.put('/me', updateMe);

export default router; 