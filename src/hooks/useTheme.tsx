import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Mode = "light" | "dark" | "auto";
export type ColorTheme =
  | "default"
  | "violet"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "berry";

interface ThemeCtx {
  mode: Mode;
  effectiveMode: "light" | "dark";
  color: ColorTheme;
  toggleMode: () => void;
  setMode: (m: Mode) => void;
  setColor: (c: ColorTheme) => void;
}

type ThemeVars = Record<string, string>;

const ThemeContext = createContext<ThemeCtx | null>(null);

const COLOR_CLASSES: ColorTheme[] = [
  "default",
  "violet",
  "emerald",
  "rose",
  "amber",
  "cyan",
  "berry",
];

const THEME_VARIABLE_KEYS = [
  "--background",
  "--card",
  "--popover",
  "--secondary",
  "--muted",
  "--muted-foreground",
  "--primary",
  "--primary-glow",
  "--accent",
  "--sidebar-background",
  "--sidebar-accent",
  "--ring",
  "--amber-glow",
  "--magenta-glow",
  "--page-tint",
  "--page-tint-strong",
] as const;

const LIGHT_THEME_VARS: Record<ColorTheme, ThemeVars> = {
  default: {
    "--background": "240 13% 98%",
    "--card": "0 0% 100%",
    "--popover": "0 0% 100%",
    "--secondary": "240 10% 94%",
    "--muted": "240 10% 95%",
    "--muted-foreground": "222 15% 40%",
    "--primary": "222 31% 52%",
    "--primary-glow": "225 41% 71%",
    "--accent": "222 44% 62%",
    "--sidebar-background": "240 13% 96%",
    "--sidebar-accent": "240 10% 92%",
    "--ring": "222 31% 52%",
    "--amber-glow": "222 31% 52%",
    "--magenta-glow": "225 41% 71%",
    "--page-tint": "222 60% 92%",
    "--page-tint-strong": "225 75% 88%",
  },
  violet: {
    "--background": "268 55% 97%",
    "--card": "270 45% 99%",
    "--popover": "270 45% 99%",
    "--secondary": "270 38% 92%",
    "--muted": "270 30% 93%",
    "--muted-foreground": "266 18% 42%",
    "--primary": "262 60% 55%",
    "--primary-glow": "280 70% 70%",
    "--accent": "280 60% 65%",
    "--sidebar-background": "270 42% 96%",
    "--sidebar-accent": "270 30% 91%",
    "--ring": "262 60% 55%",
    "--amber-glow": "262 60% 55%",
    "--magenta-glow": "280 70% 70%",
    "--page-tint": "270 70% 92%",
    "--page-tint-strong": "285 80% 88%",
  },
  emerald: {
    "--background": "155 40% 97%",
    "--card": "156 32% 99%",
    "--popover": "156 32% 99%",
    "--secondary": "156 28% 92%",
    "--muted": "156 20% 93%",
    "--muted-foreground": "160 16% 38%",
    "--primary": "158 64% 38%",
    "--primary-glow": "168 70% 55%",
    "--accent": "168 65% 50%",
    "--sidebar-background": "156 28% 96%",
    "--sidebar-accent": "156 22% 91%",
    "--ring": "158 64% 38%",
    "--amber-glow": "158 64% 38%",
    "--magenta-glow": "168 70% 55%",
    "--page-tint": "156 52% 90%",
    "--page-tint-strong": "170 62% 86%",
  },
  rose: {
    "--background": "340 55% 97%",
    "--card": "340 42% 99%",
    "--popover": "340 42% 99%",
    "--secondary": "340 34% 92%",
    "--muted": "340 28% 93%",
    "--muted-foreground": "340 18% 40%",
    "--primary": "340 75% 55%",
    "--primary-glow": "20 85% 65%",
    "--accent": "20 80% 60%",
    "--sidebar-background": "340 36% 96%",
    "--sidebar-accent": "340 24% 91%",
    "--ring": "340 75% 55%",
    "--amber-glow": "340 75% 55%",
    "--magenta-glow": "20 85% 65%",
    "--page-tint": "340 75% 92%",
    "--page-tint-strong": "14 85% 88%",
  },
  amber: {
    "--background": "38 70% 97%",
    "--card": "36 52% 99%",
    "--popover": "36 52% 99%",
    "--secondary": "34 40% 92%",
    "--muted": "34 30% 93%",
    "--muted-foreground": "26 18% 38%",
    "--primary": "32 85% 50%",
    "--primary-glow": "45 95% 60%",
    "--accent": "14 80% 55%",
    "--sidebar-background": "34 42% 96%",
    "--sidebar-accent": "34 28% 91%",
    "--ring": "32 85% 50%",
    "--amber-glow": "32 85% 50%",
    "--magenta-glow": "14 80% 55%",
    "--page-tint": "38 88% 90%",
    "--page-tint-strong": "24 85% 86%",
  },
  cyan: {
    "--background": "194 60% 97%",
    "--card": "192 42% 99%",
    "--popover": "192 42% 99%",
    "--secondary": "192 34% 92%",
    "--muted": "192 26% 93%",
    "--muted-foreground": "197 18% 38%",
    "--primary": "192 75% 46%",
    "--primary-glow": "187 80% 62%",
    "--accent": "204 82% 60%",
    "--sidebar-background": "192 38% 96%",
    "--sidebar-accent": "192 24% 91%",
    "--ring": "192 75% 46%",
    "--amber-glow": "192 75% 46%",
    "--magenta-glow": "204 82% 60%",
    "--page-tint": "192 82% 90%",
    "--page-tint-strong": "205 90% 86%",
  },
  berry: {
    "--background": "328 52% 97%",
    "--card": "328 40% 99%",
    "--popover": "328 40% 99%",
    "--secondary": "328 32% 92%",
    "--muted": "328 26% 93%",
    "--muted-foreground": "328 16% 40%",
    "--primary": "328 68% 45%",
    "--primary-glow": "346 74% 62%",
    "--accent": "12 84% 63%",
    "--sidebar-background": "328 36% 96%",
    "--sidebar-accent": "328 24% 91%",
    "--ring": "328 68% 45%",
    "--amber-glow": "328 68% 45%",
    "--magenta-glow": "12 84% 63%",
    "--page-tint": "328 75% 91%",
    "--page-tint-strong": "348 82% 87%",
  },
};

