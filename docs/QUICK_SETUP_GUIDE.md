# Швидкий гайд налаштування календаря

Цей документ призначений для **контент-менеджерів та бізнес-користувачів**, які налаштовують календар через `app-config.json` без зміни коду.

## Зміст

- [Для кого ця документація](#для-кого-ця-документація)
- [Швидкий старт за 5 хвилин](#швидкий-старт-за-5-хвилин)
- [Покрокове налаштування календаря](#покрокове-налаштування-календаря)
- [Валідація конфігурації](#валідація-конфігурації)
- [Чек-лист перед запуском](#чек-лист-перед-запуском)
- [Типові конфігурації](#типові-конфігурації)

---

## Для кого ця документація

### 👥 Цільова аудиторія:

1. **Контент-менеджери** — налаштовують тексти, задачі, зображення
2. **Маркетологи** — створюють промо-кампанії, змінюють дати
3. **Бізнес-користувачі** — керують видимістю секцій, локалізацією
4. **QA-спеціалісти** — тестують календар з різними конфігураціями

### 📚 Інша документація:

| Документ                     | Для кого                       | Що містить                                |
| ---------------------------- | ------------------------------ | ----------------------------------------- |
| `QUICK_SETUP_GUIDE.md` (цей) | Бізнес-користувачі             | Швидке налаштування, валідація, чек-листи |
| `CONFIG_GUIDE.md`            | Контент-менеджери + Розробники | Повний опис всіх параметрів конфігу       |
| `COMPONENTS_API.md`          | Розробники                     | API компонентів, пропси, події            |
| `DEVELOPER_GUIDE.md`         | Розробники                     | Внутрішня архітектура, composables        |
| `TROUBLESHOOTING.md`         | Всі                            | Вирішення проблем                         |
| `DESIGN_TOKENS.md`           | Дизайнери + Розробники         | Стилізація, токени, брейкпоінти           |

---

## Швидкий старт за 5 хвилин

### Крок 1: Відкрийте конфігураційний файл

```bash
src/data/app-config.json
```

### Крок 2: Встановіть дати кампанії

```json
{
  "config": {
    "startDate": "2025-12-01", // Початок календаря
    "endDate": "2025-12-24" // Кінець календаря (24 дні)
  }
}
```

### Крок 3: Перевірте кількість задач

```json
{
  "calendar": {
    "tasks": [
      // Має бути РІВНО 24 задачі (24 дні = 24 задачі)
      { "id": "task-1", "title": {...}, ... },
      { "id": "task-2", "title": {...}, ... },
      // ... ще 22 задачі
    ]
  }
}
```

### Крок 4: Валідуйте конфігурацію

```bash
npm run validate-config
```

**Очікуваний результат:**

```
✓ Configuration is valid
✓ Date range: 2025-12-01 to 2025-12-24 (24 days)
✓ Tasks count: 24 (matches days count)
```

### Крок 5: Запустіть календар

```bash
npm run dev
```

Відкрийте http://localhost:5173 в браузері.

---

## Покрокове налаштування календаря

### 1. Налаштування дат

**Файл:** `src/data/app-config.json`

```json
{
  "config": {
    "startDate": "2025-12-01", // Формат: YYYY-MM-DD
    "endDate": "2025-12-24", // Формат: YYYY-MM-DD
    "timeMode": "local" // "local" або "utc"
  }
}
```

**Правила:**

- `startDate` має бути раніше або дорівнювати `endDate`
- Обидві дати мають бути валідними календарними днями
- Рекомендована довжина: до 92 днів (3 місяці)
- `timeMode`:
  - `"local"` — використовує часовий пояс користувача (рекомендовано для локальних кампаній)
  - `"utc"` — фіксований UTC час (рекомендовано для глобальних кампаній)

**Приклад розрахунку кількості днів:**

```
startDate: 2025-12-01
endDate: 2025-12-24
Кількість днів: 24 (включно)
```

### 2. Налаштування задач

**Критично важливо:** Кількість задач = Кількість днів

```json
{
  "calendar": {
    "tasks": [
      {
        "id": "task-1", // Унікальний ID
        "title": {
          "en": "Daily Bonus", // Англійська (обов'язково)
          "de": "Täglicher Bonus" // Інші мови
        },
        "description": {
          "en": "Claim your daily bonus!"
        },
        "buttonText": {
          "en": "CLAIM BONUS"
        },
        "targetUrl": "https://example.com/bonus" // Опціонально
      }
      // Додайте стільки задач, скільки днів у календарі
    ]
  }
}
```

**Порядок задач:**

- Перша задача (`tasks[0]`) → перший день (`startDate`)
- Друга задача (`tasks[1]`) → другий день (`startDate + 1`)
- І так далі...

**Що станеться, якщо кількість не збігається:**

```bash
# Якщо задач менше, ніж днів:
⚠ Calendar validation: expected 24 tasks for 24 days, found 20.
  Tasks will be repeated cyclically.
  Consider adding 4 tasks or adjust the date range.

# Якщо задач більше, ніж днів:
⚠ Calendar validation: expected 24 tasks for 24 days, found 30.
  Extra tasks will be ignored.
  Consider removing 6 tasks or extending the date range.
```

### 3. Налаштування локалізації

```json
{
  "config": {
    "defaultLanguage": "en",
    "supportedLanguages": ["en", "de", "fr", "it", "es", "pt"]
  }
}
```

**Правила:**

- `defaultLanguage` має бути в списку `supportedLanguages`
- Всі тексти мають мати переклад для кожної мови з `supportedLanguages`
- Якщо переклад відсутній, система використає англійську версію

**Приклад повної локалізації:**

```json
{
  "calendar": {
    "title": {
      "en": "Sports Calendar",
      "de": "Sportkalender",
      "fr": "Calendrier Sportif",
      "it": "Calendario Sportivo",
      "es": "Calendario Deportivo",
      "pt": "Calendário Esportivo"
    }
  }
}
```

### 4. Налаштування видимості UI-секцій

```json
{
  "config": {
    "ui": {
      "introSection": {
        "visible": true, // Показувати заголовок та опис
        "tagLabel": true, // Показувати бейдж "Promotion"
        "title": true, // Показувати заголовок
        "description": true // Показувати опис
      },
      "calendarSection": {
        "visible": true, // Показувати календар
        "tasksPanel": true // Показувати панель з задачами
      },
      "footerSection": {
        "visible": true, // Показувати футер
        "termsButton": true, // Показувати кнопку "Terms"
        "termsModal": {
          "visible": true // Показувати модалку з умовами
        }
      }
    }
  }
}
```

**Використання:**

- Встановіть `false` для секцій, які не потрібні
- Це не вимагає зміни коду, тільки конфігурації

### 5. Налаштування вирівнювання по тижнях

```json
{
  "config": {
    "alignByWeekday": true, // Вирівнювати по днях тижня
    "firstDayOfWeek": "auto" // "auto", "monday" або "sunday"
  }
}
```

**Що це робить:**

- `alignByWeekday: true` — дні вирівнюються по колонках (понеділок завжди в першій колонці)
- `alignByWeekday: false` — дні йдуть послідовно без вирівнювання

**Важливо:**

- Працює тільки на екранах >= 768px (десктоп/планшет)
- На мобільних завжди послідовне відображення

---

## Валідація конфігурації

### Команда валідації

```bash
npm run validate-config
```

### Що перевіряється:

1. **Формат дат:**

   ```
   ✓ startDate is valid: 2025-12-01
   ✓ endDate is valid: 2025-12-24
   ✓ startDate <= endDate
   ```

2. **Довжина періоду:**

   ```
   ✓ Date range: 24 days (within recommended 92 days)
   ```

   або

   ```
   ⚠ Date range: 100 days (exceeds recommended 92 days)
     Consider splitting into multiple campaigns
   ```

3. **Кількість задач:**

   ```
   ✓ Tasks count: 24 (matches 24 days)
   ```

   або

   ```
   ⚠ Tasks count: 20 (expected 24 for 24 days)
     Tasks will be repeated cyclically
   ```

4. **Параметр firstDayOfWeek:**
   ```
   ✓ firstDayOfWeek: "auto" (valid)
   ```

### Приклад успішної валідації:

```bash
$ npm run validate-config

> advent-calendar-vue@1.0.0 validate-config
> node scripts/validate-config.mjs

✓ Configuration is valid
✓ Date range: 2025-12-01 to 2025-12-24 (24 days)
✓ Tasks count: 24 (matches days count)
✓ All supported languages have translations
✓ firstDayOfWeek: "auto" (valid)
✓ timeMode: "local" (valid)

Configuration validation passed! ✨
```

### Приклад валідації з попередженнями:

```bash
$ npm run validate-config

⚠ Configuration has warnings:
  - Tasks count: 20 (expected 24 for 24 days)
    Tasks will be repeated cyclically.
    Consider adding 4 tasks or adjust the date range.

  - Missing translations for "fr" in:
    - calendar.tasks[5].title
    - calendar.tasks[5].description

Configuration is valid but has warnings.
```

---

## Чек-лист перед запуском

### ✅ Обов'язкові перевірки:

- [ ] **Дати налаштовані правильно**
  - `startDate` раніше або дорівнює `endDate`
  - Дати у форматі `YYYY-MM-DD`
  - Обидві дати валідні

- [ ] **Кількість задач = Кількість днів**
  - Порахуйте дні від `startDate` до `endDate` (включно)
  - Перевірте, що `tasks.length` дорівнює кількості днів
  - Запустіть `npm run validate-config`

- [ ] **Всі тексти локалізовані**
  - Кожна мова з `supportedLanguages` має переклади
  - Немає порожніх полів у локалізаціях
  - `defaultLanguage` входить в `supportedLanguages`

- [ ] **Зображення існують**
  - Всі шляхи в `images.banner` вказують на існуючі файли
  - Файли знаходяться в `src/assets/images/`
  - Є WebP версії зображень

- [ ] **URL-адреси правильні**
  - `links.primary` або `tasks[].targetUrl` валідні
  - URL починаються з `http://` або `https://`

### ✅ Рекомендовані перевірки:

- [ ] **Запустіть валідацію**

  ```bash
  npm run validate-config
  ```

- [ ] **Перевірте в браузері**

  ```bash
  npm run dev
  ```

  Відкрийте http://localhost:5173

- [ ] **Протестуйте з різними датами**

  ```
  http://localhost:5173/?testDate=2025-12-01  # Перший день
  http://localhost:5173/?testDate=2025-12-15  # Середина
  http://localhost:5173/?testDate=2025-12-24  # Останній день
  ```

- [ ] **Протестуйте різні мови**

  ```
  http://localhost:5173/?language=en
  http://localhost:5173/?language=de
  http://localhost:5173/?language=fr
  ```

- [ ] **Перевірте на мобільному**
  - Відкрийте DevTools (F12)
  - Увімкніть Device Toolbar (Ctrl+Shift+M)
  - Протестуйте на iPhone, iPad, Android

---

## Типові конфігурації

### 1. Класичний Advent Calendar (24 дні)

```json
{
  "config": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-24",
    "timeMode": "local",
    "alignByWeekday": true,
    "firstDayOfWeek": "auto",
    "defaultLanguage": "en",
    "supportedLanguages": ["en", "de"],
    "ui": {
      "introSection": { "visible": true },
      "calendarSection": { "visible": true, "tasksPanel": true },
      "footerSection": { "visible": true, "termsButton": true }
    }
  },
  "calendar": {
    "tasks": [
      // 24 задачі для 24 днів
    ]
  }
}
```

### 2. Тижнева промо-кампанія (7 днів)

```json
{
  "config": {
    "startDate": "2025-10-20",
    "endDate": "2025-10-26",
    "timeMode": "utc",
    "alignByWeekday": true,
    "firstDayOfWeek": "monday",
    "defaultLanguage": "en",
    "supportedLanguages": ["en"],
    "ui": {
      "introSection": { "visible": true, "tagLabel": true },
      "calendarSection": { "visible": true, "tasksPanel": true },
      "footerSection": { "visible": false }
    }
  },
  "calendar": {
    "tasks": [
      // 7 задач для 7 днів
    ]
  }
}
```

### 3. Мінімальний календар (тільки сітка днів)

```json
{
  "config": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "timeMode": "local",
    "alignByWeekday": false,
    "ui": {
      "introSection": { "visible": false },
      "calendarSection": { "visible": true, "tasksPanel": false },
      "footerSection": { "visible": false }
    }
  },
  "calendar": {
    "tasks": [
      // 30 задач для 30 днів
    ]
  }
}
```

### 4. Глобальна кампанія (UTC, багато мов)

```json
{
  "config": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "timeMode": "utc",
    "alignByWeekday": true,
    "firstDayOfWeek": "auto",
    "defaultLanguage": "en",
    "supportedLanguages": ["en", "de", "fr", "it", "es", "pt"],
    "ui": {
      "introSection": { "visible": true },
      "calendarSection": { "visible": true, "tasksPanel": true },
      "footerSection": { "visible": true, "termsButton": true }
    }
  },
  "calendar": {
    "tasks": [
      // 31 задача для 31 дня
      // Кожна задача має переклади для всіх 6 мов
    ]
  }
}
```

---

## Поширені помилки

### ❌ Помилка 1: Кількість задач не збігається

**Проблема:**

```json
{
  "config": {
    "startDate": "2025-12-01",
    "endDate": "2025-12-24" // 24 дні
  },
  "calendar": {
    "tasks": [
      /* тільки 20 задач */
    ]
  }
}
```

**Рішення:**
Додайте 4 задачі або змініть `endDate` на `2025-12-20`.

### ❌ Помилка 2: Відсутні переклади

**Проблема:**

```json
{
  "config": {
    "supportedLanguages": ["en", "de", "fr"]
  },
  "calendar": {
    "title": {
      "en": "Calendar",
      "de": "Kalender"
      // Відсутня "fr"
    }
  }
}
```

**Рішення:**
Додайте французький переклад:

```json
{
  "title": {
    "en": "Calendar",
    "de": "Kalender",
    "fr": "Calendrier"
  }
}
```

### ❌ Помилка 3: Неправильний формат дат

**Проблема:**

```json
{
  "startDate": "01-12-2025", // Неправильний формат
  "endDate": "2025/12/24" // Неправильний формат
}
```

**Рішення:**
Використовуйте формат `YYYY-MM-DD`:

```json
{
  "startDate": "2025-12-01",
  "endDate": "2025-12-24"
}
```

---

## Корисні команди

```bash
# Валідація конфігурації
npm run validate-config

# Запуск в режимі розробки
npm run dev

# Збірка для продакшену
npm run build

# Перевірка TypeScript типів
npm run type-check

# Лінтинг коду
npm run lint

# Лінтинг стилів
npm run lint:styles

# Форматування коду
npm run format

# Генерація WebP зображень
npm run images:webp

# Генерація дизайн-токенів
npm run tokens:build
```

---

## Наступні кроки

Після налаштування календаря:

1. **Для детальної інформації:** [`CONFIG_GUIDE.md`](CONFIG_GUIDE.md)
2. **Для вирішення проблем:** [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
3. **Для розробників:** [`DEVELOPER_GUIDE.md`](DEVELOPER_GUIDE.md)
4. **Для дизайнерів:** [`DESIGN_TOKENS.md`](DESIGN_TOKENS.md)

**Потрібна допомога?** Перевірте консоль браузера на помилки або зверніться до команди розробки.

