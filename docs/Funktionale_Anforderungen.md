# Funktionale Anforderungen

Diese Datei beschreibt die funktionalen Anforderungen in Must/Should/Could/Wont‑Have‑Kategorien mit konkreten Merkmalen und Akzeptanzkriterien. Sie basiert auf dem aktuellen Stand der Anwendung (u. a. Forum, Dashboard, Aufgabenverwaltung, Skripte‑Bereich, Convex‑Schema).

## Must‑Have (detailliert)

- **Authentifizierung & Rollen**
  - Beschreibung: Nutzer müssen sich anmelden/abmelden können. Rollen: `admin`, `user`. Admins verwalten Kurse, Nutzerfreischaltungen und Moderation.
  - Pflichtfelder/Validierung: E‑Mail (valides Format), Name (nicht leer).
  - Akzeptanzkriterien: 1) Nicht authentifizierte Nutzer werden von `ProtectedRoute` auf Login geleitet. 2) Admin‑Funktionen sind nur sichtbar/ausführbar, wenn `role=admin`
  - Globaler Admin: Moderation (Löschen von Beiträgen in Foren, Bannen von Nutzern)
    - Admin-Dashboard: extra Reiter für Admin-Tätigkeiten: User freischalten/löschen, Übersicht durch Nutzer gemeldeter Beiträge

- **Dashboard — Persönliche Lernübersicht**
  - Beschreibung: offene/anstehende Aufgaben/Deadlines, aktuelle Forenbeiträge, neueste Skripte
    - allgemeine Ansicht mit allen aktuellen Aufgaben/Forenbeiträgen/Skripten und Filtermöglichkeit, um diese vorlesungsbasiert darzustellen
  - Datenquellen: Planner, abonnierte Foren, Skript-Bibliothek

- **Planner (Aufgaben & Projekte (CRUD))**
  - Beschreibung: Aufgabe zu Vorlesungen anlegen, bearbeiten, löschen, anzeigen. Aufgaben besitzen: `id`, `lecturetitle`, `description`, `lectureId`, `dueDate` (ISO), `status` (open/done), `priority` (low/med/high), `attachments`. Aufgaben können normal oder als Gruppenaufgabe angelegt werden.
    - Bei normalen Aufgabe, können Einzelpersonen, Gruppen oder Kurse geteilt werden (als Kopie geteilt, jeder hat seinen eigenen Status zur Aufgabe)
    - Gruppentermine können von jedem Gruppenmitglied bearbeitet werden (gemeinsamer Status)
    - Einladungen erscheinen in den Benachrichtigungen und können akzeptiert oder abgelehnt werden
    - Aufgaben können nach Vorlesungen gefiltert werden
  - Validierung: `lecturetitle` & `lectureId` & `dueDate` sind Pflicht; `dueDate` darf nicht in der Vergangenheit liegen (bei Erstellung); `title` max. 50 Zeichen (angepasst am 03.07.2026 durch DM: vorher 200 Zeichen).
  - Akzeptanzkriterien: 1) Erstellen einer Aufgabe speichert alle Pflichtfelder und erscheint sofort im Dashboard.

- **Foren / Diskussionen**
  - Beschreibung: Allgemeines Forum (gesamter Kurs), vorlesungsbasierte Foren, Threads mit Posts und Kommentaren, Anzeige von Autor, Zeitstempel, Edit/Remove von Kommentaren durch den Author des Kommentars erlauben (mit Bearbeitungsdatum).
  - Foren können nach Vorlesungen gefiltert werden.
  - Rechte: Nur Kursmitglieder dürfen in kursinternen Foren posten, Moderatoren/Admins können Posts moderieren (siehe Authentifizierung & Rollen).
  - Akzeptanzkriterien: 1) Ein Thread zeigt korrekt alle Kommentare in chronologischer Reihenfolge. 2) Editieren/Löschen von Kommentaren durch Autor möglich; Editieren/Löschen von Posts nur durch Moderator möglich; Moderationsaktionen werden protokolliert.

- **Materialien**
  - Beschreibung: Attachments zu Aufgaben/Postings anhängen; zentrale Bibliothek für Kursmaterialien.
  - Technische Regeln: Erlaubte Formate: PDF, DOCX, PPTX, PNG, JPG; Max‑Size konfigurierbar (z. B. Default 10 MB). Sichtbarkeit: `private` (nur Ersteller), `course` (Kursmitglieder), `group` (Gruppenmitglieder Projektgruppe), `public`.
  - Akzeptanzkriterien: 1) Upload verweigert mit erklärender Fehlermeldung bei falschem Format oder Überschreitung der Größe. 2) Zugriffskontrolle verhindert unberechtigten Download.

