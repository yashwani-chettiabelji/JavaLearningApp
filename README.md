# Learn Java — Interactive Basics

A production-ready, single-page static web app for learning Java fundamentals. No frameworks, no build step — deploy anywhere.

## Structure

```
JavaLearningApp/
├── index.html          # App shell (semantic HTML + a11y landmarks)
├── css/style.css       # Design tokens, responsive layout, dark mode
├── js/
│   ├── data.js         # Single source of truth — topics & quiz content
│   └── app.js          # UI rendering, storage, quiz logic, a11y
├── manifest.json       # PWA manifest
├── favicon.svg
└── README.md
```

## Run locally

```bash
python -m http.server 8000
```

Visit `http://localhost:8000`. Serving over HTTP is recommended (clipboard API, manifest).

## Features

- **17 guided topics** with structured notes, code examples, and copy-to-clipboard
- **Progress tracking** persisted in `localStorage` with reset option
- **Live search** across topic titles and summaries (debounced)
- **8-question quiz** with validation, inline feedback, and retake
- **Light/dark theme** with flash prevention, OS preference, and persistence
- **Accessibility**: skip link, focus trap, `inert` background, ARIA, keyboard nav
- **PWA-ready**: web manifest, theme-color, SVG favicon

## Editing content

All topic and quiz content lives in `js/data.js` under `window.APP_DATA`. Update topics or quiz questions there — `app.js` renders everything dynamically.

## License

MIT
