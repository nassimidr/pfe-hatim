import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge" // ✅ ici, c'est bien tailwind-merge

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
