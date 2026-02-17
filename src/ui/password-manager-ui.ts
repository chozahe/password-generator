import blessed from 'blessed';
import clipboardy from 'clipboardy';
import {
  createScreen,
  createTitle,
  createMenu,
  createOutputBox,
  createHint,
  createPrompt,
  setupExitHandler,
  COLORS,
  createBox,
  createButton
} from './components.ts';
import type { PasswordEntry, FormField, FormResult, PasswordOptions } from '../types/index.ts';

interface PasswordListItem {
  entry: PasswordEntry;
  revealed: boolean;
}

export class PasswordManagerUI {
  private screen: blessed.Widgets.Screen;
  private menu: blessed.Widgets.ListElement;
  private output: blessed.Widgets.BoxElement;
  private hint: blessed.Widgets.BoxElement;
  private onMenuSelect: (index: number) => void;
  private activeFormElements: blessed.Widgets.BlessedElement[] = [];
  private passwordListItems: PasswordListItem[] = [];
  private passwordListElement: blessed.Widgets.ListElement | null = null;
  private passwordDetailBox: blessed.Widgets.BoxElement | null = null;

  constructor(onMenuSelect: (index: number) => void) {
    this.onMenuSelect = onMenuSelect;

    this.screen = createScreen('🔐 Менеджер паролей');

    const title = createTitle('🔐 Менеджер паролей');

    // Основной контейнер
    const mainBox = createBox({
      top: 5,
      left: 'center',
      width: 70,
      height: 22,
      label: ' Главное меню '
    });
    this.screen.append(mainBox);

    this.menu = createMenu({
      top: 7,
      left: 'center',
      width: 50,
      height: 12,
      items: [
        'Посмотреть пароли',
        'Добавить пароль',
        'Сгенерировать пароль',
        'Настройки генерации',
        'Выйти'
      ]
    });

    this.output = createOutputBox(
      '{center}Добро пожаловать!{/center}\n{center}Выберите действие из меню ниже{/center}',
      18
    );

    this.hint = createHint('↑↓ / Ctrl+N / Ctrl+P — выбор  |  Enter — подтвердить  |  q — выход');

    this.screen.append(title);
    this.screen.append(this.menu);
    this.screen.append(this.output);
    this.screen.append(this.hint);

    this.menu.focus();

    this.setupEventHandlers();
    this.setupNavigationKeys();
    setupExitHandler(this.screen);
  }

  private setupEventHandlers(): void {
    this.menu.on('select', (_item, index) => {
      this.onMenuSelect(index);
    });
  }

  private setupNavigationKeys(): void {
    this.screen.key(['C-n'], () => {
      this.menu.down(1);
      this.screen.render();
    });
    this.screen.key(['C-p'], () => {
      this.menu.up(1);
      this.screen.render();
    });
  }

  public showMessage(message: string): void {
    this.clearForm();
    this.output.setContent(message);
    this.screen.render();
  }