const DARK_THEME_VARS: Record<ColorTheme, ThemeVars> = {
  default: {
    "--primary": "225 70% 65%",
    "--primary-glow": "250 75% 70%",
    "--accent": "250 70% 70%",
    "--ring": "225 70% 65%",
    "--amber-glow": "225 70% 65%",
    "--magenta-glow": "280 75% 70%",
  },
  violet: {
    "--primary": "270 80% 70%",
    "--primary-glow": "290 85% 75%",
    "--accent": "290 75% 70%",
    "--ring": "270 80% 70%",
    "--amber-glow": "270 80% 70%",
    "--magenta-glow": "290 85% 75%",
  },
  emerald: {
    "--primary": "158 70% 55%",
    "--primary-glow": "175 80% 60%",
    "--accent": "175 75% 60%",
    "--ring": "158 70% 55%",
    "--amber-glow": "158 70% 55%",
    "--magenta-glow": "175 80% 60%",
  },
  rose: {
    "--primary": "345 85% 65%",
    "--primary-glow": "20 90% 70%",
    "--accent": "20 85% 65%",
    "--ring": "345 85% 65%",
    "--amber-glow": "345 85% 65%",
    "--magenta-glow": "20 90% 70%",
  },
  amber: {
    "--primary": "38 95% 60%",
    "--primary-glow": "50 100% 65%",
    "--accent": "18 90% 60%",
    "--ring": "38 95% 60%",
    "--amber-glow": "38 95% 60%",
    "--magenta-glow": "18 90% 60%",
  },
  cyan: {
    "--primary": "190 85% 62%",
    "--primary-glow": "184 90% 68%",
    "--accent": "206 88% 70%",
    "--ring": "190 85% 62%",
    "--amber-glow": "190 85% 62%",
    "--magenta-glow": "206 88% 70%",
  },
  berry: {
    "--primary": "330 78% 68%",
    "--primary-glow": "348 82% 72%",
    "--accent": "14 88% 68%",
    "--ring": "330 78% 68%",
    "--amber-glow": "330 78% 68%",
    "--magenta-glow": "14 88% 68%",
  },
};

const applyThemeVariables = (root: HTMLElement, vars: ThemeVars) => {
  THEME_VARIABLE_KEYS.forEach((key) => {
    root.style.removeProperty(key);
  });
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

const getSystemMode = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem("theme-mode") as Mode) || "auto";
  });
  const [systemMode, setSystemMode] = useState<"light" | "dark">(() =>
    typeof window === "undefined" ? "light" : getSystemMode()
  );
  const [color, setColorState] = useState<ColorTheme>(() => {
    if (typeof window === "undefined") return "default";
    return (localStorage.getItem("theme-color") as ColorTheme) || "default";
  });

  const effectiveMode: "light" | "dark" = mode === "auto" ? systemMode : mode;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) =>
      setSystemMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", effectiveMode === "dark");
    localStorage.setItem("theme-mode", mode);
  }, [mode, effectiveMode]);

  useEffect(() => {
    const root = document.documentElement;
    COLOR_CLASSES.forEach((theme) => root.classList.remove(`theme-${theme}`));
    if (color !== "default") root.classList.add(`theme-${color}`);
    root.setAttribute("data-theme-color", color);

    const palette =
      effectiveMode === "dark" ? DARK_THEME_VARS[color] : LIGHT_THEME_VARS[color];
    applyThemeVariables(root, palette);

    localStorage.setItem("theme-color", color);
  }, [color, effectiveMode]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        effectiveMode,
        color,
        toggleMode: () =>
          setModeState((current) => {
            if (current === "auto") return "light";
            if (current === "light") return "dark";
            return "auto";
          }),
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
