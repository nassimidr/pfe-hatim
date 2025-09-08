import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestEmployee = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');

    // Créer un utilisateur employé
    const employee = await User.create({
      name: 'Jean Dupont',
      email: 'jean.dupont@test.com',
      password: 'password123',
      role: 'employee'
    });

    console.log('Utilisateur employé créé:', employee.email);

    // Créer quelques tâches de test
    const tasks = await Task.create([
      {
        title: 'Tâche pour Jean (employé)',
        description: 'Cette tâche est assignée à Jean',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
        assignedTo: employee._id,
        createdBy: employee._id
      },
      {
        title: 'Tâche pour un autre employé',
        description: 'Cette tâche est assignée à quelqu\'un d\'autre',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 jours
        assignedTo: new mongoose.Types.ObjectId(), // ID différent
        createdBy: employee._id
      }
    ]);

    console.log('Tâches créées:', tasks.length);

    // Vérifier les tâches de Jean
    const jeanTasks = await Task.find({ assignedTo: employee._id });
    console.log('Tâches assignées à Jean:', jeanTasks.length);

    // Vérifier toutes les tâches
    const allTasks = await Task.find({});
    console.log('Total des tâches:', allTasks.length);

    console.log('Test terminé avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

createTestEmployee(); 