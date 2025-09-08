"use client"

import type React from "react"
import { useState } from "react"
import { Search, Filter, Plus, Calendar, Flag, User } from "lucide-react"
import { Link } from "react-router-dom"
import { useTask, type Task } from "../contexts/TaskContext"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent } from "../components/UI/Card"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

const MyTasks: React.FC = () => {
  const { tasks, updateTask } = useTask()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Task["status"]>("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | Task["priority"]>("all")

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const handleStatusChange = (taskId: string, newStatus: Task["status"]) => {
    console.log('[DEBUG] Changement de statut pour la tâche ID:', taskId)
    const task = tasks.find(t => t.id === taskId)
    if (!task) {
      console.error('[DEBUG] Tâche non trouvée pour ID:', taskId)
      return
    }
    const updates: Partial<Task> = {
      ...task,
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString() : undefined
    }
    updateTask(taskId, updates)
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "todo":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return "Terminé"
      case "in-progress":
        return "En cours"
      case "todo":
        return "À faire"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Tâches</h1>
          <p className="text-gray-600 mt-1">Gérez et suivez vos tâches</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {(user?.role === 'manager' || user?.role === 'admin') && (
            <Link to="/create-task">
              <Button className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle tâche
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Rechercher des tâches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4 text-gray-400" />}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | Task["status"])}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="todo">À faire</option>
              <option value="in-progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as "all" | Task["priority"])}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les priorités</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>

            <Button variant="secondary" className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtres avancés
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card key={task.id} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={(e) => handleStatusChange(task.id, e.target.checked ? "completed" : "todo")}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3
                          className={`font-semibold ${
                            task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"
                          }`}
                        >
                          <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                        </h3>
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </div>

                      <p
                        className="text-gray-600 mb-3"
                        style={{
                          wordBreak: 'break-all',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {task.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                        </div>
                        <div className="flex items-center">
                          <Flag className="h-4 w-4 mr-1" />
                          {task.priority === "high" ? "Haute" : task.priority === "medium" ? "Moyenne" : "Basse"}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {task.assignedTo}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="todo">À faire</option>
                      <option value="in-progress">En cours</option>
                      <option value="completed">Terminé</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche trouvée</h3>
              <p className="text-gray-600 mb-4">Essayez de modifier vos filtres ou créez une nouvelle tâche</p>
              {(user?.role === 'manager' || user?.role === 'admin') && (
                <Link to="/create-task">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une tâche
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default MyTasks
