/**
 * Array Utils Utility
 * Utility functions for common array operations
 */

export class ArrayUtils {
  /**
   * Check if array is empty or null/undefined
   * @param arr - Array to check
   * @returns true if empty or falsy, false otherwise
   */
  static isEmpty<T>(arr: T[] | null | undefined): boolean {
    return !arr || arr.length === 0;
  }

  /**
   * Check if array has elements
   * @param arr - Array to check
   * @returns true if array has elements, false otherwise
   */
  static hasItems<T>(arr: T[] | null | undefined): boolean {
    return arr !== null && arr !== undefined && arr.length > 0;
  }

  /**
   * Get first element of array
   * @param arr - Array
   * @param defaultValue - Value to return if array is empty
   * @returns First element or default value
   */
  static first<T>(arr: T[] | null | undefined, defaultValue: T | null = null): T | null {
    if (this.isEmpty(arr)) return defaultValue;
    return (arr as T[])[0];
  }

  /**
   * Get last element of array
   * @param arr - Array
   * @param defaultValue - Value to return if array is empty
   * @returns Last element or default value
   */
  static last<T>(arr: T[] | null | undefined, defaultValue: T | null = null): T | null {
    if (this.isEmpty(arr)) return defaultValue;
    const array = arr as T[];
    return array[array.length - 1];
  }

  /**
   * Remove duplicates from array
   * @param arr - Array with potential duplicates
   * @returns Array with unique values
   */
  static unique<T>(arr: T[] | null | undefined): T[] {
    if (this.isEmpty(arr)) return [];
    return Array.from(new Set(arr));
  }

  /**
   * Remove duplicates by property value
   * @param arr - Array
   * @param key - Property name to check for duplicates
   * @returns Array with unique items by property
   */
  static uniqueBy<T>(arr: T[] | null | undefined, key: keyof T): T[] {
    if (this.isEmpty(arr)) return [];
    
    const seen = new Set<any>();
    const result: T[] = [];
    
    for (const item of arr as T[]) {
      const value = item[key];
      if (!seen.has(value)) {
        seen.add(value);
        result.push(item);
      }
    }
    
    return result;
  }

  /**
   * Group array items by property
   * @param arr - Array to group
   * @param key - Property to group by
   * @returns Object with grouped items
   */
  static groupBy<T>(arr: T[] | null | undefined, key: keyof T): Record<string, T[]> {
    if (this.isEmpty(arr)) return {};
    
    const grouped: Record<string, T[]> = {};
    
    for (const item of arr as T[]) {
      const groupKey = String(item[key]);
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(item);
    }
    
    return grouped;
  }

  /**
   * Sort array by property
   * @param arr - Array to sort
   * @param key - Property to sort by
   * @param descending - Sort in descending order (default: ascending)
   * @returns Sorted array
   */
  static sortBy<T>(arr: T[] | null | undefined, key: keyof T, descending: boolean = false): T[] {
    if (this.isEmpty(arr)) return [];
    
    const sorted = [...(arr as T[])];
    sorted.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return descending ? 1 : -1;
      if (aVal > bVal) return descending ? -1 : 1;
      return 0;
    });
    
    return sorted;
  }

  /**
   * Remove item from array
   * @param arr - Array
   * @param item - Item to remove
   * @returns New array without the item
   */
  static remove<T>(arr: T[] | null | undefined, item: T): T[] {
    if (this.isEmpty(arr)) return [];
    return (arr as T[]).filter(x => x !== item);
  }

  /**
   * Remove item by predicate
   * @param arr - Array
   * @param predicate - Function to test items
   * @returns New array without matching items
   */
  static removeWhere<T>(arr: T[] | null | undefined, predicate: (item: T) => boolean): T[] {
    if (this.isEmpty(arr)) return [];
    return (arr as T[]).filter(item => !predicate(item));
  }

  /**
   * Flatten nested array
   * @param arr - Array to flatten
   * @param depth - Depth to flatten (default: 1)
   * @returns Flattened array
   */
  static flatten<T>(arr: any[] | null | undefined, depth: number = 1): T[] {
    if (this.isEmpty(arr)) return [];
    return (arr as any[]).flat(depth) as T[];
  }

  /**
   * Chunk array into smaller arrays
   * @param arr - Array to chunk
   * @param size - Size of each chunk
   * @returns Array of chunks
   */
  static chunk<T>(arr: T[] | null | undefined, size: number): T[][] {
    if (this.isEmpty(arr) || size <= 0) return [];
    
    const chunks: T[][] = [];
    const array = arr as T[];
    
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    
    return chunks;
  }

  /**
   * Shuffle array (randomize order)
   * @param arr - Array to shuffle
   * @returns New shuffled array
   */
  static shuffle<T>(arr: T[] | null | undefined): T[] {
    if (this.isEmpty(arr)) return [];
    
    const shuffled = [...(arr as T[])];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Paginate array
   * @param arr - Array to paginate
   * @param pageNumber - Page number (1-indexed)
   * @param pageSize - Items per page
   * @returns Items for the requested page
   */
  static paginate<T>(arr: T[] | null | undefined, pageNumber: number, pageSize: number): T[] {
    if (this.isEmpty(arr) || pageNumber < 1 || pageSize < 1) return [];
    
    const array = arr as T[];
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return array.slice(startIndex, endIndex);
  }
}
