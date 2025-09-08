
"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import Button from "../components/UI/Button"
import Input from "../components/UI/Input"

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    const success = await login(email, password)
    if (success) {
      navigate("/dashboard")
    } else {
      setError("Email ou mot de passe incorrect")
    }
  }

return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
      <div className="absolute top-[60%] left-[-5%] w-[300px] h-[300px] bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-600 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="z-10 bg-white w-full max-w-5xl rounded-xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left side (Welcome) */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-10 flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-4">Bienvenue 👋</h2>
          <p className="text-lg">Connectez-vous pour accéder à TaskManager</p>
        </div>

        {/* Right side (Form) */}
        <div className="p-10 bg-white">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Connexion</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="email"
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="h-4 w-4 text-gray-400" />}
              error={error && !email ? "Email requis" : ""}
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                label="Mot de passe"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-4 w-4 text-gray-400" />}
                error={error && !password ? "Mot de passe requis" : ""}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Se connecter
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

}

export default LoginPage
