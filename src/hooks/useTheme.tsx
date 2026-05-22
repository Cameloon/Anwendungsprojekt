import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Mode = "light" | "dark";
export type ColorTheme = "default" | "violet" | "emerald" | "rose" | "amber";

interface ThemeCtx {
  mode: Mode;
  color: ColorTheme;
  toggleMode: () => void;
  setMode: (m: Mode) => void;
  setColor: (c: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

const COLOR_CLASSES: ColorTheme[] = ["default", "violet", "emerald", "rose", "amber"];

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme-mode") as Mode | null;
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [color, setColorState] = useState<ColorTheme>(() => {
    if (typeof window === "undefined") return "default";
    return (localStorage.getItem("theme-color") as ColorTheme) || "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    localStorage.setItem("theme-mode", mode);
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    COLOR_CLASSES.forEach((c) => root.classList.remove(`theme-${c}`));
    if (color !== "default") root.classList.add(`theme-${color}`);
    localStorage.setItem("theme-color", color);
  }, [color]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        color,
        toggleMode: () => setModeState((m) => (m === "dark" ? "light" : "dark")),
        setMode: setModeState,
        setColor: setColorState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
