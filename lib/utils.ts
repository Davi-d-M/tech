import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const formatPrice = (price: number | string | undefined | null) => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : Number(price || 0);
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(isNaN(numericPrice) ? 0 : numericPrice);
};

export const getReferralLink = (code: string, path: string = '/shop') => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://tech-paxv.onrender.com');
    const separator = path.includes('?') ? '&' : '?';
    return `${baseUrl}${path}${separator}ref=${code}`;
};
