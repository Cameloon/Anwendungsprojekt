# Rückblick & Ausblick

## Rückblick

### Fachliche Abweichungen von der ursprünglichen Planung

- **Auf weitere Standorte erweitert, statt nur DHBW-Lörrach** Ursprünglich nur für die DHBW-Lörrach geplant, wurden im Laufe des Projektes dennoch die weiteren DHBW Standorte aufgenommen.
- **Dashboard-Lernfortschritt anders umgesetzt als ursprünglich beschrieben.** `Projektbeschreibung.md` sah eine "prozentuale Anzahl der fertiggestellten Wochenaufgaben" vor. Umgesetzt wurden stattdessen einfache Kennzahlen (offene Termine, dringende Termine, nächster Termin) ohne Prozent- oder Wochenbezug, da der Fokus so auf die tatsächlich anstehenden Terminen, bzw. andere aktuelle Infos aus dem Forum / den Skripten gelenkt wird.
- **Supabase war ursprünglich geplant, wurde aber nicht angebunden.** Ursprünglich als Datei-Storage vorgesehen, aber tatsächlich liefen Uploads von Anfang an vollständig über Convex File Storage. Der ungenutzte Supabase-Client (`src/integrations/supabase/`), die Abhängigkeit `@supabase/supabase-js` sowie alle zugehörigen Env-Variablen/Docker-Build-Args wurden entfernt.

### Technische Probleme während der Entwicklung

- **Serverseitige Berechtigungsprüfungen fehlten zunächst** und existierten nur als UI-Bedingung (BUG-005: Bearbeiten/Löschen öffentlicher Termine war clientseitig verboten, backend-seitig aber nicht abgesichert). Lehre: sicherheitsrelevante Prüfungen gehören von Anfang an ins Backend, nicht nur ins UI.
- **Convex-Reactivity-Fallstrick** (BUG-013): Ein `useEffect`, der von einer sich bei jedem Render neu referenzierenden Liste abhing, öffnete einen Dialog ungewollt erneut. Ursache erst nach Fehlzuordnung (zunächst im Planner vermutet, tatsächlich in der Skripte-Seite) gefunden.
- **Durchgängige Zeichenkodierungsfehler** (BUG-012) in mehreren Seiten (kaputte Umlaute) — vermutlich Folge einer früheren Copy/Paste- oder Editor-Encoding-Problematik, die erst spät im Projekt auffiel und projektweit korrigiert werden musste.
- **Meldefunktion zunächst nur lokal:** Gemeldete Beiträge wurden zuerst in `localStorage` statt zentral in Convex gespeichert (BUG-009) und waren dadurch für Admins anderer Browser/Geräte unsichtbar — ein Beispiel dafür, dass einzelne Features zunächst als Frontend-Provisorium gebaut und erst später ans Backend angebunden wurden.

---

## Ausblick

Mögliche Erweiterungen des StudentPlanners

### Funktionale Erweiterungen

