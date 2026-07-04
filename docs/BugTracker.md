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

---

## Bugs in Bearbeitung

Hinweis: Bearbeiter mit Kürzel ergänzen

---

## Erledigte Bugs

Hinweis: "Datum erledigt" ergänzen

### BUG-001: Dashboard Forum-Feed – Foren ausblenden ohne Wirkung

**Datum erfasst:** 25-06-2026
**Datum erledigt:** 26-06-2026
**Verfasser:** DM (CC)
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
**Verfasser:** DM (CC)
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
**Verfasser:** DM (CC)
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
**Verfasser:** DM (CC)
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
**Verfasser:** DM (CC)
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
**Verfasser:** DM (CC)
**Bearbeitet durch** DM (CC)
**Komponente/Bereich:** Forum – Beitragsdetail
**Priorität:** Hoch
**Beschreibung:**
Der Löschen-Button für Kommentare wird nur Admins angezeigt (`{isAdmin && …}`). Das Backend erlaubt es dem Verfasser, den eigenen Kommentar zu löschen, die UI bietet diese Möglichkeit jedoch nicht an. Nutzer können ihre eigenen Kommentare nicht entfernen.
**Fundort:** `src/pages/PostDetailPage.tsx`, Zeile 463

---

### BUG-008: Dashboard – Stat „Neue Beiträge" zeigt keine wirklich neuen Beiträge

**Datum erfasst:** 25-06-2026
**Verfasser:** DM (CC)
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
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
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
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
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
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
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
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer
**Priorität:** Mittel
**Beschreibung:**
Die Bedingung `isOwn || d.visibility === "public"` zeigt Bearbeiten- und Löschen-Buttons für alle öffentlichen Termine, auch wenn der angemeldete Nutzer nicht der Ersteller ist. Das Backend lehnt solche Aktionen ab, die UI ist jedoch irreführend.
**Fundort:** `src/pages/PlannerPage.tsx`, Zeile 850
**Hinweis:** Die ursprüngliche Annahme "Das Backend lehnt solche Aktionen ab" traf nicht zu – `update` und `deleteDeadline` in `convex/deadlines.ts` prüften die Berechtigung bisher nur bei `visibility === "private"`; bei öffentlichen Terminen gab es serverseitig gar keine Eigentümer-Prüfung.
**Fix:** Backend: Berechtigungsprüfung in `update` (Besitzer oder Eingeladene) und `deleteDeadline` (nur Besitzer) gilt jetzt unabhängig von `visibility`, nicht mehr nur für private Termine. Frontend: Bearbeiten-Button an allen 6 Stellen zeigt sich jetzt nur noch für Besitzer oder Eingeladene, Löschen-Button nur noch für den Besitzer.

---

### BUG-015: ForumDetailPage – Archivieren/Rückgängig wirft ReferenceError

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum – Detailansicht
**Priorität:** Hoch
**Beschreibung:**
`archiveForumMutation`/`unarchiveForumMutation` wurden nur in `ForumDetailPage` erzeugt, aber innerhalb der separaten Funktion `ForumDetailLayout` referenziert, in der sie nicht im Scope sind. Klick auf „Archivieren"/„Rückgängig" wirft einen `ReferenceError`, der vom umgebenden `try/catch` verschluckt wird – der Nutzer sieht nur einen generischen Fehler-Toast, das Forum wird nie archiviert. In `ForumPage.tsx` war das gleiche Feature korrekt verdrahtet, hier ein isolierter Regressions-Bug.
**Fundort:** `src/pages/ForumDetailPage.tsx`, Zeilen 539, 543
**Fix:** `archiveForumMutation`/`unarchiveForumMutation` werden jetzt als Props von `ForumDetailPage` an `ForumDetailLayout` durchgereicht (analog zu `deleteForumMutation`).

---

