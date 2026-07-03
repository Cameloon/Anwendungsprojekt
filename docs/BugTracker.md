# BugTracker

## Vorgehen:

- Fehlfunktionen anhand der folgenden Vorlage zum Bereich "Aktive Bugs" hinzufügen
- Beschäftigst du dich mit der Behebung eines Fehler, schiebe diesen in "Bugs in Bearbeitung" und ergänze das Feld "Bearbeiter" mit deinem Kürzel
- Ist der Fehler abgestellt, schiebe diesen in "Erledigte Bugs"

## Vorlage

Hinweis:für XXX die fortlaufende Nummer eingeben

"

### BUG-XXX: [Kurzer, prägnanter Titel des Fehlers]

**Datum erfasst:** DD-MM-YYYY
**Verfasser:** Kürzel des Verfassers, z.B. "DM" für Daniela Maier
**Komponente/Bereich:** z.B. Dashboard UI, Forum Backend, etc.
**Priorität:** Hoch/Mittel/Niedrig
**Beschreibung:**
Beschreibung des Fehlers (ggf. ergänzend Screenshots in die WhatsApp Gruppe)
"

## Aktive Bugs

### BUG-004: PlannerPage – Datei-Upload im Termin-Dialog ist ein toter Stub

**Datum erfasst:** 25-06-2026
**Verfasser:** CC
**Komponente/Bereich:** Planer
**Priorität:** Mittel
**Beschreibung:**
Im Detail-Dialog eines Termins existiert ein Datei-Upload-Element, dessen `onChange`-Handler leer ist (`onChange={() => {}}`). Die Mutationen `generateUploadUrl` und `attachFile` sind importiert, aber nicht mit dem UI-Element verbunden. Dateien können nicht angehängt werden.
**Fundort:** `src/pages/PlannerPage.tsx`, Zeile 923

---

### BUG-005: PlannerPage – Bearbeiten/Löschen bei fremden öffentlichen Terminen sichtbar

**Datum erfasst:** 25-06-2026
**Verfasser:** CC
**Komponente/Bereich:** Planer
**Priorität:** Mittel
**Beschreibung:**
Die Bedingung `isOwn || d.visibility === "public"` zeigt Bearbeiten- und Löschen-Buttons für alle öffentlichen Termine, auch wenn der angemeldete Nutzer nicht der Ersteller ist. Das Backend lehnt solche Aktionen ab, die UI ist jedoch irreführend.
**Fundort:** `src/pages/PlannerPage.tsx`, Zeile 850

---

BUG-010: Dashboard – Skriptbereich zeigt nur öffentliche Skripte
Datum erfasst: 03-07-2026
Verfasser: CC
Komponente/Bereich: Dashboard UI
Priorität: Mittel
Beschreibung:
Im Dashboard werden Skripte über api.scripts.listPublic bzw. nur aus der öffentlichen Sicht geladen. Dadurch fehlen im Dashboard Skripte mit Sichtbarkeit jahrgang, group oder private eigene Skripte, obwohl diese in der Skript-Bibliothek sichtbar sind. Die Anzeige im Dashboard ist damit unvollständig und weicht vom tatsächlichen Datenbestand der Bibliothek ab.
Fundort: src/pages/DashboardPage.tsx, Query für Skripte

---

BUG-011: Dashboard – Fachfilter berücksichtigt nur Vorlesungen des aktuellen Semesters
Datum erfasst: 03-07-2026
Verfasser: CC
Komponente/Bereich: Dashboard UI
Priorität: Mittel
Beschreibung:
Die Fachkarten im Dashboard basieren auf getLecturesForMyKurs und damit nur auf Vorlesungen des aktuellen Semesters. Inhalte wie ältere Beiträge, Skripte oder Termine können zwar in den geladenen Daten vorhanden sein, erscheinen aber nicht in den auswählbaren Fachfiltern. Dadurch entsteht eine inkonsistente Filterlogik zwischen sichtbaren Inhalten und auswählbaren Fächern.
Fundort: src/pages/DashboardPage.tsx, convex/semesterLectures.ts

---


