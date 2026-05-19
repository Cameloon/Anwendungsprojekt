# PRD — Meilenstein 2

Erstellt: 2026-05-10
Letze Änderung: 2026-05-18

## Zweck

Dieses Dokument listet die verbindlichen Must‑have‑Funktionen und die zentralen User‑Flows, die laut Meilenstein 2 (Deadline 19.05.26) im Repository nachgewiesen werden müssen. Nachweis erfolgt durch annotierte Mockups oder einen Prototyp mit Dummy‑Daten sowie durch entsprechende Commits / GitHub Project‑Einträge.

## Funktionale Anforderungen mit Priorisierung

Siehe detaillierte Anforderungen und Ergänzungen in docs/Funktionale_Anforderungen.md

## Zentrale User‑Flows

### 1. Zugang & Identität (Onboarding)

- **Flow:** Landingpage → Login/Registrierung → Identitätsprüfung → Dashboard
- **Zweck:** Sicherstellen, dass der Nutzer Zugriff auf seine privaten Daten (Stundenplan, Notizen) hat.
- **Nutzer-Intent:** „Ich möchte schnell und sicher zu meiner Lernübersicht.“

### 2. Organisation (Lern-Planer)

- **Flow:** Dashboard → Planer-Ansicht → Termin/Aufgabe hinzufügen → Speichern
- **Zweck:** Die Kernfunktion zur Strukturierung des Studiums.
- **Nutzer-Intent:** „Ich muss wissen, was heute ansteht und neue Fristen eintragen.“

### 3. Wissensaustausch (Community & Forum)

- **Flow:** Forum-Übersicht → Kategorie wählen → Beitrag öffnen → Interaktion (Antworten/Posten)
- **Zweck:** Vernetzung und gegenseitige Hilfe bei Fachfragen.
- **Nutzer-Intent:** „Ich habe eine Frage zu einem Modul und suche Hilfe bei Kommilitonen.“

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
