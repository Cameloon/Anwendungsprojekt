import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PlannerPage from "@/pages/PlannerPage";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";

vi.mock("@/components/Navbar", () => ({
  default: () => <nav aria-label="Mock Navbar" />,
}));

// Mock the auth hook so the app uses demo/localStorage auth in tests and
// does not require the ClerkProvider wrapper.
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: JSON.parse(localStorage.getItem("demo_user") || "null"),
    isAdmin: false,
    loading: false,
    signOut: async () => {},
  }),
}));

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
      jahrgang: "WWI23A",
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
  const row = titleNode.closest(".group");
  expect(row).toBeTruthy();
  return row as HTMLElement;
};

describe("Planner CRUD + toggle flow", () => {
  beforeEach(() => {
    localStorage.clear();
    seedDemoAuth();
    window.scrollTo = vi.fn();
  });

  it("creates, edits, toggles and deletes an appointment", async () => {
    const initialTitle = "E2E Planner Termin 2026-06-09";
    const updatedTitle = "E2E Planner Termin 2026-06-09 (bearbeitet)";

    const { container } = renderPlanner();

    fireEvent.click(screen.getByRole("button", { name: /Neuer Termin/i }));

    fireEvent.change(screen.getByPlaceholderText(/Titel des Termins/i), {
      target: { value: initialTitle },
    });

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement | null;
    expect(dateInput).toBeTruthy();
    fireEvent.change(dateInput as HTMLInputElement, {
      target: { value: "2026-11-20" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Hinzufügen$/i }));

    await screen.findByText(initialTitle);

    const createdRow = getDeadlineRow(initialTitle);
    fireEvent.click(within(createdRow).getByRole("button", { name: /Bearbeiten/i }));

    const titleInput = screen.getByPlaceholderText(/Titel des Termins/i);
    fireEvent.change(titleInput, { target: { value: updatedTitle } });
    fireEvent.change(container.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: "2026-12-15" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Speichern$/i }));

    await screen.findByText(updatedTitle);
    expect(screen.queryByText(initialTitle)).not.toBeInTheDocument();

    const updatedRow = getDeadlineRow(updatedTitle);
    fireEvent.click(
      within(updatedRow).getByRole("button", {
        name: /Als erledigt markieren/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(updatedTitle)).toHaveClass("line-through");
    });

    fireEvent.click(within(getDeadlineRow(updatedTitle)).getByRole("button", { name: /Löschen/i }));

    await waitFor(() => {
      expect(screen.queryByText(updatedTitle)).not.toBeInTheDocument();
    });
  });
});
