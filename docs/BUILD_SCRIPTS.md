# Скрипти та інструменти збірки

## 1. Node.js та вимоги
- Вимога до середовища: Node.js `^20.19.0` або `>=22.12.0`.
- Усі команди виконуються з кореня репозиторію.

## 2. Основні npm-скрипти

| Команда | Призначення |
|---------|-------------|
| `npm run dev` | Запуск Vite у режимі розробки. Перед цим виконується `predev` (генерація токенів). |
| `npm run build` | Продакшен-збірка. Виконує `vue-tsc --build` і `vite build` паралельно (`npm-run-all2`) + `prebuild` (оптимізація зображень та токенів). |
| `npm run preview` | HTTP-сервер із результатом збірки (`dist`). |
| `npm run build-only` | Чиста збірка без перевірки типів. |
| `npm run type-check` | Статичний аналіз `.ts` і `.vue` через `vue-tsc`. |
| `npm run lint` | ESLint з автофіксом (JS/TS/Vue). |
| `npm run lint:styles` | Stylelint для `.scss` та `.vue`. |
| `npm run lint:comments` | Перевірка коментарів на відсутність кирилиці (warning mode). |
| `npm run lint:comments:strict` | Те саме, але з помилкою, якщо інциденти знайдені (для CI). |
| `npm run check` | Комбінує `lint` + `lint:comments`. |
| `npm run format` / `npm run format:check` | Prettier для уніфікації форматування. |
| `npm run validate-config` | Валідація `app-config.json` (дати, діапазон, `firstDayOfWeek`). |
| `npm run tokens:build` | Генерація CSS/TS із `design/tokens.json`. Викликається перед dev та build. |
| `npm run tokens:watch` | Спостерігає за `tokens.json` та перебудовує токени. |
| `npm run tokens:docs` | Створює Markdown-довідник щодо токенів (виводиться у корінь як `DESIGN_TOKENS.md`). |
| `npm run images:webp` | Рекурсивна конвертація PNG/JPG у WebP у `src/assets/images`. |

## 3. Директорія `scripts/`

| Файл | Опис |
|------|------|
| `build-tokens.ts` | Створює `tokens.css` і `design-tokens.d.ts`. Приймає конфігурацію з `src/design/tokens.json`. |
| `convert-to-webp.ts` | За допомогою `sharp` генерує `.webp` копії зображень. Використовуйте перед деплоєм, щоб уникнути ручної оптимізації. |
| `export-docs.ts` | Генерує Markdown з переліком токенів (потрібен для зовнішньої документації/дизайнерів). |
| `validate-config.mjs` | Перевіряє діапазон дат, допустимі значення `firstDayOfWeek`, попереджає про надто довгі кампанії (>92 днів). |
| `check-comments.mjs` | Скрипт контролю політики коментарів (відсутність кирилиці; корисно, коли код ревʼюється міжнародною командою). |

### Порада
Якщо скрипти використовуються у CI/CD, рекомендується додати:
```bash
npm install
npm run tokens:build
npm run check
npm run type-check
npm run build
```

## 4. Хуки та автоматизація
- `predev`: виконує `tokens:build`, щоб dev-сервер одразу бачив актуальні токени.
- `prebuild`: запускає конвертацію зображень та генерацію токенів перед основною збіркою.
- Husky не налаштований, але можна додати git-хук `pre-commit`, який викликає `npm run check` та `npm run validate-config`.

## 5. Робота з токенами та зображеннями
1. Змінюючи дизайн-токени, завжди запускайте `npm run tokens:build`.
2. Після додавання PNG/JPG у `src/assets/images` — `npm run images:webp`. Це збереже початковий файл і додасть `.webp` поруч.
3. Для документування теми дизайнеру — `npm run tokens:docs`.

## 6. Типові сценарії
- **Локальна розробка нової кампанії:**
  ```bash
  npm install
  npm run validate-config    # перевірити діапазон дат/тасків
  npm run dev
  ```
- **Підготовка до релізу:**
  ```bash
  npm run check
  npm run lint:styles
  npm run validate-config
  npm run build
  ```
- **Оновлення токенів після отримання нового дизайну:**
  ```bash
  npm run tokens:build
  npm run format:check
  ```

Цей набір команд забезпечує контроль якості, відтворюваність та прозорість збірки на всіх етапах розробки.
