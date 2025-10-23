# Посібник для розробників

Цей документ описує внутрішні механізми календаря та рекомендації щодо розширення функціоналу.

## 1. Компосабли

### 1.1 `createAppConfig` / `useAppConfig`

- **Розташування:** `src/composables/useAppConfig.ts`
- **Призначення:** читає `app-config.json`, нормалізує дані та надає API:
  - `calendarData`, `config`, `calendarDays`, `currentDate`;
  - функції для локалізації (`getLocalizedText`), роботи з датами (`getTaskDate`, `formatTaskDate`, `isToday`, ...);
  - `resolveImg` для перетворення логічних шляхів у URL (працює з Vite glob-імпортами);
  - `resolveTargetUrl` (падіння на `links.primary`).
- **Singleton:** `createAppConfig()` створює інстанс один раз, `useAppConfig()` намагається отримати його через `inject(AppConfigKey)`, а в тестах може створити fallback.
- **Перевірки:** `validateTasksAndDays` попереджає про розбіжність між кількістю задач і довжиною періоду.
- **Поточна дата:** `currentDate` оновлюється кожні 30 с (коли немає `?testDate`), реагує на зміну `timeMode`.

### 1.2 `useLocale`

- **Розташування:** `src/composables/useLocale.ts`
- **Поведінка:** обирає мову за схемою `?language` → `<html lang>` → `defaultLanguage`.
- **Методи:** `currentLanguage` (ref), `setLanguage(lang)` (оновлює `<html lang>`).

### 1.3 `useQueryParams`

- Парсить URL-параметри (language, testDate, debug). Перед редерендером головний composable застосовує їх.

### 1.4 `useMediaQuery`

- Обгортка над `window.matchMedia`; повертає реактивний `ref<boolean>`. Використовується для ввімкнення вирівнювання по тижнях лише на десктопі.

### 1.5 `useTokens`

- Хелпер для читання/зміни CSS-змінних та перемикання тем (`setTheme`).

## 2. Локалізація

- **Базовий набір мов:** `['en', 'de', 'fr', 'it', 'es', 'pt']`.
- **Fallback:** якщо переклад відсутній, система показує англійський.
- **Метадані:** `main.ts` оновлює `<title>` і `<meta name="description">` при зміні мови.
- **Вбудовування в iframe:** усі посилання мають `target="_parent"` (див. `TaskCard.vue`), але значення можна змінити в конфігурації.

## 3. Час та статуси

### 3.1 Налаштування

- `timeMode: 'local'` — день вважається активним, якщо в таймзоні користувача вже настало відповідне число.
- `timeMode: 'utc'` — контроль здійснюється по UTC (рекомендовано для глобальних кампаній).
- `?testDate=YYYY-MM-DD` — примусова дата для QA/демо.

### 3.2 `CalendarDays` + `TaskCard`

- `CalendarContent` при маунті:
  1. скидає `isSelected` для всіх днів;
  2. шукає запис для `currentDate` (або перший день);
  3. синхронізує відображення (виділення дня, скролл до картки).
- Таймер у `TaskCard`:
  - кожні 1 с оновлює `currentTime`;
  - при завершенні змінює статус на `Finished`;
  - для неактивних карток таймер не запускається.
- Стани:
  - **Активна** (сьогодні) — показує таймер і CTA з прямим переходом.
  - **Завершена** (минулі дні) — бейдж “Finished”, кнопка веде на глобальний URL.
  - **Заблокована** (майбутні) — показує дату відкриття, кнопка повертає до поточної задачі.

## 4. Продуктивність

- `CalendarContent` кешує посилання на DOM-елементи (`dayElementsCache`, `cardElementsCache`) для швидкого скролу без повторного пошуку.
- Оновлення активного місяця відбувається в `requestAnimationFrame`, щоб не блокувати скрол.
- Вирівнювання по тижнях (`alignByWeekday`) включається лише на широких екранах (`useMediaQuery('(min-width: 768px)')`).
- Таймер у `TaskCard` очищається через `onScopeDispose`, щоб уникнути витоків при розмонті.

## 5. Рекомендації щодо розширення

