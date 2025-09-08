import type React from "react"
import { cn } from "../../utils/cn"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
        <input
          className={cn(
            "block w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 dark:focus:ring-sky-500 dark:focus:border-sky-500 transition-all duration-200 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
            icon && "pl-10",
            error && "border-red-300 focus:ring-red-500 focus:border-red-500",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default Input
