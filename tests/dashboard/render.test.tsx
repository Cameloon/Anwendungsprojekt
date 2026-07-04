// Render-Tests für DashboardPage.
// Prüft, dass aktuelle Forum-Beiträge und Skripte als Widgets angezeigt werden
// und die Navigationslinks auf die richtigen Zielseiten verweisen.
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";

type ForumPost = {
  title: string;
  content: string;
  tag: string;
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
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    posts: { listRecent: "posts.listRecent" },
    scripts: { listVisible: "scripts.listVisible" },
    deadlines: { listForUser: "deadlines.listForUser" },
    semesterLectures: { getLecturesForMyKurs: "semesterLectures.getLecturesForMyKurs" },
    sections: { list: "sections.list", seedDefaultSections: "sections.seedDefaultSections" },
  },
}));

vi.mock("convex/react", async () => {
  const ReactModule = await import("react");

  return {
    useQuery: (query: string) => {
      if (query === "posts.listRecent") return postsFixture;
      if (query === "scripts.listVisible") return scriptsFixture;
      if (query === "deadlines.listForUser") return deadlinesFixture;
      if (query === "semesterLectures.getLecturesForMyKurs") return lecturesFixture;
      if (query === "sections.list") return [];
      return [];
    },
    useMutation: vi.fn(),
    ConvexProviderWithClerk: ({ children }: { children: ReactModule.ReactNode }) => children,
  };
});

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

describe("Dashboard render and widgets", () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    seedDemoAuth();
    postsFixture = [];
    scriptsFixture = [];
    lecturesFixture = [];
    deadlinesFixture = [];
  });

  it("shows current forum and scripts widgets and links navigate", async () => {
    lecturesFixture = [{ _id: "lecture-1", lectureName: "Informatik" }];
    postsFixture = [
      {
        title: "Beitrag fuer Dashboard",
        content: "Kurzbeschreibung",
        tag: "Informatik",
      },
    ];
    scriptsFixture = [
      {
        title: "Algorithmen Skript",
        subject: "Informatik",
        authorName: "Dr. A",
        description: "Algo",
      },
    ];
    deadlinesFixture = [
      {
        _id: "deadline-1",
        title: "Dashboard Termin",
        date: "2026-11-20",
        done: false,
        vorlesung: "Informatik",
      },
    ];

    renderDashboard();

    const postsHeading = await screen.findByRole("heading", { name: /Alle Forenbeitr/i });
    const scriptsHeading = screen.getByRole("heading", { name: /Alle Skripte/i });

    const postsBlock = postsHeading.parentElement?.parentElement as HTMLElement;
    const scriptsBlock = scriptsHeading.parentElement?.parentElement as HTMLElement;

    expect(within(postsBlock).queryAllByRole("listitem").length).toBeGreaterThan(0);
    expect(within(scriptsBlock).queryAllByRole("listitem").length).toBeGreaterThan(0);

    fireEvent.click(within(postsBlock).getByRole("link", { name: /Forum/i }));
    expect(await screen.findByText(/Forum Route/i)).toBeInTheDocument();

    cleanup();
    seedDemoAuth();
    postsFixture = [
      {
        title: "Beitrag fuer Dashboard",
        content: "Kurzbeschreibung",
        tag: "Informatik",
      },
    ];
    scriptsFixture = [
      {
        title: "Algorithmen Skript",
        subject: "Informatik",
        authorName: "Dr. A",
        description: "Algo",
      },
    ];
    lecturesFixture = [{ _id: "lecture-1", lectureName: "Informatik" }];
    deadlinesFixture = [
      {
        _id: "deadline-1",
        title: "Dashboard Termin",
        date: "2026-11-20",
        done: false,
        vorlesung: "Informatik",
      },
    ];
    renderDashboard();

    const refreshedScriptsBlock = (await screen.findByRole("heading", { name: /Alle Skripte/i }))
      .parentElement?.parentElement as HTMLElement;
    fireEvent.click(within(refreshedScriptsBlock).getByRole("link", { name: /Bibliothek/i }));
    expect(await screen.findByText(/Skripte Route/i)).toBeInTheDocument();
  });

  it("shows empty-state text when no lectures, posts and scripts exist", async () => {
    renderDashboard();

    expect(await screen.findByText(/Keine Inhalte .* Filtereinstellung/i)).toBeInTheDocument();

    const overviewButton = screen.getByRole("button", { name: /Gesamt/i });
    expect(overviewButton).toBeDisabled();

    expect(await screen.findByText(/Keine Beitr/i)).toBeInTheDocument();
    expect(screen.getByText(/Keine Skripte/i)).toBeInTheDocument();
    expect(screen.getByText(/Keine Termine/i)).toBeInTheDocument();
  });
});
