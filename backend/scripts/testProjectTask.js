import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

dotenv.config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error);
    process.exit(1);
  }
};

// Test de création de tâche via la route des projets
const testProjectTask = async () => {
  try {
    console.log('🧪 Test de création de tâche via route projet...');

    // Récupérer un utilisateur et un projet existants
    const user = await User.findOne();
    const project = await Project.findOne();

    if (!user || !project) {
      console.log('❌ Aucun utilisateur ou projet trouvé pour les tests');
      return;
    }

    console.log('👤 Utilisateur trouvé:', user.name);
    console.log('📁 Projet trouvé:', project.name);

    // Simuler les données envoyées par le frontend
    const taskData = {
      title: 'Tâche de projet test',
      description: 'Description de la tâche de projet test',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours dans le futur
      priority: 'medium',
      assignedTo: user._id.toString(),
      estimatedTime: 4
    };

    console.log('📝 Données de la tâche:', taskData);

    // Simuler la création via la route des projets
    const task = await Task.create({
      ...taskData,
      assignedTo: user._id,
      createdBy: user._id,
      project: project._id, // Le projet est ajouté automatiquement
      dueDate: new Date(taskData.dueDate)
    });

    console.log('✅ Tâche créée avec succès:', task._id);

    // Vérifier que la tâche a bien le projet
    const createdTask = await Task.findById(task._id).populate('project');
    console.log('🔍 Tâche récupérée:', {
      id: createdTask._id,
      title: createdTask.title,
      project: createdTask.project.name,
      projectId: createdTask.project._id
    });

    // Nettoyer - supprimer la tâche de test
    await Task.findByIdAndDelete(task._id);
    console.log('🧹 Tâche de test supprimée');

    console.log('🎉 Test réussi !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Fonction principale
const main = async () => {
  await connectDB();
  await testProjectTask();
  
  console.log('🏁 Test terminé');
  mongoose.connection.close();
  process.exit(0);
};

main().catch(console.error); 