### BUG-016: PlannerPage – Nachrichten-Tab eines Termins zeigt nie Nachrichten an

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer
**Priorität:** Hoch
**Beschreibung:**
`listForUser` liefert Termine ohne eingebettetes `messages`-Feld (Nachrichten liegen in der separaten Tabelle `deadlineMessages`), die dafür vorgesehene Query `getMessages` wurde im Frontend nirgends aufgerufen. Nachrichten wurden zwar über `addMessage` gespeichert, aber nie angezeigt – der Nachrichten-Tab zeigte immer „Keine Nachrichten." und die Badge-Zahl blieb bei 0.
**Fundort:** `convex/deadlines.ts`, `getMessages` (Zeile 118); `src/pages/PlannerPage.tsx`
**Fix:** Neue Query `openMessagesQuery` (`api.deadlines.getMessages`) für den geöffneten Termin ergänzt, analog zum bereits bestehenden Muster für Anhänge. `listForUser` liefert zusätzlich `messageCount` pro Termin mit, damit auch die Badge-Zahlen in der Terminliste korrekt sind (vorher immer 0).

---

### BUG-017: convex/deadlines.ts – getById, getMessages und addMessage ohne Berechtigungsprüfung

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer Backend
**Priorität:** Hoch
**Beschreibung:**
Anders als `getAttachments`/`attachFile` (die `canAccessDeadline` prüfen) hatten `getById`, `getMessages` und `addMessage` keine Zugriffsprüfung. Jeder eingeloggte Nutzer konnte per direktem API-Aufruf private Termine fremder Nutzer auslesen, alle Nachrichten fremder Termine lesen oder Nachrichten in fremde private Termine schreiben.
**Fundort:** `convex/deadlines.ts`, `getById` (Zeile 79), `getMessages` (Zeile 118), `addMessage` (Zeile 578)
**Fix:** Alle drei Funktionen prüfen jetzt `canAccessDeadline` vor dem Zugriff, analog zu `getAttachments`/`attachFile`.

---

### BUG-018: PlannerPage – Öffentlich-Schalten eines Termins lädt den Kurs nicht wirklich ein

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer
**Priorität:** Hoch
**Beschreibung:**
Beim Bearbeiten eines Termins wurden beim Wechsel auf „Öffentlich" die zuvor gesetzten Einzel-Invitees mit übernommen (`inviteeIds` blieb dadurch nicht leer). Da das Backend seinen Auto-Invite-Zweig (ganzer Kurs) nur auslöst, wenn `invitees` beim Update `undefined` ist, wurde bei diesem Übergang nur die alte Einzelliste gespeichert – trotz UI-Hinweis „Alle Personen deines Kurses werden automatisch eingeladen." Zusätzlich verschickte selbst der Auto-Invite-Zweig im Backend (anders als bei `create`) nie Benachrichtigungen an neu hinzugekommene Kurs-Mitglieder.
**Fundort:** `src/pages/PlannerPage.tsx`, Invitee-Merge-Logik in `submitDeadline`; `convex/deadlines.ts`, `update`-Mutation
**Fix:** Die Übernahme bestehender Invitees beim Bearbeiten greift jetzt nur noch, wenn die Sichtbarkeit „Privat" bleibt. Zusätzlich verschickt der Auto-Invite-Zweig in `update` jetzt Benachrichtigungen an neu hinzugekommene Kurs-Mitglieder, analog zu `create`.

---

### BUG-019: convex/posts.ts – listRecent kann eigene zugängliche Beiträge verschlucken

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Dashboard UI / Forum Backend
**Priorität:** Mittel
**Beschreibung:**
Die Query holte zunächst die 50 neuesten Beiträge über alle Foren hinweg und filterte erst danach auf für den Nutzer zugängliche Foren. Bei mehr Aktivität in fremden Kurs-Foren konnten dadurch alle 50 Plätze durch nicht-zugängliche Beiträge belegt werden, wodurch die Dashboard-Beitragsliste leer oder unvollständig wirkte, obwohl ältere eigene Beiträge existierten.
**Fundort:** `convex/posts.ts`, `listRecent`, Zeilen 540-559
**Fix:** Reihenfolge vertauscht – es wird zuerst auf zugängliche Foren gefiltert und danach auf die neuesten 20 begrenzt.

---

