import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
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

let postsFixture: ForumPost[] = [];
let scriptsFixture: ScriptItem[] = [];
let lecturesFixture: Lecture[] = [];

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

vi.mock("../../convex/_generated/api", () => ({
  api: {
    posts: { listRecent: "posts.listRecent" },
    scripts: { listPublic: "scripts.listPublic" },
    semesterLectures: { getLecturesForMyJahrgang: "semesterLectures.getLecturesForMyJahrgang" },
  },
}));

vi.mock("convex/react", async () => {
  const ReactModule = await import("react");

  return {
    useQuery: (query: string) => {
      if (query === "posts.listRecent") return postsFixture;
      if (query === "scripts.listPublic") return scriptsFixture;
      if (query === "semesterLectures.getLecturesForMyJahrgang") return lecturesFixture;
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
      jahrgang: "TINF25A",
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

    renderDashboard();

    const postsHeading = await screen.findByRole("heading", { name: /Aktuelle Forenbeitr/i });
    const scriptsHeading = screen.getByRole("heading", { name: /Neueste Skripte/i });

    const postsBlock = postsHeading.closest("section") as HTMLElement;
    const scriptsBlock = scriptsHeading.closest("section") as HTMLElement;

    expect(within(postsBlock).queryAllByRole("listitem").length).toBeGreaterThan(0);
    expect(within(scriptsBlock).queryAllByRole("listitem").length).toBeGreaterThan(0);

    fireEvent.click(within(postsBlock).getByRole("link", { name: /Forum/i }));
    expect(await screen.findByText(/Forum Route/i)).toBeInTheDocument();

    cleanup();
    seedDemoAuth();
    renderDashboard();

    const refreshedScriptsBlock = (await screen.findByRole("heading", { name: /Neueste Skripte/i })).closest("section") as HTMLElement;
    fireEvent.click(within(refreshedScriptsBlock).getByRole("link", { name: /Bibliothek/i }));
    expect(await screen.findByText(/Skripte Route/i)).toBeInTheDocument();
  });

  it("shows empty-state text when no lectures, posts and scripts exist", async () => {
    renderDashboard();

    expect(await screen.findByText(/Keine Inhalte fuer die gewaehlte Filtereinstellung|Keine Inhalte für die gewählte Filtereinstellung/i)).toBeInTheDocument();

    const uploadButton = screen.getByRole("button", { name: /Aktuelle Uploads/i });
    fireEvent.click(uploadButton);

    expect(await screen.findByText(/Keine Beitraege|Keine Beiträge/i)).toBeInTheDocument();
    expect(screen.getByText(/Keine Skripte/i)).toBeInTheDocument();
  });
});