BUG-012: Dashboard – Zeitabhängige Kennzahlen können ohne Re-Render veralten
Datum erfasst: 03-07-2026
Verfasser: CC
Komponente/Bereich: Dashboard UI
Priorität: Niedrig
Beschreibung:
Kennzahlen wie „Nächster Termin“ und die Anzahl dringender Termine hängen direkt von der aktuellen Uhrzeit ab. Bleibt die Seite länger geöffnet, können diese Werte ohne regelmäßige Aktualisierung veralten und nicht mehr den tatsächlichen Stand widerspiegeln.
Fundort: src/pages/DashboardPage.tsx, Berechnung von nextDeadline und urgentDeadlinesCount

---


BUG-013: Projektweite Zeichenkodierung – fehlerhafte Sonderzeichen in der UI
Datum erfasst: 03-07-2026
Verfasser: CC
Komponente/Bereich: UI / Frontend-Texte
Priorität: Mittel
Beschreibung:
Mehrere Benutzertexte enthalten fehlerhaft dargestellte Sonderzeichen wie Ã¼, Ã–, Ã¤ oder das Ersatzzeichen �. Dadurch wirken Oberfläche und Texte technisch fehlerhaft und unprofessionell. Der Fehler tritt nicht nur im Dashboard, sondern auch in anderen Seiten wie dem Planer auf.
Fundort: z. B. src/pages/PlannerPage.tsx, src/pages/DashboardPage.tsx

---


BUG-014: PlannerPage – Detail-Dialog für Termine verhält sich beim Schließen instabil
Datum erfasst: 03-07-2026
Verfasser: CC
Komponente/Bereich: Planer
Priorität: Hoch
Beschreibung:
Der Detail-Dialog eines Termins zeigt instabiles Verhalten beim Schließen. In Verbindung mit der URL-basierten Öffnungslogik (?deadline=...) kann es dazu kommen, dass der Dialog nicht zuverlässig geschlossen wird oder unmittelbar wieder geöffnet erscheint. Das Verhalten ist für Nutzer irritierend und wirkt wie ein hängendes Modal.
Fundort: src/pages/PlannerPage.tsx, Dialog- und Query-Logik für Termin-Details

---


BUG-015: Lint-Status des Projekts – produktive Dateien verletzen React-Hook-Regeln
Datum erfasst: 03-07-2026
Verfasser: CC
Komponente/Bereich: Projektqualität / Frontend-Architektur
Priorität: Mittel
Beschreibung:
Der aktuelle Lint-Status enthält Fehler in produktiven Dateien, darunter Verstöße gegen die React-Hook-Regeln wie konditionale Hook-Aufrufe. Das ist nicht nur ein Stilproblem, sondern kann zu instabilem Laufzeitverhalten führen und fällt bei einer technischen Prüfung des Projekts sofort auf.
Fundort: z. B. src/hooks/useAuth.tsx, src/components/ProtectedRoute.tsx, src/components/EnsureProfile.tsx



---

## Bugs in Bearbeitung

Hinweis: Bearbeiter mit Kürzel ergänzen



---

## Erledigte Bugs

Hinweis: "Datum erledigt" ergänzen

### BUG-001: Dashboard Forum-Feed – Foren ausblenden ohne Wirkung

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 26-06-2026
**Verfasser:** CC
**Bearbeitet durch:** DM
**Komponente/Bereich:** Dashboard UI
**Priorität:** Hoch
**Beschreibung:**
Die Variable `visible` (gefilterte Forum-Liste ohne ausgeblendete Foren) wird in `ForumFeed.tsx` berechnet, aber nie verwendet. Die Render-Schleife und die Leer-Meldung arbeiten weiterhin mit der vollständigen `forums`-Liste. Klick auf „Ausblenden" speichert den Wunsch zwar in localStorage, hat aber keinerlei sichtbaren Effekt.
**Fundort:** `src/components/ForumFeed.tsx`, Zeilen 77 und 83

---

