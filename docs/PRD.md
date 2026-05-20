# PRD — Meilenstein 2

Erstellt: 2026-05-10
Letze Änderung: 2026-05-19

## Zweck

Dieses Dokument listet die verbindlichen Must‑have‑Funktionen und die zentralen User‑Flows, die laut Meilenstein 2 (Deadline 19.05.26) im Repository nachgewiesen werden müssen. Nachweis erfolgt durch annotierte Mockups oder einen Prototyp mit Dummy‑Daten sowie durch entsprechende Commits / GitHub Project‑Einträge.

## Funktionale Anforderungen mit Priorisierung

Siehe detaillierte Anforderungen und Ergänzungen in docs/Funktionale_Anforderungen.md

## Zentrale User‑Flows

### 1. Zugang & Identität (Onboarding)

- **Flow:** Landing-Page → Login/Registrierung → Identitätsprüfung → Dashboard
- **Login:** Email + Passwort eingeben → Validierung → Token speichern → Dashboard
- **Registrierung:** Email, Passwort, Matrikelnummer → Validierung → Admin-Freischaltung erforderlich → Warte-Screen
- **Fehler:** Falsche Credentials, Email bereits registriert, Passwort zu schwach, Nutzer nicht freigeschaltet

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

- **Flow:** Skripte-Seite → [Suchen / Filtern] → Dokument klicken → [Herunterladen / Vorschau / Teilen]
- **Suche:** Suchbegriff eingeben → API durchsucht Titel/Beschreibung → Ergebnisse filtern
- **Filter:** Nach Kurs, Dateityp (PDF, Word, etc.), Datum
- **Download:** Click → PDF/Datei wird heruntergeladen (Warnung bei Dateigröße > 10 MB)
- **Vorschau:** PDF im Browser öffnen (andere Formate: Download empfohlen)
- **Fehler:** Datei nicht gefunden, Vorschau nicht unterstützt, zu großes Dateivolumen

### 5. Navigation & Kontextwechsel

- **Flow:**  Menü-Item klicken → Zu neuer Seite navigieren
- **Navbar/Menu:** Persistent mit Links zu Dashboard, Planner, Forum, Skripte, Profil
- **Aktuelle Seite:** Wird in Menü hervorgehoben
- **Daten-Persistenz:** Scroll-Position und Filter werden gespeichert; Warning bei ungespeicherten Änderungen
- **Profil-Dropdown:** Profil → Einstellungen → Dark Mode → Logout
- **Fehler:** Seite nicht gefunden (404), Session abgelaufen

### 6. Profil & Einstellungen

- **Flow:** Avatar/Profil → Profil-Seite mit zwei Tabs: "Profil-Info" & "Einstellungen"
- **Profil bearbeiten:** Vorname, Nachname, Avatar, Bio ändern → Speichern
- **Passwort ändern:** Aktuelles PW + Neues PW (2x) → Validierung → Speichern
- **Einstellungen:** Theme (Dark/Light), Sprache, Benachrichtigungen, Datenschutz → Live speichern
- **Logout:** Bestätigung → Session beenden → Login-Seite
- **Account löschen (optional):** Bestätigungs-Dialog mit "BESTÄTIGUNG"-Eingabe → Alle Daten löschen → Logout
- **Fehler:**Falsches aktuelles Passwort, Datei zu groß, Passwort zu schwach



### 7. Gruppen-Management

- **Flow:**
- **Neue Gruppe:**
- **Beiterten:** 
- **




### 8. Admin-Panel (Kursverwaltung & Moderation)

- **Flow:** Admin-Menü → Admin-Panel mit 4 Tabs: "Kursverwaltung", "Nutzer-Management", "Moderation", "Statistiken"



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
