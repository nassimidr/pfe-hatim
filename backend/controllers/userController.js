import User from '../models/User.js';
import Task from '../models/Task.js';

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Construire le filtre
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Construire le tri
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    // Exécuter la requête
    const users = await User.find(filter)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Compter le total
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
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

// @desc    Obtenir un utilisateur par ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedTasks');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Créer un nouvel utilisateur
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res, next) => {
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
      role
    });

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'utilisateur a des tâches assignées
    const assignedTasks = await Task.countDocuments({ assignedTo: req.params.id });
    if (assignedTasks > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer l'utilisateur. Il a ${assignedTasks} tâche(s) assignée(s).`
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activer/Désactiver un utilisateur
// @route   PATCH /api/users/:id/toggle-status
// @access  Private/Admin
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: {
        user: user.toPublicJSON()
      }
    });
  } catch (error) {
    next(error);
  }
}; 