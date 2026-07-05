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
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Dashboard UI
**Priorität:** Niedrig
**Beschreibung:**
Der Wert hinter „Neue Beiträge" ist immer `latestPosts.length` (maximal 5), unabhängig davon, ob der Nutzer die Beiträge bereits gesehen hat. Die Kennzahl suggeriert Aktualität, ist aber kein zuverlässiger Indikator für wirklich neue Inhalte.
**Fundort:** `src/pages/DashboardPage.tsx`, Zeile 110
**Fix:** Neue Kennzahl `recentPostsCount` ergänzt, die Beiträge anhand von `createdAt` gegen ein 24h-Zeitfenster (relativ zum reaktiven `now`-State) zählt, statt die auf 5 Einträge gedeckelte Vorschauliste `latestPosts` als Kennzahl zu missbrauchen. Anzeige-Wert und Hinweistext der Stat-Kachel nutzen jetzt `recentPostsCount`.

---

### BUG-010: Dashboard – Skriptbereich zeigt nur öffentliche Skripte

Datum erfasst: 03-07-2026
Datum erledigt: 05-07-2026
Verfasser: SA
Bearbeitet durch: SA
Komponente/Bereich: Dashboard UI
Priorität: Mittel
Beschreibung:
Im Dashboard werden Skripte über api.scripts.listPublic bzw. nur aus der öffentlichen Sicht geladen. Dadurch fehlen im Dashboard Skripte mit Sichtbarkeit jahrgang, group oder private eigene Skripte, obwohl diese in der Skript-Bibliothek sichtbar sind. Die Anzeige im Dashboard ist damit unvollständig und weicht vom tatsächlichen Datenbestand der Bibliothek ab.
Fundort: src/pages/DashboardPage.tsx, Query für Skripte
Fix: Query auf api.scripts.listVisible umgestellt, damit auch für den Nutzer sichtbare Skripte mit Sichtbarkeit jahrgang/group sowie eigene private Skripte im Dashboard erscheinen.

---

### BUG-011: Dashboard – Zeitabhängige Kennzahlen können ohne Re-Render veralten

Datum erfasst: 03-07-2026
Datum erledigt: 05-07-2026
Verfasser: SA
Bearbeitet durch: SA
Komponente/Bereich: Dashboard UI
Priorität: Niedrig
Beschreibung:
Kennzahlen wie „Nächster Termin“ und die Anzahl dringender Termine hängen direkt von der aktuellen Uhrzeit ab. Bleibt die Seite länger geöffnet, können diese Werte ohne regelmäßige Aktualisierung veralten und nicht mehr den tatsächlichen Stand widerspiegeln.
Fundort: src/pages/DashboardPage.tsx, Berechnung von nextDeadline und urgentDeadlinesCount
Fix: now-State wird per setInterval regelmäßig aktualisiert, wodurch nextDeadline, urgentDeadlinesCount und die neue recentPostsCount-Kennzahl (siehe BUG-008) automatisch neu berechnet werden, ohne dass der Nutzer die Seite neu laden muss.

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
**Verfasser:** SA
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

---

