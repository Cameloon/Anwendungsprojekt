# Funktionale Anforderungen

Diese Datei beschreibt die funktionalen Anforderungen in Must/Should/Could/Wont‑Have‑Kategorien mit konkreten Merkmalen und Akzeptanzkriterien. Sie basiert auf dem aktuellen Stand der Anwendung (u. a. Forum, Dashboard, Aufgabenverwaltung, Skripte‑Bereich, Convex‑Schema).

## Must‑Have (detailliert)

- **Authentifizierung & Rollen**
  - Beschreibung: Nutzer müssen sich anmelden/abmelden können. Rollen: `admin`, `user`. Admins verwalten Kurse, Nutzerfreischaltungen und Moderation.
  - Pflichtfelder/Validierung: E‑Mail (valides Format), Name (nicht leer). Matrikelnummer (optional, numerisch, Mindestlänge konfigurierbar).
  - Akzeptanzkriterien: 1) Nicht authentifizierte Nutzer werden von `ProtectedRoute` auf Login geleitet. 2) Admin‑Funktionen sind nur sichtbar/ausführbar, wenn `role=admin`.

- **Dashboard — Persönliche Lernübersicht**
  - Beschreibung: Anzeige von Fortschritt (Prozent erledigt), offene Aufgaben, anstehende Deadlines, visuelle Hervorhebungen (z. B. Fortschrittsbalken, Karten für Deadlines).
  - Datenquellen: Aufgaben‑Collection, Kurszugehörigkeit des Nutzers.
  - Akzeptanzkriterien: 1) Berechnung der Fertigstellungsquote = erledigte Aufgaben / Gesamtaufgaben (für angemeldeten Nutzer). 2) Klick auf eine Aufgabenkarte öffnet Detailansicht.

- **Aufgaben & Projekte (CRUD)**
  - Beschreibung: Aufgaben zu Kursen anlegen, bearbeiten, löschen, anzeigen. Aufgaben besitzen: `id`, `title`, `description`, `courseId`, `dueDate` (ISO), `status` (open/done), `priority` (low/med/high), `attachments`.
  - Validierung: `title` & `courseId` & `dueDate` sind Pflicht; `dueDate` darf nicht in der Vergangenheit liegen (bei Erstellung); `title` max. 200 Zeichen.
  - Akzeptanzkriterien: 1) Erstellen einer Aufgabe speichert alle Pflichtfelder und erscheint sofort im Dashboard. 2) Statusänderung (open→done) aktualisiert Fortschrittsanzeige.

- **Foren / Diskussionen**
  - Beschreibung: Kursbasierte Foren, Threads mit Posts und Kommentaren, Anzeige von Autor, Zeitstempel, evtl. Edit/Remove‑Funktionen.
  - Rechte: Nur Kursmitglieder dürfen in kursinternen Foren posten, Moderatoren/Admins können Posts moderieren.
  - Akzeptanzkriterien: 1) Ein Thread zeigt korrekt alle Kommentare in chronologischer Reihenfolge. 2) Editieren/Löschen nur durch Autor oder Moderator möglich; Moderationsaktionen werden protokolliert.

- **Materialablage / Datei‑Uploads**
  - Beschreibung: An Attachments zu Aufgaben/Postings anhängen; zentrale Skriptbibliothek für Kursmaterialien.
  - Technische Regeln: Erlaubte Formate: PDF, DOCX, PPTX, PNG, JPG; Max‑Size konfigurierbar (z. B. Default 10 MB). Sichtbarkeit: `private` (nur Ersteller), `course` (Kursmitglieder), `public`.
  - Akzeptanzkriterien: 1) Upload verweigert mit erklärender Fehlermeldung bei falschem Format oder Überschreitung der Größe. 2) Zugriffskontrolle verhindert unberechtigten Download.

- **Kursverwaltung (CRUD)**
  - Beschreibung: Admins erstellen/bearbeiten/löschen Kurse (Felder: `courseId`, `title`, `semester`, `description`, `instructors`).
  - Akzeptanzkriterien: 1) Neuer Kurs ist nach Erstellung in der Kursliste sichtbar. 2) Kurslöschung ist nur nach Bestätigung möglich und löst keine Dateninkonsistenzen in Aufgaben/Foren aus (Referentielle Integrität wird geprüft).

  - **Vorlesungen & Kurs‑Instanzen (neues Must‑Have)**
    - Beschreibung: Es gibt eine übergreifende Entität `Vorlesung`, die Vorlesungsangebote (Titel, Semester, Dozent:innen, zugehörige `courseId`/Kurse, DHBW‑Standort) abbildet. Studierende geben beim Registrieren ihren `course` (z. B. `TIF25B`) und ihren DHBW‑Standort (z. B. `DHBW Lörrach`) an. Ausgehend von offiziellen Vorlesungsplänen (extern oder importierbar) werden die relevanten Vorlesungen pro Semester als feste Auswahloptionen bereitgestellt.
    - Zweck: Vorlesungen dienen als gemeinsame Referenz in Terminen, Foren und Skripten, sodass Nutzer vorlesungsbasiert filtern, Inhalte zuordnen und Einladungen/Abonnements auf Vorlesungen/Kurse aussprechen können.
    - Felder/Modelle (Beispiel): `lectureId`, `title`, `semester`, `courseId`, `instructors`, `location` (DHBW‑Standort), `startDate`, `endDate`, `tags`.
    - Verhalten/Flows:
      - Bei Registrierung: Nutzer wählen `course` und `hochschule` → Account speichert `courseId` und `standort`.
      - Systemseitig: Vorlesungspläne werden importiert/verwaltet und veröffentlichen für einen `course` die zugehörigen `Vorlesungen` für ein Semester.
      - In Formularen (Termin/Forum/Skript): `Vorlesung` ist Pflichtfeld oder optionales Tag, auswählbar aus den systemweiten Vorlesungen (gefiltert nach Kurs/Standort/Semester).
      - Einladungen: Nutzer können ihre `course` (Jahrgang) oder einzelne `Vorlesungen` zur Teilnahme einladen; Einladungen erscheinen in den Benachrichtigungen.
    - Validierung & Akzeptanzkriterien:
      1. Beim Erstellen/Bearbeiten von Terminen/Foren/Skripten kann eine `Vorlesung` ausgewählt werden; die Auswahl zeigt nur Vorlesungen, die für den Nutzer (Kurs/Standort/Semester) relevant sind.
      2. Ein Nutzer kann sein ganzes `course` (Jahrgang) einladen — Empfänger werden korrekt in Notifications angezeigt und können beitreten.
      3. Vorlesungsdaten sind administrierbar (Import/CRUD) und werden als Auswahl in allen relevanten Formularen angeboten.

