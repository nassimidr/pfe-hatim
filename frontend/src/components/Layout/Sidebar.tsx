"use client"

import type React from "react"
import { Link, useLocation } from "react-router-dom"
import { LayoutDashboard, CheckSquare, Plus, History, BarChart3, Users, X, Folder } from "lucide-react"
import { cn } from "../../utils/cn"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    name: string
    email: string
    role: "employee" | "manager" | "admin"
    avatar?: string | null
  } | null
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user }) => {
  const location = useLocation()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Mes Tâches", href: "/tasks", icon: CheckSquare },
    ...(user?.role === 'manager' || user?.role === 'admin' ? [{ name: "Créer une tâche", href: "/create-task", icon: Plus }] : []),
    { name: "Historique", href: "/history", icon: History },
    { name: "Statistiques", href: "/statistics", icon: BarChart3 },
    { name: "Projets", href: "/projects", icon: Folder },
  ]

  if (user?.role === "admin") {
    navigation.push({ name: "Administration", href: "/admin", icon: Users })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-700 via-sky-500 to-sky-600 text-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow">TaskManager</h1>
          <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-white/20 text-white shadow border-l-4 border-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-white" : "text-white/60 group-hover:text-white"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-gradient-to-t from-sky-700/80 to-transparent">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-base font-semibold text-white">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-white/70 capitalize">{user?.role || 'employee'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
