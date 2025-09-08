"use client"

import type React from "react"
import { Menu, Bell, Search, LogOut, Sun, Moon } from "lucide-react"
import Button from "../UI/Button"
import { useTheme } from '../../App'
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import NotificationDropdown from "../UI/NotificationDropdown";

interface TopbarProps {
  onMenuClick: () => void
  user: {
    id: string
    name: string
    email: string
    role: "employee" | "manager" | "admin"
    avatar?: string | null
  } | null
  onLogout: () => void
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick, user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // logout doit être géré via un event ou un contexte parent
  // Ici, on garde le bouton mais il faudra le relier au logout réel
  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-md border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-16 px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded-lg text-sky-700 hover:bg-sky-100 dark:hover:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="hidden md:block text-xl font-bold text-sky-700 tracking-tight drop-shadow">Tableau de bord</span>
        </div>
        <div className="flex items-center space-x-3">
          <NotificationDropdown />
          <div className="hidden md:block text-right">
            <p className="text-base font-semibold text-gray-900 dark:text-white">{user?.name || "Utilisateur"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role || "employee"}</p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              className="h-10 w-10 bg-gradient-to-br from-blue-400 to-sky-400 rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="text-lg font-bold text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2 z-50 animate-fade-in">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-sky-50 dark:hover:bg-sky-800 rounded-t-xl transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Mon Profil
                </Link>
                <button
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-b-xl transition-colors"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Topbar
