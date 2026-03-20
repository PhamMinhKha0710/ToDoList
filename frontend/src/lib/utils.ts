import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Kết hợp class Tailwind, resolve conflict tự động
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isEmojiUrl(str: string): boolean {
  if (!str) return false;
  // Emoji checking (surrogate pairs or single chars)
  return str.length <= 2;
}

export function getAvatarUrl(url?: string): string {
  if (!url) return "";
  if (isEmojiUrl(url)) return url;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  const backendUrl = import.meta.env.VITE_API_URL?.split('/api')[0] || 'http://localhost:4000';
  return `${backendUrl}${url}`;
}
