"use client"

import type React from "react"
import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "../../utils/cn"


interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = "md" }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        <div className={cn("relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full border border-gray-200 dark:border-gray-800 transition-all duration-200", sizes[size])}>
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/80 via-white/90 to-sky-100/80 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-t-2xl">
              <h3 className="text-xl font-bold text-sky-700 dark:text-sky-300 tracking-tight">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-sky-400">
                <X className="h-6 w-6" />
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default Modal
