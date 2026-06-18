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

  it("Submit-Button ist deaktiviert solange keine Datei ausgewählt ist", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.change(screen.getByPlaceholderText("Titel des Skripts"), {
      target: { value: "Testskript" },
    });
    fireEvent.change(screen.getByPlaceholderText("Fach / Modul"), {
      target: { value: "Physik" },
    });
    // Pflichtfeld Datei fehlt → Button bleibt deaktiviert (FA: Datei ist Pflicht)
    expect(screen.getByRole("button", { name: /Skript hochladen/i })).toBeDisabled();
  });

  it("verhindert Submission bei ungültigen Eingaben — Formular bleibt offen", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skript hochladen/i }));
    expect(screen.getByPlaceholderText("Titel des Skripts")).toBeInTheDocument();
  });

  it("zeigt Fehlermeldung bei ungültigem Dateityp", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(["inhalt"], "dokument.txt", { type: "text/plain" });
    Object.defineProperty(fileInput, "files", { value: [invalidFile], configurable: true });
    fireEvent.change(fileInput);
    // FA: "Upload verweigert mit erklärender Fehlermeldung bei falschem Format"
    expect(screen.getByText(/Ungültiger Dateityp/i)).toBeInTheDocument();
  });

  it("fügt neues Skript zur Liste hinzu nach erfolgreichem Upload", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.change(screen.getByPlaceholderText("Titel des Skripts"), {
      target: { value: "Mein Testskript" },
    });
    fireEvent.change(screen.getByPlaceholderText("Fach / Modul"), {
      target: { value: "Physik" },
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["inhalt"], "skript.pdf", { type: "application/pdf" });
    Object.defineProperty(fileInput, "files", { value: [validFile], configurable: true });
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByRole("button", { name: /Skript hochladen/i }));
    expect(screen.queryByPlaceholderText("Titel des Skripts")).not.toBeInTheDocument();
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
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["inhalt"], "skript.pdf", { type: "application/pdf" });
    Object.defineProperty(fileInput, "files", { value: [validFile], configurable: true });
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByRole("button", { name: /^Privat$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Skript hochladen/i }));
    expect(screen.queryByPlaceholderText("Titel des Skripts")).not.toBeInTheDocument();
    expect(screen.getByText("Geheimes Skript")).toBeInTheDocument();
    // Privat-Badge für das neue Skript sichtbar (FA: private Sichtbarkeit)
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
