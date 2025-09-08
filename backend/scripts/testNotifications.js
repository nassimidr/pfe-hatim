import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/Task.js';
import User from '../models/User.js';
import NotificationService from '../services/notificationService.js';
import { Server } from 'socket.io';

dotenv.config();

// Configuration de Socket.io pour les tests
const io = new Server(3001, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const notificationService = new NotificationService(io);

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

// Fonction pour créer des notifications de test
const createTestNotifications = async () => {
  try {
    // Récupérer un utilisateur et une tâche existants
    const user = await User.findOne();
    const task = await Task.findOne().populate('assignedTo createdBy');

    if (!user || !task) {
      console.log('❌ Aucun utilisateur ou tâche trouvé pour les tests');
      return;
    }

    console.log('🔔 Création de notifications de test...');

    // Test 1: Notification de tâche créée
    await notificationService.taskCreated(task._id);
    console.log('✅ Notification "tâche créée" envoyée');

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Notification de tâche mise à jour
    await notificationService.taskUpdated(task._id);
    console.log('✅ Notification "tâche mise à jour" envoyée');

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Notification de commentaire ajouté
    await notificationService.commentAdded(task._id, user._id, 'Test commentaire');
    console.log('✅ Notification "commentaire ajouté" envoyée');

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Notification de tâche terminée
    await notificationService.taskCompleted(task._id);
    console.log('✅ Notification "tâche terminée" envoyée');

    // Attendre 2 secondes
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 5: Notification de tâche supprimée
    await notificationService.taskDeleted({
      id: task._id,
      title: task.title,
      assignedTo: task.assignedTo._id,
      createdBy: task.createdBy._id
    });
    console.log('✅ Notification "tâche supprimée" envoyée');

    console.log('🎉 Toutes les notifications de test ont été envoyées !');
    console.log('📱 Vérifiez votre interface utilisateur pour voir les notifications');

  } catch (error) {
    console.error('❌ Erreur lors de la création des notifications:', error);
  }
};

// Fonction principale
const main = async () => {
  await connectDB();
  
  console.log('🚀 Démarrage du serveur de test de notifications...');
  console.log('📡 Serveur Socket.io démarré sur le port 3001');
  
  // Créer les notifications de test
  await createTestNotifications();
  
  // Garder le serveur ouvert pour les tests
  console.log('⏳ Serveur en attente... Appuyez sur Ctrl+C pour arrêter');
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur de test...');
    mongoose.connection.close();
    io.close();
    process.exit(0);
  });
};

main().catch(console.error); 