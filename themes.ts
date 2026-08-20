// Theme registry for the Splits design system.
// A theme is a set of CSS variable overrides declared in index.css under
// [data-theme="<id>"]; adding a theme means adding a block there and an
// entry here — no component changes.

export interface ThemeDef {
  id: string;
  label: string;
}

export const THEMES: ThemeDef[] = [
  { id: "nord", label: "nord" },
  { id: "tokyo-night", label: "tokyo night" },
  { id: "dracula", label: "dracula" },
  { id: "catppuccin", label: "catppuccin" },
  { id: "gruvbox", label: "gruvbox" },
  { id: "one-dark", label: "one dark" },
  { id: "solarized", label: "solarized" },
];

export const DEFAULT_THEME = "nord";
export const THEME_STORAGE_KEY = "wired_theme";
