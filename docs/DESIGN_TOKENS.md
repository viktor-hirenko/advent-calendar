# Дизайн-система та токени

## 1. Джерело правди
- **Файл конфігурації**: `src/design/tokens.json`
- **Згенеровані файли**: `src/design/tokens.css` (CSS-змінні) та `src/design/design-tokens.d.ts` (типи)
- **Головний SCSS вхід**: `src/assets/scss/globals.scss` автоматично підтягується через `vite.config.ts` у кожен компонент

Оновлення токенів виконується командою:
```bash
npm run tokens:build
```

## 2. Тема `alpa-dark`
Наразі підтримується одна тема — `alpa-dark`. Перемикання відбувається через атрибут `data-theme="alpa-dark"` на `<html>` (або будь-якому батьківському елементі).

### 2.1 Кольори

| Токен | CSS-змінна | Призначення |
|-------|------------|-------------|
| `color.layer.1` | `--color-layer-1` | Головний фон додатку |
| `color.layer.alt-1` | `--color-layer-alt-1` | Альтернативні панелі/картки |
| `color.text.primary` | `--color-text-primary` | Основний текст |
| `color.text.secondary` | `--color-text-secondary` | Вторинний текст, підписи |
| `color.text.menu.default` | `--color-text-menu-default` | Неактивні елементи меню |
| `color.text.menu.active` | `--color-text-menu-active` | Активний пункт меню/заголовок |
| `color.button.primary` | `--color-button-primary` | Фон активних кнопок |
| `color.button.secondary` | `--color-button-secondary` | Фон вторинних кнопок / бейджів |
| `color.button.tertiary` | `--color-button-terтиary` | Акцентні кнопки/хайлайти |
| `color.button.text.*` | `--color-button-text-*` | Колір тексту на відповідних кнопках |
| `color.notif.successfully` | `--color-notif-successfully` | Стан «успішно» (таймер) |
| `color.notif.error` | `--color-notif-error` | Стан «завершено» |

### 2.2 Градієнти
- `--gradient-secondary`: фон банера й карток у різних станах.
- `--gradient-card`: підложка активної задачі.
- `--gradient-button-primary`: фон CTA/кнопок.

Використовуйте їх як `background: var(--gradient-card);`.

### 2.3 Типографіка
| Стиль | Шрифт | Вага | Розмір | Лідінг |
|-------|-------|------|--------|--------|
| `heading.h1` | Rubik | 700 | 32px | 1.25 |
| `heading.h3` | Rubik | 700 | 20px | 1.0 |
| `body.regular` | Rubik | 400 | 16px | 1.5 |
| `body.bold` | Rubik | 700 | 16px | 1.25 |
| `button.small` | Roboto Slab | 900 | 14px | 1.7 |
| `caption.tinyBold` | Rubik | 700 | 9px | 1.8 |

Для доступу до значень використовуйте mixin `@include text(...)` та функції з `src/assets/scss/utils`.

### 2.4 Брекпоїнти
Файл `src/assets/scss/tokens/_breakpoints.scss` оголошує мобайл-фьорст брекпоїнти:
```
sm: 375px  (малий мобільний)
md: 600px  (планшет портрет)
lg: 768px  (планшет ландшафт)
xl: 1024px (малий десктоп)
xxl: 1280px
xxxl: 1440px
ultra: 2880px (4K/ультраширокі)
```

Міксин `@include mq(lg)` використовуйте для `min-width`, а `@include mq(lg, 'down')` — для `max-width`.

## 3. Використання токенів
```scss
.calendar__title {
  color: var(--color-text-primary);
  background: var(--gradient-secondary);
  @include text(h1, $weight: weight(bold));
}

.task-card--active {
  background: var(--gradient-card);
  color: var(--color-text-primary);
}
```

### Через composable `useTokens`
```ts
import { useTokens } from '@/composables/useTokens'

const { var: cssVar, setTheme } = useTokens()

const style = {
  backgroundColor: cssVar('color-layer-1'),
}
setTheme('alpa-dark')
```

## 4. Адаптивність та рух
- Міксини для руху/анімацій: `@include transition`, `@include motion-duration(...)` у `utils/mixins/_motion.scss`.
- Функції для `rem`/`vw/vh`: див. `utils/functions/_units.scss`, `utils/functions/_viewport.scss`.
- У SCSS включено `to-rem`, `to-percent-x/y`, `to-dvh`, що повторюють розрахунки з макета.

## 5. Кастомізація
1. Оновіть `src/design/tokens.json`.
2. Запустіть:
   ```bash
   npm run tokens:build
   npm run tokens:docs   # опційно, щоб згенерувати Markdown-довідник
   ```
3. Для зміни теми на проєкті встановіть `data-theme`:
   ```js
   document.documentElement.setAttribute('data-theme', 'alpa-dark')
   ```
4. Тимчасово змінити значення токена можна через `useTokens().setToken('color-text-primary', '#fff')`.

Памʼятайте, що всі SCSS-файли автоматично отримують доступ до токенів завдяки `additionalData` у `vite.config.ts`, тож не потрібно вручну імпортувати `globals.scss` у кожен компонент.
