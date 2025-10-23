# Архітектура SCSS

> **Повний гайд по системі SCSS, дизайн-токенах та архітектурі стилів проекту Advent Calendar.**

---

## Зміст

1. [Огляд](#огляд)
2. [Структура файлів](#структура-файлів)
3. [Основні файли](#основні-файли)
4. [CSS Runtime змінні vs SCSS токени](#css-runtime-змінні-vs-scss-токени)
5. [Робота з Runtime токенами](#робота-з-runtime-токенами)
6. [Робота з SCSS токенами](#робота-з-scss-токенами)
7. [Правила стилізації](#правила-стилізації)
8. [Поширені помилки](#поширені-помилки)
9. [Довідник команд](#довідник-команд)

---

## Огляд

Проект використовує **гібридний підхід**, що поєднує:

- **CSS Custom Properties (Runtime токени)** - для динамічної темізації та значень, які можуть змінюватися в runtime
- **SCSS змінні та міксіни (Compile-time токени)** - для статичних значень дизайн-системи, розрахунків та адаптивного дизайну

**Ключовий принцип:** CSS змінні для темізації, SCSS для логіки та масштабування.

### Як SCSS інжектується

Всі SCSS токени, функції та міксіни **автоматично доступні** в кожному компоненті через конфігурацію Vite:

```ts
// vite.config.ts
css: {
  preprocessorOptions: {
    scss: {
      additionalData: `@use "@/assets/scss/core" as *;`,
    },
  },
}
```

**Вам ніколи не потрібно імпортувати** `@use "@/assets/scss/..."` в файлах компонентів - воно вже там!

---

## Структура файлів

```
src/
├── assets/scss/                    # SCSS архітектура
│   ├── core.scss                   # 🔧 Vite injection (токени + utils)
│   ├── base.scss                   # 🎨 Базові стилі документу
│   ├── responsive.scss             # 📱 Адаптивна система rem
│   ├── main.scss                   # 🌍 Глобальні стилі проекту
│   ├── tokens/                     # 📊 Токени дизайн-системи
│   │   ├── _index.scss             # Експорт всіх токенів
│   │   ├── _breakpoints.scss       # Адаптивні брейкпоінти
│   │   ├── _design.scss            # Дизайн-константи
│   │   ├── _motion.scss            # Токени анімацій
│   │   └── _type.scss              # Типографічна шкала
│   └── utils/                      # 🛠️ Функції та міксіни
│       ├── _index.scss             # Експорт всіх utils
│       ├── functions/              # SCSS функції
│       │   ├── _index.scss
│       │   ├── _motion.scss        # Розрахунки motion
│       │   ├── _tokens.scss        # Доступ до токенів
│       │   ├── _typography.scss    # Типографічні хелпери
│       │   ├── _units.scss         # Конвертація одиниць (rem, em)
│       │   └── _viewport.scss      # Viewport розрахунки (dvh, svh)
│       └── mixins/                 # SCSS міксіни
│           ├── _index.scss
│           ├── _media.scss         # Media query хелпери
│           ├── _motion.scss        # Міксіни анімацій
│           ├── _text.scss          # Текстові пресети
│           └── _type-helpers.scss  # Типографічні утиліти
│
└── design/                         # Runtime дизайн-токени
    ├── tokens.json                 # 📝 ДЖЕРЕЛО ІСТИНИ
    ├── tokens.css                  # 🤖 Автогенерація CSS змінних
    ├── design-tokens.d.ts          # 🤖 Автогенерація TypeScript типів
    └── design-tokens.ts            # Runtime утиліти токенів
```

---

## Основні файли

### `core.scss` - Глобальна інжекція

**Призначення:** Централізований доступ до токенів, функцій та міксінів для Vite injection.

**Вміст:**

- Імпортує всі токени
- Імпортує всі функції
- Імпортує всі міксіни
- Форвардить все для глобального доступу

**Важливо:** Цей файл **НЕ містить CSS** - лише SCSS змінні, функції та міксіни.

```scss
// Автоматично доступно у всіх компонентах через Vite
@use './tokens' as *;
@use './utils/functions' as *;
@use './utils/mixins' as *;
```

---

### `base.scss` - Основа документу

**Призначення:** Базові стилі для HTML документу.

**Містить:**

- CSS reset (`*`, `*::before`, `*::after`)
- Стилі `body` (шрифт, кольори, згладжування)
- Стилі `#app` (layout, flexbox)
- Utility класи (`.sr-only`, `.scroll-lock`)

**Використання:** Імпортується в `main.scss`, завантажується глобально один раз.

```scss
// Застосовується до всього документу
body {
  min-height: 100vh;
  line-height: typography(line-height, loose);
  background-color: var(--color-layer-1);
  color: var(--color-text-primary);

  @include font-family(primary);
  @include font-size(base);
}
```

---

### `responsive.scss` - Адаптивне масштабування

**Призначення:** Адаптивна система розмірів шрифтів через `rem` одиниці.

**Як працює:**

- Встановлює root `font-size` на різних брейкпоінтах
- Всі `rem` одиниці масштабуються пропорційно
- Можна вимкнути, закоментувавши імпорт у `main.scss`

```scss
html {
  font-size: to-rem(size(base)); // 16px

  @include mq(lg) {
    font-size: to-rem(size(sm)); // 14px
  }

  @include mq(xl) {
    font-size: to-rem(size(base)); // 16px
  }

  @include mq(ultra) {
    font-size: to-rem(26px); // 4K дисплеї
  }
}
```

---

### `main.scss` - Проектні стилі

**Призначення:** Глобальні стилі для сторінок та компонентів верхнього рівня.

**Зараз:** В основному порожній (проект використовує scoped стилі компонентів).

**Використовувати для:**

- Стилів рівня сторінки
- Глобальних компонентів layout
- Проектних utility класів

**НЕ використовувати для:**

- Стилів конкретних компонентів (використовуйте `<style scoped>`)
- Базових стилів документу (вони в `base.scss`)

---

### `tokens/` - Токени дизайн-системи

Статичні значення дизайн-системи для розрахунків та консистентності.

| Файл                | Призначення                                  | Доступ через                                   |
| ------------------- | -------------------------------------------- | ---------------------------------------------- |
| `_breakpoints.scss` | Адаптивні брейкпоінти (sm, md, lg, xl, etc.) | `@include mq(lg)`                              |
| `_design.scss`      | Дизайн-константи (висоти, розміри)           | `size(base)`, `design(height-mobile)`          |
| `_motion.scss`      | Тривалості та easing анімацій                | `duration(fast)`, `ease(in-out)`               |
| `_type.scss`        | Типографічна шкала та пресети                | `typography(scale, base)`, `@include text(h1)` |

---

### `utils/` - Функції та міксіни

Потужні SCSS утиліти для адаптивного дизайну та розрахунків.

#### Функції

```scss
// Конвертація одиниць
to-rem(16px)          // Конвертує px в rem
to-em(16px, 14px)     // Конвертує px в em (з контекстом)

// Viewport одиниці
to-dvh(500px)         // Конвертує px в dvh (dynamic viewport)
to-svh(500px)         // Конвертує px в svh (static viewport)
to-percent-x(750px)   // Конвертує px в vw (viewport width %)
to-percent-y(1334px)  // Конвертує px в vh (viewport height %)

// Доступ до токенів
typography(scale, base)           // 16px
typography(line-height, loose)    // 1.6
duration(fast)                    // 200ms
ease(in-out)                      // cubic-bezier(...)
size(base)                        // 16px
```

#### Міксіни

```scss
// Media queries (mobile-first)
@include mq(lg) { ... }           // min-width: 768px
@include mq(lg, 'down') { ... }   // max-width: 767px
@include mq(600px, 1024px) { ... } // діапазон

// Типографіка
@include font-family(primary);    // Застосувати font family
@include font-size(base);         // Застосувати font size
@include text(h1);                // Застосувати текстовий пресет

// Motion
@include transition(all);         // Стандартний transition
@include motion-duration(fast);   // Тривалість анімації
```

---

## CSS Runtime змінні vs SCSS токени

### Коли використовувати CSS змінні (`var(--...)`)

**Джерело:** `src/design/tokens.json` → `src/design/tokens.css`

**Використовуйте для:**

- ✅ Кольорів, градієнтів, тіней
- ✅ Значень, які змінюються в runtime
- ✅ Перемикання тем (`[data-theme="..."]`)
- ✅ Значень, які можна змінювати через JavaScript

**Приклади:**

```scss
.component {
  background-color: var(--color-layer-1);
  color: var(--color-text-primary);
  background: var(--gradient-secondary);
}
```

**Зміна в runtime:**

```ts
import { useTokens } from '@/composables/useTokens'

const { setToken, setTheme } = useTokens()

// Змінити тему
setTheme('alpa-dark')

// Перевизначити токен
setToken('color-text-primary', '#ffffff')
```

---

### Коли використовувати SCSS токени

**Джерело:** `src/assets/scss/tokens/*.scss`

**Використовуйте для:**

- ✅ Типографіки (розміри шрифтів, line heights, ваги)
- ✅ Брейкпоінтів та media queries
- ✅ Motion (тривалості, easing)
- ✅ Розрахунків та конвертацій
- ✅ Дизайн-констант (grid, spacing scales)

**Приклади:**

```scss
.component {
  // Типографіка
  @include font-family(primary);
  @include font-size(base);
  line-height: typography(line-height, loose);

  // Адаптивність
  padding: to-rem(16px);

  @include mq(lg) {
    padding: to-rem(24px);
  }

  // Motion
  @include transition(all);
  transition-duration: duration(fast);
}
```

---

## Робота з Runtime токенами

### Вихідний файл: `tokens.json`

Всі runtime токени визначені в одному JSON файлі:

```json
{
  "version": "1.0.0",
  "themes": {
    "alpa-dark": {
      "color": {
        "layer": {
          "1": "#000A12"
        },
        "text": {
          "primary": "#FFFFFF"
        }
      },
      "gradient": {
        "secondary": "linear-gradient(90deg, #2E0F6C 0%, #712DF5 100%)"
      },
      "typography": {
        "heading": {
          "h1": { "size": "32px", "lineHeight": 1.25 }
        }
      }
    }
  },
  "meta": {
    "source": "Figma (Alpa [dark])",
    "runtime": {
      "categories": ["color", "gradient"],
      "allow": [],
      "deny": []
    }
  }
}
```

#### Розуміння `meta.runtime`

Секція `meta.runtime` контролює **які токени генеруються як CSS змінні**:

**`categories`** - Кореневі ключі для генерації як CSS змінних:

```json
"categories": ["color", "gradient"]
```

- ✅ `color.*` → генерує `--color-*` CSS змінні
- ✅ `gradient.*` → генерує `--gradient-*` CSS змінні
- ❌ `typography.*` → **НЕ генерується** (використовуйте SCSS токени)

**Доступні категорії** (можна додати будь-який кореневий ключ):

| Категорія    | Приклад                        | Випадок використання              |
| ------------ | ------------------------------ | --------------------------------- |
| `color`      | `--color-layer-1`              | Кольори теми                      |
| `gradient`   | `--gradient-secondary`         | Градієнти теми                    |
| `typography` | `--typography-heading-h1-size` | Динамічні розміри шрифтів (рідко) |
| `spacing`    | `--spacing-md`                 | Відступи залежні від теми         |
| `shadow`     | `--shadow-card`                | Тіні залежні від теми             |
| `border`     | `--border-radius`              | Рамки залежні від теми            |

**Чому розділяти SCSS та CSS?**

- **CSS змінні** (через `categories`) - для значень, які змінюються з темами або в runtime
- **SCSS токени** - для статичних значень дизайн-системи (типографіка, брейкпоінти, motion)

**`allow` / `deny`** - Детальний контроль (опціонально):

```json
"runtime": {
  "categories": ["color", "gradient"],
  "allow": ["color.text"],           // Тільки color.text.* → CSS vars
  "deny": ["color.tertiary"]         // Виключити color.tertiary.* з CSS vars
}
```

- `allow` - Явний whitelist (якщо встановлено, генеруються лише ці шляхи)
- `deny` - Явний blacklist (має пріоритет над categories та allow)

**Поточна конфігурація оптимальна:**

```json
"categories": ["color", "gradient"]
```

Це генерує лише значення залежні від теми як CSS змінні, зберігаючи типографіку та інші статичні токени в SCSS для кращої продуктивності.

### Процес збірки

**Автоматична збірка:**

```bash
npm run dev      # Запускає tokens:build перед dev сервером
npm run build    # Запускає tokens:build перед production збіркою
```

**Ручна збірка:**

```bash
npm run tokens:build    # Одноразова збірка
npm run tokens:watch    # Watch режим (пересборка при змінах)
npm run tokens:docs     # Генерація документації токенів
```

**Вихідні файли:**

- `src/design/tokens.css` - CSS custom properties
- `src/design/design-tokens.d.ts` - TypeScript типи

### Згенерований CSS

```css
/* Автогенерація з tokens.json */
:root {
  --color-layer-1: #0a0e27;
  --color-text-primary: #ffffff;
  --gradient-secondary: linear-gradient(...);
}

/* Перевизначення теми */
[data-theme='alpa-dark'] {
  --color-layer-1: #1a1e37;
}
```

### Перемикання теми

Застосуйте тему через атрибут `data-theme`:

```ts
// В setup або lifecycle hook
document.documentElement.setAttribute('data-theme', 'alpa-dark')
```

Або використовуйте composable:

```ts
import { useTokens } from '@/composables/useTokens'

const { setTheme } = useTokens()
setTheme('alpa-dark')
```

---

## Робота з SCSS токенами

### Імпорти не потрібні

Всі SCSS токени, функції та міксіни **автоматично доступні** через Vite injection.

**❌ Не робіть так:**

```scss
@use '@/assets/scss/tokens' as *; // Не потрібно!
@use '@/assets/scss/utils/mixins' as *; // Не потрібно!
```

**✅ Просто використовуйте:**

```scss
.component {
  @include font-family(primary); // Працює автоматично
  padding: to-rem(16px); // Працює автоматично
}
```

### Приклади типографіки

```scss
.heading {
  // Застосувати font family
  @include font-family(primary);

  // Застосувати font size
  @include font-size(xl);

  // Застосувати line height
  line-height: typography(line-height, normal);

  // Застосувати повний текстовий пресет
  @include text(h1);

  // Або кастомізувати пресет
  @include text(h1, $weight: weight(bold));
}
```

### Приклади адаптивності

```scss
.container {
  padding: to-rem(16px);

  // Планшет landscape (≥768px)
  @include mq(lg) {
    padding: to-rem(24px);
  }

  // Малий десктоп (≥1024px)
  @include mq(xl) {
    padding: to-rem(32px);
  }

  // Max-width (тільки мобільний, <768px)
  @include mq(lg, 'down') {
    padding: to-rem(12px);
  }

  // Кастомний діапазон
  @include mq(600px, 1024px) {
    padding: to-rem(20px);
  }
}
```

### Приклади viewport одиниць

```scss
.hero {
  // Dynamic viewport height (адаптується до UI мобільного браузера)
  height: to-dvh(500px);

  // Viewport width percentage
  width: to-percent-x(750px); // На основі ширини дизайну

  // Кастомний контекст висоти дизайну
  padding-top: to-dvh(100px, $design-height-desktop);
}
```

### Приклади motion

```scss
.button {
  // Стандартний transition
  @include transition(all);

  // Кастомні властивості
  @include transition(background-color, opacity);

  // Тривалість
  transition-duration: duration(fast); // 200ms
  transition-timing-function: ease(in-out);

  &:hover {
    transform: scale(1.05);
  }
}
```

---

## Правила стилізації

### Методологія BEM

Використовуйте BEM (Block Element Modifier) з `&` вкладенням:

```scss
.calendar {
  // Стилі блоку

  &__header {
    // Елемент: заголовок календаря
  }

  &__day {
    // Елемент: день календаря

    &--active {
      // Модифікатор: активний день
    }

    &--disabled {
      // Модифікатор: вимкнений день
    }
  }
}
```

### Підхід Mobile-First

Пишіть базові стилі для мобільних, потім покращуйте для великих екранів:

```scss
.component {
  // Мобільні стилі (за замовчуванням)
  padding: to-rem(12px);
  font-size: to-rem(14px);

  // Планшет і більше
  @include mq(md) {
    padding: to-rem(16px);
  }

  // Десктоп і більше
  @include mq(xl) {
    padding: to-rem(24px);
    font-size: to-rem(16px);
  }
}
```

### Уникайте глибокої вкладеності

**Максимум 3 рівні вкладеності:**

```scss
// ✅ Добре
.block {
  &__element {
    &--modifier {
      // Макс 3 рівні
    }
  }
}

// ❌ Погано
.block {
  &__element {
    &--modifier {
      .nested {
        .too-deep {
          // Занадто глибоко!
        }
      }
    }
  }
}
```

### Scoping компонентів

Використовуйте `<style scoped>` у Vue компонентах:

```vue
<style scoped lang="scss">
  .component-name {
    // Стилі специфічні для компонента
    // Автоматично scoped до цього компонента
  }
</style>
```

### Не дублюйте базові стилі

**❌ Не робіть так у компонентах:**

```scss
body {
  font-family: 'Rubik', sans-serif; // Вже є в base.scss
}

#app {
  display: flex; // Вже є в base.scss
}
```

**✅ Робіть так:**

```scss
.your-component {
  // Лише стилі специфічні для компонента
}
```

---

## Поширені помилки

### 1. Ручний імпорт SCSS файлів

**❌ Неправильно:**

```scss
@use '@/assets/scss/core' as *;
@use '@/assets/scss/utils/mixins' as *;
```

**✅ Правильно:**

```scss
// Нічого! Воно авто-інжектується через Vite
.component {
  @include mq(lg) { ... } // Просто використовуйте
}
```

---

### 2. Змішування CSS змінних та SCSS токенів

**❌ Неправильно:**

```scss
.component {
  font-size: var(--font-size-base); // Має бути SCSS
  background: typography(scale, base); // Має бути CSS var
}
```

**✅ Правильно:**

```scss
.component {
  font-size: to-rem(typography(scale, base)); // SCSS для типографіки
  background: var(--color-layer-1); // CSS var для темізації
}
```

---

### 3. Забування збудувати токени

**Симптоми:**

- Відсутні CSS змінні
- Тема не працює
- TypeScript помилки для типів токенів

**Рішення:**

```bash
npm run tokens:build
```

**Профілактика:** Токени автоматично збираються при `npm run dev` та `npm run build`

---

### 4. Використання px замість rem

**❌ Неправильно:**

```scss
.component {
  padding: 16px; // Не адаптивно
  font-size: 14px; // Не масштабується
}
```

**✅ Правильно:**

```scss
.component {
  padding: to-rem(16px); // Масштабується з root font-size
  @include font-size(base); // Використовує дизайн-систему
}
```

---

### 5. Хардкод брейкпоінтів

**❌ Неправильно:**

```scss
@media (min-width: 768px) {
  .component {
    // ...
  }
}
```

**✅ Правильно:**

```scss
@include mq(lg) {
  .component {
    // ...
  }
}
```

---

## Довідник команд

### Розробка

```bash
# Запустити dev сервер (автозбірка токенів)
npm run dev

# Збудувати токени вручну
npm run tokens:build

# Watch токенів для змін
npm run tokens:watch

# Згенерувати документацію токенів
npm run tokens:docs
```

### Збірка

```bash
# Production збірка (автозбірка токенів)
npm run build

# Попередній перегляд production збірки
npm run preview
```

### Linting та форматування

```bash
# Lint TypeScript та Vue файлів
npm run lint

# Lint SCSS файлів
npm run lint:styles

# Форматувати всі файли
npm run format

# Перевірити форматування
npm run format:check
```

### Валідація

```bash
# Валідувати app-config.json
npm run validate-config

# Type check
npm run type-check
```

---

## Швидка довідкова картка

| Потреба            | Використати  | Приклад                          |
| ------------------ | ------------ | -------------------------------- |
| **Колір/Градієнт** | CSS змінна   | `var(--color-text-primary)`      |
| **Розмір шрифту**  | SCSS міксін  | `@include font-size(base)`       |
| **Line height**    | SCSS функція | `typography(line-height, loose)` |
| **Адаптивність**   | SCSS міксін  | `@include mq(lg) { ... }`        |
| **px → rem**       | SCSS функція | `to-rem(16px)`                   |
| **px → dvh**       | SCSS функція | `to-dvh(500px)`                  |
| **Анімація**       | SCSS міксін  | `@include transition(all)`       |
| **Зміна теми**     | JS/TS        | `setTheme('alpa-dark')`          |
| **Збірка токенів** | npm скрипт   | `npm run tokens:build`           |

---

## Підсумок найкращих практик

1. ✅ **Використовуйте CSS змінні для темізації** (кольори, градієнти)
2. ✅ **Використовуйте SCSS токени для дизайн-системи** (типографіка, відступи, брейкпоінти)
3. ✅ **Використовуйте міксіни для загальних патернів** (адаптивність, типографіка, motion)
4. ✅ **Використовуйте функції для розрахунків** (rem, viewport одиниці)
5. ✅ **Mobile-first адаптивний дизайн** з `@include mq()`
6. ✅ **Методологія BEM** з `&` вкладенням (макс 3 рівні)
7. ✅ **Scoped стилі компонентів** з `<style scoped>`
8. ✅ **Автозбірка токенів** при dev/build (або вручну `npm run tokens:build`)
9. ✅ **Ніколи не імпортуйте SCSS файли** в компонентах (авто-інжекція)
10. ✅ **Валідуйте конфіг** з `npm run validate-config`

---

**Для питань або уточнень, звертайтеся до:**

- `docs/DESIGN_TOKENS.md` - Деталі runtime токенів
- `src/assets/scss/README.md` - Швидка довідка файлів
- `docs/DEVELOPER_GUIDE.md` - Загальний гайд розробника
