import { getRandomValues } from 'node:crypto';
import type { PasswordOptions } from '../types/index.ts';

const DEFAULT_OPTIONS: Required<PasswordOptions> = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true
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

export function generatePassword(options: Partial<PasswordOptions> = {}): string {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  let chars = '';
  if (config.includeUppercase) chars += CHAR_SETS.uppercase;
  if (config.includeLowercase) chars += CHAR_SETS.lowercase;
  if (config.includeNumbers) chars += CHAR_SETS.numbers;
  if (config.includeSymbols) chars += CHAR_SETS.symbols;
  
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