BUG-025: Dashboard-Deadline-Links öffnen keinen Eintrag im Planer
Datum erfasst: 04-07-2026
Datum erledigt: 05-07-2026
Verfasser: SA 
Bearbeitet durch: SA
Komponente/Bereich: Dashboard UI / Planner Navigation
Priorität: Hoch
Beschreibung:
Im Dashboard werden Deadline-Einträge mit Links wie /planner?deadline=... erzeugt ([src/pages/DashboardPage.tsx (line 153)], [src/pages/DashboardPage.tsx (line 202)]
Der Planer verarbeitet diesen Query-Parameter aber aktuell nicht; in [src/pages/PlannerPage.tsx (line 1)] gibt es keine useSearchParams-Logik für deadline. Dadurch wirkt der Klick aus dem Dashboard wie eine Detail-Navigation, landet aber nur auf der allgemeinen Planer-Seite ohne den gewünschten Eintrag zu öffnen oder hervorzuheben.
Fix: PlannerPage.tsx liest den deadline-Query-Parameter jetzt über useSearchParams, öffnet den passenden Termin-Dialog automatisch und entfernt den Parameter nach dem Schließen wieder aus der URL (Ref dismissedQueryScriptId-Muster analog zu BUG-013).

---

BUG-026: Fehlerhafte Sonderzeichen in mehreren UI-Texten
Datum erfasst: 04-07-2026
Datum erledigt: 05-07-2026
Verfasser: SA
Bearbeitet durch: SA
Komponente/Bereich: Mehrere Frontend-Seiten / Textdarstellung
Priorität: Mittel
Beschreibung:
Mehrere Benutzertexte enthalten weiterhin fehlerhaft dargestellte Sonderzeichen wie Ã¤, Ã¼, Ã¶, â€ž oder RÃ¼ckgÃ¤ngig. Sichtbar ist das u. a. im Dashboard bei Texten wie „Neueste EintrÃ¤ge“, „Letzte BeitrÃ¤ge“ oder „NÃ¤chster Termin“ sowie in der Forum-Detailansicht bei Texten wie „ZurÃ¼ck“, „VerÃ¶ffentlichen“ oder Bestätigungsdialogen ([src/pages/DashboardPage.tsx (line 1)](/abs/path/C:/Users/Antropova_S/DHBW/Anwendungsprojekt-main/Anwendungsprojekt/src/pages/DashboardPage.tsx:1), [src/pages/ForumDetailPage.tsx (line 1)](/abs/path/C:/Users/Antropova_S/DHBW/Anwendungsprojekt-main/Anwendungsprojekt/src/pages/ForumDetailPage.tsx:1)).
Dadurch wirkt die Oberfläche technisch beschädigt und teilweise schwer lesbar. Dieser Fehler scheint bereits sinngleich im BugTracker bekannt zu sein, tritt im aktuellen Code aber weiterhin sichtbar auf.
Fix: Projektweite Prüfung (grep über src/ nach den gemeldeten Mojibake-Mustern) zeigt keine Treffer mehr in DashboardPage.tsx, ForumDetailPage.tsx oder anderen Dateien — der Fehler ist bereits durch BUG-012 behoben; kein weiterer Codeänderungsbedarf, nur die Nachpflege des BugTracker-Eintrags war offen.

---

### BUG-027: Planner – Öffentliche Termine ohne echten Kurs-Abgleich sichtbar und annehmbar

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer Backend
**Priorität:** Hoch
**Beschreibung:**
`toggleDone` prüfte bei öffentlichen Terminen gar nicht, ob der aufrufende Nutzer eingeladen ist (`if (!isPublic && !isInvited)` statt immer `isInvited`) – jeder authentifizierte Nutzer konnte per Klick eine eigene Kopie eines fremden öffentlichen Termins anlegen. `listForUser` zeigte zusätzlich jeden öffentlichen Termin app-weit an, unabhängig vom Kurs des Betrachters, da das dafür vorgesehene Feld `allowedKurse` nirgends ausgewertet wurde. Eine erste Korrektur (strikte Prüfung auf das `invitees`-Array) entpuppte sich als zu streng: viele ältere öffentliche Termine haben ein leeres `invitees`-Array (vor Einführung der Auto-Einladung entstanden), wodurch echte Kurskolleg:innen ihre eigenen Kurs-Termine plötzlich nicht mehr sahen.
**Fundort:** `convex/deadlines.ts`, `toggleDone`, `listForUser`, `acceptDeadline`, `declineDeadline`
**Fix:** Sichtbarkeit und Annehmen/Ablehnen/Abhaken für öffentliche Termine hängen jetzt von einem **live Kurs-Abgleich** ab (`isSameKurs`/`canRespond`-Helper: Ersteller- und Betrachter-Profil werden bei jedem Zugriff verglichen) statt vom statischen `invitees`-Snapshot. Das ist robust gegenüber leeren/veralteten `invitees`-Arrays und nachträglichen Kurswechseln. `canAccessDeadline` (Lese-Zugriff auf Details/Anhänge/Nachrichten) wurde analog ergänzt.

---

### BUG-028: Planner – Invitee-Entfernen beim Bearbeiten eines privaten Termins wirkungslos

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer
**Priorität:** Hoch
**Beschreibung:**
Beim Bearbeiten eines privaten Termins wurde die im Formular editierte Invitee-Liste (`selectedInvitees`, dort können Personen per X-Button entfernt werden) beim Speichern immer mit der bereits bestehenden `invitees`-Liste vereinigt (`[...new Set([...existing, ...selected])]`). Entfernte Personen blieben dadurch trotzdem eingeladen.
**Fundort:** `src/pages/PlannerPage.tsx`, `submitDeadline`
**Fix:** Union-Logik entfernt – `inviteeIds` entspricht jetzt exakt der vom Nutzer editierten Liste aus `selectedInvitees`.

---

### BUG-029: Planner – Abgelehnte öffentliche Termine werden bei Bearbeitung erneut zugestellt

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer Backend
**Priorität:** Mittel
**Beschreibung:**
`declineDeadline` entfernte den Nutzer nur aus `invitees`, trug ihn aber nie in `declinedBy` ein – obwohl ein Kommentar in `update` explizit davon ausgeht, dass `declinedBy` „für beide Fälle" (Annehmen und Ablehnen) gesetzt wird. Bearbeitete der Termin-Ersteller danach den Termin, wurde der bereits ablehnende Nutzer über die `alreadyHandled`-Prüfung in `update` fälschlich wieder als „nicht behandelt" erkannt und erneut eingeladen (inkl. neuer Notification).
**Fundort:** `convex/deadlines.ts`, `declineDeadline`
**Fix:** `declineDeadline` trägt den Nutzer bei öffentlichen Terminen jetzt zusätzlich in `declinedBy` ein, analog zu `acceptDeadlineForUser`.

---

### BUG-030: Planner – Gelöschte Termine hinterlassen kaputte Einladungs-Benachrichtigungen

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer Backend
**Priorität:** Niedrig
**Beschreibung:**
Löschte der Ersteller einen Termin, blieben offene `deadline_invite`-Notifications mit Status „pending" für noch nicht reagierende Eingeladene bestehen. Die Notification-Glocke zeigte weiterhin „Annehmen"/„Ablehnen" für einen nicht mehr existierenden Termin an; ein Klick führte zu einem stillen No-Op (kein Absturz, da `notifications.accept`/`decline` fehlende Termine bereits abfangen, aber irreführende „Angenommen"/„Abgelehnt"-Anzeige).
**Fundort:** `convex/deadlines.ts`, `deleteDeadline`
**Fix:** `deleteDeadline` löscht jetzt zusätzlich alle offenen `deadline_invite`-Notifications zu diesem Termin.

---

### BUG-031: Planner – Fragile Duplikat-Erkennung über Titel/Datum/Kategorie statt stabiler Referenz

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer Backend
**Priorität:** Mittel
**Beschreibung:**
Die eigene „angenommene" Kopie eines öffentlichen Termins wurde über einen Abgleich von `(title, date, category)` gefunden (`findOwnCopy`, `listForUser`-Dedup, `deleteDeadline`-Original-Suche). Zwei unabhängig erstellte Termine mit zufällig gleichem Titel/Datum/Kategorie (z. B. „Klausur" am selben Tag) konnten dadurch fälschlich als dieselbe Kopie erkannt werden.
**Fundort:** `convex/deadlines.ts`, `findOwnCopy`, `listForUser`, `deleteDeadline`
**Fix:** Neues Feld `sourceDeadlineId` (plus Index `by_source_owner`) verweist explizit auf den Ursprungstermin einer Kopie. Alle Abgleiche laufen jetzt darüber statt über Titel/Datum/Kategorie.

