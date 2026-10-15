# MediCare Center — Frontend

Marketing landing page for MediCare Center, built with React + Vite. Visual language (colors,
typography, spacing, elevation, components) is implemented to match `medicare-design-system.html`,
the project's design-system reference, with full English/Arabic and LTR/RTL support.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/   UI building blocks (Navbar, Hero, Button, icons, ...)
  i18n/         Language context + en/ar translation strings
  pages/        Route-level pages (LandingPage)
  routes/       React Router route table (AppRouter)
  styles/       tokens.css (design tokens) -> global.css (base + primitives) -> landing.css (page sections)
```

## Design system

`medicare-design-system.html` is a static reference file documenting the color system, type
scale, spacing/radius scale, shadows, and component states (buttons, badges, cards, forms) for
both light and dark themes. It is not part of the running app — it's kept in the repo as the
source of truth designers/engineers can open directly in a browser to check a value.

## Localization

Language state lives in `LanguageContext` (`src/i18n/LanguageContext.jsx`). Toggling language
also flips `<html dir>` between `ltr` and `rtl`; all layout CSS uses logical properties
(`margin-inline-start`, `padding-inline`, etc.) so it mirrors correctly rather than needing
separate RTL overrides.
