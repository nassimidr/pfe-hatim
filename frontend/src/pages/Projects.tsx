import React, { useState, useEffect } from 'react';
import { createProject, getUserProjects } from '../services/projects';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Projects: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const res = await getUserProjects();
        if (res.success) {
          setProjects(res.data);
        }
      } catch {}
      setProjectsLoading(false);
    };
    fetchProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const membersEmails = emails.split(',').map(email => email.trim()).filter(Boolean);
      const response = await createProject(name, description, membersEmails);
      if (response.success) {
        setCreatedProject(response.data);
        setSuccess('Projet créé avec succès !');
        setName('');
        setDescription('');
        setEmails('');
        navigate(`/projects/${response.data._id}`);
      } else {
        setError(response.message || 'Erreur lors de la création du projet');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {(user?.role === 'manager' || user?.role === 'admin') && (
        <>
          <h1 className="text-2xl font-bold mb-4">Créer un projet</h1>
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block font-medium mb-1">Nom du projet</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-medium mb-1">Emails des membres (séparés par des virgules)</label>
          <input type="text" value={emails} onChange={e => setEmails(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="exemple1@mail.com, exemple2@mail.com" />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Création...' : 'Créer le projet'}</button>
          </form>
        </>
      )}

      <h2 className="text-xl font-bold mt-10 mb-4">Mes projets</h2>
      {projectsLoading ? (
        <div>Chargement des projets...</div>
      ) : projects.length === 0 ? (
        <div className="text-gray-500">Aucun projet pour le moment.</div>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project._id} className="bg-gray-50 rounded shadow p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{project.name}</div>
                <div className="text-sm text-gray-600">{project.description}</div>
                <div className="text-xs text-gray-500">Membres : {project.members.length}</div>
              </div>
              <Link to={`/projects/${project._id}`} className="bg-blue-600 text-white px-3 py-1 rounded">Ouvrir</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Projects; 