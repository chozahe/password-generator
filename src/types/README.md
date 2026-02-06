# 📦 Папка `types/` — Типы данных

Эта папка содержит **описания данных** — шаблоны, которые говорят программе, как должны выглядеть пароли, настройки и другие объекты.

---

## 🤔 Что такое "типы"?

Представьте, что вы заполняете форму в больнице. Там есть правила:
- В поле "Имя" — только буквы
- В поле "Дата рождения" — только даты
- В поле "Телефон" — только цифры

**Типы данных в программировании — это такие же правила.**

Они помогают:
1. **Избежать ошибок** — программа не позволит записать текст вместо числа
2. **Понять код** — сразу видно, какие данные используются
3. **Автодополнение** — редактор подсказывает доступные поля

---

## 📄 Содержимое файла

### `index.ts`

Этот файл содержит все типы данных, используемые в программе.

---

## 🔍 Разбор каждого типа

### 1. `PasswordEntry` — Запись о пароле

```typescript
export interface PasswordEntry {
  id: string;              // Уникальный номер записи
  service: string;         // Название сервиса (google.com, vk.com)
  username: string;        // Логин или email
  password: string;        // Сам пароль (в зашифрованном виде)
  createdAt: Date;         // Когда создана запись
  updatedAt?: Date;        // Когда последний раз изменена (необязательно)
}
```

**Что это такое?**

Это "паспорт" пароля — полное описание одной записи в хранилище.

**Пример использования:**
```typescript
const myPassword: PasswordEntry = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  service: "gmail.com",
  username: "ivan@example.com",
  password: "SuperSecret123!",
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-06-20")
};
```

**Что означает каждое поле:**

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `id` | `string` | Уникальный идентификатор (UUID) | `"550e8400-e29b-41d4-a716-446655440000"` |
| `service` | `string` | Название сайта или сервиса | `"google.com"`, `"vk.com"` |
| `username` | `string` | Ваш логин на этом сервисе | `"ivan@example.com"` |
| `password` | `string` | Пароль (будет зашифрован) | `"MyP@ssw0rd!"` |
| `createdAt` | `Date` | Дата создания записи | `new Date()` |
| `updatedAt` | `Date?` | Дата последнего изменения (может отсутствовать) | `new Date()` |

**Почему `updatedAt` со знаком вопроса?**

`?` означает, что поле **необязательное**. Когда вы только создаёте запись, она ещё не изменялась — поэтому `updatedAt` может быть пустым.

---

### 2. `PasswordOptions` — Настройки генерации пароля

```typescript
export interface PasswordOptions {
  length: number;              // Длина пароля (количество символов)
  includeUppercase?: boolean;  // Использовать заглавные буквы (A-Z)?
  includeLowercase?: boolean;  // Использовать строчные буквы (a-z)?
  includeNumbers?: boolean;    // Использовать цифры (0-9)?
  includeSymbols?: boolean;    // Использовать спецсимволы (!@#$)?
}
```

**Что это такое?**

Настройки для генератора паролей. Позволяют указать, какой пароль вы хотите получить.

**Пример использования:**
```typescript
// Создать короткий пароль только из цифр
const pinCodeOptions: PasswordOptions = {
  length: 4,
  includeNumbers: true,
  includeUppercase: false,
  includeLowercase: false,
  includeSymbols: false
};
// Результат: "7392"

// Создать длинный сложный пароль
const strongOptions: PasswordOptions = {
  length: 20,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true
};
// Результат: "K9#mP$vL2@nQ5*wR8!xZ"
```

**Значения по умолчанию:**

Если не указать необязательные поля (со `?`), используются такие настройки:
```typescript
const DEFAULT_OPTIONS = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true
};
```

---

### 3. `FormField` — Поле формы

```typescript
export interface FormField {
  name: string;        // Техническое имя поля (для программы)
  label: string;       // Название поля (что видит пользователь)
  password?: boolean;  // Это поле для пароля? (скрывать ввод?)
  value?: string;      // Начальное значение (если есть)
}
```

**Что это такое?**

Описание одного поля в форме ввода. Используется, когда программа показывает форму для добавления пароля.

**Пример использования:**
```typescript
// Форма добавления пароля
const formFields: FormField[] = [
  {
    name: 'service',
    label: 'Сервис (например: google.com)'
  },
  {
    name: 'username',
    label: 'Логин / Email'
  },
  {
    name: 'password',
    label: 'Пароль',
    password: true  // Символы будут скрыты звёздочками
  }
];
```