1. **Нові типи задач:** додайте поля у `CalendarTask` та розгорніть потрібні гілки у `TaskCard`.
2. **Додаткові події/аналітика:** додайте обробники подій безпосередньо в `CalendarContent.vue` (для кліків по днях) або `TaskCard.vue` (для кліків по кнопках), передавайте дані у зовнішній API.
3. **Підтримка RTL:** поточна реалізація `ltr`. Для RTL — додайте перемикач `dir` у `main.ts` залежно від мови і пропишіть стилі.
4. **Валідації контенту:** скрипт `validate-config` можна доповнити правилами (наприклад, ліміт на довжину опису).
5. **Тестування:** при додаванні Vitest створіть фікстури для `calendarDays` і використовуйте `createAppConfig()` як DI.

## 6. Логування та режим налагодження

- `devLog/devWarn` виводять повідомлення лише у development-оточенні (`import.meta.env.DEV`).
- Консольне попередження “Calendar validation…” служить індикатором розбіжності між кількістю днів та задач — його можна вимкнути, якщо повторення задач є бізнес-вимогою.

## 7. Робота з iframe

- Усі зовнішні посилання мають `target="_parent"` для коректного переходу з iframe.
- Якщо потрібно залишатися в iframe — змініть поведінку `TaskCard.handleButtonClick`.

## 8. Стиль-керівництво

- Використовуйте токени та міксини: `@include font-family(primary)`, `@include text(h3)`, `@include mq(lg)` тощо.
- Нові компоненти слід створювати в `src/components`, підключаючи залежності через `@`.
- Стилі по замовчуванню scoped; глобальні правила додавайте в `src/assets/scss/base.scss`.

---

## 9. Утиліти (`src/utils/`)

Проект містить три ключові утиліти для роботи з датами, HTML-санацією та dev-логуванням.

### 9.1 `dateUtils.ts` - Робота з датами та часом

**Експортовані функції:**

- **`parseYMD(dateStr: string): Date`** - Парсинг дати у форматі YYYY-MM-DD. Повертає Date об'єкт з нульовим часом (00:00:00).
- **`formatYMD(date: Date): string`** - Форматування Date в YYYY-MM-DD. Використовується для порівняння дат.
- **`isSameDay(d1: Date, d2: Date): boolean`** - Перевірка, чи дві дати припадають на один день (ігнорує час).
- **`buildMonthDays(year, month, firstDayOfWeek): CalendarDay[]`** - Генерація масиву днів місяця з плейсхолдерами для вирівнювання сітки по тижням. Використовується в `CalendarContent.vue`.
- **`getFirstDayOfWeekFromLang(lang, config): number`** - Визначення першого дня тижня (0 = неділя, 1 = понеділок) на основі мови користувача та конфігурації календаря.

**Використання:**

```ts
import { parseYMD, formatYMD, isSameDay } from '@/utils/dateUtils'

const date = parseYMD('2025-10-15')
const formatted = formatYMD(new Date()) // "2025-10-23"
const isToday = isSameDay(new Date(), date) // false
```

**Особливості:**

- Всі функції працюють з локальним часом (`Date.prototype.getFullYear()`, `getMonth()`, `getDate()`).
- Для UTC-режиму використовуйте `config.timeMode = 'utc'` у `useAppConfig`.

---

### 9.2 `sanitizeHtml.ts` - Санація HTML

**Експортовані функції:**

- **`sanitizeHtml(html: string, options?): string`** - Очищення HTML від потенційно небезпечних тегів, атрибутів та скриптів.
- **`sanitizeAttribute(text: string): string`** - Очищення значень атрибутів (видаляє всі HTML-теги).

**Використання:**

```ts
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const userInput = '<p>Безпечний HTML</p><script>alert("XSS")</script>'
const safe = sanitizeHtml(userInput)
// Результат: '<p>Безпечний HTML</p>' (script видалено)
```

**Конфігурація:**

- Використовує **DOMPurify** для надійної санації.
- **Дозволені теги:** `p`, `b`, `i`, `strong`, `em`, `br`, `span`.
- **Блокує:** всі події (`on*` атрибути), `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`.
- **Налаштування:** для додавання інших тегів оновіть `ALLOWED_TAGS` у `sanitizeHtml.ts`.

**Де використовується:**

- `TaskCard.vue` - для відображення опису задач (`task.description`).
- Всі користувацькі дані з `app-config.json` проходять через `sanitizeHtml`.

---

### 9.3 `devLog.ts` - Dev-логування

**Експортовані функції:**

- **`devLog(...args: unknown[]): void`** - Логування в dev-режимі з префіксом `[Advent Calendar]`.
- **`devWarn(...args: unknown[]): void`** - Попередження в dev-режимі з префіксом.
- **`devError(...args: unknown[]): void`** - Помилки в dev-режимі з префіксом.

