// CRUD-Integrationstest für PlannerPage (Terminplaner).
// Prüft den vollständigen Flow: Termin erstellen → in der Liste sehen →
// bearbeiten (Titel + Datum ändern) → als erledigt markieren → löschen.
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PlannerPage from "@/pages/PlannerPage";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";

type Attachment = {
  _id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
};

type Message = {
  _id: string;
  authorName: string;
  text: string;
  _creationTime: number;
};

type DeadlineRecord = {
  _id: string;
  title: string;
  date: string;
  category: "abgabe" | "pruefung" | "sonstiges";
  done: boolean;
  note?: string;
  vorlesung?: string;
  attachments: Attachment[];
  messages: Message[];
  visibility: "public" | "private";
  invitees: string[];
  allowedKurse: string[];
  ownerId: string;
};

type Lecture = {
  _id: string;
  lectureName: string;
};

type Person = {
  userId: string;
  displayName: string;
};

let deadlinesStore: DeadlineRecord[] = [];
let lecturesStore: Lecture[] = [];
let peopleStore: Person[] = [];
const listeners = new Set<() => void>();
let nextId = 1;
let currentSnapshot = {
  deadlines: deadlinesStore,
  lectures: lecturesStore,
  people: peopleStore,
};

const emit = () => {
  currentSnapshot = {
    deadlines: deadlinesStore,
    lectures: lecturesStore,
    people: peopleStore,
  };
  listeners.forEach((listener) => listener());
};

const createDeadlineRecord = (overrides: Partial<DeadlineRecord>): DeadlineRecord => ({
  _id: overrides._id ?? `deadline-${nextId++}`,
  title: overrides.title ?? "Termin",
  date: overrides.date ?? "2026-11-20",
  category: overrides.category ?? "abgabe",
  done: overrides.done ?? false,
  note: overrides.note,
  vorlesung: overrides.vorlesung ?? "Software Engineering",
  attachments: overrides.attachments ?? [],
  messages: overrides.messages ?? [],
  visibility: overrides.visibility ?? "private",
  invitees: overrides.invitees ?? [],
  allowedKurse: overrides.allowedKurse ?? [],
  ownerId: overrides.ownerId ?? "demo-test-user",
});

vi.mock("@/components/Navbar", () => ({
  default: () => <nav aria-label="Mock Navbar" />,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: JSON.parse(localStorage.getItem("demo_user") || "null"),
    isAdmin: false,
    loading: false,
    signOut: async () => {},
  }),
}));

vi.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    display_name: "Planner Test User",
    studienfach: "Wirtschaftsinformatik",
    matrikelnummer: "1234567",
    hochschule: "DHBW",
    kurs: "WWI23A",
    avatar_url: null,
    created_at: "2026-06-09T08:00:00.000Z",
    role: "user",
  }),
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    deadlines: {
      listForUser: "deadlines.listForUser",
      create: "deadlines.create",
      update: "deadlines.update",
      toggleDone: "deadlines.toggleDone",
      acceptDeadline: "deadlines.acceptDeadline",
      declineDeadline: "deadlines.declineDeadline",
      deleteDeadline: "deadlines.deleteDeadline",
      addMessage: "deadlines.addMessage",
      generateUploadUrl: "deadlines.generateUploadUrl",
      attachFile: "deadlines.attachFile",
      deleteAttachment: "deadlines.deleteAttachment",
    },
    semesterLectures: {
      getLecturesForMyKurs: "semesterLectures.getLecturesForMyKurs",
    },
    profiles: {
      listSameKurs: "profiles.listSameKurs",
    },
    notifications: {
      inviteToDeadline: "notifications.inviteToDeadline",
    },
    sections: {
      list: "sections.list",
      seedDefaultSections: "sections.seedDefaultSections",
    },
    scripts: {
      listVisible: "scripts.listVisible",
    },
    groups: {
      listForUser: "groups.listForUser",
    },
    forums: {
      getPrivateForumsForUser: "forums.getPrivateForumsForUser",
    },
  },
}));

