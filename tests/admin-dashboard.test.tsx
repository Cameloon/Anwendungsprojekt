// Render-Test für AdminDashboardPage.
// Prüft, dass alle zentralen Admin-Bereiche (Nutzerfreischaltungen, Moderationsprotokoll,
// Vorlesungsverwaltung, Upload-Regeln) im gerenderten HTML sichtbar sind.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";

vi.mock("@clerk/clerk-react", () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: false, user: null }),
  useClerk: () => ({ signOut: vi.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn(() => Promise.resolve())),
  ConvexProviderWithClerk: ({ children }: { children: React.ReactNode }) =>
    children,
}));

describe("AdminDashboardPage", () => {
  it("renders the admin overview sections", () => {
    render(
      <ThemeProvider>
        <LanguageProvider>
          <MemoryRouter>
            <AdminDashboardPage />
          </MemoryRouter>
        </LanguageProvider>
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", {
        name: /Moderation, Freischaltungen und Vorlesungsverwaltung an einem Ort/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nutzerfreischaltungen/i)).toBeInTheDocument();
    expect(screen.getByText(/Moderationsprotokoll/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Vorlesungsverwaltung/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Material- und Upload-Regeln/i),
    ).toBeInTheDocument();
  });
});
