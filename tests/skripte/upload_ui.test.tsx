import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SkriptePage from "../../src/pages/SkriptePage";
import { validateFileSize, FILE_MAX_BYTES } from "../../src/lib/validation";

// ── Reactive in-memory store ──

let scriptsStore: any[] = [];
const scriptListeners = new Set<() => void>();
let scriptIdx = 0;
let scriptSnapshot = { scripts: scriptsStore };

const getScriptSnapshot = () => scriptSnapshot;

const subscribeScripts = (listener: () => void) => {
  scriptListeners.add(listener);
  return () => scriptListeners.delete(listener);
};

const emitScripts = () => {
  scriptSnapshot = { scripts: scriptsStore };
  scriptListeners.forEach((l) => l());
};

// ── Static mocks ──

vi.mock("../../src/components/Navbar", () => ({ default: () => null }));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: true, user: { id: "demo-test-user" } }),
  useClerk: () => ({ signOut: vi.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "demo-test-user", email: "test@example.com" },
    isAdmin: false,
    loading: false,
    signOut: async () => {},
  }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    display_name: "Test Nutzer",
    studienfach: "Informatik",
    matrikelnummer: "123456",
    hochschule: "DHBW Mannheim",
    jahrgang: "TINF25A",
    avatar_url: null,
    created_at: null,
    role: "user",
  }),
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    scripts: {
      listVisible: "scripts.listVisible",
      create: "scripts.create",
      deleteScript: "scripts.deleteScript",
      generateUploadUrl: "scripts.generateUploadUrl",
    },
    sections: {
      list: "sections.list",
      seedDefaultSections: "sections.seedDefaultSections",
    },
  },
}));

vi.mock("convex/react", async () => {
  const ReactModule = await import("react");

  return {
    useQuery: (query: string) => {
      const snap = ReactModule.useSyncExternalStore(subscribeScripts, getScriptSnapshot);
      if (query === "scripts.listVisible") return snap.scripts;
      if (query === "sections.list") return [];
      return undefined;
    },

    useMutation: (mutation: string) => {
      if (mutation === "scripts.create") {
        return async (payload: {
          title: string;
          subject: string;
          description: string;
          pages: number;
          type: string;
          visibility: string;
        }) => {
          const script = {
            _id: `script-${++scriptIdx}`,
            _creationTime: Date.now(),
            title: payload.title,
            subject: payload.subject,
            description: payload.description ?? "",
            authorName: "Test Nutzer",
            authorId: "demo-test-user",
            pages: payload.pages ?? 0,
            type: payload.type ?? "Notiz",
            visibility: payload.visibility,
          };
          scriptsStore = [...scriptsStore, script];
          emitScripts();
          return script._id;
        };
      }

      if (mutation === "scripts.deleteScript") {
        return async ({ scriptId }: { scriptId: string }) => {
          scriptsStore = scriptsStore.filter((s) => s._id !== scriptId);
          emitScripts();
        };
      }

      if (mutation === "scripts.generateUploadUrl") {
        return async () => "https://fake-upload.example.com";
      }

      return async () => {};
    },

    ConvexProviderWithClerk: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ── Test suite ──

describe("SkriptePage – Upload-Dialog", () => {
  beforeEach(() => {
    scriptsStore = [];
    scriptIdx = 0;
    scriptListeners.clear();
    scriptSnapshot = { scripts: scriptsStore };
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

  // FA: Datei ist Pflicht — file-input noch nicht implementiert
  it.todo("Submit-Button ist deaktiviert solange keine Datei ausgewählt ist");

  it("verhindert Submission bei ungültigen Eingaben — Formular bleibt offen", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    // Kein Titel → Validierung schlägt fehl → Formular bleibt offen
    fireEvent.click(screen.getByRole("button", { name: /Als Notiz speichern/i }));
    expect(screen.getByPlaceholderText("Titel des Skripts")).toBeInTheDocument();
  });

  // FA: Upload verweigert mit Fehlermeldung bei falschem Format — file-input noch nicht implementiert
  it.todo("zeigt Fehlermeldung bei ungültigem Dateityp");

  it("fügt neues Skript zur Liste hinzu nach erfolgreichem Upload", async () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.change(screen.getByPlaceholderText("Titel des Skripts"), {
      target: { value: "Mein Testskript" },
    });
    fireEvent.change(screen.getByPlaceholderText("Fach / Modul"), {
      target: { value: "Physik" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Als Notiz speichern/i }));

    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Titel des Skripts")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Mein Testskript")).toBeInTheDocument();
  });

  it("Sichtbarkeit-Buttons Öffentlich und Privat sind im Formular sichtbar", () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    expect(screen.getByRole("button", { name: /Öffentlich/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Privat$/i })).toBeInTheDocument();
  });

  it("privates Skript zeigt Privat-Badge in der Liste", async () => {
    render(<SkriptePage />);
    fireEvent.click(screen.getByRole("button", { name: /^Hochladen$/i }));
    fireEvent.change(screen.getByPlaceholderText("Titel des Skripts"), {
      target: { value: "Geheimes Skript" },
    });
    fireEvent.change(screen.getByPlaceholderText("Fach / Modul"), {
      target: { value: "Mathematik" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Privat$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Als Notiz speichern/i }));

    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Titel des Skripts")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Geheimes Skript")).toBeInTheDocument();
    // FA: private Sichtbarkeit — Privat-Badge sichtbar
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