- **Datenpersistenz & Integrität**
  - Beschreibung: Convex dient als primäre Persistenz; Schemas definieren Felder und Typen (siehe `convex/schema.ts`). Demo‑Daten sind zulässig für Prototyp.
  - Akzeptanzkriterien: 1) Alle CRUD‑Operationen sind atomar; 2) Backend validiert Eingaben und lehnt ungültige Anfragen ab.

- **Suche, Filter & Sortierung**
  - Beschreibung: Volltext‑Suche (Titel/Beschreibung), Filter (Kurs, Status, Priorität, Deadline‑Bereich), Sortierung (Deadline auf-/absteigend, Priorität).
  - Akzeptanzkriterien: 1) Filterkombinationen sind kumulativ. 2) Paging/Virtualization bei >50 Items vorhanden.

## Should‑Have (detailliert)

- **Dateien privat/kursweit teilen & Benachrichtigungen**
  - Beschreibung: Uploads können als privat oder kursweit markiert werden. Freigaben generieren Benachrichtigungen an Kursmitglieder.
  - Akzeptanzkriterien: 1) Bei Kurs‑Upload erhalten Kursmitglieder eine Benachrichtigung (in‑app). 2) Private Dateien sind für andere Nutzer unsichtbar.

- **Erweiterte Upload‑Regeln & Management**
  - Beschreibung: Admin konfiguriert erlaubte Formate, Max‑Größe, Quota pro Nutzer/Kurs.
  - Akzeptanzkriterien: 1) Admin‑UI zum Anpassen von Limits vorhanden (oder Config‑File). 2) System weist Nutzer bei Erreichen von Quota verständlich an.

- **Erweiterte Forenfunktionen**
  - Beschreibung: Pinnen, Markieren als wichtig, Tags/Hashtags, Sortierung nach Aktivität.
  - Akzeptanzkriterien: 1) Gepinnte Beiträge bleiben oben; 2) Tags sind filterbar.

## Could‑Have (detailliert)

- **Skript‑Bibliothek & Metadaten**
  - Beschreibung: Kategorisierte Sammlung von Skripten/Übungsblättern mit Metadaten (Jahr, Dozent, Modul). Nutzer können Material bewerten.
  - Akzeptanzkriterien: 1) Suche nach Metadaten liefert passende Ergebnisse; 2) Bewertungen sind aggregierbar.

- **Personalisierung / Theme**
  - Beschreibung: Light/Dark Mode, Option zur Anzeige von kompakten/ausführlichen Listen.
  - Akzeptanzkriterien: 1) UI‑Theme persistiert für den Nutzer (lokal oder im Profil).

- **Whiteboard (Basisfunktionen)**
  - Beschreibung: Gemeinsames Whiteboard mit einfachen Zeichenwerkzeugen, Speichern/Exportieren.
  - Akzeptanzkriterien: 1) Board kann als Bild exportiert werden; 2) Mehrere Nutzer sehen den letzten gespeicherten Zustand.

## Wont‑Have (Out‑of‑Scope)

- Detaillierter Terminplaner im Stil von Google Calendar (komplexe Kalenderfunktionen)
- Vollwertige Lern‑/Karteikarten‑App
- Umfangreiche Notizverwaltung und externe Professoren‑Management‑Plattform
- Externe Nutzer außerhalb DHBW (keine öffentliche Registrierung ohne Freischaltung)

## Nicht‑funktionale Anforderungen (Kurz)

- **Performance**: Seiten mit Standarddaten (<50 Einträge) laden <1s lokal; Pagination/Virtualization bei großen Listen.
- **Sicherheit**: RBAC, HTTPS, Minimale Speicherung persönlicher Daten, Audit‑Logs für Admin/Moderation.
- **Zuverlässigkeit**: Atomare CRUD‑Operationen, konsistente Fehlerbehandlung, Wiederherstellbarkeit bei fehlgeschlagenen Uploads.
- **Testbarkeit**: Kernflows mit Unit/Integration Tests (Vitest) abgedeckt.
- **Barrierefreiheit**: Grundlegende a11y‑Standards (ARIA, Tastaturnavigation) umgesetzt.

---

Aktualisierungen bitte per Review; auf Wunsch priorisiere ich die Must‑Haves als MVP und generiere Issues/AC‑Tests.
