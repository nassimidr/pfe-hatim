import type React from "react"
import { cn } from "../../utils/cn"

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md transition-all duration-200",
      hover && "hover:shadow-xl hover:-translate-y-1 hover:border-sky-400 dark:hover:border-sky-500",
      className)}>
      {children}
    </div>
  )
}

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn("px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50/60 via-white/80 to-sky-100/60 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-t-2xl text-lg font-bold text-sky-700 dark:text-sky-300", className)}>{children}</div>
}

const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn("px-8 py-6", className)}>{children}</div>
}

const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  return <div className={cn("px-8 py-5 border-t border-gray-100 dark:border-gray-800 rounded-b-2xl", className)}>{children}</div>
}

export { Card, CardHeader, CardContent, CardFooter }