**Використання:**

```ts
import { devLog, devWarn, devError } from '@/utils/devLog'

devLog('Calendar initialized', { daysCount: 25 })
devWarn('Task not found for day', dayNumber)
devError('Invalid configuration', error)
```

**Поведінка:**

- **Development** (`import.meta.env.DEV === true`): виводить в console.
- **Production** (`import.meta.env.DEV === false`): не виводить нічого (оптимізація bundle size).

**Де використовується:**

- `useAppConfig.ts` - попередження про розбіжність кількості задач та днів.
- `CalendarContent.vue` - логування помилок DOM-маніпуляцій.

---

## 10. TypeScript типи (`src/types/`)

Проект використовує суворий TypeScript з повною типізацією всіх даних та API.

### 10.1 `app-config.ts`

**Основні інтерфейси:**

- **`AppConfig`** - корінь конфігураційного файлу (`calendar`, `config`).
- **`CalendarData`** - секція `calendar` з контентом, задачами, зображеннями.
- **`CalendarConfig`** - секція `config` з технічними налаштуваннями (дати, часовий пояс, UI).
- **`CalendarTask`** - опис задачі (id, title, description, buttonText, targetUrl).
- **`CalendarDay`** - день у сітці календаря (day, date, isActive, isSelected, isToday, hasTask).
- **`LocalizedText`** - обʼєкт з перекладами (`{ en: string, de?: string, ... }`).
- **`UseCalendarReturn`** - тип повернення `useAppConfig()` (всі методи та реактивні дані).

**Особливості:**

- Всі поля `LocalizedText` є опціональними, крім `en` (fallback мова).
- `CalendarDay.isPlaceholder` - маркер для placeholder-елементів у сітці (не відображаються на мобільних).

---

### 10.2 `design.ts`

**Інтерфейси для дизайн-токенів:**

- **`DesignTokens`** - типізація `tokens.json` (themes, meta, version).
- **`TokenTheme`** - структура теми (color, gradient, typography, spacing, тощо).
- **`RuntimeTokenCategories`** - категорії токенів для генерації CSS-змінних.

**Використання:**

- `build-tokens.ts` - скрипт генерації `tokens.css` з типізацією.
- `useTokens.ts` - composable для роботи з CSS-змінними.

---

### 10.3 `errors.ts`

**Типи помилок:**

- **`AppError`** - базовий клас для всіх помилок проекту.
- **`ValidationError`** - помилки валідації конфігурації.
- **`ConfigError`** - помилки завантаження або парсингу `app-config.json`.

**Використання:**

- `useErrorHandler.ts` - centralized error handling.
- `validate-config.mjs` - скрипт валідації конфігу.

---

### 10.4 `validation.ts`

**Інтерфейси для валідації:**

- **`ValidationResult`** - результат валідації (`isValid`, `errors[]`).
- **`ConfigValidationRules`** - правила валідації для `app-config.json`.

**Використання:**

- `scripts/validate-config.mjs` - скрипт для перевірки конфігу перед збіркою.

---

## 11. Dependency Injection та Symbols (`src/symbols/`)

Проект використовує Vue 3 Provide/Inject API для передачі глобальних залежностей.

### 11.1 `app-config.ts`

**Експорт:**

```ts
export const AppConfigKey: InjectionKey<UseCalendarReturn> = Symbol('AppConfig')
```

**Призначення:**

- Ключ для `provide`/`inject` у Vue 3.
- Використовується для передачі `useAppConfig()` від `App.vue` до дочірніх компонентів.

**Використання:**

**В `App.vue` (provide):**

```ts
import { provide } from 'vue'
import { AppConfigKey } from '@/symbols/app-config'
import { createAppConfig } from '@/composables/useAppConfig'

const calendarApi = createAppConfig()
provide(AppConfigKey, calendarApi)
```

**В компонентах (inject):**

```ts
import { inject } from 'vue'
import { AppConfigKey } from '@/symbols/app-config'

const calendar = inject(AppConfigKey)
if (!calendar) throw new Error('Calendar not provided')
```

**Переваги:**

- Типобезпека завдяки `InjectionKey<T>`.
- Централізований singleton для `useAppConfig()`.
- Легке тестування (мокаємо через `provide` у тестах).

---

Дотримання цих рекомендацій забезпечить стабільну роботу календаря та просту підтримку команди у майбутніх релізах.
