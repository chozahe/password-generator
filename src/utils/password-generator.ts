import { getRandomValues } from 'node:crypto';
import type { PasswordOptions } from '../types/index.ts';

const DEFAULT_OPTIONS: Required<PasswordOptions> = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  customChars: '',
  excludeChars: ''
};

const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*'
};

function getSecureRandomInt(max: number): number {
  const randomBytes = getRandomValues(new Uint32Array(1));
  const value = randomBytes[0];
  if (value === undefined) {
    throw new Error('Failed to generate secure random value');
  }
  return value % max;
}

function removeChars(charSet: string, charsToRemove: string): string {
  const removeSet = new Set(charsToRemove);
  return charSet.split('').filter(c => !removeSet.has(c)).join('');
}

export function generatePassword(options: Partial<PasswordOptions> = {}): string {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  let chars = '';
  if (config.includeUppercase) chars += removeChars(CHAR_SETS.uppercase, config.excludeChars);
  if (config.includeLowercase) chars += removeChars(CHAR_SETS.lowercase, config.excludeChars);
  if (config.includeNumbers) chars += removeChars(CHAR_SETS.numbers, config.excludeChars);
  if (config.includeSymbols) chars += removeChars(CHAR_SETS.symbols, config.excludeChars);
  
  // Добавляем пользовательские символы
  if (config.customChars) {
    chars += config.customChars;
  }
  
  if (chars.length === 0) {
    throw new Error('At least one character set must be selected');
  }
  
  let password = '';
  for (let i = 0; i < config.length; i++) {
    const randomIndex = getSecureRandomInt(chars.length);
    password += chars.charAt(randomIndex);
  }
  
  return password;
}

export function generateSecurePassword(length: number = 16): string {
  return generatePassword({
    length,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true
  });
}
