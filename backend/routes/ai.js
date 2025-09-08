import express from 'express';
import { askAI } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/ask', protect, askAI);

export default router; 