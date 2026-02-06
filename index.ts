import { PasswordManagerApp } from './src/app.ts';

const DATA_FILE = process.env.PASSWORD_VAULT_PATH || 'passwords.dat';

const app = new PasswordManagerApp(DATA_FILE);
app.initialize();
