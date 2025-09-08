import Project from '../models/Project.js';
import User from '../models/User.js';
import Task from '../models/Task.js';

// Créer un projet
export const createProject = async (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Seuls les managers et les admins peuvent créer un projet.'
    });
  }
  try {
    const { name, description, membersEmails } = req.body;
    const owner = req.user.id;

    // Chercher les utilisateurs par email
    const members = await User.find({ email: { $in: membersEmails } });
    if (members.length !== membersEmails.length) {
      return res.status(400).json({ success: false, message: "Certains emails ne correspondent à aucun utilisateur." });
    }

    // Créer le projet
    const project = await Project.create({
      name,
      description,
      owner,
      members: members.map(u => u._id)
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// Ajouter un membre à un projet par email
export const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Projet non trouvé." });
    }
    if (project.members.includes(user._id)) {
      return res.status(400).json({ success: false, message: "Cet utilisateur est déjà membre du projet." });
    }
    project.members.push(user._id);
    await project.save();
    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// Lister les membres d’un projet
export const listMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('members', 'name email role');
    if (!project) {
      return res.status(404).json({ success: false, message: "Projet non trouvé." });
    }
    res.json({ success: true, data: project.members });
  } catch (error) {
    next(error);
  }
};

// Créer une tâche dans un projet et l’assigner à un membre
export const createProjectTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, dueDate, priority } = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Projet non trouvé." });
    }
    if (!project.members.includes(assignedTo)) {
      return res.status(400).json({ success: false, message: "L'utilisateur assigné doit être membre du projet." });
    }
    const task = await Task.create({
      title,
      description,
      assignedTo,
      createdBy: req.user.id,
      dueDate,
      priority,
      project: projectId, // Lier la tâche au projet
    });
    project.tasks.push(task._id);
    await project.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// Lister tous les projets dont l'utilisateur est membre ou propriétaire
export const listUserProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    }).populate('members', 'name email role');
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate({
      path: 'tasks',
      populate: { path: 'assignedTo', select: 'name email' }
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Projet non trouvé.' });
    }
    res.json({ success: true, data: project.tasks });
  } catch (error) {
    next(error);
  }
}; 