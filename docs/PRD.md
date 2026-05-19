# PRD — Meilenstein 2

Erstellt: 2026-05-10
Letze Änderung: 2026-05-19

## Zweck

Dieses Dokument listet die verbindlichen Must‑have‑Funktionen und die zentralen User‑Flows, die laut Meilenstein 2 (Deadline 19.05.26) im Repository nachgewiesen werden müssen. Nachweis erfolgt durch annotierte Mockups oder einen Prototyp mit Dummy‑Daten sowie durch entsprechende Commits / GitHub Project‑Einträge.

## Funktionale Anforderungen mit Priorisierung

Siehe detaillierte Anforderungen und Ergänzungen in docs/Funktionale_Anforderungen.md

## Zentrale User‑Flows

### 1. Zugang & Identität (Onboarding)

- **Flow:** Landing-Page → [Login/Registrierung] → Identitätsprüfung → Dashboard
- **Login:** Email + Passwort eingeben → Validierung → Token speichern → Dashboard
- **Registrierung:** Email, Passwort, Matrikelnummer → Validierung → Admin-Freischaltung erforderlich → Warte-Screen
- **Fehler: Falsche Credentials, Email bereits registriert, Passwort zu schwach, Nutzer nicht freigeschaltet

### 2. Organisation (Lern-Planer)

- **Flow:** Planner-Seite → Aufgabenliste mit Filtern → [Neue Aufgabe / Bearbeiten / Löschen / Markieren als erledigt]
- **Neue Aufgabe:** Titel, Beschreibung, Kurs, Abgabedatum, Priorität → Speichern → In Liste einsortiert
- **Bearbeiten/Löschen:** Click auf Aufgabe → Edit-Dialog / Bestätigung → Aktualisieren/Löschen → Liste aktualisiert
- **Filter & Sortierung:** Nach Kurs, Status (offen/erledigt), Deadline, Priorität
- **Fehler:** Felder leer, ungültiges Datum, Kurs nicht vorhanden

### 3. Wissensaustausch (Community & Forum)

- **Flow:** Forum-Seite → Forum/Kategorie wählen → Beitrag öffnen → [Lesen / Antworten / Posten]
- **Neuer Beitrag:** Titel + Text eingeben → Validierung → Posten → Wird in Liste angezeigt
- **Antworten:** Text eingeben → Validierung → Posten → Wird unter Beitrag angezeigt
- **Filter & Suche:** Nach Titel, Status (offen/gelöst), Datum
Bearbeiten/Löschen: Nur Autor oder Admin können ihre Beiträge bearbeiten/löschen
- **Fehler:** Titel/Text leer, Text zu kurz

### 4. Ressourcen-Abruf (Materialien)

- **Flow:** Skripte-Bereich → Suche/Filter → Dokument auswählen → Download/Ansicht
- **Zweck:** Zentraler Zugriff auf alle prüfungsrelevanten Unterlagen.
- **Nutzer-Intent:** „Ich brauche sofort das Skript für die Vorlesung von letzter Woche.“

### 5. Navigation & Kontextwechsel

- **Flow:** Aktuelle Seite → Hauptmenü → Zielseite (z.B. Profil oder Dashboard)
- **Zweck:** Nahtloser Wechsel zwischen den Werkzeugen ( Planer, Forum, Skripte).
- **Nutzer-Intent:** „Ich möchte zwischen meinen Aufgaben und den passenden Lernmaterialien hin- und herspringen.“

## UI‑Struktur (Seitenübersicht)

- Login
- Dashboard (Kurse, nächste Deadlines, % erledigt)
- Planner (Aufgabenliste, Create/Edit Aufgaben)
- Forum (Allgemeines Forum und Foren zu von Usern gebildeten Gruppen)
- Profil / Einstellungen
- Optional: Admin Panel

## Deliverables (für Meilenstein 2)

- `docs/PRD.md` (dieses Dokument)
- Anwendung ist jetzt von Lovable in das Repository übernommen
- Aktualisierte `docs/Rollenverteilung.md`

---
