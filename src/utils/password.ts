import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

/**
 * Hash a password using bcrypt (simple encryption)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return hash;
};

/**
 * Hash password (alias for hashPassword - kept for compatibility)
 */
export const hashPasswordWithStretching = async (password: string): Promise<string> => {
  return await hashPassword(password);
};

/**
 * Verify password against stored hash using bcrypt
 */
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  try {
    // Use bcrypt's built-in verification
    const isValid = await bcrypt.compare(password, storedHash);
    return isValid;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

/**
 * Check password complexity requirements
 */
export interface PasswordComplexity {
  isValid: boolean;
  errors: string[];
}

export const checkPasswordComplexity = (password: string): PasswordComplexity => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate password strength score (0-100)
 */
export const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
  
  // Bonus for longer passwords
  if (password.length >= 20) score += 10;
  
  // Deduct for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  
  return Math.min(Math.max(score, 0), 100);
};

/**
 * Generate a random strong password
 */
export const generateStrongPassword = (length: number = 16): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
