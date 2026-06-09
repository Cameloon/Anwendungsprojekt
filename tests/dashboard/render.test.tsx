import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "@/pages/DashboardPage";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";

vi.mock("@/components/Navbar", () => ({ default: () => <nav aria-label="Mock Navbar" /> }));

// Ensure demo auth is used in tests
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: JSON.parse(localStorage.getItem("demo_user") || "null"), isAdmin: false, loading: false, signOut: async () => {} }),
}));

const seedDemoAuth = () => {
  localStorage.setItem(
    "demo_user",
    JSON.stringify({ id: "demo-test-user", email: "test@example.com", created_at: "2026-06-09T08:00:00.000Z" }),
  );
  localStorage.setItem(
    "demo_profile",
    JSON.stringify({ display_name: "Test Nutzer", studienfach: "Informatik", matrikelnummer: "123", hochschule: "DHBW", jahrgang: "TINF25A", avatar_url: null, created_at: "2026-06-09T08:00:00.000Z" }),
  );
};

const seedPlannerTasks = () => {
  localStorage.setItem(
    "planner_tasks_v1",
    JSON.stringify([
      {
        id: "task-1",
        title: "Planner Dashboard Aufgabe",
        due: "2026-06-20",
        fach: "Informatik",
        done: false,
      },
    ]),
  );
};

const seedForumPosts = () => {
  localStorage.setItem(
    "forum_posts_v1",
    JSON.stringify([
      {
        id: "post-1",
        author: "Test Nutzer",
        title: "Beitrag für Dashboard",
        content: "Kurzbeschreibung",
        date: "09.06.2026, 08:00",
        likes: 0,
        replies: 0,
        tag: "diskussion",
        fach: "Informatik",
        visibility: "public",
      },
    ]),
  );
};

const seedScripts = () => {
  localStorage.setItem(
    "scripts_v1",
    JSON.stringify([
      { id: "s1", title: "Algorithmen Skript", subject: "Informatik", description: "Algo", author: "Dr. A", date: "01.04.2026", pages: 10, type: "PDF", visibility: "public" },
    ]),
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
    seedDemoAuth();
    cleanup();
  });

  it("shows entries for tasks, forum and scripts and links navigate", async () => {
    // Seed planner, forum and script fixtures so all three widgets contain items.
    seedPlannerTasks();
    seedForumPosts();
    seedScripts();

    renderDashboard();

    // Overview blocks have headings we can target
    const tasksHeading = await screen.findByRole("heading", { name: /Aktuelle Abgaben/i });
    const postsHeading = screen.getByRole("heading", { name: /Aktuelle Forenbeiträge/i });
    const scriptsHeading = screen.getByRole("heading", { name: /Neueste Skripte/i });

    // Ensure there is at least one listitem in each block
    const tasksBlock = tasksHeading.closest("div") as HTMLElement;
    const postsBlock = postsHeading.closest("div") as HTMLElement;
    const scriptsBlock = scriptsHeading.closest("div") as HTMLElement;

    expect(within(tasksBlock).queryAllByRole("listitem").length).toBeGreaterThan(0);
    expect(within(postsBlock).queryAllByRole("listitem").length).toBeGreaterThan(0);
    expect(within(scriptsBlock).queryAllByRole("listitem").length).toBeGreaterThan(0);

    // Links exist and point to correct routes
    const plannerLink = within(tasksBlock).getByRole("link", { name: /Planner/i });
    const forumLink = within(postsBlock).getByRole("link", { name: /Forum/i });
    const skripteLink = within(scriptsBlock).getByRole("link", { name: /Bibliothek/i });

    expect((plannerLink as HTMLAnchorElement).getAttribute("href")).toBe("/planner");
    expect((forumLink as HTMLAnchorElement).getAttribute("href")).toBe("/forum");
    expect((skripteLink as HTMLAnchorElement).getAttribute("href")).toBe("/skripte");

    // Simulate clicks and assert the target route renders.
    fireEvent.click(plannerLink);
    expect(await screen.findByText(/Planner Route/i)).toBeTruthy();

    cleanup();
    seedDemoAuth();
    seedPlannerTasks();
    seedForumPosts();
    seedScripts();
    renderDashboard();
    const refreshedForumBlock = screen.getByRole("heading", { name: /Aktuelle Forenbeiträge/i }).closest("div") as HTMLElement;
    fireEvent.click(within(refreshedForumBlock).getByRole("link", { name: /Forum/i }));
    expect(await screen.findByText(/Forum Route/i)).toBeTruthy();

    cleanup();
    seedDemoAuth();
    seedPlannerTasks();
    seedForumPosts();
    seedScripts();
    renderDashboard();
    const refreshedScriptsBlock = screen.getByRole("heading", { name: /Neueste Skripte/i }).closest("div") as HTMLElement;
    fireEvent.click(within(refreshedScriptsBlock).getByRole("link", { name: /Bibliothek/i }));
    expect(await screen.findByText(/Skripte Route/i)).toBeTruthy();
  });

  it("shows empty-state text when fixtures are empty", async () => {
    // Ensure empty stores for all three areas.
    localStorage.setItem("planner_tasks_v1", JSON.stringify([]));
    localStorage.removeItem("forum_posts_v1");
    localStorage.setItem("scripts_v1", JSON.stringify([]));

    renderDashboard();

    // When no subjects exist, subjects grid shows a clear message
    expect(await screen.findByText(/Keine Inhalte für die gewählte Filtereinstellung\./i)).toBeTruthy();

    // Switch to 'Aktuelle Uploads' overview to see empty block texts
    const uploadButton = screen.getByRole("button", { name: /Aktuelle Uploads/i });
    fireEvent.click(uploadButton);

    // Each block should display its empty text
    expect(await screen.findByText(/Keine offenen Aufgaben\./i)).toBeTruthy();
    expect(screen.getByText(/Keine Beiträge\./i)).toBeTruthy();
    expect(screen.getByText(/Keine Skripte\./i)).toBeTruthy();
  });
});
