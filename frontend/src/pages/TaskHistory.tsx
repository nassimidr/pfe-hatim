"use client"

import type React from "react"
import { useState } from "react"
import { Calendar, Clock, CheckCircle, Filter } from "lucide-react"
import { useTask } from "../contexts/TaskContext"
import { Card, CardContent } from "../components/UI/Card"

const TaskHistory: React.FC = () => {
  const { tasks } = useTask()
  const [dateFilter, setDateFilter] = useState("all")

  const completedTasks = tasks.filter((task) => task.status === "completed")

  const filteredTasks = completedTasks.filter((task) => {
    if (dateFilter === "all") return true

    const taskDate = new Date(task.completedAt || task.createdAt)
    const now = new Date()

    switch (dateFilter) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return taskDate >= weekAgo
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return taskDate >= monthAgo
      case "quarter":
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        return taskDate >= quarterAgo
      default:
        return true
    }
  })

  const getPerformanceColor = (task: any) => {
    if (!task.estimatedTime || !task.actualTime) return "text-gray-500"

    const ratio = task.actualTime / task.estimatedTime
    if (ratio <= 1) return "text-green-600"
    if (ratio <= 1.2) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceText = (task: any) => {
    if (!task.estimatedTime || !task.actualTime) return "N/A"

    const ratio = task.actualTime / task.estimatedTime
    if (ratio <= 1) return "Dans les temps"
    if (ratio <= 1.2) return "Léger retard"
    return "En retard"
  }

  const averageCompletionTime =
    filteredTasks.reduce((acc, task) => {
      return acc + (task.actualTime || 0)
    }, 0) / filteredTasks.length || 0

  const onTimePercentage =
    (filteredTasks.filter((task) => {
      if (!task.estimatedTime || !task.actualTime) return false
      return task.actualTime <= task.estimatedTime
    }).length /
      filteredTasks.length) *
      100 || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique des tâches</h1>
          <p className="text-gray-600 mt-1">Consultez vos tâches terminées et vos performances</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tâches terminées</p>
                <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Temps moyen</p>
                <p className="text-2xl font-bold text-gray-900">{averageCompletionTime.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dans les temps</p>
                <p className="text-2xl font-bold text-gray-900">{onTimePercentage.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les périodes</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
            </select>
            <span className="text-sm text-gray-600">
              {filteredTasks.length} tâche{filteredTasks.length > 1 ? "s" : ""} trouvée
              {filteredTasks.length > 1 ? "s" : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tasks History */}
      <div className="space-y-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          task.priority === "high"
                            ? "bg-red-500"
                            : task.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                      />
                    </div>

                    <p className="text-gray-600 mb-3">{task.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Terminé le:</span>
                        <p className="font-medium">
                          {task.completedAt ? new Date(task.completedAt).toLocaleDateString("fr-FR") : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Temps estimé:</span>
                        <p className="font-medium">{task.estimatedTime ? `${task.estimatedTime}h` : "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Temps réel:</span>
                        <p className="font-medium">{task.actualTime ? `${task.actualTime}h` : "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Performance:</span>
                        <p className={`font-medium ${getPerformanceColor(task)}`}>{getPerformanceText(task)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche terminée</h3>
              <p className="text-gray-600">Les tâches que vous terminez apparaîtront ici</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default TaskHistory