**Как это выглядит на экране:**
```
┌─────────────────────────────────────────┐
│  Сервис (например: google.com):         │
│  [____________________]                 │
│                                         │
│  Логин / Email:                         │
│  [____________________]                 │
│                                         │
│  Пароль:                                │
│  [********************]  ← скрыто!      │
└─────────────────────────────────────────┘
```

---

### 4. `FormResult` — Результат заполнения формы

```typescript
export type FormResult = Record<string, string>;
```

**Что это такое?**

Результат, который возвращает форма после заполнения. Это объект, где:
- **Ключ** — имя поля (тот `name` из `FormField`)
- **Значение** — то, что ввёл пользователь

**Что такое `Record<string, string>`?**

Это короткая запись для "объект с любыми строковыми ключами и строковыми значениями":
```typescript
// Record<string, string> означает:
{
  [key: string]: string
}

// Пример:
const result: FormResult = {
  service: "gmail.com",
  username: "ivan@example.com",
  password: "MySecret123!"
};
```

**Как используется:**
```typescript
// После того как пользователь заполнил форму
const result: FormResult = await ui.showForm('Добавить пароль', fields);

// Получаем значения
const service = result['service'];    // "gmail.com"
const username = result['username'];  // "ivan@example.com"
const password = result['password'];  // "MySecret123!"
```

---

## 🎯 Ключевые концепции TypeScript

### `interface` vs `type`

**Интерфейс (`interface`)** — описывает форму объекта:
```typescript
interface User {
  name: string;
  age: number;
}
```

**Тип (`type`)** — создаёт псевдоним для любого типа:
```typescript
type ID = string;
type FormResult = Record<string, string>;
```

### Необязательные поля (`?`)

Знак `?` после имени поля означает, что оно может отсутствовать:

```typescript
interface User {
  name: string;      // Обязательное
  age?: number;      // Необязательное
}

// Можно создать без age
const user1: User = { name: "Иван" };

// Можно создать с age
const user2: User = { name: "Мария", age: 25 };
```

### `export` — экспорт для использования в других файлах

Ключевое слово `export` делает тип доступным в других файлах:

```typescript
// В файле types/index.ts
export interface PasswordEntry { /* ... */ }

// В другом файле
import type { PasswordEntry } from './types/index.ts';
```

Обратите внимание на `import type` — это особый синтаксис для импорта типов в TypeScript.

---

## 🔄 Связь типов между собой

```
┌─────────────────────────────────────────────────────────────┐
│  PasswordEntry                                              │
│  Описывает: что хранится в базе                             │
│  Содержит: id, service, username, password, createdAt       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ создаётся из
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  FormResult                                               │
│  Описывает: что ввёл пользователь                           │
│  Содержит: service, username, password (без id и дат)       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ заполняется через
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  FormField[]                                               │
│  Описывает: какие поля показать                             │
│  Содержит: настройки для каждого поля ввода                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Полезные примеры

### Создание новой записи пароля

```typescript
import type { PasswordEntry, FormResult } from './types/index.ts';

// Данные от пользователя (из формы)
const formData: FormResult = {
  service: "facebook.com",
  username: "myemail@example.com",
  password: "SecretPass123!"
};

// Создание полной записи
const newEntry: PasswordEntry = {
  id: crypto.randomUUID(),  // Генерируем уникальный ID
  service: formData.service,
  username: formData.username,
  password: formData.password,
  createdAt: new Date()     // Текущая дата и время
};
```

### Проверка наличия необязательного поля

```typescript
import type { PasswordEntry } from './types/index.ts';

function formatEntry(entry: PasswordEntry): string {
  let result = `${entry.service}: ${entry.username}`;
  
  // Проверяем, есть ли updatedAt
  if (entry.updatedAt) {
    result += ` (обновлено: ${entry.updatedAt.toLocaleDateString()})`;
  }
  
  return result;
}
```

---

## 📚 Дополнительные ресурсы

- [TypeScript Handbook — Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [TypeScript Handbook — Types](https://www.typescriptlang.org/docs/handbook/basic-types.html)
- [TypeScript — Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) (Record, Partial и другие)

---

**Теперь вы понимаете, как описываются данные в программе! Переходите к другим папкам, чтобы увидеть, как эти типы используются на практике.**