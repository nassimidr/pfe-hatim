"use client"

import React, { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, Brain } from "lucide-react"
import { useTask } from "../contexts/TaskContext"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent, CardHeader } from "../components/UI/Card"
import Button from "../components/UI/Button"

const Dashboard: React.FC = () => {
  const { tasks, getTaskStats } = useTask()
  const { user } = useAuth()
  const stats = getTaskStats()

  // 🔽 Scroll automatique en haut au montage
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const todayTasks = tasks.filter((task) => {
    return task.status === "todo"
  })

  // --- Chat IA ---
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiHistory, setAiHistory] = useState<{ question: string; answer: string }[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll auto vers le bas à chaque nouveau message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [aiHistory, aiLoading])

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiInput.trim()) return
    setAiLoading(true)
    setAiError(null)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ question: aiInput }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || "Erreur IA")
      setAiHistory((prev) => [...prev, { question: aiInput, answer: data.answer }])
      setAiInput("")
    } catch (err: any) {
      setAiError(err.message || "Erreur IA")
    } finally {
      setAiLoading(false)
    }
  }

  const aiSuggestions = [
    {
      id: 1,
      title: "Prioriser les tâches urgentes",
      description: "Vous avez 3 tâches avec une échéance proche",
      action: "Voir les tâches",
      priority: "high",
    },
    {
      id: 2,
      title: "Optimiser votre planning",
      description: "Réorganiser vos tâches pour une meilleure productivité",
      action: "Optimiser",
      priority: "medium",
    },
    {
      id: 3,
      title: "Pause recommandée",
      description: "Vous travaillez depuis 3h, prenez une pause de 15min",
      action: "Programmer",
      priority: "low",
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bonjour, {user?.name} 👋</h1>
          <p className="text-gray-600 mt-1">Voici un aperçu de vos tâches aujourd'hui</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total des tâches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Tâches à faire</h3>
          </CardHeader>
          <CardContent>
            {todayTasks.length > 0 ? (
              <div className="space-y-3">
                {todayTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        task.priority === "high"
                          ? "bg-red-500"
                          : task.priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  </div>
                ))}
                {todayTasks.length > 5 && (
                  <Link to="/tasks" className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Voir toutes les tâches ({todayTasks.length - 5} de plus)
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune tâche pour aujourd'hui</p>
                {(user?.role === 'manager' || user?.role === 'admin') && (
                  <Link to="/create-task">
                    <Button variant="secondary" className="mt-2">
                      Créer une tâche
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Brain className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Assistant IA</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white dark:bg-gray-800 rounded shadow p-6 col-span-1">
              <div className="font-semibold mb-4 text-purple-700 flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-purple-600" /> Assistant IA
              </div>
              <div className="flex flex-col h-96 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex-1 overflow-y-auto pr-2" style={{ minHeight: 0 }}>
                  {aiHistory.length === 0 && !aiLoading && (
                    <div className="text-gray-400 text-center mt-10">Posez une question à l'IA pour commencer.</div>
                  )}
                  {aiHistory.map((item, idx) => (
                    <div key={idx} className="mb-4 flex flex-col gap-1">
                      {/* Question */}
                      <div className="flex items-end gap-2 self-end">
                        <div className="bg-blue-500 text-white px-4 py-2 rounded-2xl rounded-br-sm max-w-xs text-sm shadow">
                          {item.question}
                        </div>
                        <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center rounded-full font-bold text-xs">Vous</div>
                      </div>
                      {/* Réponse IA */}
                      <div className="flex items-end gap-2 self-start mt-1">
                        <div className="w-7 h-7 bg-purple-600 text-white flex items-center justify-center rounded-full font-bold text-xs">IA</div>
                        <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm max-w-xs text-sm shadow whitespace-pre-line">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex items-end gap-2 self-start mt-1 animate-pulse">
                      <div className="w-7 h-7 bg-purple-600 text-white flex items-center justify-center rounded-full font-bold text-xs">IA</div>
                      <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm max-w-xs text-sm shadow">
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1 animate-bounce"></span>
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1 animate-bounce delay-75"></span>
                        <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleAskAI} className="mt-3 flex gap-2 items-end">
                  <textarea
                    className="flex-1 border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm min-h-[40px] max-h-32"
                    placeholder="Posez une question à l'IA..."
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    disabled={aiLoading}
                    rows={1}
                    style={{ minHeight: 40 }}
                  />
                  <Button type="submit" disabled={aiLoading || !aiInput.trim()} className="h-10 px-5 text-base font-semibold">
                    {aiLoading ? (
                      <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                      "Envoyer"
                    )}
                  </Button>
                </form>
                {aiError && <div className="text-red-500 text-sm mt-2 text-center">{aiError}</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