### BUG-002: Dashboard Forum-Feed – Post-Link führt zum Forum statt zum Beitrag

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 26-06-2026
**Verfasser:** CC
**Bearbeitet durch:** DM
**Komponente/Bereich:** Dashboard UI
**Priorität:** Hoch
**Beschreibung:**
Klickt ein Nutzer im Dashboard-Forum-Feed auf den Titel eines Beitrags, landet er auf `/forum` (allgemeine Forum-Liste) statt auf der Detailseite des konkreten Beitrags. Das Link-Ziel ist hardcoded als `/forum`.
**Fundort:** `src/components/ForumFeed.tsx`, Zeile 104

---

### BUG-006: Forum-Einladungen senden Freitext-Namen statt User-IDs

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 26-06-2026
**Verfasser:** CC
**Bearbeitet durch:** DM
**Komponente/Bereich:** Forum – Einladungsdialog
**Priorität:** Mittel
**Beschreibung:**
Im Einladungsdialog (sowohl in ForumDetailPage als auch ForumPage) werden die eingegebenen Freitext-Namen direkt als `recipientIds` übergeben. Da das System echte User-IDs erwartet, kommen Einladungen nicht an.
**Fundort:** `src/pages/ForumDetailPage.tsx` Zeile 278, `src/pages/ForumPage.tsx` Zeile 357

---

### BUG-007: ForumPage – ForumItem-Komponente innerhalb der Render-Funktion definiert

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 26-06-2026
**Verfasser:** CC
**Bearbeitet durch:** DM
**Komponente/Bereich:** Forum – Sidebar
**Priorität:** Niedrig
**Beschreibung:**
Die Komponente `ForumItem` ist innerhalb von `ForumPageLayout` definiert und wird bei jedem Re-Render neu instanziiert. React erkennt sie als neue Komponente, unmountet und remountet die Sidebar-Einträge – sichtbar als kurzes Flackern beim Liken oder Posten.
**Fundort:** `src/pages/ForumPage.tsx`, Zeile 695

---

### BUG-009: ReportDialog – Meldungen werden in localStorage statt Convex gespeichert

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 26-06-2026
**Verfasser:** CC
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum – Melden-Funktion
**Priorität:** Mittel
**Beschreibung:**
Der „Melden"-Button in `PostDetailPage` und `ForumPage` öffnet einen `ReportDialog`, der Meldungen über `addReport` aus `src/lib/reportsStore.ts` in localStorage speichert. Dadurch sind Meldungen nur im Browser des meldenden Nutzers sichtbar – der Admin sieht im Dashboard nur Meldungen aus dem eigenen Browser, nicht die anderer Nutzer. Eine persistente, geräteübergreifende Auswertung ist nicht möglich.
**Fundort:** `src/components/ReportDialog.tsx`, `src/lib/reportsStore.ts`

---

### BUG-003: PostDetailPage – Kommentar löschen nur für Admins sichtbar

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 25-06-2026
**Verfasser:** CC
**Bearbeitet durch** DM (CC)
**Komponente/Bereich:** Forum – Beitragsdetail
**Priorität:** Hoch
**Beschreibung:**
Der Löschen-Button für Kommentare wird nur Admins angezeigt (`{isAdmin && …}`). Das Backend erlaubt es dem Verfasser, den eigenen Kommentar zu löschen, die UI bietet diese Möglichkeit jedoch nicht an. Nutzer können ihre eigenen Kommentare nicht entfernen.
**Fundort:** `src/pages/PostDetailPage.tsx`, Zeile 463

---

### BUG-008: Dashboard – Stat „Neue Beiträge" zeigt keine wirklich neuen Beiträge  

**Datum erfasst:** 25-06-2026
**Verfasser:** CC
**Komponente/Bereich:** Dashboard UI
**Priorität:** Niedrig
**Beschreibung:**
Der Wert hinter „Neue Beiträge" ist immer `latestPosts.length` (maximal 5), unabhängig davon, ob der Nutzer die Beiträge bereits gesehen hat. Die Kennzahl suggeriert Aktualität, ist aber kein zuverlässiger Indikator für wirklich neue Inhalte.
**Fundort:** `src/pages/DashboardPage.tsx`, Zeile 110

