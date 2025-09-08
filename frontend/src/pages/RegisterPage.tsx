"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee" as "employee" | "manager",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis"
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide"
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setServerError(null)
    if (!validateForm()) return

    const result = await register(formData.name, formData.email, formData.password, formData.role)
    if (result === true) {
      navigate("/dashboard")
    } else if (typeof result === 'string') {
      setServerError(result)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p className="text-gray-600">Rejoignez TaskManager</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {serverError && (
            <div className="text-red-600 text-sm font-medium text-center mb-2">{serverError}</div>
          )}
          <Input
            type="text"
            name="name"
            label="Nom complet"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            icon={<User className="h-4 w-4 text-gray-400" />}
            error={errors.name}
          />

          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="votre@email.com"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail className="h-4 w-4 text-gray-400" />}
            error={errors.email}
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              label="Mot de passe"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="h-4 w-4 text-gray-400" />}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            label="Confirmez le mot de passe"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            icon={<Lock className="h-4 w-4 text-gray-400" />}
            error={errors.confirmPassword}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="employee">Employé</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            S'inscrire
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
