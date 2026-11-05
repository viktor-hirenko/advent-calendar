# Кампанії

Один проєкт обслуговує кілька календарів. Рушій (`src/`) спільний і не містить дат, періодів, текстів чи картинок конкретної акції. Усе, що належить акції, лежить у папці кампанії `campaigns/<id>/`.

## 1. Склад папки кампанії

```
campaigns/<id>/
├── campaign.json              # дані для збірки: тема і шрифти
├── config.json                # період, задачі, тексти, посилання (docs/CONFIG_GUIDE.md)
├── images/                    # картинки, на які посилається config.json (папки може не бути, поки картинок немає)
├── styles.scss                # необовʼязково: власний вигляд кампанії
└── components/
    └── CampaignBanner.vue     # необовʼязково: власний банер кампанії
```

### `campaign.json`

| Поле | Що робить |
|---|---|
| `theme` | Значення `data-theme` у `<html>`. Тема має існувати в `src/design/tokens.json`, інакше збірка зупиниться з помилкою. |
| `fontsUrl` | Адреса таблиці стилів шрифтів (Google Fonts), підставляється в `index.html`. |
| `strictValidation` | Необовʼязково. `true` — `npm run validate-config` перевіряє строго: задач стільки ж, скільки днів, у кожного тексту є англійська, усі картинки на місці. |

### `config.json`

Формат описано в `docs/CONFIG_GUIDE.md`. Картинки в ньому вказуються шляхом від `images/`, наприклад `banners/default/hero-mobile.webp`.

### Банер

- Якщо є `components/CampaignBanner.vue`, сторінка показує його. Картинки він імпортує відносно себе: `../images/...`.
- Якщо файлу немає, показується спільний `src/components/CalendarBanner.vue`, який бере картинки з `calendar.images.banner` у `config.json`.

### Стилі кампанії (`styles.scss`)

- Якщо файл є, він підключається після спільних стилів (аліас `@campaign-styles`); якщо немає — підключається порожній `src/assets/scss/campaign-styles-none.scss`.
- Кожне правило починається з селектора теми кампанії, наприклад `html[data-theme='alpa-santa-vegas'] .task-card--active`. Він сильніший за scoped-стилі компонентів, тому вигляд змінюється без правок у `src/`, а інші кампанії його не бачать.
- Картинки з `url('./images/...')` беруться відносно файлу стилів.
- Доступні міксини й функції проєкту (`mq`, `to-rem`, `font-family`, `weight` тощо).
- Картка завдання має атрибут `data-type` зі значенням `tasks[].type`. За ним стилі кампанії ставлять ілюстрацію кожного типу на її місце з макета, наприклад `.task-card--active[data-type='live'] .task-card__illustration-img`.
- Картинки з макета — це експорт шару з Figma у PNG 2× з прозорим фоном, переведений у WebP. Шар вивантажується цілим, разом зі світінням і тінями, які в ньому намальовані. Не вирізати картинки зі скриншотів, не збирати їх із частин і не домальовувати світіння стилями.

### Розкладка `carousel` і змінні дизайну

- Вмикається в `config.json`: `"ui": { "layout": "carousel" }`. `src/main.ts` ставить `<html data-layout="carousel">`, спільні стилі розкладки — `src/assets/scss/layouts/carousel.scss`; кожне правило там починається з `html[data-layout='carousel']`, тож кампанії без цього поля виглядають як раніше.
- Ширини: телефон до 543px, планшет 544–1079px (та сама розкладка, що на телефоні), десктоп від 1080px. Розміри від телефона до 1079px не змінюються, корінний шрифт не зменшується на 768px.
- Кольори, радіуси й тіні беруться тільки зі змінних, які кампанія задає в `styles.scss` під селектором своєї теми:
  - сторінка й текст: `--bg-page`, `--bg-transparent`, `--fg-brand`, `--fg-primary`, `--fg-secondary`, `--fg-success`, `--fg-error`, `--font-page`;
  - радіуси: `--radius-card`, `--radius-date`;
  - картки: `--card-active-bg`, `--card-active-border`, `--card-active-shadow`, `--card-default-bg`, `--card-default-shadow` (закрита картка), `--card-passed-bg`, `--card-passed-shadow`;
  - дні: `--date-default-fg`, `--date-default-bg`, `--date-default-border`, `--date-hover-fg`, `--date-hover-bg`, `--date-hover-border`, `--date-today-fg`, `--date-today-bg`, `--date-passed-fg`, `--date-passed-bg`;
  - вікно правил: `--modal-bg`, `--modal-shadow` (від 544px), `--overlay-bg`, `--overlay-effect`;
  - кнопки: `--button-primary-bg`, `--button-primary-fg` (кнопка завдання), `--button-secondary-bg`, `--button-secondary-fg`, `--button-secondary-border` (кнопка «повернутися до сьогоднішнього завдання»).
  
  Необовʼязкові: `--date-default-border`, `--card-default-shadow`, `--button-secondary-border`.
- Прикраса сьогоднішнього дня (наприклад, гірлянда) — у стилях кампанії: `.calendar-days__day--active::before`.
- Банер кампанії: фон на всю ширину (`cover`, притиснутий донизу, щоб на широких екранах лишався перехід у колір сторінки) і головна картинка по центру; висота 208px до 1079px і 256px від 1080px.
- Ілюстрація типу завдання — одна картинка 80×80 (`taskTypes.<type>.image`); `finishedImage` необовʼязковий.
- Дата на картці «5 Dec» — `cardDateFormat: "day-month"` (`docs/CONFIG_GUIDE.md`).

Після зміни `campaign.json` dev-сервер перезапускається сам, щоб підхопити тему й шрифти.

## 2. Вибір кампанії

Кампанія обирається змінною середовища `CAMPAIGN`. Без неї береться кампанія за замовчуванням (`DEFAULT_CAMPAIGN` у `scripts/campaign.mjs`, зараз `alpa-2026`).

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
2. У `config.json` задати період (`startDate`, `endDate`), режим часу, задачі й тексти. Задачі можна перенести з CSV-експорту таблиці завдань:
   ```bash
   CAMPAIGN=<нова> npm run import-tasks -- шлях/до/таблиці.csv --dry-run   # подивитися, що вийде
   CAMPAIGN=<нова> npm run import-tasks -- шлях/до/таблиці.csv             # записати в config.json
   npx prettier --write campaigns/<нова>/config.json
   ```
   Скрипт замінює `calendar.tasks` повністю (англійські тексти, тип механіки, суми в евро — жирним) і звіряє дати таблиці з `startDate`.
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
| `alpa-2026` | 01.12.2026–24.12.2026 | У роботі: 24 задачі англійською з таблиці, розкладка `carousel` (тема `alpa-santa-vegas`, змінні дизайну в `styles.scss`, банер із двох шарів — фон міста на всю ширину й стадіон по центру) |
