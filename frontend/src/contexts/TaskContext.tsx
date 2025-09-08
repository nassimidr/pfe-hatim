"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import apiService, { type Task as ApiTask } from "../services/api"
import { useAuth } from "./AuthContext"

export interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  dueDate: string
  assignedTo: string
  project: string // ID du projet
  createdAt: string
  completedAt?: string
  estimatedTime?: number
  actualTime?: number
}

interface TaskContextType {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  addTask: (task: Omit<Task, "id" | "createdAt">) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTasksByStatus: (status: Task["status"]) => Task[]
  getTaskStats: () => {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
  refreshTasks: () => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export const useTask = () => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider")
  }
  return context
}

// Convertir la tâche API en format local
const convertApiTask = (apiTask: ApiTask): Task => ({
  id: apiTask._id,
  title: apiTask.title,
  description: apiTask.description,
  status: apiTask.status,
  priority: apiTask.priority,
  dueDate: apiTask.dueDate,
  assignedTo: typeof apiTask.assignedTo === 'object' && apiTask.assignedTo !== null
    ? apiTask.assignedTo._id // Correction : toujours utiliser l'ID
    : apiTask.assignedTo,
  project: typeof apiTask.project === 'object' && apiTask.project !== null
    ? apiTask.project._id
    : apiTask.project || '',
  createdAt: apiTask.createdAt,
  completedAt: apiTask.completedAt,
  estimatedTime: apiTask.estimatedTime,
  actualTime: apiTask.actualTime
})

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Charger les tâches depuis l'API
  const loadTasks = async () => {
    if (!user) {
      setTasks([])
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Les paramètres de filtrage sont gérés côté backend selon le rôle
      const response = await apiService.getTasks()
      const convertedTasks = response.tasks.map(convertApiTask)
      // Filtrer les tâches avec un ID MongoDB valide (24 caractères hex)
      const filteredTasks = convertedTasks.filter(t => typeof t.id === 'string' && t.id.length === 24 && /^[a-fA-F0-9]+$/.test(t.id))
      setTasks(filteredTasks)
      console.log('[DEBUG] Utilisateur:', user.name, 'Rôle:', user.role)
      console.log('[DEBUG] Tâches chargées:', filteredTasks.length)
      console.log('[DEBUG] IDs des tâches chargées:', filteredTasks.map(t => t.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tâches')
      console.error('Failed to load tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les tâches au montage du composant et quand l'utilisateur change
  useEffect(() => {
    loadTasks()
  }, [user])

  const addTask = async (taskData: Omit<Task, "id" | "createdAt">) => {
    try {
      await apiService.createTask({
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        assignedTo: taskData.assignedTo,
        project: taskData.project,
        estimatedTime: taskData.estimatedTime,
        tags: []
      })
      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la tâche')
      throw err
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await apiService.updateTask(id, {
        title: updates.title,
        description: updates.description,
        dueDate: updates.dueDate,
        priority: updates.priority,
        assignedTo: updates.assignedTo,
        estimatedTime: updates.estimatedTime,
        status: updates.status,
        completedAt: updates.completedAt,
      })
      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la tâche')
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await apiService.deleteTask(id)
      await refreshTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la tâche')
      throw err
    }
  }

  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter((task) => task.status === status)
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "completed").length
    const inProgress = tasks.filter((t) => t.status === "in-progress").length
    const overdue = tasks.filter((t) => new Date(t.dueDate) < new Date() && t.status !== "completed").length

    return { total, completed, inProgress, overdue }
  }

  const refreshTasks = async () => {
    setTasks([]) // Vide la liste pour éviter les doublons/fantômes
    await loadTasks()
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoading,
        error,
        addTask,
        updateTask,
        deleteTask,
        getTasksByStatus,
        getTaskStats,
        refreshTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}
