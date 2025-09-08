import { validationResult, body, query } from 'express-validator';

// Middleware pour gérer les erreurs de validation
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Validation pour l'authentification
export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Veuillez entrer un email valide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  handleValidationErrors
];

// Validation pour l'inscription
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .withMessage('Veuillez entrer un email valide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('role')
    .isIn(['employee', 'manager'])
    .withMessage('Le rôle doit être employee ou manager'),
  handleValidationErrors
];

// Validation pour les tâches
export const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Le titre doit contenir entre 3 et 100 caractères'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La description doit contenir entre 10 et 1000 caractères'),
  body('dueDate')
    .isISO8601()
    .withMessage('Date limite invalide')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La date limite doit être dans le futur');
      }
      return true;
    }),
  body('priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('La priorité doit être low, medium ou high'),
  body('assignedTo')
    .isMongoId()
    .withMessage('ID utilisateur invalide'),
  body('project')
    .isMongoId()
    .withMessage('ID projet invalide'),
  body('estimatedTime')
    .optional()
    .isFloat({ min: 0.5, max: 168 })
    .withMessage('Le temps estimé doit être entre 0.5 et 168 heures'),
  handleValidationErrors
];

// Validation pour les tâches de projet (sans le champ project car il est dans l'URL)
export const validateProjectTask = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Le titre doit contenir entre 3 et 100 caractères'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La description doit contenir entre 10 et 1000 caractères'),
  body('dueDate')
    .isISO8601()
    .withMessage('Date limite invalide')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La date limite doit être dans le futur');
      }
      return true;
    }),
  body('priority')
    .isIn(['low', 'medium', 'high'])
    .withMessage('La priorité doit être low, medium ou high'),
  body('assignedTo')
    .isMongoId()
    .withMessage('ID utilisateur invalide'),
  body('estimatedTime')
    .optional()
    .isFloat({ min: 0.5, max: 168 })
    .withMessage('Le temps estimé doit être entre 0.5 et 168 heures'),
  handleValidationErrors
];

// Validation pour la mise à jour des tâches
export const validateTaskUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Le titre doit contenir entre 3 et 100 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('La description doit contenir entre 10 et 1000 caractères'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Date limite invalide'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('La priorité doit être low, medium ou high'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'completed'])
    .withMessage('Le statut doit être todo, in-progress ou completed'),
  body('estimatedTime')
    .optional()
    .isFloat({ min: 0.5, max: 168 })
    .withMessage('Le temps estimé doit être entre 0.5 et 168 heures'),
  body('actualTime')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le temps réel ne peut pas être négatif'),
  handleValidationErrors
];

// Validation pour les utilisateurs
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .isEmail()
    .withMessage('Veuillez entrer un email valide')
    .normalizeEmail(),
  body('role')
    .isIn(['employee', 'manager', 'admin'])
    .withMessage('Le rôle doit être employee, manager ou admin'),
  handleValidationErrors
];

// Validation pour les commentaires
export const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Le commentaire doit contenir entre 1 et 500 caractères'),
  handleValidationErrors
];

// Validation pour les paramètres de requête
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Le numéro de page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', 'dueDate', 'priority', 'status', 'title'])
    .withMessage('Tri invalide'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre invalide'),
  handleValidationErrors
]; 