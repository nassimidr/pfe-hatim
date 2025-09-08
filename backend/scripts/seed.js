import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Task from '../models/Task.js';

dotenv.config();

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@company.com',
    password: 'Admin123!',
    role: 'admin',
    isActive: true
  },
  {
    name: 'John Manager',
    email: 'manager@company.com',
    password: 'Manager123!',
    role: 'manager',
    isActive: true
  },
  {
    name: 'Jane Employee',
    email: 'employee@company.com',
    password: 'Employee123!',
    role: 'employee',
    isActive: true
  },
  {
    name: 'Bob Smith',
    email: 'bob@company.com',
    password: 'Bob123!',
    role: 'employee',
    isActive: true
  },
  {
    name: 'Alice Johnson',
    email: 'alice@company.com',
    password: 'Alice123!',
    role: 'manager',
    isActive: true
  }
];

const seedTasks = [
  {
    title: 'Finaliser le rapport mensuel',
    description: 'Compiler les données de performance du mois dernier et préparer le rapport pour la direction',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 jours
    estimatedTime: 4,
    actualTime: 3,
    tags: ['rapport', 'mensuel', 'performance']
  },
  {
    title: 'Révision du code frontend',
    description: 'Réviser le code de la nouvelle fonctionnalité et s\'assurer qu\'il respecte les standards',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 jours
    estimatedTime: 2,
    tags: ['code', 'frontend', 'révision']
  },
  {
    title: 'Réunion équipe marketing',
    description: 'Planifier la campagne Q1 et discuter des objectifs de vente',
    status: 'completed',
    priority: 'medium',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // hier
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    estimatedTime: 1,
    actualTime: 1.5,
    tags: ['réunion', 'marketing', 'planification']
  },
  {
    title: 'Mise à jour documentation',
    description: 'Mettre à jour la documentation technique et les guides utilisateur',
    status: 'todo',
    priority: 'low',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    estimatedTime: 3,
    tags: ['documentation', 'technique', 'guide']
  },
  {
    title: 'Optimisation base de données',
    description: 'Analyser et optimiser les requêtes de base de données pour améliorer les performances',
    status: 'in-progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours
    estimatedTime: 6,
    actualTime: 2,
    tags: ['optimisation', 'base de données', 'performance']
  },
  {
    title: 'Formation équipe',
    description: 'Préparer et animer une session de formation sur les nouvelles fonctionnalités',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 jours
    estimatedTime: 2,
    tags: ['formation', 'équipe', 'nouveautés']
  },
  {
    title: 'Test d\'intégration',
    description: 'Effectuer les tests d\'intégration pour la nouvelle version',
    status: 'completed',
    priority: 'high',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // il y a 2 jours
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    estimatedTime: 3,
    actualTime: 2.5,
    tags: ['test', 'intégration', 'qualité']
  },
  {
    title: 'Analyse des besoins clients',
    description: 'Analyser les retours clients et identifier les nouvelles fonctionnalités à développer',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
    estimatedTime: 4,
    tags: ['analyse', 'clients', 'besoins']
  }
];

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

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connecter à la base de données
    await connectDB();

    // Nettoyer la base de données
    console.log('🧹 Cleaning database...');
    await User.deleteMany({});
    await Task.deleteMany({});

    // Créer les utilisateurs
    console.log('👥 Creating users...');
    const createdUsers = await User.create(seedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Créer les tâches avec des assignations
    console.log('📋 Creating tasks...');
    const tasksWithAssignments = seedTasks.map((task, index) => ({
      ...task,
      assignedTo: createdUsers[index % createdUsers.length]._id,
      createdBy: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id
    }));

    const createdTasks = await Task.create(tasksWithAssignments);
    console.log(`✅ Created ${createdTasks.length} tasks`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Tasks: ${createdTasks.length}`);
    console.log('\n🔑 Test Accounts:');
    console.log('Admin: admin@company.com / Admin123!');
    console.log('Manager: manager@company.com / Manager123!');
    console.log('Employee: employee@company.com / Employee123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Exécuter le script
seedDatabase(); 