import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY } from "../themes";

const isKnownTheme = (id: string | null): id is string =>
  !!id && THEMES.some((t) => t.id === id);

const initialTheme = (): string => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return isKnownTheme(saved) ? saved : DEFAULT_THEME;
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<string>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((id: string) => {
    if (isKnownTheme(id)) setThemeState(id);
  }, []);

  return { theme, setTheme, themes: THEMES };
};
