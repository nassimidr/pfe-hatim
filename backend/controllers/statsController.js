import Task from '../models/Task.js';
import User from '../models/User.js';

// @desc    Obtenir les statistiques du dashboard
// @route   GET /api/stats/dashboard
// @access  Private
export const getDashboardStats = async (req, res, next) => {
  try {
    // Déterminer le filtre selon le rôle
    let taskFilter = { isArchived: false };
    
    if (req.user.role === 'employee') {
      // Les employés ne voient que leurs tâches
      taskFilter.assignedTo = req.user.id;
    }
    // Les managers et admins voient toutes les tâches par défaut
    
    console.log('[Stats] getDashboardStats appelé avec rôle:', req.user.role);
    console.log('[Stats] Utilisateur:', req.user.name, 'Rôle:', req.user.role);
    console.log('[Stats] Filtre appliqué:', taskFilter);
    
    // Statistiques des tâches
    let managedProjectIds = null;
    if (req.user.role === 'manager') {
      const Project = (await import('../models/Project.js')).default;
      const managedProjects = await Project.find({ owner: req.user.id }).select('_id');
      managedProjectIds = managedProjects.map(p => p._id);
    }
    const taskStats = await Task.getStats(
      req.user.id, 
      req.user.role, 
      managedProjectIds
    );
    console.log('[Stats] taskStats calculées:', taskStats);

    // Tâches du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await Task.find({
      dueDate: { $gte: today, $lt: tomorrow },
      ...taskFilter
    }).populate('assignedTo', 'name email');

    // Tâches en retard
    const overdueTasks = await Task.find({
      dueDate: { $lt: today },
      status: { $ne: 'completed' },
      ...taskFilter
    }).populate('assignedTo', 'name email');

    // Activité récente (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          ...taskFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          created: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const responseData = {
      taskStats,
      todayTasks,
      overdueTasks,
      recentActivity
    };

    console.log('[Stats] Données complètes à envoyer:', responseData);

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('[Stats] Erreur dans getDashboardStats:', error);
    next(error);
  }
};

// @desc    Obtenir les analyses des tâches
// @route   GET /api/stats/tasks
// @access  Private
export const getTaskAnalytics = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    // Déterminer le filtre selon le rôle
    let taskFilter = { isArchived: false };
    
    if (req.user.role === 'employee') {
      // Les employés ne voient que leurs tâches
      taskFilter.assignedTo = req.user.id;
    } else if (req.user.role === 'manager') {
      // Les managers voient leurs tâches assignées + les tâches des projets dont ils sont owner
      const Project = (await import('../models/Project.js')).default;
      const managedProjects = await Project.find({ owner: req.user.id }).select('_id');
      const managedProjectIds = managedProjects.map(p => p._id);
      
      taskFilter.$or = [
        { assignedTo: req.user.id }, // Tâches assignées à ce manager
        { project: { $in: managedProjectIds } } // Tâches des projets gérés
      ];
    }
    // Les admins voient toutes les tâches par défaut

    // TEMP : Désactiver le filtre de période pour tout remonter
    // const now = new Date();
    // let startDate;
    // switch (period) { ... }
    // Remplacer startDate par 0 pour tout inclure
    const startDate = new Date(0);

    // Statistiques par priorité
    const priorityStats = await Task.aggregate([
      {
        $match: {
          $or: [
            { createdAt: { $gte: startDate } },
            { completedAt: { $gte: startDate } }
          ],
          ...taskFilter
        }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$status', 'completed'] },
                  { $gte: ['$completedAt', startDate] }
                ] },
                1, 0
              ]
            }
          }
        }
      }
    ]);

    // Statistiques par statut (sur la période de complétion pour completed)
    const statusStats = await Task.aggregate([
      {
        $match: {
          $or: [
            { createdAt: { $gte: startDate } },
            { completedAt: { $gte: startDate } }
          ],
          ...taskFilter
        }
      },
      {
        $group: {
          _id: '$status',
          count: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$status', 'completed'] },
                  { $gte: ['$completedAt', startDate] }
                ] },
                1,
                {
                  $cond: [
                    { $ne: ['$status', 'completed'] },
                    1,
                    0
                  ]
                }
              ]
            }
          }
        }
      }
    ]);

    // Performance (temps estimé vs réel) sur la période de complétion
    const performanceStats = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: startDate },
          estimatedTime: { $exists: true, $ne: null },
          actualTime: { $exists: true, $ne: null },
          ...taskFilter
        }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          avgEstimatedTime: { $avg: '$estimatedTime' },
          avgActualTime: { $avg: '$actualTime' },
          onTimeTasks: {
            $sum: { $cond: [{ $lte: ['$actualTime', '$estimatedTime'] }, 1, 0] }
          }
        }
      }
    ]);

    // Tâches par jour de la semaine (créées ou terminées sur la période)
    const weeklyStats = await Task.aggregate([
      {
        $match: {
          $or: [
            { createdAt: { $gte: startDate } },
            { completedAt: { $gte: startDate } }
          ],
          ...taskFilter
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        priorityStats,
        statusStats,
        performanceStats: performanceStats[0] || null,
        weeklyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les performances des utilisateurs
// @route   GET /api/stats/users/performance
// @access  Private/Manager
export const getUserPerformance = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;

    // Définir la période
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    // Performance par utilisateur
    const userPerformance = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isArchived: false
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$assignedTo',
          userName: { $first: '$user.name' },
          userEmail: { $first: '$user.email' },
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                '$actualTime',
                null
              ]
            }
          },
          onTimePercentage: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'completed'] },
                    { $ne: ['$estimatedTime', null] },
                    { $ne: ['$actualTime', null] },
                    { $lte: ['$actualTime', '$estimatedTime'] }
                  ]
                },
                100,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          userName: 1,
          userEmail: 1,
          totalTasks: 1,
          completedTasks: 1,
          overdueTasks: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedTasks', '$totalTasks'] },
              100
            ]
          },
          avgCompletionTime: { $round: ['$avgCompletionTime', 1] },
          onTimePercentage: { $round: ['$onTimePercentage', 1] }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    res.json({
      success: true,
      data: { userPerformance }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir les statistiques d'équipe
// @route   GET /api/stats/team
// @access  Private/Manager
export const getTeamStats = async (req, res, next) => {
  try {
    // Statistiques globales de l'équipe
    const teamStats = await Task.aggregate([
      {
        $match: { isArchived: false }
      },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Répartition par rôle
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    // Tâches créées par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          isArchived: false
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          created: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        teamStats: teamStats[0] || null,
        roleStats,
        monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
}; 