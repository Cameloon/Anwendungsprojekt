# Architekturüberblick — DHBW-Studierenden-Plattform

## 1. Systemkontext (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Externe Systeme                         │
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│   │    Clerk     │    │   Convex     │    │    Supabase      │  │
│   │  (Auth-SaaS) │    │  (BaaS/DB)   │    │  (File-Storage)  │  │
│   └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
└──────────┼────────────────────┼─────────────────────┼───────────┘
           │ JWT-Token           │ WebSocket/HTTP       │ HTTP REST
           ▼                    ▼                       ▼
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
│  │  │  Convex React Client  │  LocalStorage Stores (Demo)       │  │  │
│  │  │  TanStack Query       │  forumsStore / scriptsStore etc.  │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
            │ WebSocket (Realtime)          │ HTTPS REST
            ▼                              ▼
┌────────────────────────┐     ┌───────────────────────────┐
│   Convex Backend       │     │        Supabase            │
│   (Serverless BaaS)    │     │   (Datei-Upload / Storage) │
│                        │     └───────────────────────────┘
│  ┌──────────────────┐  │
│  │  Convex-Datenbank│  │     ┌───────────────────────────┐
│  │  (profiles-Tab.) │◄────►  │   Clerk (Auth Provider)   │
│  └──────────────────┘  │     │   JWT-Ausstellung +        │
│  ┌──────────────────┐  │     │   Benutzerverwaltung       │
│  │  Server Functions│  │     └───────────────────────────┘
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
| **Backend (BaaS)** | Convex | Serverless-Funktionen, Echtzeit-Daten, Datenbank |
| **Datei-Storage** | Supabase | Upload und Speicherung von Skripten/Dateien |
| **Lokaler State** | localStorage Stores | Demo-Modus, Forum- & Skripte-Daten (offline-fähig) |

---

## 4. Kommunikationswege

```
Browser SPA  ──── WebSocket (Realtime-Sync) ────►  Convex Backend
Browser SPA  ──── HTTPS REST ────────────────────►  Supabase Storage
Browser SPA  ──── HTTPS / JWT-Austausch ─────────►  Clerk Auth
Convex       ──── JWT-Validierung ───────────────►  Clerk (issuer domain)
```

- **Convex**: persistente WebSocket-Verbindung für reaktive Daten-Queries — automatisches Re-Rendering bei Datenänderungen, kein manuelles Polling
- **Clerk**: JWT-basierte Authentifizierung; Token wird von Convex serverseitig validiert
- **Supabase**: REST-API für Datei-Uploads (Skripte / Vorlesungsmaterial)
- **LocalStorage**: Fallback-Datenschicht im Demo-Modus (kein Backend erforderlich)

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
| `/forum/:id` | Nutzer | Kurs-/Gruppenspezifisches Forum |
| `/planner` | Nutzer | Terminplaner |
| `/skripte` | Nutzer | Vorlesungsmaterial-Upload & -Verwaltung |
| `/profile` | Nutzer | Nutzerprofil |

---

## 7. Externe Abhängigkeiten

| Dienst | Typ | Zweck |
|---|---|---|
| **Clerk** | SaaS (Cloud) | Authentifizierung & Nutzerverwaltung |
| **Convex** | BaaS (Cloud) | Datenbank, Echtzeit-Sync, Serverlogik |
| **Supabase** | BaaS (Cloud) | Datei-Storage (Skripte / PDFs) |

Alle drei Dienste sind Cloud-basiert — kein On-Premise-Betrieb.

---

## 8. Technologische Grundentscheidungen

| Entscheidung | Ausprägung | Begründung |
|---|---|---|
| Hosting-Modell | Cloud-only (kein eigener Server) | Kein Infrastrukturaufwand; alle Services managed |
| Typsicherheit | TypeScript end-to-end | Frontend und Convex-Backend teilen Typen via generierter API |
| Offline-Fähigkeit | Demo-Mode (localStorage) | Entwicklung & Präsentation ohne konfigurierte Cloud-Dienste |
| Datensynchronisation | Reaktiv (Convex Realtime) | Automatisches UI-Update bei Datenänderungen ohne Polling |
| Komponentenbibliothek | shadcn/ui + Radix UI | Barrierefreiheit, Konsistenz, keine externe Laufzeitabhängigkeit |
