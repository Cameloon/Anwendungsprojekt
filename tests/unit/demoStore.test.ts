// Unit-Tests für demoStore in src/lib/demoMode.ts.
// Geprüft: signIn (User + Profil anlegen), signOut (User entfernen),
//          getUser/getProfile (Lesen aus localStorage),
//          updateProfile (partielles Mergen),
//          Fehlertoleranz bei korruptem localStorage-Inhalt.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoStore } from "../../src/lib/demoMode";

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// signIn
// ---------------------------------------------------------------------------
describe("demoStore.signIn", () => {
  it("legt einen User in localStorage an", () => {
    demoStore.signIn("test@dhbw.de");
    const user = demoStore.getUser();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("test@dhbw.de");
    expect(user?.id).toMatch(/^demo-/);
  });

  it("leitet den displayName aus der E-Mail-Adresse ab wenn keiner übergeben wird", () => {
    demoStore.signIn("max@dhbw.de");
    const profile = demoStore.getProfile();
    expect(profile?.display_name).toBe("max");
  });

  it("verwendet den übergebenen displayName statt der E-Mail", () => {
    demoStore.signIn("max@dhbw.de", "Max Mustermann");
    const profile = demoStore.getProfile();
    expect(profile?.display_name).toBe("Max Mustermann");
  });

  it("überschreibt ein bestehendes Profil nicht", () => {
    demoStore.signIn("erster@dhbw.de", "Erster");
    demoStore.signIn("zweiter@dhbw.de", "Zweiter");
    // Das zweite signIn darf das bereits vorhandene Profil nicht überschreiben
    const profile = demoStore.getProfile();
    expect(profile?.display_name).toBe("Erster");
  });
});

// ---------------------------------------------------------------------------
// signOut
// ---------------------------------------------------------------------------
describe("demoStore.signOut", () => {
  it("entfernt den User nach dem Abmelden", () => {
    demoStore.signIn("test@dhbw.de");
    demoStore.signOut();
    expect(demoStore.getUser()).toBeNull();
  });

  it("lässt das Profil nach dem Abmelden bestehen", () => {
    demoStore.signIn("test@dhbw.de");
    demoStore.signOut();
    // Profil bleibt erhalten, damit es beim nächsten signIn nicht überschrieben wird
    expect(demoStore.getProfile()).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
describe("demoStore.updateProfile", () => {
  it("merged einen Patch auf das bestehende Profil", () => {
    demoStore.signIn("test@dhbw.de");
    demoStore.updateProfile({ studienfach: "Informatik", jahrgang: "TINF23A" });
    const profile = demoStore.getProfile();
    expect(profile?.studienfach).toBe("Informatik");
    expect(profile?.jahrgang).toBe("TINF23A");
    // Unverändertes Feld bleibt erhalten
    expect(profile?.display_name).toBe("test");
  });

  it("erstellt ein Basisprofil wenn noch keines existiert", () => {
    // kein signIn zuvor — kein Profil in localStorage
    demoStore.updateProfile({ studienfach: "BWL" });
    const profile = demoStore.getProfile();
    expect(profile?.studienfach).toBe("BWL");
  });
});

// ---------------------------------------------------------------------------
// Fehlertoleranz bei korruptem localStorage
// ---------------------------------------------------------------------------
describe("demoStore Fehlertoleranz", () => {
  it("getUser() gibt null zurück wenn der localStorage-Eintrag kein gültiges JSON ist", () => {
    localStorage.setItem("demo_user", "kein-json{{{");
    expect(demoStore.getUser()).toBeNull();
  });

  it("getProfile() gibt null zurück wenn der localStorage-Eintrag kein gültiges JSON ist", () => {
    localStorage.setItem("demo_profile", "kein-json{{{");
    expect(demoStore.getProfile()).toBeNull();
  });
});
