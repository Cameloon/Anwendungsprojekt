# Funktionale Anforderungen

Kurzform der Must-/Should-/Could-/Wont‑Have‑Anforderungen für das Anwendungsprojekt.

## Must‑Have

- Thematisch sortierte Foren für den Austausch zu jeweiligen Vorlesungen
- Dashboard mit persönlicher Lernübersicht
  - Prozentuale Anzahl der fertiggestellten Wochenaufgaben
  - Visuelle Darstellung von Abgaben (offen / erledigt / nächste Deadline)
- Aufgaben/Projekte je Vorlesung, sortiert nach Abgabeterminen
  - Offene Aufgaben und Projekte klar sichtbar und nach Deadlines geordnet
  - Abgabetermine sofort ersichtlich, ohne aufwendiges Navigieren
  - Einfache, schnelle Navigation (nicht stark verschachtelt)
- Zentrale Ablage für benötigte Dokumente
- Authentifizierung & Rollen
  - Login / Logout (grundlegende Authentifizierung, simuliert für Prototyp zulässig)
  - Rollen: Admin vs. normaler Nutzer; Admin darf Kurse und Nutzer verwalten
- Datenpersistenz & Demo‑Daten
  - Primäre Persistenz: Convex; für Prototypen sind Dummy‑Daten zulässig
  - Datenmodell für Aufgaben: Pflichtfelder: Titel, Beschreibung, Kurs, Abgabedatum, Status (offen/erledigt)
- Suche, Filter & Sortierung
  - Suche nach Titel/Beschreibung
  - Filter nach Kurs, Status, Deadline, Priorität
  - Sortierung nach Deadline, Priorität oder Erstellungsdatum

## Should‑Have

- Möglichkeit, Dokumente privat oder kursweit hochzuladen (inkl. Benachrichtigungen)
- Nutzer können Veranstaltungen (Kurse) selbst anlegen
- Admin für Erstanmeldungen und Benutzerverwaltung
  - Überprüfung von Matrikelnummern und Erteilung von Freischaltungen
  - Moderation (Bann / Timeout bei Spam) und ggf. Benutzerrollen
- Datei‑Uploads & Limits
  - Erlaubte Formate: PDF, DOCX, PPTX, PNG, JPG (empfohlen)
  - Maximale Dateigröße: z.B. 10 MB pro Datei (konfigurierbar)
  - Zugriffskontrolle: Nur Kursmitglieder oder Upload‑Besitzer sehen private Dateien

## Could‑Have

- Skript‑Bibliothek mit Skripten, Übungsblättern und Vorlesungsmaterialien
- Auswahl zwischen Light‑ und Dark‑Mode
- Erweiterung der Foren (z.B. jahrgangsübergreifende Foren oder bei Bedarf entstehende Foren)
- Zusätzliche Features: Whiteboard, Erinnerungs‑/Push‑Benachrichtigungen, persönlicher Notizen‑Upload

## Wont‑Have (Out‑of‑Scope)

- Detaillierter Terminplaner (z.B. ähnlich Google Calendar)
- Lernapp im Sinne „Karteikarten erstellen und lernen“
- Notiz‑App (umfangreiche Notizverwaltung ist nicht geplant)
- Plattform für Professoren
- Nutzer außerhalb der DHBW
- Unterstützung weiterer Sprachen (außer Deutsch und Englisch)
- Off‑topic‑Austausch (z.B. private Treffen) — Fokus liegt auf vorlesungsrelevanten Inhalten
