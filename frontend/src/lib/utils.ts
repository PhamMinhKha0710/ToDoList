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
  // Regex to detect if string is just an emoji
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  const matches = str.match(emojiRegex);
  return matches !== null && matches.length === 1 && str.trim().length === matches[0].length;
}

export function getAvatarUrl(url?: string): string {
  if (!url) return "";
  if (isEmojiUrl(url)) return url;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  // Trả về url gốc (vd: /uploads/...) vì frontend đã cấu hình proxy (Vite)
  // hoặc cấu hình routing trên server production cho thư mục này.
  // Việc thêm tên miền khác port trực tiếp sẽ bị block bởi Cross-Origin-Resource-Policy từ Helmet.
  return url;
}
