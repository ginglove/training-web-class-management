import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Safely format a date value. Returns a fallback string if the date is invalid.
 */
export function safeFormat(
  date: any, 
  formatStr: string, 
  options: { locale?: any; fallback?: string } = { locale: vi, fallback: 'N/A' }
): string {
  if (!date) return options.fallback || 'N/A';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return options.fallback || 'N/A';
    }
    return format(dateObj, formatStr, { locale: options.locale || vi });
  } catch (err) {
    return options.fallback || 'N/A';
  }
}
