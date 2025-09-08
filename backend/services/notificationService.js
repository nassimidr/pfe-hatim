import Task from '../models/Task.js';
import User from '../models/User.js';

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // Notifier un utilisateur spécifique
  notifyUser(userId, notification) {
    this.io.to(`user-${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Notifier tous les admins
  notifyAdmins(notification) {
    this.io.to('admin-room').emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Notifier tous les utilisateurs
  broadcast(notification) {
    this.io.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Nouvelle tâche créée
  async taskCreated(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      if (!task) return;

      // Notifier l'utilisateur assigné
      this.notifyUser(task.assignedTo._id, {
        type: 'task-assigned',
        title: 'Nouvelle tâche assignée',
        message: `Vous avez une nouvelle tâche: "${task.title}"`,
        priority: task.priority,
        data: {
          taskId: task._id,
          taskTitle: task.title,
          dueDate: task.dueDate
        }
      });

      // Notifier les admins
      this.notifyAdmins({
        type: 'task-created',
        title: 'Nouvelle tâche créée',
        message: `Tâche "${task.title}" créée et assignée à ${task.assignedTo.name}`,
        priority: 'medium',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          assignedTo: task.assignedTo.name
        }
      });
    } catch (error) {
      console.error('Error in taskCreated notification:', error);
    }
  }

  // Tâche mise à jour
  async taskUpdated(taskId, updatedFields = {}) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      if (!task) return;

      // Notifier l'utilisateur assigné
      this.notifyUser(task.assignedTo._id, {
        type: 'task-updated',
        title: 'Tâche mise à jour',
        message: `La tâche "${task.title}" a été mise à jour`,
        priority: 'medium',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          updatedFields
        }
      });

      // Notifier le créateur si différent de l'assigné
      if (task.createdBy._id.toString() !== task.assignedTo._id.toString()) {
        this.notifyUser(task.createdBy._id, {
          type: 'task-updated',
          title: 'Tâche mise à jour',
          message: `La tâche "${task.title}" a été mise à jour`,
          priority: 'medium',
          data: {
            taskId: task._id,
            taskTitle: task.title,
            updatedFields
          }
        });
      }
    } catch (error) {
      console.error('Error in taskUpdated notification:', error);
    }
  }

  // Tâche terminée
  async taskCompleted(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      if (!task) return;

      // Notifier le créateur
      this.notifyUser(task.createdBy._id, {
        type: 'task-completed',
        title: 'Tâche terminée',
        message: `La tâche "${task.title}" a été terminée par ${task.assignedTo.name}`,
        priority: 'high',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          completedBy: task.assignedTo.name
        }
      });

      // Notifier les admins
      this.notifyAdmins({
        type: 'task-completed',
        title: 'Tâche terminée',
        message: `Tâche "${task.title}" terminée par ${task.assignedTo.name}`,
        priority: 'medium',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          completedBy: task.assignedTo.name
        }
      });
    } catch (error) {
      console.error('Error in taskCompleted notification:', error);
    }
  }

  // Tâche en retard
  async taskOverdue(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      if (!task) return;

      // Notifier l'utilisateur assigné
      this.notifyUser(task.assignedTo._id, {
        type: 'task-overdue',
        title: 'Tâche en retard',
        message: `La tâche "${task.title}" est en retard`,
        priority: 'high',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          dueDate: task.dueDate
        }
      });

      // Notifier le créateur
      this.notifyUser(task.createdBy._id, {
        type: 'task-overdue',
        title: 'Tâche en retard',
        message: `La tâche "${task.title}" assignée à ${task.assignedTo.name} est en retard`,
        priority: 'high',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          assignedTo: task.assignedTo.name,
          dueDate: task.dueDate
        }
      });
    } catch (error) {
      console.error('Error in taskOverdue notification:', error);
    }
  }

  // Échéance approchante (24h avant)
  async taskDueSoon(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      if (!task) return;

      // Notifier l'utilisateur assigné
      this.notifyUser(task.assignedTo._id, {
        type: 'task-due-soon',
        title: 'Échéance approchante',
        message: `La tâche "${task.title}" est due demain`,
        priority: 'medium',
        data: {
          taskId: task._id,
          taskTitle: task.title,
          dueDate: task.dueDate
        }
      });
    } catch (error) {
      console.error('Error in taskDueSoon notification:', error);
    }
  }

  // Nouveau commentaire
  async commentAdded(taskId, commentUserId, content) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('comments.user', 'name email');

      if (!task) return;

      const commentUser = task.comments[task.comments.length - 1].user;

      // Notifier l'utilisateur assigné si le commentaire n'est pas de lui
      if (commentUser._id.toString() !== task.assignedTo._id.toString()) {
        this.notifyUser(task.assignedTo._id, {
          type: 'comment-added',
          title: 'Nouveau commentaire',
          message: `${commentUser.name} a commenté sur la tâche "${task.title}"`,
          priority: 'low',
          data: {
            taskId: task._id,
            taskTitle: task.title,
            commentBy: commentUser.name
          }
        });
      }

      // Notifier le créateur si différent de l'assigné et du commentateur
      if (task.createdBy._id.toString() !== task.assignedTo._id.toString() && 
          task.createdBy._id.toString() !== commentUser._id.toString()) {
        this.notifyUser(task.createdBy._id, {
          type: 'comment-added',
          title: 'Nouveau commentaire',
          message: `${commentUser.name} a commenté sur la tâche "${task.title}"`,
          priority: 'low',
          data: {
            taskId: task._id,
            taskTitle: task.title,
            commentBy: commentUser.name
          }
        });
      }
    } catch (error) {
      console.error('Error in commentAdded notification:', error);
    }
  }

  // Tâche mise à jour
  async taskUpdated(taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      if (!task) return;

      // Notifier l'utilisateur assigné
      this.notifyUser(task.assignedTo._id, {
        type: 'task-updated',
        title: 'Tâche mise à jour',
        message: `La tâche "${task.title}" a été mise à jour`,
        priority: 'medium',
        data: {
          taskId: task._id,
          taskTitle: task.title
        }
      });

      // Notifier le créateur si différent de l'assigné
      if (task.createdBy._id.toString() !== task.assignedTo._id.toString()) {
        this.notifyUser(task.createdBy._id, {
          type: 'task-updated',
          title: 'Tâche mise à jour',
          message: `La tâche "${task.title}" assignée à ${task.assignedTo.name} a été mise à jour`,
          priority: 'medium',
          data: {
            taskId: task._id,
            taskTitle: task.title,
            assignedTo: task.assignedTo.name
          }
        });
      }
    } catch (error) {
      console.error('Error in taskUpdated notification:', error);
    }
  }

  // Tâche supprimée
  async taskDeleted(taskInfo) {
    try {
      // Notifier l'utilisateur assigné
      this.notifyUser(taskInfo.assignedTo, {
        type: 'task-deleted',
        title: 'Tâche supprimée',
        message: `La tâche "${taskInfo.title}" a été supprimée`,
        priority: 'high',
        data: {
          taskId: taskInfo.id,
          taskTitle: taskInfo.title
        }
      });

      // Notifier le créateur si différent de l'assigné
      if (taskInfo.createdBy.toString() !== taskInfo.assignedTo.toString()) {
        this.notifyUser(taskInfo.createdBy, {
          type: 'task-deleted',
          title: 'Tâche supprimée',
          message: `La tâche "${taskInfo.title}" a été supprimée`,
          priority: 'high',
          data: {
            taskId: taskInfo.id,
            taskTitle: taskInfo.title
          }
        });
      }

      // Notifier les admins
      this.notifyAdmins({
        type: 'task-deleted',
        title: 'Tâche supprimée',
        message: `Tâche "${taskInfo.title}" supprimée`,
        priority: 'medium',
        data: {
          taskId: taskInfo.id,
          taskTitle: taskInfo.title
        }
      });
    } catch (error) {
      console.error('Error in taskDeleted notification:', error);
    }
  }

  // Vérifier les tâches en retard (à appeler périodiquement)
  async checkOverdueTasks() {
    try {
      const overdueTasks = await Task.find({
        status: { $ne: 'completed' },
        dueDate: { $lt: new Date() },
        isArchived: false
      }).populate('assignedTo', 'name email');

      for (const task of overdueTasks) {
        await this.taskOverdue(task._id);
      }
    } catch (error) {
      console.error('Error checking overdue tasks:', error);
    }
  }

  // Vérifier les échéances approchantes (à appeler périodiquement)
  async checkDueSoonTasks() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      const dueSoonTasks = await Task.find({
        status: { $ne: 'completed' },
        dueDate: { 
          $gte: tomorrow,
          $lt: dayAfterTomorrow 
        },
        isArchived: false
      }).populate('assignedTo', 'name email');

      for (const task of dueSoonTasks) {
        await this.taskDueSoon(task._id);
      }
    } catch (error) {
      console.error('Error checking due soon tasks:', error);
    }
  }
}

export default NotificationService; 