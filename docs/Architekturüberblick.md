# Architekturüberblick — DHBW-Studierenden-Plattform

## Systemkontext

```
┌─────────────────────────────────────────────────────────────────┐
│                         Externe Systeme                         │
│                                                                 │
│     Authentifizierung             Datenbank + File Storage      │
│           ┌──────────────┐    ┌──────────────┐                  │
│           │    Clerk     │    │   Convex     │                  │
│           │              │    │              │                  │
│           └──────┬───────┘    └──────┬───────┘                  │
└──────────────────┼───────────────────┼──────────────────────────┘
                   │ JWT-Token         │ WebSocket/HTTP
                   ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Web Browser                                    │
│                                                                  │
│                   React: Single Page Application                 │
│                    (Vite + React 18 + TypeScript)                │
└──────────────────────────────────────────────────────────────────┘

```

---


## Hauptkomponenten

| Komponente | Technologie | Aufgabe |
|---|---|---|
| **Frontend SPA** | React 18, Vite, TypeScript | UI-Rendering, Routing, Zustandsverwaltung |
| **Auth-Layer** | Clerk + Demo-Mode | Authentifizierung, Sitzungsverwaltung, JWT |
| **Backend (BaaS)** | Convex | Serverless-Funktionen, Echtzeit-Daten, Datenbank, Datei-Storage (Skripte/Uploads) |
| **Lokaler State** | localStorage Stores | Demo-Modus, Forum- & Skripte-Daten (offline-fähig) |

### Convex-Datenbanktabellen

| Tabelle | Beschreibung |
|---|---|
| `profiles` | Nutzerprofil, Rolle, Status, Onboarding-Felder |
| `forums` | Foren (kursübergreifend, Vorlesungs- oder Gruppen-gebunden) |
| `forumArchiveStates` | Archivierungsstatus eines Forums je Nutzer |
| `forumMembers` | Mitgliedschaft in Foren |
| `forumFiles` | Dateianhänge in Foren |
| `posts` | Beiträge in Foren |
| `postFiles` | Dateianhänge an Posts |
| `postComments` | Kommentare zu Posts (inkl. Verschachtelung via `parentId`) |
| `commentLikes` | Likes auf Kommentare |
| `postLikes` | Likes auf Posts |
| `postReports` | Gemeldete Beiträge (Moderationswarteschlange) |
| `deadlines` | Abgaben / Prüfungen / sonstige Termine |
| `deadlineAttachments` | Dateianhänge an Deadlines |
| `deadlineMessages` | Chat-Nachrichten zu einer Deadline |
| `deadlineSubscribers` | Nutzer, die eine Deadline abonniert haben |
| `scripts` | Vorlesungsmaterial / Skripte |
| `moderationLog` | Protokoll von Admin-Aktionen an Posts |
| `groups` | Lerngruppen |
| `groupFiles` | Dateianhänge in Lerngruppen |
| `groupMembers` | Mitgliedschaft in Lerngruppen |
| `sections` | Forum-Kategorien / Abschnitte (für die Forumübersicht) |
| `semesterLectures` | Vorlesungen je Kurs und Semester |
| `jahrgangLectures` | Vorlesungen je Jahrgang und Semester |
| `feedback` | Nutzerbewertungen der Plattform |
| `userReports` | Bug- und Feature-Meldungen der Nutzer |
| `notifications` | Einladungsbenachrichtigungen (Forum / Deadline) |

### Convex-Module

| Datei | Aufgabe |
|---|---|
| `admin.ts` | Nutzer freischalten / ablehnen |
| `profiles.ts` | Profil-CRUD, Zugriffsstatus, Onboarding |
| `forums.ts` | Forum-Queries/Mutations |
| `posts.ts` | Post-Queries/Mutations |
| `postReports.ts` | Gemeldete Beiträge (Moderationswarteschlange) |
| `deadlines.ts` | Deadline-Queries/Mutations |
| `groups.ts` | Lerngruppen-Queries/Mutations |
| `scripts.ts` | Skripte/Material-Queries/Mutations |
| `sections.ts` | Forum-Abschnitte |
| `semesterLectures.ts` | Vorlesungsbezogene Foren automatisch anlegen |
| `notifications.ts` | Benachrichtigungen |
| `feedback.ts` | Plattform-Feedback |
| `userReports.ts` | Bug-/Feature-Meldungen |
| `auth.config.ts` | Clerk JWT-Konfiguration |
| `migrations.ts` | Datenmigrationen (z. B. `renameJahrgangToKurs`) |

---

## Kommunikationswege

```
Web-Browser  ──── WebSocket (Realtime-Sync) ────►  Convex Backend
Web-Browser  ──── HTTPS / JWT-Austausch ─────────►  Clerk Auth
Convex       ──── JWT-Validierung ───────────────►  Clerk (issuer domain)
```

- **Convex**: persistente WebSocket-Verbindung für reaktive Daten-Queries — automatisches Re-Rendering bei Datenänderungen, kein manuelles Polling; Datei-Uploads (Skripte / Vorlesungsmaterial) laufen ebenfalls über Convex File Storage
- **Clerk**: JWT-basierte Authentifizierung; Token wird von Convex serverseitig validiert
- **LocalStorage**: Fallback-Datenschicht im Demo-Modus für Auth/Profil (kein Backend erforderlich); alle übrigen Daten (Foren, Skripte, Deadlines) laufen ausschließlich über Convex

---


## Feature-Module (React Routen)

| Route | Sichtbarkeit | Beschreibung |
|---|---|---|
| `/` | öffentlich | Landing Page |
| `/dashboard` | Nutzer | Persönliches Dashboard |
| `/admin-dashboard` | Admin | Nutzerverwaltung & Admintools |
| `/forum` | Nutzer | Kursübergreifendes Forum |
| `/forum/:forumId` | Nutzer | Kurs-/Gruppenspezifisches Forum |
| `/forum/:forumId/post/:postId` | Nutzer | Einzelner Post mit Kommentaren |
| `/planner` | Nutzer | Terminplaner |
| `/skripte` | Nutzer | Vorlesungsmaterial-Upload & -Verwaltung |
| `/profile` | Nutzer | Nutzerprofil |
| `/impressum` | öffentlich | Impressum |
| `/datenschutz` | öffentlich | Datenschutzerklärung |
| `/nutzungsordnung` | öffentlich | Nutzungsordnung |


---

## Technologische Grundentscheidungen

| Entscheidung | Ausprägung | Begründung |
|---|---|---|
| Hosting-Modell | Cloud-only (kein eigener Server) | Kein Infrastrukturaufwand; alle Services managed |
| Typsicherheit | TypeScript end-to-end | Frontend und Convex-Backend teilen Typen via generierter API |
| Datensynchronisation | Reaktiv (Convex Realtime) | Automatisches UI-Update bei Datenänderungen ohne Polling |
| Komponentenbibliothek | shadcn/ui + Radix UI | Barrierefreiheit, Konsistenz, keine externe Laufzeitabhängigkeit |