---

### BUG-032: Planner – Mehrfach-Erinnerungen werden in der aktiven Liste falsch angezeigt

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer
**Priorität:** Niedrig
**Beschreibung:**
`remindBefore` ist ein `number[]` (mehrere wählbare Erinnerungstage), wurde im aktiven Bereich der Terminliste aber wie ein einzelner Wert gerendert (`{d.remindBefore} Tage`), was bei mehreren gewählten Tagen zu einer verwirrenden Anzeige führte (z. B. „35 Tage" statt „3, 5 Tage"). Die Bereiche „Erledigt" und „Archiviert" waren bereits korrekt implementiert. Zusätzlich stellte sich heraus, dass die Erinnerungsfunktion insgesamt nie tatsächlich Erinnerungen verschickt (kein Scheduler/Cron im Projekt) und auch nicht in den Funktionalen Anforderungen gefordert ist.
**Fundort:** `src/pages/PlannerPage.tsx`, aktive Terminliste
**Fix:** Anzeige zunächst an das korrekte Muster der anderen Bereiche angeglichen; da die Funktion aber ohnehin folgenlos ist und nicht gefordert wird, wurde die komplette Erinnerungs-UI (Formularfeld, Anzeige, State) anschließend entfernt, um keine falschen Erwartungen zu wecken. Das Backend-Feld bleibt bestehen (harmlos, ungenutzt).

