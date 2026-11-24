# ARC Design System (code copy)

The ARC Design System applies the **Langara College Brand Guidelines (2025)** to ARC's logo. This folder is the copy the app uses. The browsable version, with live component previews, is at https://claude.ai/artifact/V9iBXwRrpKDrb37ay1ijEb. If the two differ, update this folder and note it in the commit.

| File | Use |
| --- | --- |
| `tokens.json` | Source of truth: colours (light and dark themes), type styles, spacing and radius |
| `tokens.css` | Generated from `tokens.json`: CSS variables plus a class per type style. **Don't edit by hand** |
| `components.css` | `arc-` component classes: buttons, badges, fields, tables, stat tiles, grant cards, slide header |
| `logos/` | `arc-logo.svg` (full colour, light grounds), `arc-logo-reversed.svg` and `arc-mark.svg` (derived; approval pending, see below) |

## Loading

```css
/* src/styles/global.css */
@import '../../design/tokens.css';
@import '../../design/components.css';
```

Fonts: Roboto Slab (400, 600, 700) and Roboto (400, 500, 700) from Google Fonts, or `next/font/google`. They are the brand's approved alternates for Adelle and TheSans. If Langara provides web licences for Adelle and TheSans, add the font files; they come first in the font stacks.

Themes: `data-theme="light"` (admin, web, TV) is the default. `data-theme="dark"` is only for the TV's after-hours screen.

## Rules

- **Colour only through tokens** (`var(--brand-orange)`, `var(--ink)`, …). No hex values in app code.
- **Text on orange, amber, gold and sand is black** (`--on-accent`, `--brand-black`). White on orange is 3.4:1 and fails for normal text.
- **Small orange text on light backgrounds** uses `--accent-text` (#B8440F); Langara orange itself is for fills and large text.
- **Status badges**: `arc-badge--active` (sand), `--completed` (charcoal), `--pending` (outlined), `--archived` (grey), `--new` (orange), `--error` (functional red). Always show the word, not colour alone.
- **Research areas**: `--area-natural-products`, `--area-data-analytics`, `--area-social-innovation`, always with the area name.
- **Type**: headings and slide titles in slab (`.h1`, `.tv-title`), sentence case, ending with a period. Subheads uppercase sans (`.subhead`, `.tv-subhead`). UI and data in sans (`.ui`).
- **TV**: white ground, a 16px stripe of orange, amber, gold and sand along the top, colour tiles with black text, 96px side margins, nothing under 22px, one idea per slide.
- **Focus**: 2px `--focus-ring` outline with a 2px offset on every interactive element. Targets are at least 44px.

## Logo

- Use `arc-logo.svg` on white and light greys, with clear space of at least one letter height on every side.
- Never place any logo on orange, amber or gold. Never stretch, recolour or separate the mark from the wordmark.
- `arc-logo-reversed.svg` (white wordmark, for the dark after-hours screen) and `arc-mark.svg` (mark only, for favicons) were derived for this system. **They need approval from Langara Strategic Communications and Marketing before public use.**

## Regenerating tokens.css

`tokens.css` is generated from `tokens.json`. After changing `tokens.json`, regenerate it with `node scripts/build-tokens.mjs` (to become `pnpm tokens` once the project is scaffolded) and commit both.
