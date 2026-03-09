import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Kết hợp class Tailwind, resolve conflict tự động
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
