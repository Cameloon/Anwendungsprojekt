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
├── convex/            # Convex backend (schema, functions, auth)
├── src/
│   ├── components/    # React components (shadcn/ui + custom)
│   ├── hooks/         # Custom React hooks
│   ├── integrations/  # External service integrations
│   ├── lib/           # Utility libraries
│   ├── pages/         # Page components (React Router)
│   ├── test/          # Test files
│   ├── App.tsx        # Main React component
│   └── main.tsx       # Entry point
├── public/            # Static assets
└── docs/              # Documentation
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

### Backend (Convex)
- Schema defined in `convex/schema.ts`
- Auth configuration in `convex/auth.config.ts`
- Functions in `convex/*.ts` files

### Testing
- Tests use Vitest + @testing-library/react
- Test files located in `src/test/`
- Run with `bun test`

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
