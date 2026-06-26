/// <reference types="@testing-library/jest-dom" />
// Filter-Tests für DashboardPage.
// Prüft, dass der Vorlesungs-Filter Forum-Beiträge und Deadlines korrekt einschränkt —
// nur Einträge der gewählten Vorlesung werden angezeigt, alle anderen ausgeblendet.
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";

type ForumPost = {
  title: string;
  content: string;
  tag: string;
  vorlesung?: string;
};

type ScriptItem = {
  title: string;
  subject: string;
  authorName: string;
  description?: string;
};

type Lecture = {
  _id: string;
  lectureName: string;
};

type DeadlineItem = {
  _id: string;
  title: string;
  date: string;
  done: boolean;
  vorlesung?: string;
  note?: string;
};

let postsFixture: ForumPost[] = [];
let scriptsFixture: ScriptItem[] = [];
let lecturesFixture: Lecture[] = [];
let deadlinesFixture: DeadlineItem[] = [];

vi.mock("@/components/Navbar", () => ({
  default: () => <nav aria-label="Mock Navbar" />,
}));

vi.mock("@/components/GroupsPanel", () => ({
  default: () => null,
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
    display_name: "Test Nutzer",
    studienfach: "Informatik",
    matrikelnummer: "123",
    hochschule: "DHBW",
    kurs: "TINF25A",
    avatar_url: null,
    created_at: "2026-06-09T08:00:00.000Z",
    role: "user",
  }),
});

vi.mock("../../convex/_generated/api", () => ({
  api: {
    posts: { listRecent: "posts.listRecent" },
    scripts: { listPublic: "scripts.listPublic" },
    deadlines: { listForUser: "deadlines.listForUser" },
    semesterLectures: { getLecturesForMyKurs: "semesterLectures.getLecturesForMyKurs" },
    sections: { list: "sections.list", seedDefaultSections: "sections.seedDefaultSections" },
  },
}));

vi.mock("convex/react", () => ({
    useQuery: (query: string) => {
      if (query === "posts.listRecent") return postsFixture;
      if (query === "scripts.listPublic") return scriptsFixture;
      if (query === "deadlines.listForUser") return deadlinesFixture;
      if (query === "semesterLectures.getLecturesForMyKurs") return lecturesFixture;
      if (query === "sections.list") return [];
      return [];
    },
    useMutation: vi.fn(),
  ConvexProviderWithClerk: ({ children }: { children: React.ReactNode }) => children,
}));

const seedDemoAuth = () => {
  localStorage.setItem(
    "demo_user",
    JSON.stringify({ id: "demo-test-user", email: "test@example.com", created_at: "2026-06-09T08:00:00.000Z" }),
  );
  localStorage.setItem(
    "demo_profile",
    JSON.stringify({
      display_name: "Test Nutzer",
      studienfach: "Informatik",
      matrikelnummer: "123",
      hochschule: "DHBW",
      kurs: "TINF25A",
      avatar_url: null,
      created_at: "2026-06-09T08:00:00.000Z",
    }),
  );
};

const renderDashboard = () =>
  render(
    <ThemeProvider>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/planner" element={<div>Planner Route</div>} />
            <Route path="/forum" element={<div>Forum Route</div>} />
            <Route path="/skripte" element={<div>Skripte Route</div>} />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </ThemeProvider>,
  );