---

### BUG-033: Planner – Vergangenheits-Warnung wird beim Bearbeiten teils übersprungen

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer
**Priorität:** Niedrig
**Beschreibung:**
Das Ref `pastDateConfirmed` merkt sich, ob der Nutzer die Warnung „Datum liegt in der Vergangenheit" bereits bestätigt hat, und wird nur über den gewrappten `setDate`-Handler im Formular zurückgesetzt. `startEdit` setzte das Datum beim Öffnen eines bestehenden Termins jedoch direkt über den rohen State-Setter, ohne das Ref zurückzusetzen – blieb es von einer vorherigen (evtl. fehlgeschlagenen) Bestätigung noch `true`, wurde die Warnung beim Bearbeiten eines weiteren Vergangenheits-Termins fälschlich übersprungen.
**Fundort:** `src/pages/PlannerPage.tsx`, `startEdit`
**Fix:** `startEdit` setzt `pastDateConfirmed.current` und `showPastWarning` jetzt explizit zurück.

---

### BUG-034: Planner – Überfällige, offene Termine verschwinden ins Archiv trotz Statistik-Zählung

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Planer
**Priorität:** Niedrig
**Beschreibung:**
Die Einteilung in „Aktiv"/„Erledigt"/„Archiviert" richtete sich rein nach dem Alter (>30 Tage), unabhängig vom `done`-Status. Ein überfälliger, nicht erledigter Termin älter als 30 Tage wanderte dadurch ins Archiv, wurde aber weiterhin in der „Überfällig"-Statistik oben mitgezählt – die Zahl in der Kachel stimmte nicht mit der sichtbaren aktiven Liste überein. Zusätzlich sollten „Erledigt" und „Archiv" absteigend (neueste zuerst) statt aufsteigend sortiert sein.
**Fundort:** `src/pages/PlannerPage.tsx`, Listen-Gruppierung
**Fix:** Offene (nicht erledigte) Termine bleiben jetzt unabhängig vom Alter im aktiven Bereich; nur erledigte, alte Termine gelten als archiviert. Sortierung von „Erledigt"/„Archiv" auf absteigend (neueste zuerst) umgestellt, „Aktiv" bleibt aufsteigend.

---

### BUG-035: Forum – Fehlende Zugriffskontrolle beim Lesen privater Foren/Posts/Kommentare

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum Backend
**Priorität:** Hoch
**Beschreibung:**
`posts.listByForum`, `posts.getById`, `posts.getComments` sowie `forums.getById` prüften nur, ob überhaupt ein Nutzer eingeloggt ist – nicht, ob er Mitglied des jeweiligen privaten Forums ist. `posts.create` prüfte das bereits korrekt. Wer die ID eines privaten Forums/Posts kannte (z. B. aus einem alten Link), konnte dessen Inhalte vollständig lesen, ohne Mitglied zu sein.
**Fundort:** `convex/posts.ts`, `listByForum`/`getById`/`getComments`; `convex/forums.ts`, `getById`
**Fix:** Neuer Helper `canAccessForum` (öffentlich → immer erlaubt, privat → Mitglied oder Admin), in allen vier Queries ergänzt.

---

