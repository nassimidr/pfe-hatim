"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import apiService, { type User as ApiUser } from "../services/api"

interface User {
  id: string
  name: string
  email: string
  role: "employee" | "manager" | "admin"
  avatar?: string
  bio?: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, role: "employee" | "manager") => Promise<boolean | string>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

const convertApiUser = (apiUser: ApiUser): User => ({
  id: apiUser._id,
  name: apiUser.name,
  email: apiUser.email,
  role: apiUser.role,
  avatar: apiUser.avatar
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Lire le token au chargement et vérifier l'utilisateur
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      console.log("[Auth] Token relu au chargement:", token)
      if (token) {
        apiService.setToken(token) // Synchronise l'instance
        try {
          console.log("[Auth] Tentative de récupération du profil utilisateur...")
          const apiUser = await apiService.getProfile()
          setUser(convertApiUser(apiUser.user))
          console.log("[Auth] Profil utilisateur récupéré:", apiUser)
          console.log("[Auth] Utilisateur défini dans le contexte")
        } catch (error) {
          console.error("[Auth] Erreur lors de la récupération du profil:", error)
          setUser(null)
          apiService.clearToken()
          localStorage.removeItem("token")
        }
      } else {
        console.log("[Auth] Aucun token trouvé, utilisateur non connecté")
        setUser(null)
      }
      console.log("[Auth] Fin du chargement, isLoading = false")
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  // Login : stocke le token dans localStorage et synchronise l'instance
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await apiService.login({ email, password })
      setUser(convertApiUser(response.user))
      localStorage.setItem("token", response.token)
      apiService.setToken(response.token) // Synchronise l'instance
      return true
    } catch (error) {
      setUser(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Register : stocke le token dans localStorage et synchronise l'instance
  const register = async (
    name: string,
    email: string,
    password: string,
    role: "employee" | "manager",
  ): Promise<boolean | string> => {
    setIsLoading(true)
    try {
      const response = await apiService.register({ name, email, password, role })
      setUser(convertApiUser(response.user))
      localStorage.setItem("token", response.token)
      apiService.setToken(response.token) // Synchronise l'instance
      return true
    } catch (error: any) {
      setUser(null)
      // Retourner le message d'erreur du backend s'il existe
      if (error?.response?.data?.message) {
        return error.response.data.message
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout : efface le token du localStorage et synchronise l'instance
  const logout = () => {
    setUser(null)
    apiService.clearToken()
    localStorage.removeItem("token")
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}
