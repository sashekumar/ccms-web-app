/**
 * Date Formatter Utility
 * Centralized date formatting for consistent display across the application
 */

export class DateFormatter {
  /**
   * Format date to DD/MM/YYYY (user-friendly format)
   * @param date - Date object or date string
   * @param defaultValue - Value to return if date is invalid
   * @returns Formatted date string or default value
   */
  static formatDDMMYYYY(date: Date | string | null | undefined, defaultValue: string = '-'): string {
    if (!date) return defaultValue;
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return defaultValue;
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Format date to YYYY-MM-DD (ISO-like format for inputs)
   * @param date - Date object or date string
   * @param defaultValue - Value to return if date is invalid
   * @returns Formatted date string or default value
   */
  static formatYYYYMMDD(date: Date | string | null | undefined, defaultValue: string = '-'): string {
    if (!date) return defaultValue;
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return defaultValue;
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Format date with time to DD/MM/YYYY HH:MM:SS
   * @param date - Date object or date string
   * @param defaultValue - Value to return if date is invalid
   * @returns Formatted date-time string or default value
   */
  static formatDateTime(date: Date | string | null | undefined, defaultValue: string = '-'): string {
    if (!date) return defaultValue;
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return defaultValue;
      
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago", "3 days ago")
   * @param date - Date object or date string
   * @param defaultValue - Value to return if date is invalid
   * @returns Relative time string or default value
   */
  static formatRelativeTime(date: Date | string | null | undefined, defaultValue: string = '-'): string {
    if (!date) return defaultValue;
    
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return defaultValue;
      
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffSeconds < 60) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return this.formatDDMMYYYY(date, defaultValue);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Parse date string to Date object
   * @param dateString - Date string in various formats
   * @returns Date object or null if invalid
   */
  static parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString) return null;
    
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  /**
   * Check if date is valid
   * @param date - Date object or date string
   * @returns true if valid, false otherwise
   */
  static isValidDate(date: any): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    
    if (typeof date === 'string') {
      const d = new Date(date);
      return !isNaN(d.getTime());
    }
    
    return false;
  }

  /**
   * Get difference in days between two dates
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Number of days difference (positive if endDate > startDate)
   */
  static daysBetween(startDate: Date | string, endDate: Date | string): number | null {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      
      const diffMs = end.getTime() - start.getTime();
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  }

  /**
   * Add days to a date
   * @param date - Base date
   * @param days - Number of days to add (can be negative)
   * @returns New Date object
   */
  static addDays(date: Date | string, days: number): Date | null {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      
      d.setDate(d.getDate() + days);
      return d;
    } catch {
      return null;
    }
  }
}
