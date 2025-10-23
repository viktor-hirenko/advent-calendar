# Архітектура SCSS

> **Швидка довідка структури SCSS файлів. Для повної документації див. [`docs/SCSS_ARCHITECTURE.md`](../../../docs/SCSS_ARCHITECTURE.md).**

---

## Призначення файлів

| Файл                  | Призначення                                        | Імпортується в |
| --------------------- | -------------------------------------------------- | -------------- |
| **`core.scss`**       | Глобальна інжекція через Vite (токени + utils)     | Vite config    |
| **`base.scss`**       | Базові стилі документу (html/body/#app, utilities) | main.scss      |
| **`responsive.scss`** | Адаптивна система rem розмірів                     | main.scss      |
| **`main.scss`**       | Глобальні проектні стилі (рівень сторінки)         | main.ts        |
| **`tokens/`**         | Токени дизайн-системи (брейкпоінти, type, motion)  | core.scss      |
| **`utils/`**          | Функції та міксіни (mq, rem, dvh, text)            | core.scss      |

---

## Ключові концепції

### Авто-інжекція через Vite

Всі токени, функції та міксіни **автоматично доступні** в кожному компоненті:

```scss
// ❌ Не імпортуйте вручну
@use '@/assets/scss/core' as *;

// ✅ Просто використовуйте
.component {
  @include mq(lg) {
    padding: to-rem(16px);
  }
}
```

### CSS змінні vs SCSS токени

- **CSS змінні** (`var(--color-text-primary)`) - для темізації та runtime змін
- **SCSS токени** (`@include font-size(base)`) - для дизайн-системи та розрахунків

---

## Швидкі приклади

### Адаптивний дизайн

```scss
.component {
  padding: to-rem(12px);

  @include mq(lg) {
    padding: to-rem(24px);
  }
}
```

### Типографіка

```scss
.heading {
  @include font-family(primary);
  @include font-size(xl);
  line-height: typography(line-height, normal);
}
```

### Кольори та темізація

```scss
.card {
  background-color: var(--color-layer-1);
  color: var(--color-text-primary);
}
```

---

## Команди

```bash
npm run dev           # Автозбірка токенів, запуск dev сервера
npm run tokens:build  # Вручну збудувати дизайн-токени
npm run tokens:watch  # Watch токенів для змін
npm run lint:styles   # Lint SCSS файлів
```

---

## Дерево файлів

```
scss/
├── core.scss              # Vite injection (токени + utils)
├── base.scss              # Основа документу
├── responsive.scss        # Адаптивна система rem
├── main.scss              # Глобальні проектні стилі
├── tokens/                # Токени дизайн-системи
│   ├── _index.scss        # Експорт всього
│   ├── _breakpoints.scss  # Адаптивні брейкпоінти
│   ├── _design.scss       # Дизайн-константи
│   ├── _motion.scss       # Токени анімацій
│   └── _type.scss         # Типографічна шкала
└── utils/                 # Функції та міксіни
    ├── _index.scss        # Експорт всього
    ├── functions/         # SCSS функції
    │   ├── _motion.scss
    │   ├── _tokens.scss
    │   ├── _typography.scss
    │   ├── _units.scss
    │   └── _viewport.scss
    └── mixins/            # SCSS міксіни
        ├── _media.scss
        ├── _motion.scss
        ├── _text.scss
        └── _type-helpers.scss
```

---

**Для повної документації див. [`docs/SCSS_ARCHITECTURE.md`](../../../docs/SCSS_ARCHITECTURE.md).**