### BUG-020: GroupsPanel – Archivierte Gruppe öffnen zeigt leeren Dialog

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Lerngruppen
**Priorität:** Mittel
**Beschreibung:**
`active` wurde nur aus der nicht-archivierten Gruppenliste berechnet. Klick auf eine Gruppe unter „Archivierte Gruppen" setzte `activeId`, aber `active` blieb `null`, da die Gruppe dort nicht gefunden wurde – die Detailansicht rendert nur bei `view === "detail" && active`, der Nutzer sah einen leeren Dialog ohne Zurück-Button. Die „Rückgängig"-Funktion (Reaktivieren) war dadurch unerreichbar.
**Fundort:** `src/components/GroupsPanel.tsx`, Zeile 54
**Fix:** `active` sucht jetzt zusätzlich in der archivierten Gruppenliste.

---

### BUG-021: GroupsPanel – Löschen-Button für Gruppen-Dateien anderer Mitglieder vom Backend abgelehnt

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Lerngruppen
**Priorität:** Mittel
**Beschreibung:**
Das Frontend zeigt den Löschen-Button für Dateien, wenn `f.uploadedBy === user.id || active.ownerId === user.id` gilt – impliziert also, dass der Gruppen-Owner auch Dateien anderer Mitglieder löschen kann. Das Backend (`deleteGroupFile`) prüfte aber nur `uploadedBy`, wodurch der Klick für den Owner bei fremden Dateien immer mit „Fehler beim Löschen" fehlschlug.
**Fundort:** `src/components/GroupsPanel.tsx`, Zeile 397; `convex/groups.ts`, `deleteGroupFile`
**Fix:** `deleteGroupFile` erlaubt jetzt zusätzlich den Gruppen-Owner, passend zur bestehenden UI.

---

### BUG-022: PlannerPage – Löschen-Button für Termin-Anhänge allen Betrachtern sichtbar

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer
**Priorität:** Mittel
**Beschreibung:**
Der Löschen-Button für Termin-Anhänge wurde für jeden Betrachter des Termins angezeigt, nicht nur für den Uploader. Das Backend (`deleteAttachment`) erlaubte nur dem Uploader das Löschen, wodurch der Klick bei fremden Anhängen fehlschlug. Analoges Problem wie BUG-021, nur beim Planer statt bei Lerngruppen.
**Fundort:** `src/pages/PlannerPage.tsx`, Anhänge-Rendering; `convex/deadlines.ts`, `deleteAttachment`
**Fix:** Backend erlaubt jetzt zusätzlich den Termin-Owner. Frontend zeigt den Löschen-Button jetzt nur noch für Uploader oder Termin-Owner (`uploadedBy` wird dafür jetzt mit ausgeliefert).

---

### BUG-023: useProfile – Demo-Modus liest falsche Feldnamen aus dem Profil

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Account / Demo-Modus
**Priorität:** Mittel
**Beschreibung:**
`useDemoProfile` griff auf camelCase-Felder (`p.displayName`, `p.avatarUrl`, `p.createdAt`) zu, während `DemoProfile` diese Werte tatsächlich als snake_case speichert (`display_name`, `avatar_url`, `created_at`). Dadurch waren Anzeigename, Avatar und Beitrittsdatum im Demo-Modus immer leer, obwohl sie im Onboarding gesetzt wurden.
**Fundort:** `src/hooks/useProfile.ts`, Zeilen 22-28
**Fix:** Zugriff auf die korrekten snake_case-Feldnamen korrigiert.

---

### BUG-014: Lint-Status des Projekts – produktive Dateien verletzen React-Hook-Regeln

