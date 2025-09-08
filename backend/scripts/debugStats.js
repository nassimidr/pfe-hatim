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

const debugStats = async () => {
  try {
    await connectDB();
    
    console.log('\n=== DÉBOGAGE DES STATISTIQUES ===\n');
    
    // 1. Vérifier les utilisateurs
    const users = await User.find({});
    console.log(`📊 Utilisateurs dans la base: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Rôle: ${user.role} - ID: ${user._id}`);
    });
    
    // 2. Vérifier toutes les tâches
    const allTasks = await Task.find({});
    console.log(`\n📋 Total des tâches dans la base: ${allTasks.length}`);
    
    if (allTasks.length === 0) {
      console.log('❌ AUCUNE TÂCHE TROUVÉE dans la base de données!');
      return;
    }
    
    // 3. Afficher quelques tâches pour vérifier
    console.log('\n📝 Exemples de tâches:');
    allTasks.slice(0, 3).forEach((task, index) => {
      console.log(`  ${index + 1}. "${task.title}" - Statut: ${task.status} - Priorité: ${task.priority}`);
      console.log(`     Assignée à: ${task.assignedTo} - Créée par: ${task.createdBy}`);
      console.log(`     Date limite: ${task.dueDate} - Créée le: ${task.createdAt}`);
      console.log(`     Archivée: ${task.isArchived}`);
    });
    
    // 4. Statistiques globales
    const globalStats = await Task.getStats();
    console.log('\n📊 Statistiques globales (getStats):', globalStats);
    
    // 5. Statistiques par statut
    const statusCounts = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\n📊 Tâches par statut:', statusCounts);
    
    // 6. Statistiques par priorité
    const priorityCounts = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    console.log('\n📊 Tâches par priorité:', priorityCounts);
    
    // 7. Tâches archivées vs non archivées
    const archivedCount = await Task.countDocuments({ isArchived: true });
    const nonArchivedCount = await Task.countDocuments({ isArchived: false });
    console.log(`\n📊 Tâches archivées: ${archivedCount}`);
    console.log(`📊 Tâches non archivées: ${nonArchivedCount}`);
    
    // 8. Test avec un utilisateur spécifique
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Test avec l'utilisateur: ${testUser.name} (${testUser._id})`);
      
      const userTasks = await Task.find({ assignedTo: testUser._id });
      console.log(`📋 Tâches assignées à cet utilisateur: ${userTasks.length}`);
      
      const userStats = await Task.getStats(testUser._id);
      console.log('📊 Stats pour cet utilisateur:', userStats);
    }
    
    // 9. Vérifier les tâches terminées
    const completedTasks = await Task.find({ status: 'completed' });
    console.log(`\n✅ Tâches terminées: ${completedTasks.length}`);
    
    if (completedTasks.length > 0) {
      console.log('📝 Exemples de tâches terminées:');
      completedTasks.slice(0, 3).forEach((task, index) => {
        console.log(`  ${index + 1}. "${task.title}" - Terminée le: ${task.completedAt}`);
      });
    }
    
    console.log('\n=== FIN DU DÉBOGAGE ===');
    
  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
};

debugStats(); 