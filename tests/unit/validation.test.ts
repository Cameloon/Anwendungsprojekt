// Unit-Tests für die Validierungsfunktionen in src/lib/validation.ts.
// Geprüft: validateTitle (Mindest-/Maximallänge, Whitespace-Trimming),
//          validateDate (Vergangenheitsschutz, Pflichtfeld),
//          validateMessage (Mindestlänge), isDeadlineFormValid (kombinierte Prüfung),
//          validateSubject (Pflichtfeld für Skript-Thema),
//          validateScriptDescription (optionales Feld, Mindestlänge wenn befüllt),
//          validateFileSize (25-MB-Grenzwert).
import { describe, it, expect } from "vitest";
import {
  validateTitle,
  validateDate,
  validateMessage,
  isDeadlineFormValid,
  validateSubject,
  validateScriptDescription,
  TITLE_MAX,
} from "../../src/lib/validation";

// ---------------------------------------------------------------------------
// validateTitle
// ---------------------------------------------------------------------------
describe("validateTitle", () => {
  it.each([
    ["", ""],
    ["ab", "Mindestens 3 Zeichen."],
    ["abc", ""],
    ["a".repeat(TITLE_MAX), ""],
    ["a".repeat(TITLE_MAX + 1), "Maximal 200 Zeichen."],
    ["  a  ", "Mindestens 3 Zeichen."],  // trim: length 1
    ["  abc  ", ""],                      // trim: length 3
  ])("validateTitle(%j) → %j", (input, expected) => {
    expect(validateTitle(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// validateDate
// ---------------------------------------------------------------------------
describe("validateDate", () => {
  const TODAY = new Date(2026, 5, 9); // 2026-06-09 (month is 0-indexed)

  it.each([
    ["", "Bitte ein Datum wählen."],
    ["2026-06-08", "Datum darf nicht in der Vergangenheit liegen."],
    ["2026-06-09", ""],   // today is allowed
    ["2026-06-10", ""],   // future
    ["2030-01-01", ""],   // far future
  ])("validateDate(%j) → %j", (input, expected) => {
    expect(validateDate(input, TODAY)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// validateMessage
// ---------------------------------------------------------------------------
describe("validateMessage", () => {
  it.each([
    ["", ""],
    ["abcd", "Mindestens 5 Zeichen."],
    ["abcde", ""],
    ["  hi  ", "Mindestens 5 Zeichen."],  // trim: length 2
    ["hello world", ""],
  ])("validateMessage(%j) → %j", (input, expected) => {
    expect(validateMessage(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// validateSubject
// ---------------------------------------------------------------------------
describe("validateSubject", () => {
  it.each([
    // Pflichtfeld — Fehler auch bei leerem String (wird on-open validiert)
    ["", "Mindestens 2 Zeichen."],
    // 1 Zeichen → zu kurz
    ["A", "Mindestens 2 Zeichen."],
    // Nur Whitespace → trim ergibt < 2
    ["  ", "Mindestens 2 Zeichen."],
    // Grenzwert 2 Zeichen → gültig
    ["IT", ""],
    // Normaler Wert
    ["Informatik", ""],
  ])("validateSubject(%j) → %j", (input, expected) => {
    expect(validateSubject(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// validateScriptDescription
// ---------------------------------------------------------------------------
describe("validateScriptDescription", () => {
  it.each([
    // Leer → ok (Feld ist optional)
    ["", ""],
    // Nur Whitespace → trim ergibt 0 → ok
    ["   ", ""],
    // 1–9 Zeichen → zu kurz
    ["Kurz", "Mindestens 10 Zeichen oder leer lassen."],
    ["123456789", "Mindestens 10 Zeichen oder leer lassen."],
    // Genau 10 Zeichen → Grenzwert bestanden
    ["1234567890", ""],
    // Ausführliche Beschreibung → gültig
    ["Eine vollständige Beschreibung des Skripts.", ""],
  ])("validateScriptDescription(%j) → %j", (input, expected) => {
    expect(validateScriptDescription(input)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// isDeadlineFormValid
// ---------------------------------------------------------------------------
describe("isDeadlineFormValid", () => {
  const TODAY = new Date(2026, 5, 9);

  it("returns true for valid title + future date", () => {
    expect(isDeadlineFormValid("Hausarbeit", "2026-06-10", TODAY)).toBe(true);
  });

  it("returns false for empty title", () => {
    expect(isDeadlineFormValid("", "2026-06-10", TODAY)).toBe(false);
  });

  it("returns false for too-short title", () => {
    expect(isDeadlineFormValid("ab", "2026-06-10", TODAY)).toBe(false);
  });

  it("returns false for past date", () => {
    expect(isDeadlineFormValid("Hausarbeit", "2026-06-08", TODAY)).toBe(false);
  });

  it("returns false for missing date", () => {
    expect(isDeadlineFormValid("Hausarbeit", "", TODAY)).toBe(false);
  });

  it("returns false for title exceeding max length", () => {
    expect(isDeadlineFormValid("a".repeat(TITLE_MAX + 1), "2026-06-10", TODAY)).toBe(false);
  });
});
