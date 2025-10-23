# Advent Calendar Hub

Vue 3 + TypeScript застосунок для керування святковими промокалендарями. Увесь контент, задачі та брендінг налаштовуються через JSON-конфіг, а дизайн — через токени.

## Швидкий старт

```bash
node -v        # має бути >=20.19 або >=22.12
npm install
npm run validate-config
npm run dev
```

Основні команди:

- `npm run build` — продакшен-збірка (`prebuild` оптимізує зображення та токени);
- `npm run check` — ESLint + перевірка коментарів;
- `npm run lint:styles` — Stylelint для SCSS/Vue;
- `npm run tokens:build` — генерація дизайн-токенів;
- `npm run validate-config` — валідація `app-config.json`.

## Документація

[`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md)

Дотримуйтеся цих матеріалів для швидкої адаптації календаря під нові кампанії.
