# AGENT.md

## Project Overview

- **Type:** Vite + React 18 + TypeScript web application
- **Backend:** Convex (serverless backend)
- **Styling:** Tailwind CSS + shadcn/ui (Radix UI components)
- **Auth:** Clerk
- **Database:** Convex + Supabase
- **Package Manager:** Bun (npm also supported)
- **Testing:** Vitest + Testing Library
- **Linting:** ESLint

## Key Commands

```bash
bun install          # Install dependencies
bun dev              # Start development server
bun build            # Production build
bun build:dev        # Dev mode build
bun preview          # Preview production build
bun lint             # Run ESLint
bun test             # Run tests
bun test:watch       # Run tests in watch mode
```

## Project Structure

```
├── convex/              # Convex backend (schema, functions, auth)
│   ├── schema.ts        # DB schema: profiles table
│   ├── profiles.ts      # User profile queries/mutations
│   ├── admin.ts         # Admin-only functions
│   └── auth.config.ts   # Clerk JWT auth config
├── src/
│   ├── components/      # React components
│   │   ├── ui/          # shadcn/ui primitives
│   │   ├── Navbar.tsx   # Top nav (adapts based on access status)
│   │   ├── ProtectedRoute.tsx  # Auth + access status guard
│   │   ├── AdminRoute.tsx       # Admin-only route guard
│   │   ├── OnboardingDialog.tsx # Forced profile completion
│   │   ├── AccountSettingsDialog.tsx  # Profile edit dialog
│   │   ├── EnsureProfile.tsx    # Auto-creates profile on sign-up
│   │   └── ...           # Other components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries & data lists
│   │   ├── dhbw.ts      # DHBW_STANDORTE list
│   │   ├── studienfach.ts # STUDIENFAECHER list (38 entries)
│   │   ├── jahrgang.ts  # JAHRGAENGE list (course×year×class)
│   │   └── ...
│   ├── pages/           # Page components (React Router)
│   ├── test/            # Test files
│   ├── App.tsx          # Root component + routing
│   └── main.tsx         # Entry point (Clerk + Convex providers)
├── public/
└── docs/
```

## Conventions

### Code Style
- TypeScript throughout (strict mode)
- ES modules (`"type": "module"`)
- Functional React components with hooks
- shadcn/ui component patterns (class-variance-authority, tailwind-merge, clsx)
- React Hook Form + Zod for form validation
- TanStack React Query for data fetching

### Component Patterns
- Use `cn()` utility from `lib/utils` for className merging
- Follow shadcn/ui conventions for component structure
- Use `lucide-react` for icons
- Use `sonner` for toast notifications
- Demo mode (`IS_DEMO`) uses conditional hooks pattern (project-wide convention)

### Backend (Convex)
- Schema defined in `convex/schema.ts`
- Auth configuration in `convex/auth.config.ts`
- Functions in `convex/*.ts` files
- Run `npx convex dev` during development to sync schema + functions
- Run `npx convex deploy` for production deployment

### Auth & Access Flow
1. **Clerk sign-up** → `EnsureProfile` creates a Convex profile with `role: "user"`
2. **Onboarding** → `OnboardingDialog` forces user to fill: `displayName`, `studienfach`, `matrikelnummer`, `hochschule`, `jahrgang` (all via searchable Comboboxes)
3. **Status `"pending"`** → Set after onboarding completion; user sees "Freischaltung ausstehend" page
4. **Admin approval** → Admin dashboard shows pending users; admin clicks "Freigeben" → `status: "active"` or "Ablehnen" → `status: "rejected"`
5. **Access** → `ProtectedRoute` uses `getAccessStatus` query → shows onboarding / pending / rejected / active states
6. **Admin users** (`role: "admin"`) bypass approval — always `"active"`
7. **Navbar** adapts: before approval only shows "Zugang freischalten"; after approval shows full navigation

### Profile Schema (`profiles` table)
| Field | Type | Notes |
|-------|------|-------|
| `userId` | `string` | Clerk user ID, indexed |
| `email` | `optional string` | |
| `displayName` | `optional string` | Required for completion |
| `studienfach` | `optional string` | Selected from `STUDIENFAECHER` list |
| `matrikelnummer` | `optional string` | 5-10 digits |
| `hochschule` | `optional string` | Selected from `DHBW_STANDORTE` |
| `jahrgang` | `optional string` | Selected from `JAHRGAENGE` list |
| `role` | `optional "admin" \| "user"` | Defaults to `"user"` |
| `status` | `optional "pending" \| "active" \| "rejected"` | Approval state |
| `createdAt` / `updatedAt` | `number` | |

### Testing
- Tests use Vitest + @testing-library/react
- Test files located in `src/test/`
- Run with `bun test`

### Layout
- Navbar is `fixed top-0`, pages use `pt-32 md:pt-24` to clear it
- Footer is a sticky flexbox element (not fixed)
- Mobile navbar is taller (~108px) due to bottom nav strip

## Team (GitHub Mapping)

| Name            | GitHub      |
|-----------------|-------------|
| Sofia Antropova | antropos-v  |
| Daniel Beljaew  | Cameloon    |
| Niklas Brietenhahn | niklas-b1 |
| Alexia Dinu     | dinua23     |
| Daniela Maier   | njela0      |

## Active Issues

- #44 — Forum: Kursübergreifendes Forum
- #45 — Forum: Terminspezifisches Forum
- #46 — User-Management & DHBW-Kurs-Verknüpfung
- #47 — Material-Upload (Vorlesungsmaterial)
- #48 — Dashboard-Integration