### BUG-036: Forum – Hassrede-Flag wird nach erstem Treffer nie zurückgesetzt

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum Backend / Moderation
**Priorität:** Hoch
**Beschreibung:**
Beim Bearbeiten eines Posts/Kommentars wurde `flagged` nur auf `true` gesetzt, nie zurück auf `false`. Die Bedingung für einen neuen automatischen Report (`flagged && !post.flagged`) griff dadurch nach dem ersten Treffer nie wieder – auch wenn eine spätere Bearbeitung ein komplett anderes beleidigendes Wort einfügte.
**Fundort:** `convex/posts.ts`, `update` (Post), `updateComment`
**Fix:** `flagged`/`detectedWord` werden jetzt immer aktuell gesetzt (auch zurück auf „sauber"); ein neuer Report entsteht, wenn `flagged` ist und entweder vorher nicht geflaggt war oder sich das erkannte Wort geändert hat.

---

### BUG-037: Forum – Keyword-Filter erzeugt False Positives bei „Opfer"

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum Backend / Moderation
**Priorität:** Mittel
**Beschreibung:**
Das Einzelwort „opfer" stand zusätzlich zur Phrase „du opfer" in der Hassrede-Wortliste. Dadurch wurde jede harmlose Verwendung („Verkehrsopfer", „die Opfer des Unfalls") automatisch als Hassrede geflaggt und ein Moderations-Report erzeugt.
**Fundort:** `convex/hateSpeech.ts`
**Fix:** Einzelwort „opfer" entfernt, die Phrase „du opfer" deckt den eigentlichen Beleidigungsfall weiterhin ab.

---

### BUG-038: Forum – Löschen eines Kommentars hinterlässt verwaiste Enkel-Antworten

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum Backend
**Priorität:** Mittel
**Beschreibung:**
`deleteComment` löschte beim Löschen eines Kommentars nur die direkten Antworten (eine Ebene über `by_parent`). Antworten auf Antworten blieben in der Datenbank, verwiesen aber auf eine gelöschte `parentId` – sie wurden im UI nicht mehr angezeigt und waren auch nicht mehr löschbar, zählten aber weiterhin in der „X Antworten"-Anzeige mit.
**Fundort:** `convex/posts.ts`, `deleteComment`
**Fix:** Neue rekursive Hilfsfunktion `deleteCommentSubtree` löscht Kommentare samt aller Antworten in beliebiger Tiefe.

---

### BUG-039: Dashboard – Forum-Feed verdrängt Posts selten genutzter Foren

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Dashboard UI / Forum Backend
**Priorität:** Mittel
**Beschreibung:**
`listRecent` lieferte die global neuesten 20 Posts über alle zugänglichen Foren, `ForumFeed.tsx` filterte diese Liste erst danach pro Forum. War ein Nutzer in vielen aktiven Foren, fielen ältere (aber existierende) Posts selten genutzter Foren aus den globalen Top-20 heraus – das Dashboard zeigte dort fälschlich „Noch keine Beiträge."
**Fundort:** `convex/posts.ts`, `listRecent`
**Fix:** Für jedes zugängliche Forum werden jetzt einzeln die letzten 5 Posts geladen (über den `by_forum`-Index), statt eines globalen Top-20-Pools.

---

### BUG-040: Forum – Melden-Funktion ohne Validierung, Duplikatsschutz und mit spoofbarem Namen

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum Backend / Moderation
**Priorität:** Niedrig
**Beschreibung:**
`postReports.submit` prüfte nie, ob der gemeldete Post tatsächlich existiert, erlaubte beliebig viele Mehrfach-Meldungen desselben Nutzers für denselben Post, und übernahm den angezeigten Melder-Namen (`reportedBy`) unverändert vom Client statt ihn serverseitig abzuleiten.
**Fundort:** `convex/postReports.ts`, `submit`
**Fix:** Existenzprüfung des Posts ergänzt, Duplikat-Reports (gleicher Melder, gleicher Post, Status „offen") werden abgelehnt, `reportedBy` wird jetzt serverseitig aus dem Profil des Melders ermittelt (Prop dafür aus `ReportDialog.tsx`, `PostDetailPage.tsx` und `ForumPage.tsx` entfernt).

---

### BUG-041: Forum – Storage-Dateien und Meldungen bei Post-/Forum-Löschung nicht aufgeräumt

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum Backend
**Priorität:** Niedrig
**Beschreibung:**
`deletePost` löschte keine angehängten `postFiles` (weder Datenbank-Einträge noch Storage-Blobs) und keine zugehörigen `postReports` – letztere verwiesen danach dauerhaft auf einen nicht mehr existierenden Post. `deleteForum` löschte `forumFiles`-Einträge zwar aus der Datenbank, rief aber nie `ctx.storage.delete` auf (verwaiste Storage-Blobs), und räumte pro Post ebenfalls keine `postFiles`/`postReports` auf.
**Fundort:** `convex/posts.ts`, `deletePost`; `convex/forums.ts`, `deleteForum`
**Fix:** Beide Mutationen löschen jetzt zusätzlich `postFiles` (inkl. Storage) und zugehörige `postReports`; `deleteForum` löscht bei Forum-Dateien zusätzlich den Storage-Blob.

---

### BUG-042: Forum – Admin-Bearbeitung fremder Kommentare wird nicht protokolliert

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Forum Backend / Admin-Dashboard
**Priorität:** Niedrig
**Beschreibung:**
Anders als beim Löschen eines Kommentars oder beim Bearbeiten/Löschen eines Posts erzeugte `updateComment` keinen Moderationslog-Eintrag, wenn ein Admin den Kommentar eines anderen Nutzers bearbeitete – Lücke im Audit-Trail. Zusätzlich fehlte im Admin-Dashboard ein Label für die neue Aktion `edit_comment` (wäre als roher String angezeigt worden), und Log-Zeitstempel älter als 2 Tage zeigten weiterhin „vor X Tagen" statt eines konkreten Datums.
**Fundort:** `convex/posts.ts`, `updateComment`; `src/pages/AdminDashboardPage.tsx`, `actionMeta`/`timeAgo`
**Fix:** `updateComment` protokolliert Admin-Fremdbearbeitungen jetzt über `logModeration` (Aktion `edit_comment`); passendes Label in `actionMeta` ergänzt; `timeAgo`-Schwelle für die Datumsanzeige von 30 Tagen auf 2 Tage reduziert (auf Wunsch, damit ältere Einträge das konkrete Datum statt einer relativen Angabe zeigen).

---

### BUG-043: Skripte – Verwaiste Storage-Datei bei fehlgeschlagenem Erstellen nach Upload

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Skripte Backend/UI
**Priorität:** Hoch
**Beschreibung:**
Der Upload-Flow lädt die Datei zuerst in den Storage hoch und ruft danach `createMutation` auf. Schlug diese fehl (z. B. Kontingent von 50 Skripten pro Nutzer erreicht, Netzwerkfehler), blieb die bereits hochgeladene Datei dauerhaft und unerreichbar im Storage zurück.
**Fundort:** `src/pages/SkriptePage.tsx`, `addScript`
**Fix:** Neue Mutation `scripts.discardUpload` löscht eine hochgeladene, aber nie zugeordnete Datei; wird im Fehlerfall nach erfolgreichem Upload automatisch aufgerufen.

---

### BUG-044: Skripte – Doppelter Klick bei „Als Notiz speichern" erzeugt Duplikate

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Skripte UI
**Priorität:** Hoch
**Beschreibung:**
Im Zweig ohne Datei-Upload („Notiz speichern") wurde `uploading` nie auf `true` gesetzt, wodurch der Speichern-Button während der laufenden Mutation aktiv blieb. Mehrfaches schnelles Klicken erzeugte mehrere identische Skript-Einträge.
**Fundort:** `src/pages/SkriptePage.tsx`, `addScript`
**Fix:** Lade-Sperre (`uploading`) greift jetzt in beiden Zweigen (mit und ohne Datei); zusätzlich Guard `if (uploading) return;` am Funktionsanfang.

---

### BUG-045: Skripte – Fehlende serverseitige Mitgliedschaftsprüfung bei Gruppen-Sichtbarkeit

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Skripte Backend
**Priorität:** Hoch
**Beschreibung:**
`create`/`update` prüften bei Sichtbarkeit „Gruppe" nur, dass überhaupt eine `forumId` angegeben wurde – nicht, ob der aufrufende Nutzer tatsächlich Mitglied dieses Forums ist. Über einen direkten API-Aufruf ließe sich ein Skript für ein beliebiges fremdes Forum sichtbar machen.
**Fundort:** `convex/scripts.ts`, `create`, `update`
**Fix:** Beide Mutationen prüfen jetzt per `forumMembers`-Index, ob der Nutzer tatsächlich Mitglied des angegebenen Forums ist.

---

### BUG-046: Skripte – Seitenzahl fest auf 0 statt einer echten Eingabe

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Skripte UI
**Priorität:** Mittel
**Beschreibung:**
Beim Erstellen eines Skripts wurde `pages: 0` hart codiert – es gab keine UI-Möglichkeit, eine Seitenzahl einzugeben. Der Detail-Dialog zeigte dadurch für jedes Skript „Notiz oder Datei ohne Seitenangabe", unabhängig vom tatsächlichen Umfang.
**Fundort:** `src/pages/SkriptePage.tsx`, `addScript`
**Fix:** Neues optionales Eingabefeld „Seitenzahl" ergänzt, Wert wird validiert (nicht-negative Ganzzahl) und an die Mutation übergeben.

---

### BUG-047: Skripte – Speichern ohne Fach/Modul-Auswahl möglich

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Skripte UI
**Priorität:** Mittel
**Beschreibung:**
`addScript` validierte Titel- und Beschreibungslänge, aber nicht, ob überhaupt ein Fach/Modul (`lectureId`) ausgewählt wurde. Ohne Auswahl wurde ein leerer `subject`-String gespeichert, was zu einem leeren, aber klickbaren Filter-Button in der Fächer-Leiste führte.
**Fundort:** `src/pages/SkriptePage.tsx`, `addScript`
**Fix:** Fehlende Fach/Modul-Auswahl wird jetzt vor dem Speichern mit einer Fehlermeldung abgefangen.

---

### BUG-048: Skripte – Sichtbarkeit „Kurs" ohne gesetzten Profil-Kurs macht Skript faktisch unsichtbar

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Skripte Backend
**Priorität:** Mittel
**Beschreibung:**
Wählte ein Nutzer ohne gesetzten Profil-Kurs die Sichtbarkeit „Kurs", wurde `authorKurs: undefined` gespeichert. Da der Sichtbarkeits-Check (`canAccess`) nie mit `undefined` übereinstimmt, sah außer dem Autor selbst niemand das Skript – ohne jeden Hinweis, dass die gewählte Freigabe wirkungslos war.
**Fundort:** `convex/scripts.ts`, `create`, `update`, `canAccess`
**Fix:** `create`/`update` lehnen die Sichtbarkeit „Kurs" jetzt mit klarer Fehlermeldung ab, wenn im Profil kein Kurs hinterlegt ist; `update` aktualisiert `authorKurs` außerdem korrekt, wenn nachträglich auf „Kurs" umgestellt wird.

---

### BUG-049: Skripte – Sichtbarkeits-Badge im Detail-Dialog zeigt unübersetzten Rohwert

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Skripte UI
**Priorität:** Niedrig
**Beschreibung:**
Der Detail-Dialog eines Skripts zeigte den internen Sichtbarkeitswert direkt an (`public`/`private`/`jahrgang`/`group`) statt der an anderer Stelle bereits vorhandenen übersetzten Labels („Öffentlich"/„Privat"/„Kurs"/„Gruppe").
**Fundort:** `src/pages/SkriptePage.tsx`, Detail-Dialog
**Fix:** Neue `visibilityLabels`-Zuordnung ergänzt und im Dialog verwendet.

---

### BUG-050: Skripte – Fehlende Sortierung der Skript-Liste

**Datum erfasst:** 05-07-2026
**Datum erledigt:** 05-07-2026
**Verfasser:** DM (CC)
**Bearbeitet durch:** DM (CC)
**Komponente/Bereich:** Skripte Backend
**Priorität:** Niedrig
**Beschreibung:**
`listVisible`/`listPublic` gaben Skripte ohne explizite Sortierung zurück (Reihenfolge folgte der internen Speicherreihenfolge, nicht „neueste zuerst").
**Fundort:** `convex/scripts.ts`, `listVisible`, `listPublic`
**Fix:** Beide Queries sortieren jetzt explizit absteigend (neueste zuerst).


