/**
 * String Utils Utility
 * Utility functions for common string operations
 */

export class StringUtils {
  /**
   * Check if string is empty or whitespace only
   * @param str - String to check
   * @returns true if empty or whitespace, false otherwise
   */
  static isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * Check if string has content (not empty/whitespace)
   * @param str - String to check
   * @returns true if string has content, false otherwise
   */
  static hasContent(str: string | null | undefined): boolean {
    return str !== null && str !== undefined && str.trim().length > 0;
  }

  /**
   * Truncate string to maximum length
   * @param str - String to truncate
   * @param maxLength - Maximum length
   * @param suffix - Suffix to add when truncated (default: '...')
   * @returns Truncated string
   */
  static truncate(str: string | null | undefined, maxLength: number, suffix: string = '...'): string {
    if (this.isEmpty(str)) return '';
    if ((str as string).length <= maxLength) return str as string;
    
    return (str as string).substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Capitalize first letter
   * @param str - String to capitalize
   * @returns Capitalized string
   */
  static capitalize(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    const s = str as string;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Convert to uppercase
   * @param str - String to convert
   * @returns Uppercase string
   */
  static toUpperCase(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    return (str as string).toUpperCase();
  }

  /**
   * Convert to lowercase
   * @param str - String to convert
   * @returns Lowercase string
   */
  static toLowerCase(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    return (str as string).toLowerCase();
  }

  /**
   * Trim whitespace from string
   * @param str - String to trim
   * @returns Trimmed string
   */
  static trim(str: string | null | undefined): string {
    if (!str) return '';
    return str.trim();
  }

  /**
   * Split string and trim each part
   * @param str - String to split
   * @param separator - Separator character(s)
   * @returns Array of trimmed parts
   */
  static splitTrim(str: string | null | undefined, separator: string = ','): string[] {
    if (this.isEmpty(str)) return [];
    return (str as string).split(separator).map(s => s.trim()).filter(s => s.length > 0);
  }

  /**
   * Replace all occurrences of a substring
   * @param str - String to search in
   * @param search - Substring to find
   * @param replace - Replacement string
   * @returns String with all occurrences replaced
   */
  static replaceAll(str: string | null | undefined, search: string, replace: string): string {
    if (this.isEmpty(str)) return '';
    return (str as string).replaceAll(search, replace);
  }

  /**
   * Pad string to desired length
   * @param str - String to pad
   * @param length - Desired length
   * @param padChar - Character to pad with (default: ' ')
   * @param padStart - Pad at start (default) or end
   * @returns Padded string
   */
  static pad(str: string | null | undefined, length: number, padChar: string = ' ', padStart: boolean = true): string {
    if (!str) str = '';
    const s = str as string;
    
    if (padStart) {
      return s.padStart(length, padChar);
    } else {
      return s.padEnd(length, padChar);
    }
  }

  /**
   * Convert camelCase to kebab-case
   * @param str - String in camelCase
   * @returns String in kebab-case
   */
  static camelToKebab(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    return (str as string).replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Convert kebab-case to camelCase
   * @param str - String in kebab-case
   * @returns String in camelCase
   */
  static kebabToCamel(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    return (str as string).replace(/-([a-z])/g, g => g[1].toUpperCase());
  }

  /**
   * Convert snake_case to camelCase
   * @param str - String in snake_case
   * @returns String in camelCase
   */
  static snakeToCamel(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    return (str as string).replace(/_([a-z])/g, g => g[1].toUpperCase());
  }

  /**
   * Convert to Title Case
   * @param str - String to convert
   * @returns String in Title Case
   */
  static toTitleCase(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    return (str as string)
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract numbers from string
   * @param str - String to search in
   * @returns String containing only numbers
   */
  static extractNumbers(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    return (str as string).replace(/\D/g, '');
  }

  /**
   * Extract first N characters
   * @param str - String to extract from
   * @param length - Number of characters to extract
   * @returns Extracted substring
   */
  static firstN(str: string | null | undefined, length: number): string {
    if (this.isEmpty(str) || length < 1) return '';
    return (str as string).substring(0, length);
  }

  /**
   * Extract last N characters
   * @param str - String to extract from
   * @param length - Number of characters to extract
   * @returns Extracted substring
   */
  static lastN(str: string | null | undefined, length: number): string {
    if (this.isEmpty(str) || length < 1) return '';
    const s = str as string;
    return s.substring(Math.max(0, s.length - length));
  }

  /**
   * Check if string contains substring (case-insensitive)
   * @param str - String to search in
   * @param search - Substring to search for
   * @returns true if contains, false otherwise
   */
  static containsIgnoreCase(str: string | null | undefined, search: string): boolean {
    if (this.isEmpty(str) || this.isEmpty(search)) return false;
    return (str as string).toLowerCase().includes((search as string).toLowerCase());
  }

  /**
   * Check if string starts with prefix (case-insensitive)
   * @param str - String to check
   * @param prefix - Prefix to check
   * @returns true if starts with prefix, false otherwise
   */
  static startsWithIgnoreCase(str: string | null | undefined, prefix: string): boolean {
    if (this.isEmpty(str) || this.isEmpty(prefix)) return false;
    return (str as string).toLowerCase().startsWith((prefix as string).toLowerCase());
  }

  /**
   * Check if string ends with suffix (case-insensitive)
   * @param str - String to check
   * @param suffix - Suffix to check
   * @returns true if ends with suffix, false otherwise
   */
  static endsWithIgnoreCase(str: string | null | undefined, suffix: string): boolean {
    if (this.isEmpty(str) || this.isEmpty(suffix)) return false;
    return (str as string).toLowerCase().endsWith((suffix as string).toLowerCase());
  }

  /**
   * Convert special characters to HTML entities for safe display
   * @param str - String to encode
   * @returns HTML-encoded string
   */
  static htmlEncode(str: string | null | undefined): string {
    if (this.isEmpty(str)) return '';
    
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return (str as string).replace(/[&<>"']/g, char => map[char]);
  }
}
