"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, isLoading } = useAuth()

  // Si en cours de chargement, on laisse passer les enfants
  // Le Layout gérera l'affichage du loader
  if (isLoading) {
    return <>{children}</>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
