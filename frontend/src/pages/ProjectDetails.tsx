import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listProjectMembers, createProjectTask, getProjectTasks, updateTaskStatus, addMemberToProject } from '../services/projects';
import api from '../services/api';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '../contexts/AuthContext';

const statusLabels: Record<string, string> = {
  todo: 'À faire',
  'in-progress': 'En cours',
  completed: 'Terminée',
};

const statusOrder = ['todo', 'in-progress', 'completed'];

const ProjectDetails: React.FC = () => {
  const { user } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
  });
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listProjectMembers(projectId!);
        if (res.success) {
          setMembers(res.data);
        } else {
          setError(res.message || 'Erreur lors du chargement des membres');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement des membres');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [projectId]);

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await getProjectTasks(projectId!);
      if (res.success) {
        setTasks(res.data);
      }
    } catch (err: any) {}
    setTasksLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const handleTaskFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    setTaskSuccess(null);
    try {
      const res = await createProjectTask(
        projectId!,
        taskForm.title,
        taskForm.description,
        taskForm.assignedTo,
        taskForm.dueDate,
        taskForm.priority
      );
      if (res.success) {
        setTaskSuccess('Tâche créée avec succès !');
        setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'medium' });
        fetchTasks();
      } else {
        setTaskError(res.message || 'Erreur lors de la création de la tâche');
      }
    } catch (err: any) {
      setTaskError(err.message || 'Erreur lors de la création de la tâche');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberError(null);
    setAddMemberSuccess(null);
    try {
      const res = await addMemberToProject(projectId!, addMemberEmail);
      if (res.success) {
        setAddMemberSuccess('Membre ajouté avec succès !');
        setAddMemberEmail('');
        // Appeler fetchMembers pour rafraîchir la liste
        const membersRes = await listProjectMembers(projectId!);
        if (membersRes.success) setMembers(membersRes.data);
      } else {
        setAddMemberError(res.message || 'Erreur lors de l\'ajout du membre');
      }
    } catch (err: any) {
      setAddMemberError(err.message || 'Erreur lors de l\'ajout du membre');
    }
  };

  // Suppression de tâche
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;
    try {
      await api.deleteTask(taskId);
      fetchTasks();
    } catch (err: any) {
      alert('Erreur lors de la suppression de la tâche');
    }
  };

  // Kanban : regrouper les tâches par statut
  const tasksByStatus: Record<string, any[]> = {
    todo: [],
    'in-progress': [],
    completed: [],
  };
  tasks.forEach((task: any) => {
    tasksByStatus[task.status]?.push(task);
  });

  // Drag & drop handler
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;
    // Trouver la tâche déplacée
    const movedTask = tasksByStatus[source.droppableId].find((t) => t._id === draggableId);
    if (!movedTask) return;
    // Mettre à jour le statut localement (optimiste)
    setTasks((prev) =>
      prev.map((t) =>
        t._id === draggableId ? { ...t, status: destination.droppableId } : t
      )
    );
    // Appeler l'API pour mettre à jour le statut côté backend
    try {
      await updateTaskStatus(draggableId, destination.droppableId);
      fetchTasks();
    } catch (err) {
      // Optionnel : rollback ou afficher une erreur
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Projet</h1>
      <div className="mb-4">
        <strong>ID du projet :</strong> {projectId}
      </div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Membres du projet</h2>
        {loading ? (
          <div>Chargement...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-2">
              {members.map((m) => (
                <div key={m._id} className="flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1 shadow-sm">
                  <span className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    {m.name
                      .split(' ')
                      .map((n: string) => n[0]?.toUpperCase())
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-semibold text-sm">{m.name}</span>
                    <span className="text-xs text-gray-500">{m.email}</span>
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddMember} className="flex items-center gap-2 mt-2">
              <input
                type="email"
                value={addMemberEmail}
                onChange={e => setAddMemberEmail(e.target.value)}
                placeholder="Ajouter un membre par email"
                className="border rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition w-64"
                required
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-2 rounded-full font-semibold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Ajouter
              </button>
            </form>
            {addMemberError && <div className="text-red-600 text-sm mt-1">{addMemberError}</div>}
            {addMemberSuccess && <div className="text-green-600 text-sm mt-1">{addMemberSuccess}</div>}
          </>
        )}
      </div>
      <div className="mb-6">
        {(user?.role === 'manager' || user?.role === 'admin') && (
          <button
            className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-full mb-2 font-semibold flex items-center gap-2 shadow"
            onClick={() => setShowTaskForm((v) => !v)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            {showTaskForm ? 'Annuler' : 'Créer une tâche'}
          </button>
        )}
        {showTaskForm && (
          <form onSubmit={handleTaskSubmit} className="space-y-3 bg-white p-4 rounded shadow">
            <div>
              <label className="block font-medium mb-1">Titre</label>
              <input type="text" name="title" value={taskForm.title} onChange={handleTaskFormChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block font-medium mb-1">Description</label>
              <textarea name="description" value={taskForm.description} onChange={handleTaskFormChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-medium mb-1">Assigner à</label>
              <select name="assignedTo" value={taskForm.assignedTo} onChange={handleTaskFormChange} className="w-full border rounded px-3 py-2" required>
                <option value="">-- Choisir un membre --</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Date limite</label>
              <input type="date" name="dueDate" value={taskForm.dueDate} onChange={handleTaskFormChange} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block font-medium mb-1">Priorité</label>
              <select name="priority" value={taskForm.priority} onChange={handleTaskFormChange} className="w-full border rounded px-3 py-2">
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>
            {taskError && <div className="text-red-600 text-sm">{taskError}</div>}
            {taskSuccess && <div className="text-green-600 text-sm">{taskSuccess}</div>}
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Créer la tâche</button>
          </form>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-3">Tâches du projet (Kanban)</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statusOrder.map((status) => (
              <Droppable droppableId={status} key={status}>
                {(provided: any) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-50 rounded-lg p-3 min-h-[200px] shadow flex flex-col"
                  >
                    <h3 className="font-bold text-center mb-2 text-gray-700 text-base">{statusLabels[status]}</h3>
                    {tasksByStatus[status].length === 0 && (
                      <div className="text-gray-400 text-center py-4">Aucune tâche</div>
                    )}
                    {tasksByStatus[status].map((task, idx) => (
                      <Draggable draggableId={task._id} index={idx} key={task._id}>
                        {(provided: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white rounded-lg shadow mb-3 p-4 flex flex-col gap-2 border border-gray-100 hover:shadow-lg transition"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                {task.assignedTo?.name
                                  ? task.assignedTo.name.split(' ').map((n: string) => n[0]?.toUpperCase()).join('').slice(0, 2)
                                  : '?'}
                              </span>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">{task.assignedTo?.name || 'Non assignée'}</span>
                                {task.assignedTo?.email && <span className="text-xs text-gray-500">{task.assignedTo.email}</span>}
                              </div>
                              <span className={`ml-auto text-xs px-2 py-1 rounded-full font-semibold ${
                                task.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {task.priority}
                              </span>
                              <button
                                type="button"
                                className="ml-2 p-1 rounded hover:bg-red-100 text-red-600"
                                title="Supprimer la tâche"
                                onClick={() => handleDeleteTask(task._id)}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                            <div className="font-bold text-base mb-1">{task.title}</div>
                            <div className="text-sm text-gray-600 mb-1">{task.description}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {task.dueDate && <span>Échéance : {new Date(task.dueDate).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};

export default ProjectDetails; 