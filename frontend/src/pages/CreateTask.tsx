"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Save, X } from "lucide-react"
import { useTask } from "../contexts/TaskContext"
import { useAuth } from "../contexts/AuthContext"
import { useEffect } from "react"
import apiService from "../services/api"
import Toast from "../components/UI/Toast"
import { Card, CardContent, CardHeader } from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"
import { getUserProjects, listProjectMembers } from '../services/projects';
import { UserSelect } from '../components/UI/UserSelect';

const CreateTask: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()
  const { addTask } = useTask()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
    assignedTo: user?.email || "",
    estimatedTime: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [users, setUsers] = useState<{ _id: string; name: string; email: string }[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");

  // Charger la liste des projets au montage
  useEffect(() => {
    getUserProjects().then(res => {
      console.log('[DEBUG] Réponse getUserProjects:', res);
      const projectsData = res.data || [];
      console.log('[DEBUG] Projets chargés:', projectsData);
      setProjects(projectsData);
      // Si on est sur une page de projet spécifique, pré-sélectionner le projet
      if (projectId && projectsData.length > 0) {
        const project = projectsData.find(p => p._id === projectId);
        console.log('[DEBUG] Projet trouvé pour projectId:', projectId, project);
        if (project) {
          setSelectedProject(projectId);
        }
      }
    }).catch(err => {
      console.error('[DEBUG] Erreur getUserProjects:', err);
      setProjects([]);
    });
  }, [projectId]);

  // Charger les membres du projet sélectionné
  useEffect(() => {
    if (selectedProject) {
      listProjectMembers(selectedProject).then(res => setUsers(res.data || [])).catch(() => setUsers([]));
      setFormData((prev) => ({ ...prev, assignedTo: "" }));
    } else {
      setUsers([]);
      setFormData((prev) => ({ ...prev, assignedTo: "" }));
    }
  }, [selectedProject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedProject) {
      newErrors.project = "Le projet est requis"
    }

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est requis"
    }

    if (!formData.description.trim()) {
      newErrors.description = "La description est requise"
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "La date limite est requise"
    } else if (new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = "La date limite ne peut pas être dans le passé"
    }

    if (!formData.assignedTo.trim()) {
      newErrors.assignedTo = "L'assignation est requise"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setSuccess(null)

    if (!validateForm()) return

    console.log('[DEBUG] Données envoyées au backend:', JSON.stringify(formData, null, 2))

    try {
      await addTask({
        title: formData.title,
        description: formData.description,
        status: "todo",
        priority: formData.priority,
        dueDate: formData.dueDate,
        assignedTo: formData.assignedTo, // ID utilisateur
        project: selectedProject, // ID du projet
        estimatedTime: formData.estimatedTime ? Number(formData.estimatedTime) : undefined,
      })
      setSuccess("Tâche créée avec succès !")
      setTimeout(() => navigate("/tasks"), 1200)
    } catch (err: any) {
      // Si le backend renvoie un message d'erreur détaillé, l'afficher
      if (err.response && err.response.data && err.response.data.message) {
        setSubmitError(err.response.data.message)
      } else if (err.message) {
        setSubmitError(err.message)
      } else {
        setSubmitError("Erreur lors de la création de la tâche")
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer une nouvelle tâche</h1>
          <p className="text-gray-600 mt-1">Remplissez les informations pour créer une nouvelle tâche</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/tasks")} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Informations de la tâche</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélecteur de projet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projet *</label>
              <select
                name="project"
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- Choisir un projet --</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {errors.project && <p className="mt-1 text-sm text-red-600">{errors.project}</p>}
            </div>
            <Input
              label="Titre de la tâche *"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ex: Finaliser le rapport mensuel"
              error={errors.title}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez la tâche en détail..."
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                type="date"
                label="Date limite *"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                error={errors.dueDate}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigné à *</label>
                <UserSelect
                  users={users}
                  value={users.find(u => u._id === formData.assignedTo) || null}
                  onChange={u => setFormData(prev => ({ ...prev, assignedTo: u ? u._id : "" }))}
                  placeholder={selectedProject ? "Sélectionner un membre..." : "Choisissez d'abord un projet"}
                />
                  {errors.assignedTo && <p className="mt-1 text-sm text-red-600">{errors.assignedTo}</p>}
                </div>
              <Input
                type="number"
                label="Temps estimé (heures)"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
                placeholder="Ex: 4"
                min="0.5"
                step="0.5"
              />
            </div>
            {success && <Toast type="success" message={success} onClose={() => setSuccess(null)} />}
            {submitError && <Toast type="error" message={submitError} onClose={() => setSubmitError(null)} />}

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="secondary" onClick={() => navigate("/tasks")}>
                Annuler
              </Button>
              <Button type="submit" className="flex items-center">
                <Save className="h-4 w-4 mr-2" />
                Créer la tâche
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateTask
