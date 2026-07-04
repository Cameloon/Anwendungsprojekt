# Rückblick & Ausblick

## Rückblick

### Fachliche Abweichungen von der ursprünglichen Planung

- **Mehrsprachigkeit (DE/EN) nur teilweise umgesetzt.** Als Must-Have in `Funktionale_Anforderungen.md` definiert, aber `useLanguage()` ist aktuell nur in Planner und Account-Bereich verdrahtet. Dashboard, Forum und Skripte-Seite sind weiterhin fest auf Deutsch. Sollte entweder nachgezogen oder der Anforderungsstatus bewusst auf "teilweise" korrigiert werden.
- **Dashboard-Lernfortschritt anders umgesetzt als ursprünglich beschrieben.** `Projektbeschreibung.md` sah eine "prozentuale Anzahl der fertiggestellten Wochenaufgaben" vor. Umgesetzt wurden stattdessen einfache Kennzahlen (offene Termine, dringende Termine, nächster Termin) ohne Prozent- oder Wochenbezug, da der Fokus so auf die tatsächlich anstehenden Terminen, bzw. andere aktuelle Infos aus dem Forum / den Skripten gelenkt wird.
- **Supabase war ursprünglich geplant, wurde aber nicht angebunden.** Ursprünglich als Datei-Storage vorgesehen, aber tatsächlich liefen Uploads von Anfang an vollständig über Convex File Storage. Der ungenutzte Supabase-Client (`src/integrations/supabase/`), die Abhängigkeit `@supabase/supabase-js` sowie alle zugehörigen Env-Variablen/Docker-Build-Args wurden entfernt.

### Technische Probleme während der Entwicklung

- **Serverseitige Berechtigungsprüfungen fehlten zunächst** und existierten nur als UI-Bedingung (BUG-005: Bearbeiten/Löschen öffentlicher Termine war clientseitig verboten, backend-seitig aber nicht abgesichert). Lehre: sicherheitsrelevante Prüfungen gehören von Anfang an ins Backend, nicht nur ins UI.
- **Convex-Reactivity-Fallstrick** (BUG-013): Ein `useEffect`, der von einer sich bei jedem Render neu referenzierenden Liste abhing, öffnete einen Dialog ungewollt erneut. Ursache erst nach Fehlzuordnung (zunächst im Planner vermutet, tatsächlich in der Skripte-Seite) gefunden.
- **Durchgängige Zeichenkodierungsfehler** (BUG-012) in mehreren Seiten (kaputte Umlaute) — vermutlich Folge einer früheren Copy/Paste- oder Editor-Encoding-Problematik, die erst spät im Projekt auffiel und projektweit korrigiert werden musste.
- **Meldefunktion zunächst nur lokal:** Gemeldete Beiträge wurden zuerst in `localStorage` statt zentral in Convex gespeichert (BUG-009) und waren dadurch für Admins anderer Browser/Geräte unsichtbar — ein Beispiel dafür, dass einzelne Features zunächst als Frontend-Provisorium gebaut und erst später ans Backend angebunden wurden.
- **Fehlende Backend-Tests wurden im Rahmen dieser Dokumentation nachgezogen.** Bis dahin gab es laut `AGENTS.md` keine Convex-Testfixtures, alle Tests waren frontend-only. Ergänzt wurden Regressionstests (`tests/convex/`, via `convex-test`) für die sicherheitskritischsten Berechtigungsprüfungen: Termin-Bearbeitung/-Löschung (BUG-005-Muster), Kommentar-Bearbeitung/-Löschung (BUG-003-Muster), Admin-/Rollen-Mutations sowie die Sichtbarkeitsregeln der Skript-Bibliothek (private/jahrgang/group/public). Lehre: genau diese Art von Lücke (Berechtigung nur im UI statt im Backend geprüft) hätte ein Test schon beim ersten Einbau verhindert.

### Nicht abgeschlossene Punkte zum Abgabezeitpunkt

- BUG-014 (Lint-Verstöße gegen React-Hook-Regeln in produktivem Code, z. B. `useAuth.tsx`, `ProtectedRoute.tsx`) ist zum Abgabezeitpunkt noch offen.