- **Professoren als eigene Nutzerrolle ergänzen.** Aktuell ist eine Plattform für Professoren zur Organisation von Vorlesungen bewusst als Out-of-Scope definiert (`Funktionale_Anforderungen.md`). Zukünftig wäre ein eigener Professoren-Zugang denkbar — z. B. zum Verwalten von Vorlesungen/Terminen, Hochladen offizieller Materialien oder Teilnahme an vorlesungsspezifischen Foren. Setzt ein erweitertes Rollen-/Rechtekonzept über die bestehende Unterscheidung `admin`/`user` hinaus voraus.
- **Studierende hochschulübergreifend vernetzen.** Foren und Vorlesungen sind bisher an Kurs und Standort gebunden. Ein Austausch über die eigene DHBW-Hochschule hinaus, etwa gemeinsame Foren pro Studiengang standortübergreifend. Das bestehende Datenmodell der DHBW-Standorte (`src/lib/dhbw.ts`) bietet sich als Grundlage an, um Sichtbarkeits- und Mitgliedschaftsregeln für Foren um eine hochschulübergreifende Ebene zu erweitern. Außerdem kann das Konzept auch für andere Hochschulen/Universitäten ausgeweitet werden.
- **Skript-Bibliothek weiter ausbauen.** Mehrere bereits als Should-/Could-Have vorgesehene Funktionen rund um Skripte sind noch offen, u. a. erweiterte Upload-Regeln und Quota-Management pro Nutzer/Kurs, Kategorisierung nach Metadaten (Jahr, Dozent, Modul) sowie Bewertungsmöglichkeiten für Material (siehe `Funktionale_Anforderungen.md`). Bietet sich als klar abgrenzbares nächstes Arbeitspaket für eine Folgegruppe an.
- **Erweiterte Forenfunktionen nachziehen.** Kategorie-Tags pro Beitrag existieren bereits (`tag`-Feld in `convex/posts.ts`), die als Should-Have vorgesehenen Funktionen "Pinnen"/"Als wichtig markieren" und "Sortierung nach Aktivität" sind im Code aber nicht vorhanden (siehe `Funktionale_Anforderungen.md`). Guter, klar abgegrenzter nächster Schritt für die Forenfunktionalität.
- **Jahrgangsübergreifendes Q&A-Forum pro Studienfach.** Als Should-Have vorgesehen (siehe `Funktionale_Anforderungen.md`), aber noch nicht umgesetzt: Foren sind aktuell an Kurs (und damit Jahrgang) gebunden. Ein zusätzliches Forum, das Studierende desselben Studienfachs unabhängig vom Jahrgang zusammenbringt, würde den Austausch über Kursgrenzen hinweg ermöglichen — losgelöst von der oben genannten hochschulübergreifenden Vernetzung, die auf den Standort statt den Jahrgang zielt.
- **Entsperrungsantrag für gebannte Nutzer.** Admins können Nutzer bannen (`convex/admin.ts:banUser`). Betroffene Nutzer sehen aktuell nur einen Hinweis auf dem Sperrbildschirm (`ProtectedRoute.tsx`), dass sie gesperrt wurden, und müssen sich außerhalb der App an einen Admin wenden. Zukünftig soll es stattdessen ein Formular direkt auf dem Sperrbildschirm geben, über das ein Entsperrungsantrag an die Admins gestellt werden kann.
- **Content-Moderation über reinen Keyword-Filter hinaus.** `convex/hateSpeech.ts` erkennt Hassrede aktuell über eine feste Wortliste. Das führte sowohl zu False Positives (BUG-037: „Opfer" traf auch harmlose Verwendungen wie „Verkehrsopfer") als auch zu blinden Flecken bei Umschreibungen ohne Listenwort. Ein kontextsensitiverer Ansatz (z. B. LLM-gestützte Klassifikation statt reinem String-Matching) würde beide Fehlerarten reduzieren.
- **Echte Erinnerungsfunktion für Termine.** Das Feld `remindBefore` existiert weiterhin im Datenmodell, die zugehörige UI wurde aber entfernt, da mangels Scheduler/Cron nie tatsächlich Erinnerungen verschickt wurden (BUG-032). Mit Convex Scheduled Functions ließe sich eine echte Erinnerungsfunktion nachrüsten — idealerweise inklusive E-Mail-/Push-Benachrichtigung statt ausschließlich In-App-Glocke.
- **Globale Suche.** Es gibt aktuell keine übergreifende Suche über Foren, Skripte und Termine hinweg. Bei wachsendem Datenbestand pro Kurs/Standort würde eine zentrale Suchfunktion das Auffinden von Inhalten erheblich erleichtern.
- **CSV-Import für Vorlesungen im Admin-Dashboard.** Vorlesungen können aktuell nur einzeln über ein Formular angelegt oder aus der hartcodierten `SEED_DATA`-Konstante befüllt werden (`convex/semesterLectures.ts:407`). Ein CSV-Import würde Admins erlauben, semesterweise Vorlesungsverzeichnisse (z. B. aus DHBW-Stundenplänen oder Modulhandbüchern) als Bulk-Operation einzuspielen — mit Spalten wie `Kurs`, `Semester`, `Vorlesungsname`. Der Import ließe sich als neue Admin-Mutation (`semesterLectures.importCsv`) umsetzen, die einen CSV-String parsed, validiert (Kurs/Semester-Format, Duplikatserkennung) und per `ctx.db.insert` in die `semesterLectures`-Tabelle schreibt. Frontendseitig ein einfacher Drag-&-Drop- oder Dateiauswahl-Dialog im Admin-Dashboard, der die CSV-Datei einliest und als String an die Mutation übergibt.

### Design / UX

- **Eigenständigere visuelle Identität statt generischer "KI-Optik".** Das UI basiert bislang stark auf shadcn/ui-Standardkomponenten und dem ursprünglichen Lovable-Prototyp und wirkt dadurch noch sichtbar nach generischem, KI-generiertem Layout. Für die Weiterentwicklung empfiehlt sich ein eigenständigeres Designkonzept (Farbwelt, Typografie, Illustrationen/Icons), um eine wiedererkennbare, weniger austauschbar wirkende Plattform-Identität zu schaffen.

### Infrastruktur & Betrieb

- **Cloud-Abhängigkeit statt DHBW-Integration.** Die Anwendung setzt vollständig auf externe Cloud-Dienste (Clerk, Convex). Eine Integration in die DHBW-IT-Landschaft (z. B. DHBW-SSO, On-Premise-Betrieb) ist nicht vorbereitet.
- **Kein öffentliches Produktiv-Deployment — persönliches Dev-Setup ablösen.** Es existiert kein dauerhaft erreichbares Produktiv-Deployment: Convex läuft aktuell gebunden an den privaten Account eines einzelnen Teammitglieds, der verwendete Clerk-Key ist ebenfalls nur ein Test-Key. Für eine nachhaltige Weiterentwicklung über die Projektlaufzeit hinaus sollte ein teameigenes bzw. institutionelles Produktiv-Deployment aufgesetzt werden, damit der Zugriff nicht vom Fortbestehen eines einzelnen persönlichen Accounts abhängt.
