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


### BUG-014: Lint-Status des Projekts – produktive Dateien verletzen React-Hook-Regeln
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

---

### BUG-010: Dashboard – Skriptbereich zeigt nur öffentliche Skripte
Datum erfasst: 03-07-2026
Verfasser: CC
Komponente/Bereich: Dashboard UI
Priorität: Mittel
Beschreibung:
Im Dashboard werden Skripte über api.scripts.listPublic bzw. nur aus der öffentlichen Sicht geladen. Dadurch fehlen im Dashboard Skripte mit Sichtbarkeit jahrgang, group oder private eigene Skripte, obwohl diese in der Skript-Bibliothek sichtbar sind. Die Anzeige im Dashboard ist damit unvollständig und weicht vom tatsächlichen Datenbestand der Bibliothek ab.
Fundort: src/pages/DashboardPage.tsx, Query für Skripte


---


### BUG-011: Dashboard – Zeitabhängige Kennzahlen können ohne Re-Render veralten
Datum erfasst: 03-07-2026
Verfasser: CC
Komponente/Bereich: Dashboard UI
Priorität: Niedrig
Beschreibung:
Kennzahlen wie „Nächster Termin“ und die Anzahl dringender Termine hängen direkt von der aktuellen Uhrzeit ab. Bleibt die Seite länger geöffnet, können diese Werte ohne regelmäßige Aktualisierung veralten und nicht mehr den tatsächlichen Stand widerspiegeln.
Fundort: src/pages/DashboardPage.tsx, Berechnung von nextDeadline und urgentDeadlinesCount

---

### BUG-004: PlannerPage – Datei-Upload im Termin-Dialog ist ein toter Stub

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** CC
**Bearbeitet durch:** DM
**Komponente/Bereich:** Planer
**Priorität:** Mittel
**Beschreibung:**
Im Detail-Dialog eines Termins existiert ein Datei-Upload-Element, dessen `onChange`-Handler leer ist (`onChange={() => {}}`). Die Mutationen `generateUploadUrl` und `attachFile` sind importiert, aber nicht mit dem UI-Element verbunden. Dateien können nicht angehängt werden.
**Fundort:** `src/pages/PlannerPage.tsx`, Zeile 923
**Fix:** `onChange` ruft jetzt echten Upload auf (`generateUploadUrl` → Datei hochladen → `attachFile`); zusätzlich Löschen-Button pro Anhang ergänzt. Nebenbefund behoben: Anhänge wurden nie geladen (`listForUser` liefert sie nicht mit), daher neue Query `api.deadlines.getAttachments` für den geöffneten Termin ergänzt. Außerdem fehlte in `attachFile` jede Zugriffsprüfung – jetzt über `canAccessDeadline` abgesichert.

---

### BUG-012: Projektweite Zeichenkodierung – fehlerhafte Sonderzeichen in der UI

**Datum erfasst:** 03-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** CC
**Bearbeitet durch:** DM
**Komponente/Bereich:** UI / Frontend-Texte
**Priorität:** Mittel
**Beschreibung:**
Mehrere Benutzertexte enthalten fehlerhaft dargestellte Sonderzeichen wie Ã¼, Ã–, Ã¤ oder das Ersatzzeichen �. Dadurch wirken Oberfläche und Texte technisch fehlerhaft und unprofessionell. Der Fehler tritt nicht nur im Dashboard, sondern auch in anderen Seiten wie dem Planer auf.
**Fundort:** z. B. `src/pages/PlannerPage.tsx`, `src/pages/DashboardPage.tsx`
**Fix:** In `DashboardPage.tsx` fehlerhafte ASCII-Ersetzungen korrigiert ("Forenbeitraege"→"Forenbeiträge", "Beitraege"→"Beiträge", "Eintraege"→"Einträge", "fuer"→"für", "Naechster"→"Nächster", "gewaehlte"→"gewählte", "Gesamtuebersicht"→"Gesamtübersicht"). `PlannerPage.tsx` war bereits durch eine frühere Übersetzungsarbeit sauber.

---

### BUG-013: Detail-Dialog verhält sich beim Schließen instabil

**Datum erfasst:** 03-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** CC
**Bearbeitet durch:** DM
**Komponente/Bereich:** ~~Planer~~ **Skripte** (siehe Hinweis unten)
**Priorität:** Hoch
**Beschreibung:**
Der Detail-Dialog eines Termins zeigt instabiles Verhalten beim Schließen. In Verbindung mit der URL-basierten Öffnungslogik (?deadline=...) kann es dazu kommen, dass der Dialog nicht zuverlässig geschlossen wird oder unmittelbar wieder geöffnet erscheint. Das Verhalten ist für Nutzer irritierend und wirkt wie ein hängendes Modal.
**Fundort:** ~~`src/pages/PlannerPage.tsx`, Dialog- und Query-Logik für Termin-Details~~
**Hinweis:** Der Fehler war beim Ersterfassen falsch verortet. `PlannerPage.tsx` hat gar keine URL-basierte Öffnungslogik (kein `useSearchParams`, auch nicht in der Git-Historie vor dieser Session) – der `?deadline=...`-Link aus dem Dashboard führt dort aktuell ins Leere. Das beschriebene Bug-Muster (Dialog öffnet sich nach dem Schließen sofort wieder) trat tatsächlich in **`src/pages/SkriptePage.tsx`** auf, bei der `?script=...`-Öffnungslogik für die Skript-Detailansicht.
**Fix:** Der `useEffect`, der den Dialog aus dem URL-Parameter öffnet, hing u. a. von `scripts` ab – da sich diese Liste durch Convex-Reactivity ständig referenziell ändert, konnte der Effekt kurz nach dem Schließen erneut feuern, bevor der URL-Parameter tatsächlich entfernt war, und den Dialog sofort wieder öffnen. Fix über ein Ref (`dismissedQueryScriptId`), das sich merkt, welche Script-ID der Nutzer bereits geschlossen hat, und ein erneutes Öffnen dafür verhindert. Ein entsprechendes Deep-Link-Feature für den Planer (`?deadline=...`) existiert weiterhin nicht und müsste als eigenes Feature neu gebaut werden.

---

### BUG-005: PlannerPage – Bearbeiten/Löschen bei fremden öffentlichen Terminen sichtbar

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** CC
**Bearbeitet durch:** DM
**Komponente/Bereich:** Planer
**Priorität:** Mittel
**Beschreibung:**
Die Bedingung `isOwn || d.visibility === "public"` zeigt Bearbeiten- und Löschen-Buttons für alle öffentlichen Termine, auch wenn der angemeldete Nutzer nicht der Ersteller ist. Das Backend lehnt solche Aktionen ab, die UI ist jedoch irreführend.
**Fundort:** `src/pages/PlannerPage.tsx`, Zeile 850
**Hinweis:** Die ursprüngliche Annahme "Das Backend lehnt solche Aktionen ab" traf nicht zu – `update` und `deleteDeadline` in `convex/deadlines.ts` prüften die Berechtigung bisher nur bei `visibility === "private"`; bei öffentlichen Terminen gab es serverseitig gar keine Eigentümer-Prüfung.
**Fix:** Backend: Berechtigungsprüfung in `update` (Besitzer oder Eingeladene) und `deleteDeadline` (nur Besitzer) gilt jetzt unabhängig von `visibility`, nicht mehr nur für private Termine. Frontend: Bearbeiten-Button an allen 6 Stellen zeigt sich jetzt nur noch für Besitzer oder Eingeladene, Löschen-Button nur noch für den Besitzer.