vi.mock("convex/react", async () => {
  const ReactModule = await import("react");

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const getSnapshot = () => currentSnapshot;

  return {
    useQuery: (query: string) => {
      const snapshot = ReactModule.useSyncExternalStore(subscribe, getSnapshot);

      if (query === "deadlines.listForUser") return snapshot.deadlines;
      if (query === "semesterLectures.getLecturesForMyKurs") return snapshot.lectures;
      if (query === "profiles.listSameKurs") return snapshot.people;
      if (query === "sections.list") return [];
      return [];
    },
    useMutation: (mutation: string) => {
      if (mutation === "deadlines.create") {
        return async (payload: Partial<DeadlineRecord>) => {
          const created = createDeadlineRecord({
            title: payload.title,
            date: payload.date,
            category: payload.category,
            note: payload.note,
            vorlesung: payload.vorlesung,
            visibility: payload.visibility,
            invitees: payload.invitees ?? [],
          });
          deadlinesStore = [...deadlinesStore, created];
          emit();
          return created._id;
        };
      }

      if (mutation === "deadlines.update") {
        return async (payload: { deadlineId: string } & Partial<DeadlineRecord>) => {
          deadlinesStore = deadlinesStore.map((item) =>
            item._id === payload.deadlineId
              ? {
                  ...item,
                  title: payload.title ?? item.title,
                  date: payload.date ?? item.date,
                  category: payload.category ?? item.category,
                  note: payload.note ?? item.note,
                  vorlesung: payload.vorlesung ?? item.vorlesung,
                  visibility: payload.visibility ?? item.visibility,
                  invitees: payload.invitees ?? item.invitees,
                }
              : item,
          );
          emit();
        };
      }

      if (mutation === "deadlines.toggleDone") {
        return async ({ deadlineId }: { deadlineId: string }) => {
          deadlinesStore = deadlinesStore.map((item) =>
            item._id === deadlineId ? { ...item, done: !item.done } : item,
          );
          emit();
        };
      }

      if (mutation === "deadlines.deleteDeadline") {
        return async ({ deadlineId }: { deadlineId: string }) => {
          deadlinesStore = deadlinesStore.filter((item) => item._id !== deadlineId);
          emit();
        };
      }

      return async () => {};
    },
    ConvexProviderWithClerk: ({ children }: { children: ReactModule.ReactNode }) => children,
  };
});

const seedDemoAuth = () => {
  localStorage.setItem(
    "demo_user",
    JSON.stringify({
      id: "demo-test-user",
      email: "planner-test@example.com",
      created_at: "2026-06-09T08:00:00.000Z",
    }),
  );

  localStorage.setItem(
    "demo_profile",
    JSON.stringify({
      display_name: "Planner Test User",
      studienfach: "Wirtschaftsinformatik",
      matrikelnummer: "1234567",
      hochschule: "DHBW",
      kurs: "WWI23A",
      avatar_url: null,
      created_at: "2026-06-09T08:00:00.000Z",
      role: "user",
    }),
  );
};

const renderPlanner = () =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter>
          <PlannerPage />
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

const getDeadlineRow = (title: string) => {
  const titleNode = screen.getByText(title);
  const row = titleNode.closest(".glass-card");
  expect(row).toBeTruthy();
  return row as HTMLElement;
};

const selectLecture = async (lectureName: string) => {
  // PlannerPage has multiple comboboxes (Vorlesung, Skript, Gruppe) — pick the first (Vorlesung)
  const trigger = screen.getAllByRole("combobox")[0];
  fireEvent.click(trigger);
  fireEvent.click(await screen.findByText(lectureName));
};

describe("Planner CRUD + toggle flow", () => {
  beforeEach(() => {
    localStorage.clear();
    seedDemoAuth();
    deadlinesStore = [];
    lecturesStore = [{ _id: "lecture-1", lectureName: "Software Engineering" }];
    peopleStore = [{ userId: "invitee-1", displayName: "Max Mustermann" }];
    currentSnapshot = {
      deadlines: deadlinesStore,
      lectures: lecturesStore,
      people: peopleStore,
    };
    nextId = 1;
    window.scrollTo = vi.fn();
    window.confirm = vi.fn(() => true);
    listeners.clear();
  });

  it("creates, edits, toggles and deletes an appointment", async () => {
    const initialTitle = "E2E Planner Termin 2026-06-09";
    const updatedTitle = "E2E Planner Termin 2026-06-09 bearbeitet";

    renderPlanner();

    fireEvent.click(screen.getByRole("button", { name: /Neuer Termin/i }));

    fireEvent.change(screen.getByPlaceholderText(/Hausarbeit Mathe/i), {
      target: { value: initialTitle },
    });

    const createDateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(createDateInput, {
      target: { value: "2026-11-20" },
    });

    await selectLecture("Software Engineering");

    fireEvent.click(screen.getByRole("button", { name: /^Erstellen$/i }));

    await screen.findByText(initialTitle);

    const createdRow = getDeadlineRow(initialTitle);
    fireEvent.click(within(createdRow).getByTitle("Bearbeiten"));

    fireEvent.change(screen.getByPlaceholderText(/Hausarbeit Mathe/i), {
      target: { value: updatedTitle },
    });

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, {
      target: { value: "2026-12-15" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Aktualisieren$/i }));

    await screen.findByText(updatedTitle);
    expect(screen.queryByText(initialTitle)).not.toBeInTheDocument();

    const updatedRow = getDeadlineRow(updatedTitle);
    fireEvent.click(within(updatedRow).getAllByRole("button")[0]);

    await waitFor(() => {
      expect(screen.getByText(updatedTitle)).toHaveClass("line-through");
    });

    fireEvent.click(within(getDeadlineRow(updatedTitle)).getByTitle(/L.schen/i));

    await waitFor(() => {
      expect(screen.queryByText(updatedTitle)).not.toBeInTheDocument();
    });
  });
});