  public async askPassword(prompt: string): Promise<string | null> {
    this.clearForm();
    this.menu.hide();
    this.output.hide();
    this.hint.hide();

    const box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 60,
      height: 12,
      border: { type: 'line' },
      label: ' 🔐 Аутентификация ',
      tags: true,
      style: {
        border: { fg: COLORS.accent },
        label: { fg: COLORS.accentBright, bold: true } as any
      }
    });

    blessed.text({
      parent: box,
      top: 2,
      left: 'center',
      content: `{bold}${prompt}{/bold}`,
      style: { fg: COLORS.text },
      tags: true
    });

    const input = blessed.textbox({
      parent: box,
      top: 4,
      left: 'center',
      width: 50,
      height: 3,
      border: { type: 'line' },
      style: {
        border: { fg: COLORS.border },
        focus: { border: { fg: COLORS.accent } }
      },
      inputOnFocus: true,
      secret: true
    });

    const hintBox = blessed.box({
      parent: box,
      bottom: 1,
      left: 'center',
      width: 50,
      height: 1,
      content: `{${COLORS.textMuted}-fg}Enter — подтвердить  |  Esc — отмена{/${COLORS.textMuted}-fg}`,
      tags: true,
      style: { fg: COLORS.textMuted }
    });

    this.activeFormElements.push(box, input, hintBox);
    input.focus();
    this.screen.render();

    return new Promise((resolve) => {
      input.on('submit', (value: string) => {
        this.clearForm();
        this.menu.show();
        this.output.show();
        this.hint.show();
        this.menu.focus();
        this.screen.render();
        resolve(value.trim() || null);
      });

      this.screen.key(['escape'], () => {
        this.clearForm();
        this.menu.show();
        this.output.show();
        this.hint.show();
        this.menu.focus();
        this.screen.render();
        resolve(null);
      });
    });
  }

  public async showPasswordGeneratorOptions(
    currentOptions: PasswordOptions
  ): Promise<PasswordOptions | null> {
    this.clearForm();
    this.menu.hide();
    this.output.hide();
    this.hint.hide();

    const box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: 70,
      height: 32,
      border: { type: 'line' },
      label: ' ⚙️ Настройки генерации пароля ',
      tags: true,
      style: {
        border: { fg: COLORS.primary },
        label: { fg: COLORS.accentBright, bold: true } as any
      }
    });

    // Длина пароля
    blessed.text({
      parent: box,
      top: 2,
      left: 3,
      content: '{bold}Длина пароля:{/bold}',
      style: { fg: COLORS.text },
      tags: true
    });

    const lengthInput = blessed.textbox({
      parent: box,
      top: 3,
      left: 3,
      width: 64,
      height: 3,
      border: { type: 'line' },
      style: {
        border: { fg: COLORS.border },
        focus: { border: { fg: COLORS.borderFocus } }
      },
      inputOnFocus: true,
      value: String(currentOptions.length)
    });

    // Чекбоксы для наборов символов
    const checkboxes: blessed.Widgets.CheckboxElement[] = [];
    const options = [
      { name: 'includeUppercase', label: 'Заглавные буквы (A-Z)', value: currentOptions.includeUppercase },
      { name: 'includeLowercase', label: 'Строчные буквы (a-z)', value: currentOptions.includeLowercase },
      { name: 'includeNumbers', label: 'Цифры (0-9)', value: currentOptions.includeNumbers },
      { name: 'includeSymbols', label: 'Символы (!@#$%^&*)', value: currentOptions.includeSymbols }
    ];

    for (let i = 0; i < options.length; i++) {
      const opt = options[i]!;
      blessed.text({
        parent: box,
        top: 7 + i * 2,
        left: 3,
        content: opt.label,
        style: { fg: COLORS.text }
      });

      const checkbox = blessed.checkbox({
        parent: box,
        top: 7 + i * 2,
        left: 35,
        checked: opt.value,
        style: {
          focus: { fg: COLORS.accent }
        }
      });
      checkboxes.push(checkbox);
    }

    // Пользовательские символы
    blessed.text({
      parent: box,
      top: 16,
      left: 3,
      content: '{bold}Добавить свои символы:{/bold}',
      style: { fg: COLORS.text },
      tags: true
    });

    const customCharsInput = blessed.textbox({
      parent: box,
      top: 17,
      left: 3,
      width: 64,
      height: 3,
      border: { type: 'line' },
      style: {
        border: { fg: COLORS.border },
        focus: { border: { fg: COLORS.borderFocus } }
      },
      inputOnFocus: true,
      value: currentOptions.customChars || ''
    });

    // Исключаемые символы
    blessed.text({
      parent: box,
      top: 21,
      left: 3,
      content: '{bold}Исключить символы:{/bold}',
      style: { fg: COLORS.text },
      tags: true
    });

    const excludeCharsInput = blessed.textbox({
      parent: box,
      top: 22,
      left: 3,
      width: 64,
      height: 3,
      border: { type: 'line' },
      style: {
        border: { fg: COLORS.border },
        focus: { border: { fg: COLORS.borderFocus } }
      },
      inputOnFocus: true,
      value: currentOptions.excludeChars || ''
    });

    // Разделительная линия
    blessed.line({
      parent: box,
      top: 15,
      left: 2,
      width: 66,
      orientation: 'horizontal',
      style: { fg: COLORS.textMuted }
    });

    const hintBox = blessed.box({
      parent: box,
      bottom: 0,
      left: 'center',
      width: 66,
      height: 1,
      content: `{${COLORS.textMuted}-fg}Tab — следующий элемент  |  Shift+Tab — предыдущий  |  Space — выбрать/снять  |  Enter — сохранить  |  Esc — отмена{/${COLORS.textMuted}-fg}`,
      tags: true,
      style: { fg: COLORS.textMuted }
    });

    const formElements: blessed.Widgets.BlessedElement[] = [
      box, lengthInput, ...checkboxes, customCharsInput, excludeCharsInput,
      hintBox
    ];
    this.activeFormElements.push(...formElements);
    lengthInput.focus();
    this.screen.render();

    return new Promise((resolve) => {
      let cleanupKeys = () => {};

      const submit = () => {
        const length = parseInt(lengthInput.getValue() || '16', 10);
        const result: PasswordOptions = {
          length: isNaN(length) || length < 1 ? 16 : length,
          includeUppercase: checkboxes[0]?.checked ?? true,
          includeLowercase: checkboxes[1]?.checked ?? true,
          includeNumbers: checkboxes[2]?.checked ?? true,
          includeSymbols: checkboxes[3]?.checked ?? true,
          customChars: customCharsInput.getValue() || '',
          excludeChars: excludeCharsInput.getValue() || ''
        };
        cleanupKeys();
        this.clearForm();
        this.menu.show();
        this.output.show();
        this.hint.show();
        this.menu.focus();
        this.screen.render();
        resolve(result);
      };

      const cancel = () => {
        cleanupKeys();
        this.clearForm();
        this.menu.show();
        this.output.show();
        this.hint.show();
        this.menu.focus();
        this.screen.render();
        resolve(null);
      };

      const focusableElements = [lengthInput, ...checkboxes, customCharsInput, excludeCharsInput];
      let currentFocus = 0;

      const focusNext = () => {
        currentFocus = (currentFocus + 1) % focusableElements.length;
        focusableElements[currentFocus]?.focus();
        this.screen.render();
      };

      const focusPrev = () => {
        currentFocus = (currentFocus - 1 + focusableElements.length) % focusableElements.length;
        focusableElements[currentFocus]?.focus();
        this.screen.render();
      };

      lengthInput.on('submit', focusNext);
      customCharsInput.on('submit', focusNext);
      excludeCharsInput.on('submit', submit);

      const handleFocusNext = () => {
        focusNext();
        return false;
      };
      const handleFocusPrev = () => {
        focusPrev();
        return false;
      };
      const handleEnter = () => {
        const focused = this.screen.focused;
        if (
          focused === lengthInput ||
          focused === customCharsInput ||
          focused === excludeCharsInput
        ) {
          return false;
        }
        submit();
        return false;
      };
      const handleEscape = () => {
        cancel();
        return false;
      };

      this.screen.key(['tab'], handleFocusNext);
      this.screen.key(['S-tab'], handleFocusPrev);
      this.screen.key(['down', 'right'], handleFocusNext);
      this.screen.key(['up', 'left'], handleFocusPrev);
      this.screen.key(['enter'], handleEnter);
      this.screen.key(['escape'], handleEscape);

      cleanupKeys = () => {
        const bindings: Array<{ keys: string[]; handler: () => boolean | void }> = [
          { keys: ['tab'], handler: handleFocusNext },
          { keys: ['S-tab'], handler: handleFocusPrev },
          { keys: ['down', 'right'], handler: handleFocusNext },
          { keys: ['up', 'left'], handler: handleFocusPrev },
          { keys: ['enter'], handler: handleEnter },
          { keys: ['escape'], handler: handleEscape }
        ];

        for (const binding of bindings) {
          for (const key of binding.keys) {
            this.screen.unkey(key, binding.handler);
          }
        }
      };
    });
  }

  public async showForm(
    title: string,
    fields: FormField[],
    onGeneratePassword?: () => string
  ): Promise<FormResult | null> {
    this.clearForm();
    this.menu.hide();
    this.output.hide();
    this.hint.hide();

    const boxWidth = 80;
    const boxHeight = fields.length * 5 + 12;
    
    const box = blessed.box({
      parent: this.screen,
      top: 'center',
      left: 'center',
      width: boxWidth,
      height: boxHeight,
      border: { type: 'line' },
      label: ` ${title} `,
      tags: true,
      style: {
        border: { fg: COLORS.primary },
        label: { fg: COLORS.accentBright, bold: true } as any
      }
    });

    const inputs: blessed.Widgets.TextboxElement[] = [];

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]!;

      blessed.text({
        parent: box,
        top: i * 5 + 2,
        left: 3,
        content: `{bold}${field.label}:{/bold}`,
        style: { fg: COLORS.text },
        tags: true
      });

      const input = blessed.textbox({
        parent: box,
        top: i * 5 + 3,
        left: 3,
        width: onGeneratePassword && field.name === 'password' ? 58 : 74,
        height: 3,
        border: { type: 'line' },
        style: {
          border: { fg: COLORS.border },
          focus: { border: { fg: COLORS.borderFocus } }
        },
        inputOnFocus: true,
        value: field.value ?? ''
      });

      inputs.push(input);
    }

    const passwordIndex = fields.findIndex(f => f.name === 'password');
    let genBtn: blessed.Widgets.ButtonElement | null = null;

    if (onGeneratePassword && passwordIndex !== -1) {
      genBtn = createButton({
        parent: box,
        content: 'Генер.',
        top: passwordIndex * 5 + 3,
        right: 3,
        width: 14,
        height: 3,
        fg: COLORS.warning
      });
    }

    const submitBtn = createButton({
      parent: box,
      content: '✓ Сохранить',
      bottom: 3,
      left: '25%',
      width: 20,
      height: 3,
      bg: COLORS.accent,
      fg: COLORS.accent
    });

    const cancelBtn = createButton({
      parent: box,
      content: '✕ Отмена',
      bottom: 3,
      right: '25%',
      width: 18,
      height: 3,
      fg: COLORS.error
    });

    const hintBox = blessed.box({
      parent: box,
      bottom: 1,
      left: 'center',
      width: 70,
      height: 1,
      content: `{${COLORS.textMuted}-fg}Tab — следующее поле  |  Ctrl+G — сгенерировать пароль  |  Enter — сохранить  |  Esc — отмена{/${COLORS.textMuted}-fg}`,
      tags: true,
      style: { fg: COLORS.textMuted }
    });

    const formElements: blessed.Widgets.BlessedElement[] = [box, ...inputs, submitBtn, cancelBtn, hintBox];
    if (genBtn) formElements.push(genBtn);
    this.activeFormElements.push(...formElements);
    inputs[0]?.focus();
    this.screen.render();

    return new Promise((resolve) => {
      let currentField = 0;

      const submit = () => {
        const result: FormResult = {};
        for (let i = 0; i < fields.length; i++) {
          const fieldName = fields[i]!.name;
          const input = inputs[i];
          const value = input ? input.getValue() || input.value || '' : '';
          result[fieldName] = value;
        }
        this.clearForm();
        this.menu.show();
        this.output.show();
        this.hint.show();
        this.menu.focus();
        this.screen.render();
        resolve(result);
      };

      const cancel = () => {
        this.clearForm();
        this.menu.show();
        this.output.show();
        this.hint.show();
        this.menu.focus();
        this.screen.render();
        resolve(null);
      };

      for (let i = 0; i < inputs.length; i++) {
        inputs[i]!.on('submit', () => {
          if (i < inputs.length - 1) {
            inputs[i + 1]!.focus();
          } else {
            submit();
          }
        });
      }

      submitBtn.on('press', submit);
      cancelBtn.on('press', cancel);

      if (genBtn && onGeneratePassword && passwordIndex !== -1) {
        const generate = () => {
          const password = onGeneratePassword();
          const pwdInput = inputs[passwordIndex];
          if (pwdInput) {
            pwdInput.setValue(password);
            this.screen.render();
          }
        };
        genBtn.on('press', generate);
        this.screen.key(['C-g'], () => {
          generate();
          return false;
        });
        for (const input of inputs) {
          input.key(['C-g'], () => {
            generate();
            return false;
          });
        }
      }

      this.screen.key(['tab'], () => {
        currentField = (currentField + 1) % (inputs.length + 2);
        if (currentField < inputs.length) {
          inputs[currentField]!.focus();
        } else if (currentField === inputs.length) {
          submitBtn.focus();
        } else {
          cancelBtn.focus();
        }
      });

      this.screen.key(['escape'], cancel);
    });
  }

  private clearForm(): void {
    for (const element of this.activeFormElements) {
      element.destroy();
    }
    this.activeFormElements = [];
  }

  public render(): void {
    this.screen.render();
  }

  public exit(): void {
    process.exit(0);
  }

  public async showPasswordList(
    passwords: PasswordEntry[],
    onBack: () => void
  ): Promise<void> {
    this.clearForm();
    this.menu.hide();
    this.output.hide();
    this.hint.hide();

    this.passwordListItems = passwords.map(p => ({ entry: p, revealed: false }));

    const container = blessed.box({
      parent: this.screen,
      top: 2,
      left: 'center',
      width: 90,
      height: '85%',
      border: { type: 'line' },
      style: {
        border: { fg: COLORS.primary },
        label: { fg: COLORS.accentBright, bold: true } as any
      },
      label: ' 🔐 Сохранённые пароли ',
      tags: true
    });

    // Заголовок таблицы
    const headerBox = blessed.box({
      parent: container,
      top: 1,
      left: 2,
      width: 86,
      height: 1,
      content: `{bold}{${COLORS.accent}-fg}  №  │  Сервис                │  Логин                 │  Пароль{/${COLORS.accent}-fg}{/bold}`,
      style: { fg: COLORS.accent },
      tags: true
    });

    // Разделитель
    blessed.line({
      parent: container,
      top: 2,
      left: 2,
      width: 86,
      orientation: 'horizontal',
      style: { fg: COLORS.textMuted }
    });

    this.passwordListElement = blessed.list({
      parent: container,
      top: 3,
      left: 2,
      width: 86,
      height: '55%',
      style: {
        selected: {
          bg: COLORS.primary,
          fg: 'white',
          bold: true
        },
        item: { fg: COLORS.text }
      },
      keys: true,
      vi: true,
      mouse: true
    });

    this.passwordDetailBox = blessed.box({
      parent: container,
      bottom: 3,
      left: 2,
      width: 86,
      height: 8,
      border: { type: 'line' },
      label: ' {bold}Детали записи{/bold} ',
      tags: true,
      style: {
        border: { fg: COLORS.secondary },
        label: { fg: COLORS.secondary, bold: true } as any
      }
    });

    // Подсказка внизу
    const hintBox = blessed.box({
      parent: container,
      bottom: 1,
      left: 'center',
      width: 80,
      height: 1,
      content: `{${COLORS.textMuted}-fg}↑↓ — выбор  |  Enter — показать/скрыть пароль + скопировать  |  Esc — назад{/${COLORS.textMuted}-fg}`,
      tags: true,
      style: { fg: COLORS.textMuted }
    });

    this.updatePasswordList();
    this.activeFormElements.push(container, headerBox, this.passwordListElement, this.passwordDetailBox, hintBox);
    this.passwordListElement.focus();
    this.screen.render();

    this.passwordListElement.on('select', (_item, index) => {
      const item = this.passwordListItems[index];
      if (item) {
        item.revealed = !item.revealed;
        this.updatePasswordList();
        this.updatePasswordDetail(index);
        if (item.revealed) {
          clipboardy.writeSync(item.entry.password);
        }
      }
    });

    this.passwordListElement.on('select item', (_item, index: number) => {
      this.updatePasswordDetail(index);
    });

    this.screen.key(['escape'], () => {
      this.clearForm();
      this.menu.show();
      this.output.show();
      this.hint.show();
      this.menu.focus();
      this.screen.render();
      onBack();
    });

    if (this.passwordListItems.length > 0) {
      this.updatePasswordDetail(0);
    }
  }

  private updatePasswordList(): void {
    if (!this.passwordListElement) return;

    const items = this.passwordListItems.map((item, index) => {
      const num = String(index + 1).padStart(2, ' ');
      const service = item.entry.service.slice(0, 20).padEnd(20, ' ');
      const username = item.entry.username.slice(0, 20).padEnd(20, ' ');
      const maskedPassword = item.revealed
        ? item.entry.password.slice(0, 25)
        : '•'.repeat(Math.min(item.entry.password.length, 20));
      return `  ${num} │  ${service}  │  ${username}  │  ${maskedPassword}`;
    });

    this.passwordListElement.setItems(items);
    this.screen.render();
  }

  private updatePasswordDetail(index: number): void {
    if (!this.passwordDetailBox || !this.passwordListItems[index]) return;

    const item = this.passwordListItems[index]!;
    const passwordDisplay = item.revealed
      ? `{${COLORS.accentBright}-fg}{bold}${item.entry.password}{/bold}{/${COLORS.accentBright}-fg}`
      : `{${COLORS.textMuted}-fg}${'•'.repeat(item.entry.password.length)}{/${COLORS.textMuted}-fg}`;

    this.passwordDetailBox.setContent(
      `\n  {bold}Сервис:{/bold}  {${COLORS.primaryBright}-fg}${item.entry.service}{/${COLORS.primaryBright}-fg}\n\n` +
      `  {bold}Логин:{/bold}   {${COLORS.warning}-fg}${item.entry.username}{/${COLORS.warning}-fg}\n\n` +
      `  {bold}Пароль:{/bold}  ${passwordDisplay}`
    );
    this.screen.render();
  }
}
