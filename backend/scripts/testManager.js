import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestManager = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Créer un utilisateur manager
    const manager = await User.create({
      name: 'Marie Martin',
      email: 'marie.martin@test.com',
      password: 'password123',
      role: 'manager'
    });

    console.log('Utilisateur manager créé:', manager.email);

    // Créer quelques tâches de test pour le manager
    const tasks = await Task.create([
      {
        title: 'Tâche pour Marie (manager)',
        description: 'Cette tâche est assignée à Marie',
        status: 'todo',
        priority: 'high',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 jours
        assignedTo: manager._id,
        createdBy: manager._id
      },
      {
        title: 'Tâche de gestion d\'équipe',
        description: 'Tâche de supervision pour Marie',
        status: 'in-progress',
        priority: 'medium',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 jours
        assignedTo: manager._id,
        createdBy: manager._id
      }
    ]);

    console.log('Tâches créées pour Marie:', tasks.length);

    // Vérifier les tâches de Marie
    const marieTasks = await Task.find({ assignedTo: manager._id });
    console.log('Tâches assignées à Marie:', marieTasks.length);

    // Vérifier toutes les tâches
    const allTasks = await Task.find({});
    console.log('Total des tâches:', allTasks.length);

    console.log('Test manager terminé avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

createTestManager(); 