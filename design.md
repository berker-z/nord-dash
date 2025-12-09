# Design System — Nord Dash

## Visual Language
- Palette: Nord blues/auroras defined in `tailwind.config.js` as `nord-0`…`nord-16`; CSS vars mirror key surfaces (`--surface-base`, `--surface-muted`, `--text-primary`, `--accent-ice`, `--accent-aurora`).
- Typography: JetBrains Mono (300–700) loaded in `index.css`; base font size 17px (`html`), default weight 400. Titles use wider tracking (e.g., widget headers `tracking-[0.16em]`) with natural casing. Avoid unintended bold; reserve 500–700 only for emphasis/CTAs.
- Surfaces: Defaults live in `index.css` (`body` on `--surface-base` with `color-scheme: dark`). Use `bg-nord-0/90` + `border-nord-16` for panels, header bars match border color (`bg-nord-16`) with slim padding, and `backdrop-blur-md` for glass.
- Radii: `rounded-frame` (18px) for widgets, `rounded-modal` (26px) for overlays. **No drop shadows**; depth comes from borders/contrast only.
- Borders/Outlines: `border-2 border-nord-16` is the default rail; info tone uses `border-nord-9/50`, danger uses `border-nord-11/50`. Use `focus:ring-nord-9` for inputs. Event cards use a thin neutral border with a left accent bar for account color.
- Checkboxes: use the shared `Checkbox` component (`components/ui/Checkbox.tsx`) which matches the todo-list aesthetic (unchecked: light square outline, checked: green check square). Apply it everywhere instead of native checkbox styling (calendar subcalendars, Google Meet toggle, etc.).

## Primitives
- `components/ui/WidgetFrame.tsx`
  - Chrome for widgets: header slot (`title`, optional `subtitle/meta`, `icon`, `badge`), `controls` area, collapse toggle, `bodyStyle/bodyClassName` for sizing tweaks.
  - Defaults: `bg-nord-0/90 border-2 border-nord-16 rounded-frame backdrop-blur-md`, header on `bg-nord-16` with slim padding, body `p-5 text-nord-4`, title tracking widened.
  - Intended use: wrap every dashboard widget; keep per-widget padding/height adjustments inside `bodyStyle/bodyClassName` rather than redefining frames.
- `components/ui/ModalFrame.tsx`
  - Shared overlay/backdrop + ESC-to-close; `tone` (`default`, `info`, `danger`) controls border/header accent; `size` (`sm`, `md`, `lg`); `headerActions` slot and `footer` slot.
  - Container: `rounded-modal border-2` with `bg-nord-0/95 backdrop-blur-md`; body scrollable with `max-h-[90vh]`.
  - Intended use: all modals (confirmations, calendar dialogs) use this wrapper; supply `onClose` to enable overlay + ESC dismissal.

## Usage Patterns
- Tailwind is compiled only via the build pipeline (CDN removed). `index.tsx` imports `index.css` so Vite picks up Tailwind layers.
- Keep base tokens in `index.css`; prefer Nord palette utilities or the CSS vars instead of ad-hoc hex values.
- For widget chrome: `WidgetFrame` + Nord borders (no shadows); avoid recreating per-widget headers.
- For dialogs: `ModalFrame` with `tone` set to the intent; place primary action in `footer`, keep body content lightweight and scroll-friendly.

## Handy Tokens
- Backgrounds: `bg-nord-0/90`, `bg-nord-16/30` (headers), `bg-nord-1/60` (cards), `bg-nord-0/60` (badges).
- Text: `text-nord-4` primary, `text-nord-3` muted, `text-nord-11` danger, `text-nord-9` info/accent.
- Chips/Badges: `rounded-full bg-nord-0/60 border border-nord-3 text-nord-13`.
- Scrollbars: standardized in `index.css` to match Nord rails; no per-component overrides needed.
