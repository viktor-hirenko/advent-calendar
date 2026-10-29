# Кампанії

Один проєкт обслуговує кілька календарів. Рушій (`src/`) спільний і не містить дат, періодів, текстів чи картинок конкретної акції. Усе, що належить акції, лежить у папці кампанії `campaigns/<id>/`.

## 1. Склад папки кампанії

```
campaigns/<id>/
├── campaign.json              # дані для збірки: тема і шрифти
├── config.json                # період, задачі, тексти, посилання (docs/CONFIG_GUIDE.md)
├── images/                    # картинки, на які посилається config.json
└── components/
    └── CampaignBanner.vue     # необовʼязково: власний банер кампанії
```

### `campaign.json`

| Поле | Що робить |
|---|---|
| `theme` | Значення `data-theme` у `<html>`. Тема має існувати в `src/design/tokens.json`, інакше збірка зупиниться з помилкою. |
| `fontsUrl` | Адреса таблиці стилів шрифтів (Google Fonts), підставляється в `index.html`. |

### `config.json`

Формат описано в `docs/CONFIG_GUIDE.md`. Картинки в ньому вказуються шляхом від `images/`, наприклад `banners/default/hero-mobile.webp`.

### Банер

- Якщо є `components/CampaignBanner.vue`, сторінка показує його. Картинки він імпортує відносно себе: `../images/...`.
- Якщо файлу немає, показується спільний `src/components/CalendarBanner.vue`, який бере картинки з `calendar.images.banner` у `config.json`.

## 2. Вибір кампанії

Кампанія обирається змінною середовища `CAMPAIGN`. Без неї береться кампанія за замовчуванням (`DEFAULT_CAMPAIGN` у `scripts/campaign.mjs`).

```bash
CAMPAIGN=alpa-2025 npm run dev
CAMPAIGN=alpa-2025 npm run build      # результат у dist/alpa-2025/
CAMPAIGN=alpa-2025 npm run validate-config
CAMPAIGN=alpa-2025 npm run images:webp
```

Якщо назва неправильна, команда завершиться помилкою зі списком наявних кампаній. Кампанією вважається папка, у якій є `campaign.json`.

Як це працює:
- `scripts/campaign.mjs` знаходить папку кампанії та перевіряє `campaign.json`;
- `vite.config.ts` створює аліаси `@campaign` (папка кампанії) і `@campaign-banner` (банер кампанії або спільний), підставляє тему й шрифти в `index.html` і кладе збірку в `dist/<id>/`;
- `src/composables/useAppConfig.ts` читає `@campaign/config.json` і всі файли `@campaign/images/**`.

Дизайн-токени (`npm run tokens:build`) спільні для всіх кампаній: у `src/design/tokens.css` потрапляють усі теми, а кампанія лише обирає свою через `theme`.

## 3. Як додати нову кампанію

1. Скопіювати папку схожої кампанії: `campaigns/<стара>` → `campaigns/<нова>`. Переносити лише ті картинки, які справді використовуються: у збірку потрапляють усі файли з `images/`.
2. У `config.json` задати період (`startDate`, `endDate`), режим часу, задачі й тексти.
3. Якщо потрібна нова тема — додати її в `src/design/tokens.json`, виконати `npm run tokens:build` і вказати її в `campaign.json`.
4. Перевірити:
   ```bash
   CAMPAIGN=<нова> npm run validate-config
   CAMPAIGN=<нова> npm run dev           # відкрити з ?testDate=YYYY-MM-DD&language=xx
   npm run type-check && npm run lint
   CAMPAIGN=<нова> npm run build
   ```
5. Переконатися, що попередні кампанії збираються як раніше: зміни рушія не мають міняти їхній вигляд. Нова поведінка рушія вмикається полем у `config.json` і за замовчуванням вимкнена.

## 4. Кампанії в репозиторії

| id | Період | Примітка |
|---|---|---|
| `alpa-2025` | 01.12.2025–24.12.2025 | Опублікована версія 2025 року, git-мітка `alpa-2025-final` |
