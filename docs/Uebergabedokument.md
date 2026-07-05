# Übergabedokument
(markdown am besten lesbar auf github
https://github.com/Cameloon/Anwendungsprojekt/blob/main/docs/Uebergabedokument.md
)


Zusammenfassung und Verweise auf relevante Einzeldokumente

---

## 1. Projektidee (Kurzfassung)

Planer für Studierende der DHBW: Terminverwaltung je Vorlesung, vorlesungsbasierte Foren zum Austausch und ein Dashboard mit Lernübersicht.

→ Details: [Projektbeschreibung.md](Projektbeschreibung.md)

## 2. Inhalt der Abgabe

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

## 3. Verwendung des Codes

Installations- und Setup-Anleitung (Voraussetzungen, Umgebungsvariablen, lokaler Start, Befehlsübersicht) in der [README.md](../README.md).

## 4. Registrierung (Hinweis zur Übergabe)

Regulär durchläuft ein neuer Account nach der Registrierung den Status `pending` und muss von einem Admin über die Nutzerverwaltung freigeschaltet werden (siehe Auth- & Access-Flow in [AGENTS.md](../AGENTS.md)), bevor die Anwendung genutzt werden kann.

Für die vereinfachte Nutzung im Rahmen der Übergabe wurde dieser Freischaltungsschritt vorübergehend deaktiviert: Neue Profile erhalten nach Abschluss des Onboardings direkt den Status `active`, ohne dass eine Admin-Freigabe erforderlich ist. Zur Registrierung genügt somit ein Google-Konto oder eine E-Mail-Adresse über Clerk; die Bestätigung erfolgt selbstständig per E-Mail-Code (Clerk-Verifizierung), nicht durch einen Admin.

Für die Abnahme wurden zudem Testdaten für den Informatik-Kurs **TIF25B** am Standort **DHBW Lörrach** angelegt. Um diese Inhalte (z.B. Foren, Beiträge) einsehen zu können, muss bei der Registrierung entsprechend Kurs `TIF25B` und Standort `DHBW Lörrach` ausgewählt werden.

Außerdem wurde in den Profileinstellungen vorübergehend die Option eingebaut, dass man sich selbst die **Rollen Benutzer oder Administator** zuteilen kann, sodass für die Abnahme die gesamte ANwendung begutachtet werden kann.

## 5. Rückblick & Ausblick

Probleme während der Entwicklung, Abweichungen von der ursprünglichen Planung sowie offene Punkte und mögliche Erweiterungen für Folgegruppen sind ausführlich dokumentiert in [Rückblick_und_Ausblick.md](Rückblick_und_Ausblick.md).

## 6. Team

Namens-/GitHub-Zuordnung siehe [README.md](../README.md#team--namenszuordnung-github), Verantwortungsbereiche siehe [Rollenverteilung.md](Rollenverteilung.md).
