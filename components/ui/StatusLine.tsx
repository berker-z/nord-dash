import React, { useEffect, useRef, useState } from "react";
import { Cloud, CloudRain, Lock, Sun } from "lucide-react";
import { WeatherData } from "../../types";
import { ThemeDef } from "../../themes";

interface StatusLineProps {
  userName: string | null;
  weather: WeatherData | null;
  currentTime: Date;
  theme: string;
  themes: ThemeDef[];
  onSelectTheme: (id: string) => void;
  onLogout: () => void;
}

const Sep: React.FC = () => (
  <span className="text-faint select-none" aria-hidden>
    │
  </span>
);

const pad = (n: number) => String(n).padStart(2, "0");
const formatDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const WeatherIcon: React.FC<{ code: number }> = ({ code }) => {
  if (code <= 3) return <Sun className="text-yellow" size={16} />;
  if (code <= 48) return <Cloud className="text-cyan" size={16} />;
  return <CloudRain className="text-blue" size={16} />;
};

// tmux-style statusline: all global state (session, clock, weather, theme,
// auth) lives here instead of a top header.
export const StatusLine: React.FC<StatusLineProps> = ({
  userName,
  weather,
  currentTime,
  theme,
  themes,
  onSelectTheme,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const activeTheme = themes.find((t) => t.id === theme);

  return (
    // z-[55]: above the login overlay (z-50) so theme/clock stay reachable
    // while locked, below modals (z-[60]).
    <header className="fixed top-0 inset-x-0 z-[55] h-11 bg-bar border-b border-divider px-4 flex items-center justify-between gap-4 text-base whitespace-nowrap">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-accent">[thewired]</span>
        <span className="text-muted truncate">
          {userName ? userName.toLowerCase() : "guest"}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="text-muted hover:text-accent transition-colors"
            title="Switch color theme"
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
          >
            theme:{(activeTheme?.label || theme).replace(/ /g, "_")}
          </button>
          {menuOpen && (
            <div
              className="absolute top-full right-0 mt-2 min-w-[12rem] bg-surface border border-faint py-1 z-50"
              role="listbox"
            >
              {themes.map((t) => (
                <button
                  key={t.id}
                  data-theme={t.id}
                  role="option"
                  aria-selected={t.id === theme}
                  onClick={() => {
                    onSelectTheme(t.id);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 text-left bg-surface text-ink hover:bg-raised transition-colors"
                >
                  {/* data-theme on the row makes these tokens preview that theme */}
                  <span className="w-2.5 h-2.5 bg-accent flex-shrink-0" aria-hidden />
                  <span className={t.id === theme ? "text-accent" : ""}>
                    {t.label.replace(/ /g, "_")}
                  </span>
                  {t.id === theme && (
                    <span className="ml-auto text-accent">●</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        <span className="flex items-center gap-1.5 text-ink">
          {weather ? (
            <>
              <WeatherIcon code={weather.weatherCode} />
              {weather.temperature}°C
            </>
          ) : (
            <span className="text-muted animate-pulse">--°C</span>
          )}
        </span>

        <span className="hidden sm:inline-flex items-center gap-2.5">
          <Sep />
          <span className="text-muted uppercase">istanbul</span>
        </span>

        <span className="hidden md:inline-flex items-center gap-2.5">
          <Sep />
          <span className="text-ink">{formatDate(currentTime)}</span>
        </span>

        <Sep />

        <span className="text-ink">
          {currentTime.toLocaleTimeString("en-US", { hour12: false })}
        </span>

        <Sep />

        {userName ? (
          <button
            onClick={onLogout}
            className="text-muted hover:text-red transition-colors"
            title="Logout"
          >
            logout
          </button>
        ) : (
          <span className="text-red flex items-center gap-1.5">
            <Lock size={14} /> locked
          </span>
        )}
      </div>
    </header>
  );
};
