import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const testStats = async () => {
  try {
    await connectDB();
    
    console.log('\n=== TEST DES STATISTIQUES ===\n');
    
    // 1. Compter toutes les tâches
    const totalTasks = await Task.countDocuments({ isArchived: false });
    console.log(`Total des tâches (non archivées): ${totalTasks}`);
    
    // 2. Compter les tâches par statut
    const todoTasks = await Task.countDocuments({ status: 'todo', isArchived: false });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress', isArchived: false });
    const completedTasks = await Task.countDocuments({ status: 'completed', isArchived: false });
    
    console.log(`Tâches à faire: ${todoTasks}`);
    console.log(`Tâches en cours: ${inProgressTasks}`);
    console.log(`Tâches terminées: ${completedTasks}`);
    
    // 3. Tâches en retard
    const overdueTasks = await Task.countDocuments({
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() },
      isArchived: false
    });
    console.log(`Tâches en retard: ${overdueTasks}`);
    
    // 4. Tâches par priorité
    const highPriority = await Task.countDocuments({ priority: 'high', isArchived: false });
    const mediumPriority = await Task.countDocuments({ priority: 'medium', isArchived: false });
    const lowPriority = await Task.countDocuments({ priority: 'low', isArchived: false });
    
    console.log(`\nPriorité haute: ${highPriority}`);
    console.log(`Priorité moyenne: ${mediumPriority}`);
    console.log(`Priorité basse: ${lowPriority}`);
    
    // 5. Tâches du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const tasksThisMonth = await Task.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      isArchived: false
    });
    
    const completedThisMonth = await Task.countDocuments({
      status: 'completed',
      completedAt: { $gte: startOfMonth, $lte: endOfMonth },
      isArchived: false
    });
    
    console.log(`\nTâches créées ce mois: ${tasksThisMonth}`);
    console.log(`Tâches terminées ce mois: ${completedThisMonth}`);
    
    // 6. Test de la méthode getStats
    console.log('\n=== TEST DE LA MÉTHODE getStats ===');
    const stats = await Task.getStats();
    console.log('Stats globales:', stats);
    
    // 7. Test avec un utilisateur spécifique
    const firstUser = await User.findOne();
    if (firstUser) {
      console.log(`\n=== TEST AVEC UTILISATEUR: ${firstUser.name} ===`);
      const userStats = await Task.getStats(firstUser._id);
      console.log('Stats utilisateur:', userStats);
    }
    
    // 8. Test des agrégations
    console.log('\n=== TEST DES AGRÉGATIONS ===');
    
    const priorityStats = await Task.aggregate([
      {
        $match: { isArchived: false }
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    console.log('Stats par priorité:', priorityStats);
    
    const statusStats = await Task.aggregate([
      {
        $match: { isArchived: false }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Stats par statut:', statusStats);
    
    console.log('\n=== FIN DU TEST ===');
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Déconnexion de MongoDB');
  }
};

testStats(); 