**Datum erfasst:** 03-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** CC
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Projektqualität / Frontend-Architektur
**Priorität:** Mittel
**Beschreibung:**
Der aktuelle Lint-Status enthält Fehler in produktiven Dateien, darunter Verstöße gegen die React-Hook-Regeln wie konditionale Hook-Aufrufe. Das ist nicht nur ein Stilproblem, sondern kann zu instabilem Laufzeitverhalten führen und fällt bei einer technischen Prüfung des Projekts sofort auf.
**Fundort:** z. B. `src/hooks/useAuth.tsx`, `src/components/ProtectedRoute.tsx`, `src/components/EnsureProfile.tsx`
**Fix:** 11 `react-hooks/rules-of-hooks`-Verstöße in 6 Dateien behoben (`src/hooks/useAuth.tsx`, `src/hooks/useProfile.ts`, `src/components/EnsureProfile.tsx`, `src/components/ProtectedRoute.tsx`, `src/components/Navbar.tsx`, `src/components/AccountSettingsDialog.tsx`), alle nach demselben Muster `IS_DEMO ? hookA() : hookB()`. Da `IS_DEMO` fest für die gesamte App-Laufzeit ist, aber nicht alle darunterliegenden Hooks in jedem Modus sicher aufrufbar sind (Clerk-Hooks wie `useUser`/`useClerk` brauchen einen `ClerkProvider`, der im Demo-Modus laut `src/main.tsx` gar nicht gemountet wird; `useConvexAuth` braucht speziell `ConvexProviderWithAuth`, nicht den einfachen `ConvexProvider` aus dem Demo-Modus), gab es zwei unterschiedliche Fixes: (1) `useAuth`/`useProfile` wählen die Implementierung jetzt einmalig beim Modul-Load (`export const useAuth = IS_DEMO ? useDemoAuth : useClerkBackedAuth`) statt bei jedem Aufruf zu verzweigen; (2) Convex-Hooks, die auch im Demo-Modus sicher sind (`useQuery`/`useMutation`), werden jetzt unconditional aufgerufen und nutzen im Demo-Modus Convex' `"skip"`-Argument; Clerk-Hooks bzw. `useConvexAuth`, die ihren Provider zwingend brauchen, wurden in eigene Bridge-Komponenten (`ClerkUserBridge`, `ConvexAuthBridge`) ausgelagert, die nur gerendert werden, wenn `!IS_DEMO`. Lint-Fehler insgesamt 156 → 145 (alle `rules-of-hooks`-Fehler behoben); TypeScript unverändert. Beim Testlauf fielen 21 vorbestehende, unabhängige Testfehler auf (fehlender `LanguageProvider` im Test-Setup mehrerer Dateien) — dafür siehe [[BUG-024]].

---

### BUG-024: Testsuite – 21 Tests crashen mit "useLanguage must be used within LanguageProvider"

**Datum erfasst:** 04-07-2026
**Datum erledigt:** 04-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Testsuite / Frontend-Sprachsupport
**Priorität:** Mittel
**Beschreibung:**
21 Tests in vier Dateien (`tests/admin-dashboard.test.tsx`, `tests/forum/author_controls.test.tsx`, `tests/forum/post_comment.test.tsx`, `tests/skripte/upload_ui.test.tsx`) crashten mit `useLanguage must be used within LanguageProvider` (`src/hooks/useLanguage.tsx`, Zeile 25). Die gerenderten Seiten (`AdminDashboardPage`, `PostDetailPage`, `ForumPage`, `SkriptePage`) nutzen seit der Übersetzungs-Arbeit (Commits „completing app translation"/„translating more pages") intern `useLanguage()`, die betroffenen Tests wrappten ihr `render(...)` aber nur mit `ThemeProvider`/`MemoryRouter`, nicht mit `LanguageProvider` — anders als `tests/planner/crud.test.tsx`, `tests/dashboard/render.test.tsx` und `tests/dashboard/filter.test.tsx`, die das bereits korrekt taten. Reproduziert auch auf unverändertem `main`-Branch, also unabhängig von [[BUG-014]].
**Fundort:** `tests/admin-dashboard.test.tsx`, `tests/forum/author_controls.test.tsx`, `tests/forum/post_comment.test.tsx`, `tests/skripte/upload_ui.test.tsx`
**Fix:** Alle vier Dateien importieren jetzt `LanguageProvider` aus `@/hooks/useLanguage` und wrappen ihre Render-Helfer damit (analog zum bestehenden Muster in `tests/dashboard/render.test.tsx`). Testsuite danach 105/105 grün (vorher 84/105).
