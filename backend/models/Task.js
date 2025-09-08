import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: [true, 'La date limite est requise']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'assignation est requise']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le créateur est requis']
  },
  estimatedTime: {
    type: Number,
    min: [0.5, 'Le temps estimé doit être au moins de 0.5 heure'],
    max: [168, 'Le temps estimé ne peut pas dépasser 168 heures (1 semaine)']
  },
  actualTime: {
    type: Number,
    min: [0, 'Le temps réel ne peut pas être négatif']
  },
  completedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, 'Un tag ne peut pas dépasser 20 caractères']
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Un commentaire ne peut pas dépasser 500 caractères']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, "Le projet est requis"]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ isArchived: 1 });
taskSchema.index({ createdAt: -1 });

// Virtual pour vérifier si la tâche est en retard
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Virtual pour calculer le temps restant
taskSchema.virtual('timeRemaining').get(function() {
  if (this.status === 'completed') return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  return Math.max(0, due - now);
});

// Virtual pour calculer le pourcentage de progression
taskSchema.virtual('progressPercentage').get(function() {
  switch (this.status) {
    case 'todo': return 0;
    case 'in-progress': return 50;
    case 'completed': return 100;
    default: return 0;
  }
});

// Virtual pour calculer la performance (temps estimé vs réel)
taskSchema.virtual('performance').get(function() {
  if (!this.estimatedTime || !this.actualTime) return null;
  return {
    ratio: this.actualTime / this.estimatedTime,
    efficiency: this.estimatedTime / this.actualTime,
    isOnTime: this.actualTime <= this.estimatedTime
  };
});

// Middleware pre-save pour mettre à jour completedAt
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.isModified('status') && this.status !== 'completed') {
    this.completedAt = null;
  }
  next();
});

// Méthode statique pour obtenir les statistiques
taskSchema.statics.getStats = async function(userId = null, userRole = null, managedProjectIds = null) {
  let matchStage = { isArchived: false };
  
  if (userId) {
    if (userRole === 'employee') {
      // Les employés ne voient que leurs tâches assignées
      matchStage.assignedTo = userId;
    } else if (userRole === 'manager') {
      // Les managers voient leurs tâches assignées + les tâches des projets gérés
      if (managedProjectIds && managedProjectIds.length > 0) {
        matchStage.$or = [
          { assignedTo: userId }, // Tâches assignées à ce manager
          { project: { $in: managedProjectIds } } // Tâches des projets gérés
        ];
      } else {
        matchStage.assignedTo = userId;
      }
    }
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
        },
        todo: {
          $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] }
        },
        overdue: {
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

  return stats[0] || {
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    overdue: 0
  };
};

// Méthode statique pour obtenir les tâches par période
taskSchema.statics.getTasksByPeriod = async function(userId, period = 'week') {
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

  return await this.find({
    assignedTo: userId,
    createdAt: { $gte: startDate },
    isArchived: false
  }).populate('assignedTo', 'name email');
};

// Méthode pour ajouter un commentaire
taskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content: content.trim()
  });
  return this.save();
};

// Méthode pour marquer comme terminée
taskSchema.methods.markAsCompleted = function(actualTime = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (actualTime !== null) {
    this.actualTime = actualTime;
  }
  return this.save();
};

// Méthode pour archiver
taskSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

const Task = mongoose.model('Task', taskSchema);

export default Task; 