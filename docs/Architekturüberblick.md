# Architekturüberblick — DHBW-Studierenden-Plattform

## 1. Systemkontext (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Externe Systeme                         │
│                                                                 │
│           ┌──────────────┐    ┌──────────────┐                  │
│           │    Clerk     │    │   Convex     │                  │
│           │  (Auth-SaaS) │    │  (BaaS/DB,   │                  │
│           │              │    │   inkl. File │                  │
│           │              │    │   Storage)   │                  │
│           └──────┬───────┘    └──────┬───────┘                  │
└──────────────────┼────────────────────┼─────────────────────────┘
                    │ JWT-Token           │ WebSocket/HTTP
                    ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                    React SPA (Browser)                           │
│                    Vite + React 18 + TypeScript                  │
└──────────────────────────────────────────────────────────────────┘
           ▲
           │  Browser (HTTP)
     DHBW-Studierende / Admins
```

---

## 2. Container-Diagramm (C4 Level 2)

```
┌──────────────────────────── Browser ─────────────────────────────────┐
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                     React SPA (Frontend)                        │  │
│  │                                                                  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │  │
│  │  │  Auth-Layer  │  │  Routing     │  │  UI-Komponenten       │  │  │
│  │  │  (Clerk SDK) │  │  (React      │  │  (shadcn/ui +         │  │  │
│  │  │  + Demo-Mode │  │   Router)    │  │   Radix UI +          │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  │   Tailwind CSS)      │  │  │
│  │         │                 │          └──────────────────────┘  │  │
│  │  ┌──────▼──────────────────▼────────────────────────────────┐  │  │
│  │  │                  Feature-Module (Pages)                   │  │  │
│  │  │  Dashboard │ Forum │ Planner │ Skripte │ Profil │ Admin   │  │  │
│  │  └──────────────────────────────┬───────────────────────────┘  │  │
│  │                                 │                               │  │
│  │  ┌──────────────────────────────▼───────────────────────────┐  │  │
│  │  │                  Datenzugriffs-Schicht                    │  │  │
│  │  │  Convex React Client  │  LocalStorage Demo-Store          │  │  │
│  │  │  (useQuery/useMutation│  (Auth/Profil, kein Backend       │  │  │
│  │  │  aus convex/react)    │   nötig)                          │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
            │ WebSocket (Realtime)
            ▼
┌────────────────────────┐          ┌───────────────────────────┐
│   Convex Backend       │◄────────►│   Clerk (Auth Provider)   │
│   (Serverless BaaS,    │          │   JWT-Ausstellung +        │
│    inkl. File Storage) │          │   Benutzerverwaltung       │
│                        │          └───────────────────────────┘
│  ┌──────────────────┐  │
│  │  Convex-Datenbank│  │
│  │  (26 Tabellen:   │  │
│  │  profiles, forums│  │
│  │  posts, deadlines│  │
│  │  scripts, groups │  │
│  │  sections u.v.m.)│  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │  Server Functions│  │
│  │  (queries /      │  │
│  │   mutations /    │  │
│  │   actions)       │  │
│  └──────────────────┘  │
└────────────────────────┘
```

---

## 3. Hauptkomponenten

| Komponente | Technologie | Aufgabe |
|---|---|---|
| **Frontend SPA** | React 18, Vite, TypeScript | UI-Rendering, Routing, Zustandsverwaltung |
| **Auth-Layer** | Clerk + Demo-Mode | Authentifizierung, Sitzungsverwaltung, JWT |
| **Backend (BaaS)** | Convex | Serverless-Funktionen, Echtzeit-Daten, Datenbank, Datei-Storage (Skripte/Uploads) |
| **Lokaler State** | localStorage Stores | Demo-Modus, Forum- & Skripte-Daten (offline-fähig) |

### 3.1 Convex-Datenbanktabellen (26)

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

### 3.2 Convex-Module

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

## 4. Kommunikationswege

```
Browser SPA  ──── WebSocket (Realtime-Sync) ────►  Convex Backend
Browser SPA  ──── HTTPS / JWT-Austausch ─────────►  Clerk Auth
Convex       ──── JWT-Validierung ───────────────►  Clerk (issuer domain)
```

- **Convex**: persistente WebSocket-Verbindung für reaktive Daten-Queries — automatisches Re-Rendering bei Datenänderungen, kein manuelles Polling; Datei-Uploads (Skripte / Vorlesungsmaterial) laufen ebenfalls über Convex File Storage
- **Clerk**: JWT-basierte Authentifizierung; Token wird von Convex serverseitig validiert
- **LocalStorage**: Fallback-Datenschicht im Demo-Modus für Auth/Profil (kein Backend erforderlich); alle übrigen Daten (Foren, Skripte, Deadlines) laufen ausschließlich über Convex

---

## 5. Architekturmuster

- **Client-Server-Modell** mit serverlosem Backend (Convex BaaS)
- **Layered Architecture** im Frontend: UI-Schicht → Feature-Module → Datenzugriffs-Schicht
- **Demo-Mode Pattern**: vollständig localStorage-basierter Betrieb ohne externe Dienste — aktiviert automatisch, wenn Umgebungsvariablen fehlen
- **Protected Routes**: rollenbasierte Zugriffskontrolle (User / Admin) direkt im Router

---

## 6. Feature-Module (Routen)

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

## 7. Externe Abhängigkeiten

| Dienst | Typ | Zweck |
|---|---|---|
| **Clerk** | SaaS (Cloud) | Authentifizierung & Nutzerverwaltung |
| **Convex** | BaaS (Cloud) | Datenbank, Echtzeit-Sync, Serverlogik, Datei-Storage (Skripte / PDFs) |

Beide Dienste sind Cloud-basiert — kein On-Premise-Betrieb.

---

## 8. Technologische Grundentscheidungen

| Entscheidung | Ausprägung | Begründung |
|---|---|---|
| Hosting-Modell | Cloud-only (kein eigener Server) | Kein Infrastrukturaufwand; alle Services managed |
| Typsicherheit | TypeScript end-to-end | Frontend und Convex-Backend teilen Typen via generierter API |
| Offline-Fähigkeit | Demo-Mode (localStorage) | Entwicklung & Präsentation ohne konfigurierte Cloud-Dienste |
| Datensynchronisation | Reaktiv (Convex Realtime) | Automatisches UI-Update bei Datenänderungen ohne Polling |
| Komponentenbibliothek | shadcn/ui + Radix UI | Barrierefreiheit, Konsistenz, keine externe Laufzeitabhängigkeit |
