import React, { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Clock, Target, Award, Calendar } from "lucide-react"
import { useTask } from "../contexts/TaskContext"
import { useAuth } from "../contexts/AuthContext"
import { Card, CardContent, CardHeader } from "../components/UI/Card"
import apiService from "../services/api"

interface DashboardStats {
  taskStats: {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
  recentActivity: Array<{
    _id: string
    created: number
    completed: number
  }>
}

interface TaskAnalytics {
  priorityStats: Array<{
    _id: string
    count: number
    completed: number
  }>
  statusStats: Array<{
    _id: string
    count: number
  }>
  performanceStats: {
    totalTasks: number
    avgEstimatedTime: number
    avgActualTime: number
    onTimeTasks: number
  } | null
  weeklyStats: Array<{
    _id: number
    count: number
  }>
}

const Statistics: React.FC = () => {
  const { tasks } = useTask()
  const { user } = useAuth()
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [taskAnalytics, setTaskAnalytics] = useState<TaskAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  // Charger les données de statistiques
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true)
        console.log('[Statistics] Chargement des statistiques pour la période:', period)
        
        const [dashboardData, analyticsData] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getTaskAnalytics(period)
        ])
        
        console.log('[Statistics] Données dashboard reçues:', dashboardData)
        console.log('[Statistics] Données analytics reçues:', analyticsData)
        
        setDashboardStats(dashboardData)
        setTaskAnalytics(analyticsData)
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [period])

  // Données pour l'activité hebdomadaire
  const weeklyData = React.useMemo(() => {
    if (!dashboardStats?.recentActivity) return []
    
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    return days.map((day, index) => {
      const activity = dashboardStats.recentActivity.find(a => {
        const date = new Date(a._id)
        return date.getDay() === (index + 1) % 7
      })
      return {
        name: day,
        completed: activity?.completed || 0,
        created: activity?.created || 0
      }
    })
  }, [dashboardStats])

  // Données pour la répartition par priorité
  const priorityData = React.useMemo(() => {
    if (!taskAnalytics?.priorityStats) return []
    
    const colors = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' }
    return taskAnalytics.priorityStats.map(stat => ({
      name: stat._id === 'high' ? 'Haute' : stat._id === 'medium' ? 'Moyenne' : 'Basse',
      value: stat.count,
      color: colors[stat._id as keyof typeof colors]
    }))
  }, [taskAnalytics])

  // Données pour la répartition par statut
  const statusData = React.useMemo(() => {
    if (!taskAnalytics?.statusStats) return []
    
    const colors = { todo: '#6B7280', 'in-progress': '#3B82F6', completed: '#10B981' }
    return taskAnalytics.statusStats.map(stat => ({
      name: stat._id === 'todo' ? 'À faire' : stat._id === 'in-progress' ? 'En cours' : 'Terminé',
      value: stat.count,
      color: colors[stat._id as keyof typeof colors]
    }))
  }, [taskAnalytics])

  // Calculs des KPIs
  const kpis = React.useMemo(() => {
    if (!dashboardStats || !taskAnalytics) return null

    // Calculer le total des tâches et le nombre de tâches terminées à partir de statusStats
    const totalTasks = taskAnalytics.statusStats?.reduce((sum, s) => sum + s.count, 0) || 0;
    const completedTasks = taskAnalytics.statusStats?.find(s => s._id === 'completed')?.count || 0;

    // Productivité moyenne (basée sur le taux de completion)
    const productivity = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Taux de réussite (tâches dans les temps)
    const performance = taskAnalytics.performanceStats;
    const onTimeRate = performance && performance.totalTasks > 0 
      ? (performance.onTimeTasks / performance.totalTasks) * 100 
      : 0;

    // Temps moyen par tâche (utiliser estimatedTime si actualTime n'est pas disponible)
    const avgTime = performance?.avgActualTime || performance?.avgEstimatedTime || 0;

    // Tâches terminées ce mois (utiliser statusStats)
    const completedThisMonth = completedTasks;

    const result = {
      productivity: productivity.toFixed(0),
      onTimeRate: onTimeRate.toFixed(0),
      avgTime: avgTime.toFixed(1),
      completed: completedThisMonth
    }

    return result
  }, [dashboardStats, taskAnalytics])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600 mt-1">Analysez vos performances et votre productivité</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600 mt-1">Analysez vos performances et votre productivité</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Productivité moyenne</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis?.productivity || '0'}%
                </p>
                <p className="text-sm text-green-600">+5% ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taux de réussite</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis?.onTimeRate || '0'}%
                </p>
                <p className="text-sm text-green-600">Dans les temps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Temps moyen</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis?.avgTime || '0.0'}h
                </p>
                <p className="text-sm text-blue-600">Par tâche</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tâches terminées</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis?.completed || '0'}
                </p>
                <p className="text-sm text-green-600">Ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section de débogage temporaire */}
      {/* SUPPRIMÉ : Affichage brut des données de débogage pour une interface plus propre */}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Activité hebdomadaire</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" fill="#10B981" name="Terminées" />
                <Bar dataKey="created" fill="#3B82F6" name="Créées" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Répartition par priorité</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-priority-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Répartition par statut</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Aperçu des performances</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskAnalytics?.performanceStats ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tâches avec temps estimé</span>
                    <span className="font-semibold">{taskAnalytics.performanceStats.totalTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temps estimé moyen</span>
                    <span className="font-semibold">{taskAnalytics.performanceStats.avgEstimatedTime?.toFixed(1) || 0}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Temps réel moyen</span>
                    <span className="font-semibold">{taskAnalytics.performanceStats.avgActualTime?.toFixed(1) || 0}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tâches dans les temps</span>
                    <span className="font-semibold text-green-600">{taskAnalytics.performanceStats.onTimeTasks}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune donnée de performance disponible</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Statistics