describe("Dashboard lecture filter", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    seedDemoAuth();
    postsFixture = [];
    scriptsFixture = [];
    lecturesFixture = [];
    deadlinesFixture = [];
  });

  it("filters forum posts and deadlines by selected lecture", async () => {
    lecturesFixture = [
      { _id: "lec-1", lectureName: "Informatik" },
      { _id: "lec-2", lectureName: "Mathematik" },
    ];
    postsFixture = [
      { title: "Informatik Beitrag", content: "Content A", tag: "Informatik", vorlesung: "Informatik" },
      { title: "Mathematik Beitrag", content: "Content B", tag: "Mathematik", vorlesung: "Mathematik" },
    ];
    deadlinesFixture = [
      { _id: "d-1", title: "Informatik Termin", date: "2026-11-20", done: false, vorlesung: "Informatik" },
      { _id: "d-2", title: "Mathe Termin", date: "2026-11-21", done: false, vorlesung: "Mathematik" },
    ];

    renderDashboard();

    // Initially no filter active — "Alle Vorlesungen" heading and both items visible
    expect(await screen.findByRole("heading", { name: /Alle Vorlesungen/i })).toBeInTheDocument();
    expect(screen.getByText("Informatik Beitrag")).toBeInTheDocument();
    expect(screen.getByText("Mathematik Beitrag")).toBeInTheDocument();

    // Click the "Informatik" lecture filter card
    fireEvent.click(screen.getByRole("button", { name: /Informatik/i }));

    // Section heading (h2) changes to the selected subject
    expect(await screen.findByRole("heading", { name: /^Informatik$/i, level: 2 })).toBeInTheDocument();

    // Widgets switch to filtered titles (without "Alle")
    expect(screen.getByRole("heading", { name: /^Forenbeiträge$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Termine$/i })).toBeInTheDocument();

    // Informatik content is visible
    expect(screen.getByText("Informatik Beitrag")).toBeInTheDocument();
    expect(screen.getAllByText("Informatik Termin").length).toBeGreaterThan(0);

    // Mathematik content is hidden
    expect(screen.queryByText("Mathematik Beitrag")).not.toBeInTheDocument();
    expect(screen.queryByText("Mathe Termin")).not.toBeInTheDocument();

    // "Gesamtübersicht" button is now enabled
    expect(screen.getByRole("button", { name: /Gesamtübersicht/i })).not.toBeDisabled();
  });

  // Skripte-Filterung ist in Arbeit (siehe Issue #47) — aktivieren sobald subject-Feld korrekt befüllt wird
  it.todo("filters scripts by selected lecture — aktivieren sobald subject-Feld korrekt befüllt wird (Issue #47)", async () => {
    lecturesFixture = [
      { _id: "lec-1", lectureName: "Informatik" },
      { _id: "lec-2", lectureName: "Mathematik" },
    ];
    scriptsFixture = [
      { title: "Algo Skript", subject: "Informatik", authorName: "Dr. A" },
      { title: "Analysis Skript", subject: "Mathematik", authorName: "Dr. B" },
    ];

    renderDashboard();

    fireEvent.click(await screen.findByRole("button", { name: /Informatik/i }));

    expect(await screen.findByRole("heading", { name: /^Informatik$/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Algo Skript")).toBeInTheDocument();
    expect(screen.queryByText("Analysis Skript")).not.toBeInTheDocument();
  });

  it("shows empty-state texts per widget when selected lecture has no matching content", async () => {
    lecturesFixture = [
      { _id: "lec-1", lectureName: "Informatik" },
      { _id: "lec-2", lectureName: "Mathematik" },
    ];
    // All content belongs to Informatik only
    postsFixture = [
      { title: "Informatik Beitrag", content: "Content A", tag: "Informatik", vorlesung: "Informatik" },
    ];
    scriptsFixture = [
      { title: "Algo Skript", subject: "Informatik", authorName: "Dr. A" },
    ];
    deadlinesFixture = [
      { _id: "d-1", title: "Informatik Termin", date: "2026-11-20", done: false, vorlesung: "Informatik" },
    ];

    renderDashboard();

    // Click "Mathematik" — which has no associated content
    const mathematikCard = await screen.findByRole("button", { name: /Mathematik/i });
    fireEvent.click(mathematikCard);

    expect(await screen.findByRole("heading", { name: /^Mathematik$/i, level: 2 })).toBeInTheDocument();

    expect(screen.getByText(/Keine Beitr/i)).toBeInTheDocument();
    expect(screen.getByText(/Keine Skripte/i)).toBeInTheDocument();
    expect(screen.getByText(/Keine Termine/i)).toBeInTheDocument();
  });

  it("resets to full overview when 'Gesamtübersicht' is clicked after filtering", async () => {
    lecturesFixture = [{ _id: "lec-1", lectureName: "Informatik" }];
    postsFixture = [
      { title: "Informatik Beitrag", content: "Content A", tag: "Informatik", vorlesung: "Informatik" },
    ];
    scriptsFixture = [];
    deadlinesFixture = [];

    renderDashboard();

    // Activate filter
    fireEvent.click(await screen.findByRole("button", { name: /Informatik/i }));
    expect(await screen.findByRole("heading", { name: /^Informatik$/i, level: 2 })).toBeInTheDocument();

    // Reset filter
    fireEvent.click(screen.getByRole("button", { name: /Gesamtübersicht/i }));

    // Back to "Alle Vorlesungen" heading and unfiltered widget titles
    expect(await screen.findByRole("heading", { name: /Alle Vorlesungen/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Alle Forenbeiträge/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Alle Skripte/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Alle Termine/i })).toBeInTheDocument();

    // "Gesamtübersicht" is disabled again
    expect(screen.getByRole("button", { name: /Gesamtübersicht/i })).toBeDisabled();
  });
});
