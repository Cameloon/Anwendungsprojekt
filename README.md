# Anwendungsprojekt

## Setup & Inbetriebnahme

Anleitung zum lokalen Einrichten der Anwendung.

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18 oder neuer) **oder** [Bun](https://bun.sh/) installiert
- Git installiert
- Zugangsdaten zu den Diensten (werden vom Team bereitgestellt):
  - [Clerk](https://clerk.com/) – für Authentifizierung
  - [Convex](https://convex.dev/) – für die Datenbank/Backend

### 1. Repository klonen

```bash
git clone https://github.com/Cameloon/Anwendungsprojekt.git
cd Anwendungsprojekt
```

### 2. Abhängigkeiten installieren

```bash
bun install
# oder alternativ:
npm install
```

### 3. Umgebungsvariablen einrichten

Eine Datei `.env` im Projektordner anlegen (auf Basis der benötigten Schlüssel):

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...        # Clerk Publishable Key
VITE_CONVEX_URL=https://...convex.cloud       # Convex Deployment URL
CLERK_FRONTEND_API_URL=https://...clerk.accounts.dev
```

Die tatsächlichen Werte bekommt ihr vom Team oder aus den jeweiligen Dashboards:

- Clerk-Schlüssel: [dashboard.clerk.com](https://dashboard.clerk.com/) → Projekt → API Keys
- Convex-URL: [dashboard.convex.dev](https://dashboard.convex.dev/) → Projekt → Settings → URL & Deploy Key

### 4. Convex Backend verbinden

```bash
npx convex dev
```

Dieser Befehl synchronisiert das Schema und die Backend-Funktionen mit dem Convex-Projekt. Er muss **parallel** zum Frontend laufen (am besten in einem zweiten Terminal).

### 5. Entwicklungsserver starten

```bash
bun dev
# oder:
npm run dev
```

Die Anwendung ist danach unter [http://localhost:5173](http://localhost:5173) erreichbar.

> **Hinweis:** Beide Prozesse (`convex dev` und `bun dev`) müssen gleichzeitig laufen. Am einfachsten zwei Terminalfenster öffnen.

### Übersicht der wichtigsten Befehle

| Bun                | npm                  | Beschreibung                   |
| ------------------ | -------------------- | ------------------------------ |
| `bun dev`          | `npm run dev`        | Entwicklungsserver starten     |
| `npx convex dev`   | `npx convex dev`     | Convex Backend synchronisieren |
| `bun run build`    | `npm run build`      | Produktions-Build nach `dist/` |
| `bun run test`     | `npm test`           | Tests ausführen (Vitest)       |

---

## Team / Namenszuordnung GitHub

- Sofia Antropova -> antropos-v
- Daniel Beljaew -> Cameloon, Dan
- Niklas Brietenhahn -> niklas-b1
- Alexia Dinu -> dinua23
- Daniela Maier -> njela0

### Bun Commands Overview

Development - full-stack dev server with hot reload

    bun dev

Static Site - build optimized assets to disk (no backend)

    bun run build

Production - serve a full-stack production build

    bun start

### Backend Dashboard

https://dashboard.convex.dev/t/niklas-e3afb/anwendungsprojekt/

### Bun Commands

To install dependencies:

    bun install / npm install

Development - full-stack dev server with hot reload

    bun dev / npm run dev

To connect to convex db set .env variables and run:

    npx convex dev

### Project Structure

//OLD-RENEW!!!!
├── src/
│ ├── index.tsx # (Backend) Server entry point (API)
│ ├── frontend.tsx # Frontend entry point
│ └── App.tsx # Main React component
│
├── package.json # bun scripts definitions
├── tsconfig.json # TypeScript configuration
├── bunfig.toml # Bun configuration
└── bun.lock # bun dependencies
//////////////////////////////////////////

## Projektmanagement Hinweise

### Zu prüfende Tickets (Aufgabe vom 11.05.2026)

Wir haben fünf Issues (Tickets) vorbereitet, die Sie im GitHub Projekt vorfinden:

- Issue #44 — Forum: Kursübergreifendes Forum
- Issue #45 — Forum: Terminspezifisches Forum
- Issue #46 — User-Management & DHBW-Kurs-Verknüpfung
- Issue #47 — Material-Upload (Vorlesungsmaterial)
- Issue #48 — Dashboard-Integration
