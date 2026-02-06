export interface PasswordEntry {
  id: string;
  service: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PasswordOptions {
  length: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  password?: boolean;
  value?: string;
}

export type FormResult = Record<string, string>;
