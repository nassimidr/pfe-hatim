import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware pour protéger les routes
export const protect = async (req, res, next) => {
  console.log('Headers:', req.headers); // DEBUG
  let token;

  // Vérifier si le token est dans les headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extraire le token
      token = req.headers.authorization.split(' ')[1];

      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur depuis la base de données
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token non valide - utilisateur non trouvé'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Compte utilisateur désactivé'
        });
      }

      // Ajouter l'utilisateur à l'objet request
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token non valide'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'accès requis'
    });
  }
};

// Middleware pour vérifier les rôles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé - utilisateur non connecté'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rôle ${req.user.role} non autorisé à accéder à cette ressource`
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur est admin
export const requireAdmin = authorize('admin');

// Middleware pour vérifier si l'utilisateur est manager ou admin
export const requireManager = authorize('manager', 'admin');

// Middleware pour vérifier si l'utilisateur peut accéder à ses propres ressources
export const requireOwnership = (resourceField = 'assignedTo') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Les admins peuvent accéder à tout
    if (req.user.role === 'admin') {
      return next();
    }

    // Les managers peuvent accéder aux ressources de leur équipe
    if (req.user.role === 'manager') {
      // Ici vous pourriez ajouter une logique pour vérifier si l'utilisateur
      // fait partie de l'équipe du manager
      return next();
    }

    // Les employés ne peuvent accéder qu'à leurs propres ressources
    if (req.params.id) {
      // Pour les routes avec ID, vérifier si la ressource appartient à l'utilisateur
      // Cette logique sera implémentée dans les contrôleurs
      return next();
    }

    next();
  };
};

// Middleware pour mettre à jour lastLogin
export const updateLastLogin = async (req, res, next) => {
  if (req.user) {
    try {
      await req.user.updateLastLogin();
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
  next();
};

// Middleware pour vérifier le token de rafraîchissement
export const verifyRefreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Token de rafraîchissement requis'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement invalide'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token de rafraîchissement invalide'
    });
  }
};

export default protect; 