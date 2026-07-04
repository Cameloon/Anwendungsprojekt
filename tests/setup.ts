import "@testing-library/jest-dom";

// Läuft global für alle Testdateien, auch für Convex-Backend-Tests im
// edge-runtime-Environment (siehe tests/convex/) — dort gibt es kein
// echtes DOM (window.HTMLElement fehlt), daher wird der DOM-Mock-Teil
// übersprungen.
if (typeof window !== "undefined" && typeof window.HTMLElement !== "undefined") {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "localStorage", {
    writable: true,
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      length: 0,
      key: () => null,
    },
  });

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
    writable: true,
    value: () => {},
  });
}
