// UI-Tests für den Upload-Dialog auf SkriptePage sowie Unit-Tests für validateFileSize.
// Prüft: Dialog öffnet/schließt sich korrekt; Validierung verhindert leere Submissions;
//        hochgeladenes Skript erscheint in der Liste mit korrektem Sichtbarkeits-Badge (Öffentlich/Privat);
//        validateFileSize lehnt Dateien über 25 MB ab.
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

vi.mock("@/components/ui/combobox", () => ({
  default: ({ value, onChange, options, placeholder }: any) => (
    <select
      data-testid="subject-combobox"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((opt: any) => {
        const v = typeof opt === "string" ? opt : opt.value;
        const l = typeof opt === "string" ? opt : opt.label;
        return <option key={v} value={v}>{l}</option>;
      })}
    </select>
  ),
}));

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
    semesterLectures: {
      getLecturesForMyJahrgang: "semesterLectures.getLecturesForMyJahrgang",
    },
    groups: {
      listForUser: "groups.listForUser",
    },
  },
}));

vi.mock("convex/react", async () => {
  const ReactModule = await import("react");

  const lectureData = [
    { _id: "lecture-1", _creationTime: Date.now(), kurs: "TINF", semesterNumber: 3, lectureName: "Webprogrammierung", createdAt: Date.now() },
    { _id: "lecture-2", _creationTime: Date.now(), kurs: "TINF", semesterNumber: 3, lectureName: "Software Engineering", createdAt: Date.now() },
  ];

  function resolveSubject(subj: any): string {
    if (typeof subj === "string") return subj;
    const lecture = lectureData.find((l) => l._id === subj.lectureId);
    return lecture?.lectureName ?? "Unbekannt";
  }

  return {
    useQuery: (query: string) => {
      const snap = ReactModule.useSyncExternalStore(subscribeScripts, getScriptSnapshot);
      if (query === "scripts.listVisible") return snap.scripts.map((s: any) => ({ ...s, subject: resolveSubject(s.subject) }));
      if (query === "semesterLectures.getLecturesForMyJahrgang") return lectureData;
      if (query === "groups.listForUser") return [];
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
    fireEvent.change(screen.getByTestId("subject-combobox"), {
      target: { value: "lecture-1" },
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
    fireEvent.change(screen.getByTestId("subject-combobox"), {
      target: { value: "lecture-2" },
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
// Skripte-Suche und Subject-Filter
// ---------------------------------------------------------------------------
describe("SkriptePage – Suche und Subject-Filter", () => {
  // Hilfsfunktion: Skript direkt in den Store laden (kein UI-Upload nötig)
  const seed = (scripts: Array<{ title: string; subject: string; description: string; visibility?: string }>) => {
    scriptsStore = scripts.map((s, i) => ({
      _id: `script-seed-${i}`,
      _creationTime: Date.now() + i,
      title: s.title,
      subject: s.subject,
      description: s.description ?? "",
      authorName: "Test Nutzer",
      authorId: "demo-test-user",
      pages: 0,
      type: "Notiz",
      visibility: s.visibility ?? "public",
    }));
    emitScripts();
  };

  beforeEach(() => {
    scriptsStore = [];
    scriptIdx = 0;
    scriptListeners.clear();
    scriptSnapshot = { scripts: [] };
  });

  it("zeigt alle Skripte wenn Suche leer und Filter 'alle'", async () => {
    seed([
      { title: "Analysis Zusammenfassung", subject: "Mathematik", description: "" },
      { title: "OOP Grundlagen", subject: "Informatik", description: "" },
    ]);
    const { findByText } = render(<SkriptePage />);
    expect(await findByText("Analysis Zusammenfassung")).toBeInTheDocument();
    expect(await findByText("OOP Grundlagen")).toBeInTheDocument();
  });

  it("filtert nach Suchwort im Titel", async () => {
    seed([
      { title: "Analysis Zusammenfassung", subject: "Mathematik", description: "" },
      { title: "OOP Grundlagen", subject: "Informatik", description: "" },
    ]);
    render(<SkriptePage />);
    fireEvent.change(screen.getByPlaceholderText(/Skripte durchsuchen/i), {
      target: { value: "Analysis" },
    });
    expect(await screen.findByText("Analysis Zusammenfassung")).toBeInTheDocument();
    expect(screen.queryByText("OOP Grundlagen")).not.toBeInTheDocument();
  });

  it("findet Skripte über Suchbegriff in der Beschreibung", async () => {
    seed([
      { title: "Skript A", subject: "Mathematik", description: "Enthält Integralrechnung" },
      { title: "Skript B", subject: "Informatik", description: "Objektorientierung" },
    ]);
    render(<SkriptePage />);
    fireEvent.change(screen.getByPlaceholderText(/Skripte durchsuchen/i), {
      target: { value: "Integralrechnung" },
    });
    expect(await screen.findByText("Skript A")).toBeInTheDocument();
    expect(screen.queryByText("Skript B")).not.toBeInTheDocument();
  });

  it("Subject-Filter blendet andere Vorlesungen aus", async () => {
    seed([
      { title: "Analysis Zusammenfassung", subject: "Webprogrammierung", description: "" },
      { title: "OOP Grundlagen", subject: "Software Engineering", description: "" },
    ]);
    render(<SkriptePage />);
    // Subject-Filter-Buttons erscheinen sobald Skripte geladen sind
    const filterBtn = await screen.findByRole("button", { name: /^Webprogrammierung$/i });
    fireEvent.click(filterBtn);
    expect(screen.getByText("Analysis Zusammenfassung")).toBeInTheDocument();
    expect(screen.queryByText("OOP Grundlagen")).not.toBeInTheDocument();
  });

  it("Suche und Subject-Filter wirken kombiniert (AND-Logik)", async () => {
    seed([
      { title: "Analysis Skript", subject: "Webprogrammierung", description: "" },
      { title: "Analysis Notiz", subject: "Software Engineering", description: "" },
      { title: "OOP Grundlagen", subject: "Webprogrammierung", description: "" },
    ]);
    render(<SkriptePage />);
    const filterBtn = await screen.findByRole("button", { name: /^Webprogrammierung$/i });
    fireEvent.click(filterBtn);
    fireEvent.change(screen.getByPlaceholderText(/Skripte durchsuchen/i), {
      target: { value: "Analysis" },
    });
    // Nur das Skript, das BEIDE Bedingungen erfüllt, ist sichtbar
    expect(screen.getByText("Analysis Skript")).toBeInTheDocument();
    expect(screen.queryByText("Analysis Notiz")).not.toBeInTheDocument();
    expect(screen.queryByText("OOP Grundlagen")).not.toBeInTheDocument();
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
