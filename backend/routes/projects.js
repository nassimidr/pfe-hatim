import express from 'express';
import { createProject, addMember, listMembers, createProjectTask, listUserProjects, getProjectTasks } from '../controllers/projectController.js';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateProjectTask } from '../middleware/validate.js';

const router = express.Router();

// Créer un projet
router.post('/', auth, createProject);

// Ajouter un membre à un projet par email
router.post('/:projectId/members', auth, addMember);

// Lister les membres d’un projet
router.get('/:projectId/members', auth, listMembers);

// Créer une tâche dans un projet et l’assigner à un membre
router.post('/:projectId/tasks', auth, validateProjectTask, createProjectTask);

// Lister les projets de l'utilisateur
router.get('/', auth, listUserProjects);

// Lister les tâches d'un projet
router.get('/:projectId/tasks', auth, getProjectTasks);

// Lister tous les projets (admin uniquement)
router.get('/all', auth, requireAdmin, async (req, res, next) => {
  try {
    const projects = await (await import('../models/Project.js')).default.find({})
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .populate('tasks');
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
});

// Mettre à jour le statut d'une tâche
router.patch('/tasks/:taskId/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }
    task.status = status;
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
});

export default router; 