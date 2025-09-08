import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanager';

async function migrateTasksProject() {
  await mongoose.connect(MONGO_URI);
  console.log('Connecté à MongoDB');

  const projects = await Project.find({}).populate('tasks');
  let updatedCount = 0;

  for (const project of projects) {
    for (const taskId of project.tasks) {
      const task = await Task.findById(taskId);
      if (task && (!task.project || String(task.project) !== String(project._id))) {
        task.project = project._id;
        await task.save();
        updatedCount++;
        console.log(`Tâche ${task._id} liée au projet ${project._id}`);
      }
    }
  }

  console.log(`Migration terminée. ${updatedCount} tâches mises à jour.`);
  await mongoose.disconnect();
}

migrateTasksProject().catch(err => {
  console.error('Erreur de migration:', err);
  process.exit(1);
}); 