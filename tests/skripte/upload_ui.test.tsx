import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SkriptePage from "../../src/pages/SkriptePage";
import { validateFileSize, FILE_MAX_BYTES } from "../../src/lib/validation";

// Navbar depends on auth context — mock it to keep tests focused on SkriptePage
vi.mock("../../src/components/Navbar", () => ({ default: () => null }));

// Framer-motion: strip animation props so jsdom doesn't choke on unknown attrs
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ---------------------------------------------------------------------------
// UI-Flow: Upload-Dialog
// ---------------------------------------------------------------------------
describe("SkriptePage – Upload-Dialog", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("Upload-Formular ist initial ausgeblendet", () => {
    render(<SkriptePage />);
    expect(screen.queryByPlaceholderText("Titel des Skripts")).not.toBeInTheDocument();
  });

  it("öffnet das Formular beim Klick auf Hochladen", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    expect(screen.getByPlaceholderText("Titel des Skripts")).toBeInTheDocument();
  });

  it("zeigt Fehlermeldungen für leere Pflichtfelder sofort nach dem Öffnen", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    expect(screen.getByText("Mindestens 3 Zeichen.")).toBeInTheDocument();
    expect(screen.getByText("Mindestens 2 Zeichen.")).toBeInTheDocument();
  });

  it("verhindert Submission bei ungültigen Eingaben — Formular bleibt offen", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skript hochladen/i }));
    expect(screen.getByPlaceholderText("Titel des Skripts")).toBeInTheDocument();
  });

  it("zeigt Beschreibungsfehler bei zu kurzem Text", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.change(screen.getByPlaceholderText("Kurze Beschreibung zum Inhalt"), {
      target: { value: "Zu kurz" },
    });
    expect(screen.getByText("Mindestens 10 Zeichen oder leer lassen.")).toBeInTheDocument();
  });

  it("fügt neues Skript zur Liste hinzu bei gültiger Eingabe", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.change(screen.getByPlaceholderText("Titel des Skripts"), {
      target: { value: "Mein Testskript" },
    });
    fireEvent.change(screen.getByPlaceholderText("Fach / Modul"), {
      target: { value: "Physik" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Skript hochladen/i }));
    // Formular geschlossen
    expect(screen.queryByPlaceholderText("Titel des Skripts")).not.toBeInTheDocument();
    // Neuer Eintrag sichtbar
    expect(screen.getByText("Mein Testskript")).toBeInTheDocument();
  });

  it("Sichtbarkeit-Buttons Öffentlich und Privat sind im Formular sichtbar", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    expect(screen.getByRole("button", { name: /Öffentlich/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Privat$/i })).toBeInTheDocument();
  });

  it("privates Skript zeigt Privat-Badge in der Liste", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.change(screen.getByPlaceholderText("Titel des Skripts"), {
      target: { value: "Geheimes Skript" },
    });
    fireEvent.change(screen.getByPlaceholderText("Fach / Modul"), {
      target: { value: "Mathematik" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Privat$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skript hochladen/i }));
    expect(screen.getByText("Geheimes Skript")).toBeInTheDocument();
    // mindestens ein Privat-Badge in der Liste (Seed hat auch einen)
    expect(screen.getAllByText(/Privat/i).length).toBeGreaterThanOrEqual(1);
  });

  it("Abbrechen schließt das Formular ohne Eintrag hinzuzufügen", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.change(screen.getByPlaceholderText("Titel des Skripts"), {
      target: { value: "Wird nicht gespeichert" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Abbrechen/i }));
    expect(screen.queryByText("Wird nicht gespeichert")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Unit: Datei-Größen-Validierung
// ---------------------------------------------------------------------------
describe("validateFileSize", () => {
  it.each([
    [0, ""],
    [FILE_MAX_BYTES, ""],
    [FILE_MAX_BYTES + 1, "Datei darf maximal 25 MB groß sein."],
    [50 * 1024 * 1024, "Datei darf maximal 25 MB groß sein."],
  ])("validateFileSize(%i Bytes) → %j", (bytes, expected) => {
    expect(validateFileSize(bytes)).toBe(expected);
  });
});
