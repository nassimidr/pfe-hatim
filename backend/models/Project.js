import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du projet est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);
export default Project; 