---

## Ausblick

### Funktionale Erweiterungen

- **Professoren als eigene Nutzerrolle ergänzen.** Aktuell ist eine Plattform für Professoren zur Organisation von Vorlesungen bewusst als Out-of-Scope definiert (`Funktionale_Anforderungen.md`). Zukünftig wäre ein eigener Professoren-Zugang denkbar — z. B. zum Verwalten von Vorlesungen/Terminen, Hochladen offizieller Materialien oder Teilnahme an vorlesungsspezifischen Foren. Setzt ein erweitertes Rollen-/Rechtekonzept über die bestehende Unterscheidung `admin`/`user` hinaus voraus.
- **Studierende hochschulübergreifend vernetzen.** Foren und Vorlesungen sind bisher an Kurs und Standort gebunden. Ein Austausch über die eigene DHBW-Hochschule hinaus, etwa gemeinsame Foren pro Studiengang standortübergreifend. Das bestehende Datenmodell der DHBW-Standorte (`src/lib/dhbw.ts`) bietet sich als Grundlage an, um Sichtbarkeits- und Mitgliedschaftsregeln für Foren um eine hochschulübergreifende Ebene zu erweitern. Außerdem kann das Konzept auch für andere Hochschulen/Universitäten ausgeweitet werden.
- **Skript-Bibliothek weiter ausbauen.** Mehrere bereits als Should-/Could-Have vorgesehene Funktionen rund um Skripte sind noch offen, u. a. erweiterte Upload-Regeln und Quota-Management pro Nutzer/Kurs, Kategorisierung nach Metadaten (Jahr, Dozent, Modul) sowie Bewertungsmöglichkeiten für Material (siehe `Funktionale_Anforderungen.md`). Bietet sich als klar abgrenzbares nächstes Arbeitspaket für eine Folgegruppe an.
- **Erweiterte Forenfunktionen nachziehen.** Kategorie-Tags pro Beitrag existieren bereits (`tag`-Feld in `convex/posts.ts`), die als Should-Have vorgesehenen Funktionen "Pinnen"/"Als wichtig markieren" und "Sortierung nach Aktivität" sind im Code aber nicht vorhanden (siehe `Funktionale_Anforderungen.md`). Guter, klar abgegrenzter nächster Schritt für die Forenfunktionalität.
- **Jahrgangsübergreifendes Q&A-Forum pro Studienfach.** Als Should-Have vorgesehen (siehe `Funktionale_Anforderungen.md`), aber noch nicht umgesetzt: Foren sind aktuell an Kurs (und damit Jahrgang) gebunden. Ein zusätzliches Forum, das Studierende desselben Studienfachs unabhängig vom Jahrgang zusammenbringt, würde den Austausch über Kursgrenzen hinweg ermöglichen — losgelöst von der oben genannten hochschulübergreifenden Vernetzung, die auf den Standort statt den Jahrgang zielt.

### Design / UX

- **Eigenständigere visuelle Identität statt generischer "KI-Optik".** Das UI basiert bislang stark auf shadcn/ui-Standardkomponenten und dem ursprünglichen Lovable-Prototyp und wirkt dadurch noch sichtbar nach generischem, KI-generiertem Layout. Für die Weiterentwicklung empfiehlt sich ein eigenständigeres Designkonzept (Farbwelt, Typografie, Illustrationen/Icons), um eine wiedererkennbare, weniger austauschbar wirkende Plattform-Identität zu schaffen.

### Infrastruktur & Betrieb

- **Persönliches Dev-Deployment durch teameigene Produktivinstanz ablösen.** Convex läuft aktuell gebunden an den privaten Account eines einzelnen Teammitglieds; der verwendete Clerk-Key ist ebenfalls nur ein Test-Key. Für eine nachhaltige Weiterentwicklung über die Projektlaufzeit hinaus sollte ein teameigenes bzw. institutionelles Produktiv-Deployment aufgesetzt werden, damit der Zugriff nicht vom Fortbestehen eines einzelnen persönlichen Accounts abhängt.
