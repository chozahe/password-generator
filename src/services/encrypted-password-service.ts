import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import type { PasswordEntry } from '../types/index.ts';
import type { PasswordService } from './password-service.ts';

const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const DEFAULT_DATA_FILE = 'passwords.dat';

interface StoredData {
  masterHash: string;
  passwords: EncryptedEntry[];
}

interface EncryptedEntry {
  id: string;
  service: string;
  username: string;
  encryptedPassword: string;
  salt: string;
  iv: string;
  authTag: string;
  createdAt: string;
  updatedAt?: string;
}

export class EncryptedPasswordService implements PasswordService {
  private passwords: Map<string, PasswordEntry> = new Map();
  private masterKey: Buffer | null = null;
  private initialized = false;
  private dataFile: string;

  constructor(dataFile?: string) {
    this.dataFile = dataFile || DEFAULT_DATA_FILE;
  }

  async initialize(masterPassword: string): Promise<boolean> {
    if (this.initialized) return true;

    if (existsSync(this.dataFile)) {
      return this.unlock(masterPassword);
    } else {
      return this.createVault(masterPassword);
    }
  }

  isVaultCreated(): boolean {
    return existsSync(this.dataFile);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private deriveKey(password: string, salt: Buffer): Buffer {
    return scryptSync(password, salt, KEY_LENGTH);
  }

  private hashMasterPassword(password: string, salt: Buffer): string {
    const key = this.deriveKey(password, salt);
    return salt.toString('hex') + ':' + key.toString('hex');
  }

  private verifyMasterPassword(password: string, storedHash: string): boolean {
    const [saltHex] = storedHash.split(':');
    const salt = Buffer.from(saltHex!, 'hex');
    const newHash = this.deriveKey(password, salt);
    const storedKey = Buffer.from(storedHash.split(':')[1]!, 'hex');
    return timingSafeEqual(newHash, storedKey);
  }

  private createVault(masterPassword: string): boolean {
    const salt = randomBytes(SALT_LENGTH);
    this.masterKey = this.deriveKey(masterPassword, salt);
    const masterHash = this.hashMasterPassword(masterPassword, salt);

    const data: StoredData = {
      masterHash,
      passwords: []
    };

    writeFileSync(this.dataFile, JSON.stringify(data));
    this.initialized = true;
    return true;
  }

  private unlock(masterPassword: string): boolean {
    try {
      const fileContent = readFileSync(this.dataFile, 'utf-8');
      const data: StoredData = JSON.parse(fileContent);

      if (!this.verifyMasterPassword(masterPassword, data.masterHash)) {
        return false;
      }

      const [saltHex] = data.masterHash.split(':');
      const salt = Buffer.from(saltHex!, 'hex');
      this.masterKey = this.deriveKey(masterPassword, salt);

      for (const entry of data.passwords) {
        const decryptedPassword = this.decrypt(
          entry.encryptedPassword,
          entry.iv,
          entry.authTag
        );

        this.passwords.set(entry.id, {
          id: entry.id,
          service: entry.service,
          username: entry.username,
          password: decryptedPassword,
          createdAt: new Date(entry.createdAt),
          updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : undefined
        });
      }

      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  private encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    if (!this.masterKey) throw new Error('Not initialized');

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex')
    };
  }

  private decrypt(encrypted: string, ivHex: string, authTagHex: string): string {
    if (!this.masterKey) throw new Error('Not initialized');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private save(): void {
    if (!this.masterKey) throw new Error('Not initialized');

    const encryptedEntries: EncryptedEntry[] = Array.from(this.passwords.values()).map(entry => {
      const { encrypted, iv, authTag } = this.encrypt(entry.password);
      return {
        id: entry.id,
        service: entry.service,
        username: entry.username,
        encryptedPassword: encrypted,
        salt: '',
        iv,
        authTag,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt?.toISOString()
      };
    });

    const fileContent = readFileSync(this.dataFile, 'utf-8');
    const data: StoredData = JSON.parse(fileContent);
    data.passwords = encryptedEntries;

    writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
  }

  async getAllPasswords(): Promise<PasswordEntry[]> {
    return Array.from(this.passwords.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async addPassword(
    entry: Omit<PasswordEntry, 'id' | 'createdAt'>
  ): Promise<PasswordEntry> {
    const id = crypto.randomUUID();
    const newEntry: PasswordEntry = {
      ...entry,
      id,
      createdAt: new Date()
    };
    this.passwords.set(id, newEntry);
    this.save();
    return newEntry;
  }

  async getPassword(id: string): Promise<PasswordEntry | null> {
    return this.passwords.get(id) || null;
  }

  async updatePassword(
    id: string,
    updates: Partial<Omit<PasswordEntry, 'id' | 'createdAt'>>
  ): Promise<PasswordEntry | null> {
    const existing = this.passwords.get(id);
    if (!existing) return null;

    const updated: PasswordEntry = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.passwords.set(id, updated);
    this.save();
    return updated;
  }

  async deletePassword(id: string): Promise<boolean> {
    const deleted = this.passwords.delete(id);
    if (deleted) this.save();
    return deleted;
  }
}
