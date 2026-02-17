import { PasswordManagerUI } from './ui/password-manager-ui.ts';
import { generateSecurePassword, generatePassword } from './utils/password-generator.ts';
import { EncryptedPasswordService } from './services/encrypted-password-service.ts';
import type { PasswordEntry, PasswordOptions } from './types/index.ts';
import clipboardy from 'clipboardy';

const DEFAULT_GENERATOR_OPTIONS: PasswordOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  customChars: '',
  excludeChars: ''
};

export class PasswordManagerApp {
  private ui: PasswordManagerUI;
  private passwordService: EncryptedPasswordService;
  private isAuthenticated = false;
  private generatorOptions: PasswordOptions = { ...DEFAULT_GENERATOR_OPTIONS };

  constructor(dataFilePath?: string) {
    this.passwordService = new EncryptedPasswordService(dataFilePath);
    this.ui = new PasswordManagerUI(this.handleMenuSelection.bind(this));
  }

  async initialize(): Promise<void> {
    const hintText = this.passwordService.isVaultCreated()
      ? 'Введите существующий мастер-пароль'
      : 'Создаётся новое хранилище. Придумайте мастер-пароль';

    const masterPassword = await this.ui.askPassword(hintText);

    if (!masterPassword) {
      console.log('Мастер-пароль не введен. Выход.');
      process.exit(1);
    }

    const success = await this.passwordService.initialize(masterPassword);

    if (!success) {
      console.log('Неверный мастер-пароль. Выход.');
      process.exit(1);
    }

    this.isAuthenticated = true;
    this.ui.showMessage('{center}{green-fg}{bold}✓ Успешная аутентификация{/bold}{/green-fg}{/center}\n\n{center}Выберите действие из меню ниже{/center}');
    this.ui.render();
  }

  private async handleMenuSelection(index: number): Promise<void> {
    if (!this.isAuthenticated) return;

    switch (index) {
      case 0:
        await this.showPasswords();
        break;
      case 1:
        await this.addPassword();
        break;
      case 2:
        this.generatePassword();
        break;
      case 3:
        await this.showGeneratorSettings();
        break;
      case 4:
        this.ui.exit();
        break;
    }
  }

  private async showPasswords(): Promise<void> {
    const passwords = await this.passwordService.getAllPasswords();

    if (passwords.length === 0) {
      this.ui.showMessage('{center}{yellow-fg}📭 Список паролей пуст{/yellow-fg}{/center}\n\n{center}Добавьте первый пароль через меню{/center}');
    } else {
      await this.ui.showPasswordList(passwords, () => {
        this.ui.showMessage('{center}Выберите действие из меню ниже{/center}');
      });
    }
  }

  private async addPassword(): Promise<void> {
    const result = await this.ui.showForm('Добавить пароль', [
      { name: 'service', label: 'Сервис (например: google.com)' },
      { name: 'username', label: 'Логин / Email' },
      { name: 'password', label: 'Пароль', password: true }
    ], () => generatePassword(this.generatorOptions));

    if (!result) {
      this.ui.showMessage('{center}{yellow-fg}Добавление отменено{/yellow-fg}{/center}');
      return;
    }

    const { service, username, password } = result;

    if (!service || !username || !password) {
      this.ui.showMessage('{center}{red-fg}Ошибка: все поля обязательны{/red-fg}{/center}');
      return;
    }

    try {
      const entry: Omit<PasswordEntry, 'id' | 'createdAt'> = {
        service: service.trim(),
        username: username.trim(),
        password: password
      };

      await this.passwordService.addPassword(entry);
      this.ui.showMessage(`{center}{green-fg}{bold}✓ Пароль сохранён{/bold}{/green-fg}{/center}\n\n{center}Для сервиса: {cyan-fg}${entry.service}{/cyan-fg}{/center}`);
    } catch (error) {
      this.ui.showMessage('{center}{red-fg}Ошибка при сохранении пароля{/red-fg}{/center}');
    }
  }

  private generatePassword(): void {
    const password = generatePassword(this.generatorOptions);
    clipboardy.writeSync(password);
    this.ui.showMessage(
      `{center}{green-fg}{bold}✓ Пароль сгенерирован{/bold}{/green-fg}{/center}\n\n` +
      `{center}{yellow-fg}${password}{/yellow-fg}{/center}\n\n` +
      `{center}{green-fg}📋 Скопирован в буфер обмена!{/green-fg}{/center}`
    );
  }

  private async showGeneratorSettings(): Promise<void> {
    const newOptions = await this.ui.showPasswordGeneratorOptions(this.generatorOptions);
    if (newOptions) {
      this.generatorOptions = newOptions;
      this.ui.showMessage('{center}{green-fg}{bold}✓ Настройки сохранены{/bold}{/green-fg}{/center}');
    } else {
      this.ui.showMessage('{center}{yellow-fg}Настройки не изменены{/yellow-fg}{/center}');
    }
  }
}
