import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';

// Générer JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Générer Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// @desc    Inscription utilisateur
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.emailExists(email);
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee'
    });

    // Générer les tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: user.toPublicJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour lastLogin
    await user.updateLastLogin();

    // Générer les tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.toPublicJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Déconnexion utilisateur
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // Dans une implémentation plus avancée, vous pourriez
    // ajouter le token à une liste noire
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rafraîchir le token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Token de rafraîchissement requis'
      });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement invalide'
      });
    }

    // Générer de nouveaux tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        user: user.toPublicJSON(),
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Obtenir le profil utilisateur
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('assignedTasks');
    
    res.json({
      success: true,
      data: {
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour le profil utilisateur
// @route   PUT /api/auth/me
// @access  Private
export const updateMe = async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword, bio, phone } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    // Mettre à jour les champs de base
    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
      user.email = email;
    }
    if (typeof bio === 'string') user.bio = bio;
    if (typeof phone === 'string') user.phone = phone;

    // Mettre à jour le mot de passe si fourni
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mot de passe actuel incorrect'
        });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Demander la réinitialisation du mot de passe
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur trouvé avec cet email'
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // Ici vous pourriez envoyer un email avec le token
    // Pour l'instant, on retourne le token (en production, envoyez un email)
    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé',
      data: {
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Hasher le token pour la comparaison
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Mettre à jour le mot de passe
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    next(error);
  }
}; 