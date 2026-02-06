import type { PasswordEntry } from '../types/index.ts';

export interface PasswordService {
  getAllPasswords(): Promise<PasswordEntry[]>;
  addPassword(entry: Omit<PasswordEntry, 'id' | 'createdAt'>): Promise<PasswordEntry>;
  getPassword(id: string): Promise<PasswordEntry | null>;
  updatePassword(id: string, updates: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>): Promise<PasswordEntry | null>;
  deletePassword(id: string): Promise<boolean>;
}
