// Global script library store (localStorage). Lets the forum link to scripts.

export interface Script {
  id: string;
  title: string;
  subject: string;
  description: string;
  author: string;
  date: string;
  pages: number;
  type: "PDF" | "DOCX" | "PPTX" | "PNG" | "JPG" | "Notiz";
  visibility?: "public" | "private";
  fileUrl?: string;
  fileName?: string;
}

const KEY = "scripts_v1";
const EVENT = "scripts_changed";

const SEED: Script[] = [
  { id: "1", title: "Lineare Algebra Komplett", subject: "Mathematik", description: "Vollständiges Skript zu Vektorräumen, Matrizen und Eigenwerten mit Beispielen.", author: "Prof. Müller", date: "12.04.2026", pages: 85, type: "PDF", visibility: "public" },
  { id: "2", title: "Einführung in Algorithmen", subject: "Informatik", description: "Sortieralgorithmen, Graphen und Komplexitätstheorie. Gut strukturiert mit Pseudocode.", author: "Dr. Weber", date: "08.04.2026", pages: 120, type: "PDF", visibility: "public" },
  { id: "3", title: "Statistik Grundlagen", subject: "Statistik", description: "Deskriptive und induktive Statistik, Hypothesentests und Regression.", author: "Prof. Fischer", date: "01.04.2026", pages: 64, type: "DOCX", visibility: "public" },
  { id: "4", title: "Mechanik – Kapitel 1-3", subject: "Physik", description: "Kompakte Notizen zu Newton'schen Gesetzen, Energieerhaltung und Schwingungen.", author: "Du", date: "20.04.2026", pages: 22, type: "Notiz", visibility: "private" },
];

export const loadScripts = (): Script[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Script[];
  } catch {}
  localStorage.setItem(KEY, JSON.stringify(SEED));
  return SEED;
};

export const saveScripts = (s: Script[]) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(EVENT));
};

export const addScript = (s: Script) => saveScripts([s, ...loadScripts()]);

export const getScript = (id: string) => loadScripts().find((s) => s.id === id);

export const subscribeScripts = (cb: () => void) => {
  const h = () => cb();
  window.addEventListener(EVENT, h);
  window.addEventListener("storage", h);
  return () => {
    window.removeEventListener(EVENT, h);
    window.removeEventListener("storage", h);
  };
};

// Scripts visible to a viewer: all public + own private
export const visibleScripts = (viewer: string) =>
  loadScripts().filter((s) => s.visibility !== "private" || s.author === viewer);

// Scripts that may be linked publicly (e.g. from a forum post): only public ones.
export const publicScripts = () =>
  loadScripts().filter((s) => s.visibility !== "private");
