/**
 * Validation Utils Utility
 * Utility functions for common form and data validation
 */

export class ValidationUtils {
  /**
   * Validate email format
   * @param email - Email to validate
   * @returns true if valid email format, false otherwise
   */
  static isValidEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate Malaysian IC number (YYMMDD-PB-###G)
   * @param ic - IC number to validate
   * @returns true if valid format, false otherwise
   */
  static isValidMalaysianIC(ic: string | null | undefined): boolean {
    if (!ic) return false;
    // Format: YYMMDD-PB-###G (simplified validation)
    const icRegex = /^\d{6}-\d{2}-\d{4}[A-Z]?$/;
    return icRegex.test(ic.replace(/\s+/g, ''));
  }

  /**
   * Validate Malaysian phone number
   * @param phone - Phone number to validate
   * @returns true if valid format, false otherwise
   */
  static isValidMalaysianPhone(phone: string | null | undefined): boolean {
    if (!phone) return false;
    // Formats: +6010-1234567, 010-1234567, 01012345678, etc.
    const phoneRegex = /^(\+?6?0?1[0-9])[0-9]{7,8}$/;
    return phoneRegex.test(phone.replace(/[^0-9+]/g, ''));
  }

  /**
   * Validate bank account number (Malaysian format)
   * @param accountNo - Account number to validate
   * @returns true if looks valid (basic check), false otherwise
   */
  static isValidBankAccount(accountNo: string | null | undefined): boolean {
    if (!accountNo) return false;
    // Basic validation: 10-16 digits
    const accountRegex = /^\d{10,16}$/;
    return accountRegex.test(accountNo.replace(/[^0-9]/g, ''));
  }

  /**
   * Validate URL format
   * @param url - URL to validate
   * @returns true if valid URL format, false otherwise
   */
  static isValidUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate number range
   * @param value - Number to validate
   * @param min - Minimum inclusive value
   * @param max - Maximum inclusive value
   * @returns true if value is within range, false otherwise
   */
  static isInRange(value: number | null | undefined, min: number, max: number): boolean {
    if (value === null || value === undefined) return false;
    return value >= min && value <= max;
  }

  /**
   * Validate string length
   * @param str - String to validate
   * @param minLength - Minimum length (inclusive)
   * @param maxLength - Maximum length (inclusive)
   * @returns true if string length is valid, false otherwise
   */
  static isValidLength(str: string | null | undefined, minLength: number, maxLength: number): boolean {
    if (!str) return minLength === 0;
    return str.length >= minLength && str.length <= maxLength;
  }

  /**
   * Validate that all required fields in object are present and not empty
   * @param obj - Object to validate
   * @param requiredFields - Array of required field names
   * @returns Object with validation result { isValid, missingFields }
   */
  static validateRequired(obj: any, requiredFields: string[]): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      const value = obj[field];
      if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
        missingFields.push(field);
      }
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Validate numeric string
   * @param str - String to validate
   * @param allowNegative - Allow negative numbers (default: false)
   * @param allowDecimal - Allow decimal numbers (default: false)
   * @returns true if valid number format, false otherwise
   */
  static isNumeric(str: string | null | undefined, allowNegative: boolean = false, allowDecimal: boolean = false): boolean {
    if (!str) return false;
    
    let pattern = '^[0-9]+';
    if (allowDecimal) pattern = '^[0-9]+(\\.[0-9]+)?';
    if (allowNegative) pattern = '^' + (allowDecimal ? '[-]?[0-9]+(\\.[0-9]+)?' : '[-]?[0-9]+');
    
    const regex = new RegExp(pattern + '$');
    return regex.test(str);
  }

  /**
   * Validate alphanumeric string
   * @param str - String to validate
   * @param allowSpaces - Allow spaces (default: false)
   * @param allowSpecialChars - Array of allowed special characters (default: [])
   * @returns true if valid alphanumeric, false otherwise
   */
  static isAlphanumeric(
    str: string | null | undefined,
    allowSpaces: boolean = false,
    allowSpecialChars: string[] = []
  ): boolean {
    if (!str) return false;
    
    let pattern = '^[a-zA-Z0-9';
    if (allowSpaces) pattern += '\\s';
    if (allowSpecialChars.length > 0) {
      pattern += allowSpecialChars.map(char => '\\' + char).join('');
    }
    pattern += ']+$';
    
    const regex = new RegExp(pattern);
    return regex.test(str);
  }

  /**
   * Validate date is in future
   * @param date - Date to validate
   * @returns true if date is in future, false otherwise
   */
  static isFutureDate(date: Date | string | null | undefined): boolean {
    if (!date) return false;
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return false;
      
      return dateObj > new Date();
    } catch {
      return false;
    }
  }

  /**
   * Validate date is in past
   * @param date - Date to validate
   * @returns true if date is in past, false otherwise
   */
  static isPastDate(date: Date | string | null | undefined): boolean {
    if (!date) return false;
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return false;
      
      return dateObj < new Date();
    } catch {
      return false;
    }
  }

  /**
   * Validate date is between two dates
   * @param date - Date to validate
   * @param startDate - Start date (inclusive)
   * @param endDate - End date (inclusive)
   * @returns true if date is between start and end, false otherwise
   */
  static isDateBetween(
    date: Date | string,
    startDate: Date | string,
    endDate: Date | string
  ): boolean {
    try {
      const dateObj = new Date(date);
      const startObj = new Date(startDate);
      const endObj = new Date(endDate);
      
      if (isNaN(dateObj.getTime()) || isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
        return false;
      }
      
      return dateObj >= startObj && dateObj <= endObj;
    } catch {
      return false;
    }
  }

  /**
   * Validate age is within range
   * @param birthDate - Birth date
   * @param minAge - Minimum age (inclusive)
   * @param maxAge - Maximum age (inclusive)
   * @returns true if age is within range, false otherwise
   */
  static isAgeInRange(birthDate: Date | string, minAge: number, maxAge: number): boolean {
    try {
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return false;
      
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age >= minAge && age <= maxAge;
    } catch {
      return false;
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @param options - Validation options
   * @returns Object with validation result and feedback
   */
  static validatePasswordStrength(
    password: string | null | undefined,
    options: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
      specialChars?: string;
    } = {}
  ): { isValid: boolean; feedback: string[] } {
    const feedback: string[] = [];
    
    if (!password) {
      feedback.push('Password is required');
      return { isValid: false, feedback };
    }
    
    const minLength = options.minLength || 8;
    if (password.length < minLength) {
      feedback.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (options.requireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    }
    
    if (options.requireLowercase && !/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    }
    
    if (options.requireNumbers && !/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    }
    
    if (options.requireSpecialChars) {
      const specialChars = options.specialChars || '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const specialCharRegex = new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
      if (!specialCharRegex.test(password)) {
        feedback.push(`Password must contain at least one special character: ${specialChars}`);
      }
    }
    
    return {
      isValid: feedback.length === 0,
      feedback
    };
  }
}
