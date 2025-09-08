"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isLoading, user, logout } = useAuth()

  // Debug log
  console.log('[Layout] Utilisateur:', user)

  // Afficher un loader pendant que l'utilisateur est en cours de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <div className="relative w-full min-h-screen bg-gray-50 dark:bg-gray-900">
        <Topbar onMenuClick={() => setSidebarOpen(true)} user={user} onLogout={logout} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

export default Layout
