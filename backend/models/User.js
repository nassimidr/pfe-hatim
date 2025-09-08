import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez entrer un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas inclure le mot de passe dans les requêtes par défaut
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'admin'],
    default: 'employee'
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'La bio ne peut pas dépasser 500 caractères']
  },
  phone: {
    type: String,
    default: '',
    maxlength: [20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual pour le nom complet
userSchema.virtual('fullName').get(function() {
  return `${this.name}`;
});

// Virtual pour les tâches assignées (relation avec Task)
userSchema.virtual('assignedTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'assignedTo'
});

// Middleware pre-save pour hasher le mot de passe
userSchema.pre('save', async function(next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();

  try {
    // Hasher le mot de passe avec bcrypt
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir les informations publiques de l'utilisateur
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.emailVerificationToken;
  return userObject;
};

// Méthode statique pour trouver un utilisateur par email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Méthode statique pour vérifier si un email existe
userSchema.statics.emailExists = async function(email) {
  const user = await this.findOne({ email: email.toLowerCase() });
  return !!user;
};

// Middleware pour mettre à jour lastLogin
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User; 