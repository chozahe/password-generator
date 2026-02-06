import blessed from 'blessed';

export type MenuItem = {
  label: string;
  action: () => void;
};

export type MenuConfig = {
  top: number;
  left: string | number;
  width: number;
  height: number;
  items: string[];
};

// Цветовая схема
export const COLORS = {
  primary: 'blue',
  primaryBright: 'bright-blue',
  secondary: 'cyan',
  accent: 'green',
  accentBright: 'bright-green',
  warning: 'yellow',
  error: 'red',
  text: 'white',
  textMuted: 'gray',
  bg: 'black',
  border: 'blue',
  borderFocus: 'bright-cyan',
  highlight: 'bright-yellow'
};

export function createScreen(title: string): blessed.Widgets.Screen {
  return blessed.screen({
    smartCSR: true,
    title: title,
    terminal: 'xterm-256color'
  });
}

export function createTitle(content: string): blessed.Widgets.BoxElement {
  return blessed.box({
    top: 1,
    left: 'center',
    width: 'shrink',
    height: 3,
    content: `{center}{${COLORS.accentBright}-fg}{bold}${content}{/bold}{/${COLORS.accentBright}-fg}{/center}`,
    tags: true,
    style: {
      fg: COLORS.accentBright
    }
  });
}

export function createBox(options: {
  top: number | string;
  left: number | string;
  width: number | string;
  height: number | string;
  label?: string;
  doubleBorder?: boolean;
}): blessed.Widgets.BoxElement {
  return blessed.box({
    top: options.top,
    left: options.left,
    width: options.width,
    height: options.height,
    label: options.label ? ` {bold}${options.label}{/bold} ` : undefined,
    border: { type: 'line' },
    tags: true,
    style: {
      border: { fg: COLORS.border },
      label: { fg: COLORS.accent, bold: true }
    }
  });
}

export function createMenu(config: MenuConfig): blessed.Widgets.ListElement {
  return blessed.list({
    top: config.top,
    left: config.left,
    width: config.width,
    height: config.height,
    items: config.items.map((item, i) => `  ${i + 1}. ${item}`),
    label: ' Меню ',
    border: { type: 'line' },
    tags: true,
    style: {
      selected: { 
        bg: COLORS.primary, 
        fg: 'white',
        bold: true
      },
      item: { fg: COLORS.text },
      border: { fg: COLORS.border },
      label: { fg: COLORS.accent, bold: true } as any
    },
    keys: true,
    vi: true,
    mouse: true
  });
}

export function createOutputBox(
  content: string,
  top: number = 14
): blessed.Widgets.BoxElement {
  return blessed.box({
    top: top,
    left: 'center',
    width: 60,
    height: 7,
    content: content,
    align: 'center',
    valign: 'middle',
    label: ' {bold}Информация{/bold} ',
    border: { type: 'line' },
    tags: true,
    style: { 
      border: { fg: COLORS.secondary },
      label: { fg: COLORS.secondary, bold: true }
    }
  });
}

export function createHint(content: string): blessed.Widgets.BoxElement {
  return blessed.box({
    bottom: 0,
    left: 'center',
    width: '90%',
    height: 3,
    content: `{center}{${COLORS.textMuted}-fg}${content}{/${COLORS.textMuted}-fg}{/center}`,
    align: 'center',
    valign: 'middle',
    tags: true,
    style: {
      fg: COLORS.textMuted
    }
  });
}

export function createStatusBar(): blessed.Widgets.BoxElement {
  return blessed.box({
    bottom: 3,
    left: 'center',
    width: '90%',
    height: 1,
    content: '',
    tags: true,
    style: {
      fg: COLORS.textMuted
    }
  });
}

export function createPrompt(
  screen: blessed.Widgets.Screen,
  config: {
    label: string;
    top: number;
    password?: boolean;
    value?: string;
    width?: number;
  }
): blessed.Widgets.TextboxElement {
  const box = blessed.textbox({
    parent: screen,
    top: config.top,
    left: 'center',
    width: config.width || 50,
    height: 3,
    label: ` {bold}${config.label}{/bold} `,
    border: { type: 'line' },
    tags: true,
    style: {
      border: { fg: COLORS.border },
      focus: { border: { fg: COLORS.borderFocus } },
      label: { fg: COLORS.accent, bold: true }
    },
    inputOnFocus: true,
    secret: config.password ?? false,
    value: config.value ?? ''
  });
  return box;
}

export function createButton(options: {
  parent: blessed.Widgets.BoxElement;
  content: string;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  width: number;
  height: number;
  bg?: string;
  fg?: string;
}): blessed.Widgets.ButtonElement {
  return blessed.button({
    parent: options.parent,
    top: options.top,
    bottom: options.bottom,
    left: options.left,
    right: options.right,
    width: options.width,
    height: options.height,
    content: `{center}{bold}${options.content}{/bold}{/center}`,
    align: 'center',
    valign: 'middle',
    border: { type: 'line' },
    tags: true,
    style: {
      border: { fg: options.fg || COLORS.border },
      bg: options.bg || 'default',
      fg: options.fg || COLORS.text,
      focus: { 
        bg: options.bg || COLORS.primary, 
        fg: 'white',
        border: { fg: COLORS.borderFocus }
      }
    },
    keys: true,
    mouse: true
  });
}

export function setupExitHandler(
  screen: blessed.Widgets.Screen,
  keys: string[] = ['q', 'C-c']
): void {
  screen.key(keys, () => {
    process.exit(0);
  });
}

export function createSeparator(top: number): blessed.Widgets.LineElement {
  return blessed.line({
    top: top,
    left: 'center',
    width: '80%',
    orientation: 'horizontal',
    style: {
      fg: COLORS.textMuted
    }
  });
}
