# PRD — Meilenstein 2

Erstellt: 2026-05-10

## Zweck

Dieses Dokument listet die verbindlichen Must‑have‑Funktionen und die zentralen User‑Flows, die laut Meilenstein 2 (Deadline 19.05.26) im Repository nachgewiesen werden müssen. Nachweis erfolgt durch annotierte Mockups oder einen Prototyp mit Dummy‑Daten sowie durch entsprechende Commits / GitHub Project‑Einträge.

## Verbindliche Must‑Haves (MUST)

- Authentifizierung (simuliert/dummy zulässig): Login/Logout
- Kursverwaltung (CRUD): Kurse erstellen, bearbeiten, löschen, anzeigen
- Aufgabenverwaltung (CRUD) pro Kurs: Aufgaben mit Titel, Beschreibung, Kurszuordnung und Abgabedatum erstellen/ändern/löschen/anzeigen
- Aufgabenstatus & Dashboard: Aufgaben als "offen"/"erledigt" markieren; Dashboard zeigt nächste Deadlines und Anteil erledigter Aufgaben
- Benutzer‑/Rollenlogik (Admin vs. normaler Nutzer): Rollen Konzept dokumentiert; Admin darf Daten verwalten, normale Nutzer nur eigene Daten
- Datenpersistenz (Convex oder Dummy‑Daten): Daten werden in Convex gespeichert oder Dummy‑Daten zeigen das erwartete Verhalten

## Zentrale User‑Flows

Flow A — Anmeldung & Dashboard

1. Nutzer öffnet App → Login Screen
2. Nach Login wird Dashboard geladen (Kurse + nächste Deadlines)
3. Nutzer sieht hervorgehobene nächste Deadline

Flow B — Aufgabe erstellen

1. Auf Dashboard/Kursseite: "Neue Aufgabe" → Formular öffnen
2. Formular ausfüllen (Titel, Beschreibung, Kurs, Abgabedatum) → Speichern
3. Aufgabe erscheint in Kursliste und Dashboard

Flow C — Aufgabe als erledigt markieren

1. Nutzer markiert Aufgabe als "erledigt"
2. Status ändert sich; Dashboard‑Anzeige passt sich an

## UI‑Struktur (Seitenübersicht)

- Login
- Dashboard (Kurse, nächste Deadlines, % erledigt)
- Planner (Aufgabenliste, Create/Edit Aufgaben)
- Forum (Allgemeines Forum und Foren zu von Usern gebildeten Gruppen)
- Profil / Einstellungen
- Optional: Admin Panel

## Deliverables (für Meilenstein 2)

- `docs/PRD.md` (dieses Dokument) mit klarer Must‑have‑Liste
- Annotierte Mockups oder Link zum Prototyp (`docs/mockups/` oder Figma Link) ODER implementierter Prototyp in `src/` mit Dummy‑Daten (Commits im Repo)
- Aktualisierte `docs/Rollenverteilung.md` und sichtbare Aufgabenverteilung im GitHub Project

---
