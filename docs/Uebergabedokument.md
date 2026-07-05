# Übergabedokument

Markdown am besten lesbar auf github 
https://github.com/Cameloon/Anwendungsprojekt/blob/main/docs/Uebergabedokument.md


## 1. Namenszuordnung Github

- Sofia Antropova → antropos-v
- Daniel Beljaew → Cameloon, Dan
- Niklas Brietenhahn → niklas-b1
- Alexia Dinu → dinua23
- Daniela Maier → njela0


---
## 2. Setup, Installation und Registrierung

### 2.1 Setup vor der Registrierung
Vorraussetzung: Node.js

- cd Anwendungsprojekt
- npm install
- npm run dev

Dann http://localhost:8080/ im Browser öffnen

### 2.2 Registrierung
Für Registrierung genügt ein Google-Konto oder eine E-Mail-Adresse

Bitte Fach `Informatik` Kurs `TIF25B` und Standort `DHBW Lörrach` auswählen.
(Um die Beispieldaten zu sehen)

Die restlichen Daten sind frei Wählbar
(Matrikelnummer kann z.B. 12341234 sein)


## 3. Projektidee (Kurzfassung)

Planer für Studierende der DHBW: Terminverwaltung je Vorlesung, vorlesungsbasierte Foren zum Austausch und ein Dashboard mit Lernübersicht.

→ Details: [Projektbeschreibung.md](Projektbeschreibung.md)

## 4. Inhalt der Abgabe

| Lieferobjekt | Inhalt | Fundort |
|---|---|---|
| Quellcode | Vollständiges Git-Repository (Frontend + Convex-Backend) | Repository-Root, ggf. als ZIP ohne `node_modules` |
| Setup & Verwendung | Installation, Umgebungsvariablen, Start des Dev-Servers, Befehlsübersicht | [README.md](../README.md) |
| Architektur | Systemkontext, Container-/Komponentendiagramme, Datenmodell | [Architekturüberblick.md](Architekturüberblick.md) |
| Anforderungen | Must/Should/Could/Won't-Have mit Akzeptanzkriterien | [Funktionale_Anforderungen.md](Funktionale_Anforderungen.md) |
| Projektidee | Zielgruppe, Nutzen, Abgrenzung, Tech-Stack | [Projektbeschreibung.md](Projektbeschreibung.md) |
| Bugs | Bekannte, in Bearbeitung befindliche und erledigte Fehler | [BugTracker.md](BugTracker.md) |
| Testübersicht | Automatisch generierter Testreport (Frontend + Convex-Backend) | [test-uebersicht.md](test-uebersicht.md) |
| Rückblick & Ausblick | Abweichungen von der Planung, technische Probleme, bekannte Einschränkungen (Cloud-Abhängigkeit, kein Produktiv-Deployment), zukünftige Erweiterungen | [Rückblick_und_Ausblick.md](Rückblick_und_Ausblick.md) |
| Rollenverteilung | Teamzuordnung nach Verantwortungsbereich | [Rollenverteilung.md](Rollenverteilung.md) |
| Mockups | Nicht Teil der Abgabe — alle Kernfunktionen sind implementiert, kein Bereich wurde ausschließlich als Mockup umgesetzt | — |

## 5. Hinweis zum User Onboarding

Regulär durchläuft ein neuer Account nach der Registrierung den Status `pending` und muss von einem Admin über die Nutzerverwaltung freigeschaltet werden (siehe Auth- & Access-Flow in [AGENTS.md](../AGENTS.md)), bevor die Anwendung genutzt werden kann.

Für die vereinfachte Nutzung im Rahmen der Übergabe wurde dieser Freischaltungsschritt vorübergehend deaktiviert: Neue Profile erhalten nach Abschluss des Onboardings direkt den Status `active`, ohne dass eine Admin-Freigabe erforderlich ist. Zur Registrierung genügt somit ein Google-Konto oder eine E-Mail-Adresse über Clerk.

Außerdem wurde in den Profileinstellungen vorübergehend die Option eingebaut, dass man sich selbst die Rollen **Benutzer** oder **Administator** zuteilen kann, sodass für die Abnahme die gesamte Anwendung begutachtet werden kann.

## 7. Development Setup

Nicht notwendig für testing,
nur notwendig für Entwicklung und Datenbank-Änderungen:

Siehe [README.md](../README.md).

## 6. Rückblick & Ausblick

Probleme während der Entwicklung, Abweichungen von der ursprünglichen Planung sowie offene Punkte und mögliche Erweiterungen für Folgegruppen sind ausführlich dokumentiert in [Rückblick_und_Ausblick.md](Rückblick_und_Ausblick.md).

