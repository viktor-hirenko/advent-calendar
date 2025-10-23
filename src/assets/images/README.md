# 🖼️ Структура изображений

## 📁 Организация файлов

```
src/assets/images/
├── banners/                    # Баннеры и hero-изображения
│   ├── advent-calendar-hero-mobile.png     (360x320)
│   ├── advent-calendar-hero-tablet.png     (600x300)
│   ├── advent-calendar-hero-desktop.png    (1200x312)
│   ├── advent-calendar-hero-large.png      (1440x320)
│   └── advent-calendar-hero-ultra.png      (2880x320)
├── icons/                      # Иконки (SVG формат)
│   ├── logo.svg
│   ├── search.svg
│   ├── gift.svg
│   └── support.svg
└── ui/                         # UI элементы и декорации
    ├── background-pattern.svg
    └── decorative-elements.svg
```

## 🎯 Принципы именования

### Баннеры

- **Формат**: `{component}-{type}-{breakpoint}.{extension}`
- **Пример**: `advent-calendar-hero-mobile.png`

### Breakpoints

- `mobile` - до 768px
- `tablet` - 768px - 1024px
- `desktop` - 1024px - 1920px
- `large` - 1440px - 1920px
- `ultra` - 1920px+

## 🚀 Использование в компонентах

### Responsive изображения с `<picture>`

```vue
<template>
  <picture class="banner__picture">
    <source media="(min-width: 1920px)" :srcset="bannerImageUltra" />
    <source media="(min-width: 1440px)" :srcset="bannerImageLarge" />
    <source media="(min-width: 1024px)" :srcset="bannerImageDesktop" />
    <source media="(min-width: 768px)" :srcset="bannerImageTablet" />
    <img :src="bannerImageMobile" :alt="bannerAlt" loading="lazy" />
  </picture>
</template>
```

### Импорт изображений

```typescript
// Статический импорт
import bannerMobile from '@/assets/images/banners/advent-calendar-hero-mobile.png'

// Динамический импорт
const bannerMobile = new URL(
  '@/assets/images/banners/advent-calendar-hero-mobile.png',
  import.meta.url,
).href
```

## 📱 Responsive стратегия

1. **Mobile First** - начинаем с мобильной версии
2. **Progressive Enhancement** - улучшаем для больших экранов
3. **Lazy Loading** - используем `loading="lazy"`
4. **WebP Support** - планируется переход на WebP формат

## 🔧 Оптимизация

- **Размеры файлов**: оптимизированы для веб
- **Форматы**: PNG для сложных изображений, SVG для иконок
- **Lazy Loading**: включен по умолчанию
- **Alt тексты**: семантические описания

## 📋 TODO

- [ ] Конвертация в WebP формат
- [ ] Добавление 2x версий для Retina дисплеев
- [ ] Оптимизация размеров файлов
- [ ] Создание SVG иконок
