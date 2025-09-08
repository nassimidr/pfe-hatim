import Task from '../models/Task.js';
import User from '../models/User.js';
import NotificationService from '../services/notificationService.js';

// @desc    Obtenir toutes les tâches
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    console.log('[DEBUG] getTasks appelé par utilisateur:', req.user.name, 'Rôle:', req.user.role, 'ID:', req.user.id);
    
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      search,
      sort = 'createdAt',
      order = 'desc',
      assignedTo,
      dueDate
    } = req.query;

    // Construire le filtre
    const filter = { isArchived: false };

    // Filtre par utilisateur assigné selon le rôle
    if (req.user.role === 'employee') {
      // Les employés ne voient que leurs tâches assignées
      filter.assignedTo = req.user.id;
      console.log('[DEBUG] Filtre employé appliqué - assignedTo:', req.user.id);
    } else if (req.user.role === 'manager') {
      // Les managers voient leurs tâches assignées + les tâches des projets dont ils sont owner
      if (assignedTo) {
        filter.assignedTo = assignedTo;
        console.log('[DEBUG] Filtre manager avec assignedTo spécifique:', assignedTo);
      } else {
        console.log('[DEBUG] Manager - filtre pour tâches assignées ou projets gérés');
        // Les managers voient :
        // 1. Les tâches qui leur sont assignées
        // 2. Les tâches des projets dont ils sont propriétaires
        const Project = (await import('../models/Project.js')).default;
        const managedProjects = await Project.find({ owner: req.user.id }).select('_id');
        const managedProjectIds = managedProjects.map(p => p._id);
        
        filter.$or = [
          { assignedTo: req.user.id }, // Tâches assignées à ce manager
          { project: { $in: managedProjectIds } } // Tâches des projets gérés
        ];
      }
    } else if (req.user.role === 'admin') {
      // Les admins voient toutes les tâches, mais peuvent filtrer
      if (assignedTo) {
        filter.assignedTo = assignedTo;
        console.log('[DEBUG] Filtre admin avec assignedTo spécifique:', assignedTo);
      } else {
        console.log('[DEBUG] Admin - aucun filtre assignedTo, voit toutes les tâches');
      }
    }

    // Autres filtres
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (dueDate) {
      const date = new Date(dueDate);
      filter.dueDate = {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    // Recherche
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construire le tri
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    console.log('[DEBUG] Filtre final appliqué:', JSON.stringify(filter, null, 2));
    
    // Exécuter la requête
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate({ path: 'project', select: 'name owner', populate: { path: 'owner', select: 'name email' } })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Compter le total
    const total = await Task.countDocuments(filter);
    
    console.log('[DEBUG] Nombre de tâches trouvées:', tasks.length);
    console.log('[DEBUG] Total des tâches avec ce filtre:', total);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir une tâche par ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate({ path: 'project', select: 'name owner', populate: { path: 'owner', select: 'name email' } });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier les permissions
    if (
      req.user.role === 'employee' && task.assignedTo._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    if (
      req.user.role === 'manager' && task.project.owner._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
    // admin : accès total

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer une nouvelle tâche
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Seuls les managers et les admins peuvent créer une tâche.'
    });
  }
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      estimatedTime,
      tags,
      project // <-- nouveau champ obligatoire
    } = req.body;

    // Vérifier si l'utilisateur assigné existe
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur assigné non trouvé'
      });
    }
    // Vérifier si le projet existe
    const Project = (await import('../models/Project.js')).default;
    const projectObj = await Project.findById(project);
    if (!projectObj) {
      return res.status(400).json({
        success: false,
        message: 'Projet non trouvé'
      });
    }

    // Créer la tâche
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      assignedTo,
      createdBy: req.user.id,
      estimatedTime,
      tags: tags || [],
      project
    });

    // Populate les relations
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate({ path: 'project', select: 'name owner', populate: { path: 'owner', select: 'name email' } });

    // Envoyer notification temps réel
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.taskCreated(task._id);
    }

    res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour une tâche
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    console.log('updateTask appelé pour id:', req.params.id, 'par user:', req.user);
    const task = await Task.findById(req.params.id);
    console.log('Résultat de Task.findById:', task);

    if (!task) {
      console.log('Tâche non trouvée pour id:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user.id) {
      console.log('Permission refusée: employé non assigné à la tâche');
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Mettre à jour la tâche
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    // Envoyer notification temps réel
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.taskUpdated(updatedTask._id);
    }

    res.json({
      success: true,
      message: 'Tâche mise à jour avec succès',
      data: { task: updatedTask }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer une tâche
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier les permissions (seuls les créateurs et admins peuvent supprimer)
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Sauvegarder les informations avant suppression pour les notifications
    const taskInfo = {
      id: task._id,
      title: task.title,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy
    };

    await Task.findByIdAndDelete(req.params.id);

    // Envoyer notification temps réel
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.taskDeleted(taskInfo);
    }

    res.json({
      success: true,
      message: 'Tâche supprimée avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Marquer une tâche comme terminée
// @route   PATCH /api/tasks/:id/complete
// @access  Private
export const completeTask = async (req, res, next) => {
  try {
    const { actualTime } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Marquer comme terminée
    await task.markAsCompleted(actualTime);

    // Populate les relations
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // Envoyer notification temps réel
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.taskCompleted(task._id);
    }

    res.json({
      success: true,
      message: 'Tâche marquée comme terminée',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ajouter un commentaire à une tâche
// @route   POST /api/tasks/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Ajouter le commentaire
    await task.addComment(req.user.id, content);

    // Populate les relations
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('comments.user', 'name email');

    // Envoyer notification temps réel
    const io = req.app.get('io');
    if (io) {
      const notificationService = new NotificationService(io);
      await notificationService.commentAdded(task._id, req.user.id, content);
    }

    res.json({
      success: true,
      message: 'Commentaire ajouté avec succès',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un commentaire d'une tâche
// @route   DELETE /api/tasks/:taskId/comments/:commentId
// @access  Private
export const deleteComment = async (req, res, next) => {
  try {
    const { taskId, commentId } = req.params;
    const task = await Task.findById(taskId).populate('comments.user', 'role');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée' });
    }
    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Commentaire non trouvé' });
    }
    // Autorisation : auteur du commentaire OU admin/manager
    const isAuthor = comment.user.equals(req.user.id);
    const isAdminOrManager = req.user.role === 'admin' || req.user.role === 'manager';
    if (!isAuthor && !isAdminOrManager) {
      return res.status(403).json({ success: false, message: 'Non autorisé à supprimer ce commentaire' });
    }
    comment.remove();
    await task.save();
    await task.populate('comments.user', 'name email');
    res.json({ success: true, message: 'Commentaire supprimé', data: { comments: task.comments } });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les statistiques des tâches
// @route   GET /api/tasks/stats
// @access  Private
export const getTaskStats = async (req, res, next) => {
  try {
    const userId = req.user.role === 'employee' ? req.user.id : null;
    const stats = await Task.getStats(userId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les tâches par période
// @route   GET /api/tasks/period/:period
// @access  Private
export const getTasksByPeriod = async (req, res, next) => {
  try {
    const { period } = req.params;
    const userId = req.user.role === 'employee' ? req.user.id : null;

    if (userId) {
      const tasks = await Task.getTasksByPeriod(userId, period);
      res.json({
        success: true,
        data: { tasks }
      });
    } else {
      res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Archiver une tâche
// @route   PATCH /api/tasks/:id/archive
// @access  Private
export const archiveTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Tâche non trouvée'
      });
    }

    // Vérifier les permissions
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    await task.archive();

    res.json({
      success: true,
      message: 'Tâche archivée avec succès'
    });
  } catch (error) {
    next(error);
  }
}; 