- **Vorlesungsverwaltung (CRUD)**
  - Beschreibung: Admins erstellen/bearbeiten/löschen Vorlesungen (Felder: `lectureId`, `lecturetitle`, `semester`, `description`, `instructors`).
    - Es gibt eine übergreifende Entität `Vorlesung`, die Vorlesungsangebote (Titel, Semester, Dozent:innen, zugehörige `classId`/Kurse, DHBW‑Standort) abbildet. Studierende geben beim Registrieren ihre `class` (Kurs) (z.B. `TIF25B`) und ihren DHBW‑Standort (z.B. `DHBW Lörrach`) an. Ausgehend von offiziellen Vorlesungsplänen (extern oder importierbar) werden die relevanten Vorlesungen pro Semester als feste Auswahloptionen bereitgestellt.
    - Zweck: Vorlesungen dienen als gemeinsame Referenz in Terminen, Foren und Skripten, sodass Nutzer vorlesungsbasiert filtern, Inhalte zuordnen und Einladungen/Abonnements auf Vorlesungen/Kurse aussprechen können.
    - Verhalten/Flows:
      - Bei Registrierung: Nutzer wählen `class` und `hochschule` → Account speichert `classId` und `standort`.
      - Systemseitig: Vorlesungspläne werden importiert für eine `class` und die zugehörigen `Vorlesungen` für ein Semester.
      - In Formularen (Termin/Forum/Skript): `Vorlesung` ist Pflichtfeld oder optionales Tag, auswählbar aus den Kurs-Vorlesungen.
    - Validierung & Akzeptanzkriterien:
      1. Beim Erstellen/Bearbeiten von Terminen/Foren/Skripten kann eine `Vorlesung` ausgewählt werden; die Auswahl zeigt nur Vorlesungen, die für den Nutzer (Kurs/Standort/Semester) relevant sind.
      2. Vorlesungsdaten sind administrierbar durch Admin (Import/CRUD) und werden als Auswahl in allen relevanten Formularen angeboten.

- **Datenpersistenz & Integrität**
  - Beschreibung: Convex dient als primäre Persistenz; Schemas definieren Felder und Typen (siehe `convex/schema.ts`). Demo‑Daten sind zulässig.
  - Akzeptanzkriterien: 1) Backend validiert Eingaben und lehnt ungültige Anfragen ab.

  **Sprachen**
  - Deutsch und Englisch werden unterstützt

## Should‑Have (detailliert)

- **Dateien privat/kursweit teilen & Benachrichtigungen**
  - Beschreibung: Uploads können als privat oder kursweit markiert werden. Freigaben generieren Benachrichtigungen an Kursmitglieder.

- **Erweiterte Upload‑Regeln & Management**
  - Beschreibung: Admin konfiguriert erlaubte Formate, Max‑Größe, Quota pro Nutzer/Kurs.

- **Erweiterte Forenfunktionen**
  - Q&A Forum für alle Jahrgänge aus dem gleiche Studienfach
  - Beschreibung: Pinnen, Markieren als wichtig, Tags/Hashtags, Sortierung nach Aktivität.

## Could‑Have (detailliert)

- **Skript‑Bibliothek & Metadaten**
  - Beschreibung: Kategorisierte Sammlung von Skripten/Übungsblättern mit Metadaten (Jahr, Dozent, Modul). Nutzer können Material bewerten.

- **Personalisierung / Theme**
  - Beschreibung: Light/Dark Mode, Option zur Anzeige von kompakten/ausführlichen Listen.

- **Whiteboard (Basisfunktionen)**
  - Beschreibung: Gemeinsames Whiteboard mit einfachen Zeichenwerkzeugen, Speichern/Exportieren.

## Wont‑Have (Out‑of‑Scope)

- Detaillierter Terminplaner im Stil von Google Calendar (komplexe Kalenderfunktionen)
- Vollwertige Lern‑/Karteikarten‑App
- Umfangreiche Notizverwaltung und externe Professoren‑Management‑Plattform
- Externe Nutzer außerhalb DHBW (keine öffentliche Registrierung ohne Freischaltung)
- Plattform für Professoren zur Organisation von Vorlesungen oder Nutzer außerhalb der DHBW
- weitere Sprachen außerhalb von Deutsch oder Englisch
