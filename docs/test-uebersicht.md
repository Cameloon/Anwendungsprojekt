# Test-Übersicht

<!-- Automatisch generiert von scripts/update-test-status.ts — nicht manuell bearbeiten -->
<!-- Letzte Aktualisierung: 2026-06-26 09:20 UTC -->

## Gesamtstatus

| ✅ Bestanden | ❌ Fehlgeschlagen | 🔜 Todo | ⏸ Übersprungen |
|-------------|------------------|---------|----------------|
| 72 | 0 | 5 | 0 |

## tests/admin-dashboard.test.tsx

### AdminDashboardPage

- ✅ renders the admin overview sections

## tests/example.test.ts

### example

- ✅ should pass

## tests/dashboard/filter.test.tsx

### Dashboard lecture filter

- ✅ filters forum posts and deadlines by selected lecture
- 🔜 filters scripts by selected lecture — aktivieren sobald subject-Feld korrekt befüllt wird (Issue #47)
- ✅ shows empty-state texts per widget when selected lecture has no matching content
- ✅ resets to full overview when 'Gesamtübersicht' is clicked after filtering

## tests/dashboard/render.test.tsx

### Dashboard render and widgets

- ✅ shows current forum and scripts widgets and links navigate
- ✅ shows empty-state text when no lectures, posts and scripts exist

## tests/forum/author_controls.test.tsx

### Forum – Autor-Kontrolle: Edit/Delete-Buttons

- 🔜 Autor sieht Bearbeiten- und Löschen-Buttons am eigenen Beitrag
- ✅ Fremder Nutzer sieht keine Bearbeiten/Löschen-Buttons am fremden Beitrag
- ✅ Eigener Kommentar zeigt Löschen-Button, fremder Kommentar nicht
- 🔜 Klick auf Bearbeiten öffnet Inline-Formular mit vorausgefülltem Inhalt

## tests/forum/post_comment.test.tsx

### Forum post and comment flow

- ✅ creates a post and shows it with author and tag in the forum list
- ✅ shows post detail with author, tag and content; adds comments in chronological order

## tests/planner/crud.test.tsx

### Planner CRUD + toggle flow

- ✅ creates, edits, toggles and deletes an appointment

## tests/skripte/upload_ui.test.tsx

### SkriptePage – Upload-Dialog

- ✅ Upload-Formular ist initial ausgeblendet
- ✅ öffnet das Formular beim Klick auf Hochladen
- 🔜 Submit-Button ist deaktiviert solange keine Datei ausgewählt ist
- ✅ verhindert Submission bei ungültigen Eingaben — Formular bleibt offen
- 🔜 zeigt Fehlermeldung bei ungültigem Dateityp
- ✅ fügt neues Skript zur Liste hinzu nach erfolgreichem Upload
- ✅ Sichtbarkeit-Buttons Öffentlich und Privat sind im Formular sichtbar
- ✅ privates Skript zeigt Privat-Badge in der Liste
- ✅ Abbrechen schließt das Formular ohne Eintrag hinzuzufügen

### SkriptePage – Suche und Subject-Filter

- ✅ zeigt alle Skripte wenn Suche leer und Filter 'alle'
- ✅ filtert nach Suchwort im Titel
- ✅ findet Skripte über Suchbegriff in der Beschreibung
- ✅ Subject-Filter blendet andere Vorlesungen aus
- ✅ Suche und Subject-Filter wirken kombiniert (AND-Logik)

### validateFileSize

- ✅ validateFileSize(0 Bytes) → ""
- ✅ validateFileSize(29360128 Bytes) → ""
- ✅ validateFileSize(29360129 Bytes) → "Datei darf maximal 25 MB groß sein."
- ✅ validateFileSize(52428800 Bytes) → "Datei darf maximal 25 MB groß sein."

## tests/unit/demoStore.test.ts

### demoStore.signIn

- ✅ legt einen User in localStorage an
- ✅ leitet den displayName aus der E-Mail-Adresse ab wenn keiner übergeben wird
- ✅ verwendet den übergebenen displayName statt der E-Mail
- ✅ überschreibt ein bestehendes Profil nicht

### demoStore.signOut

- ✅ entfernt den User nach dem Abmelden
- ✅ lässt das Profil nach dem Abmelden bestehen

### demoStore.updateProfile

- ✅ merged einen Patch auf das bestehende Profil
- ✅ erstellt ein Basisprofil wenn noch keines existiert

### demoStore Fehlertoleranz

- ✅ getUser() gibt null zurück wenn der localStorage-Eintrag kein gültiges JSON ist
- ✅ getProfile() gibt null zurück wenn der localStorage-Eintrag kein gültiges JSON ist

## tests/unit/validation.test.ts

### validateTitle

- ✅ validateTitle("") → ""
- ✅ validateTitle("ab") → "Mindestens 3 Zeichen."
- ✅ validateTitle("abc") → ""
- ✅ validateTitle("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") → ""
- ✅ validateTitle("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") → "Maximal 200 Zeichen."
- ✅ validateTitle("  a  ") → "Mindestens 3 Zeichen."
- ✅ validateTitle("  abc  ") → ""

### validateDate

- ✅ validateDate("") → "Bitte ein Datum wählen."
- ✅ validateDate("2026-06-08") → "Datum darf nicht in der Vergangenheit liegen."
- ✅ validateDate("2026-06-09") → ""
- ✅ validateDate("2026-06-10") → ""
- ✅ validateDate("2030-01-01") → ""

### validateMessage

- ✅ validateMessage("") → ""
- ✅ validateMessage("abcd") → "Mindestens 5 Zeichen."
- ✅ validateMessage("abcde") → ""
- ✅ validateMessage("  hi  ") → "Mindestens 5 Zeichen."
- ✅ validateMessage("hello world") → ""

### validateSubject

- ✅ validateSubject("") → "Mindestens 2 Zeichen."
- ✅ validateSubject("A") → "Mindestens 2 Zeichen."
- ✅ validateSubject("  ") → "Mindestens 2 Zeichen."
- ✅ validateSubject("IT") → ""
- ✅ validateSubject("Informatik") → ""

### validateScriptDescription

- ✅ validateScriptDescription("") → ""
- ✅ validateScriptDescription("   ") → ""
- ✅ validateScriptDescription("Kurz") → "Mindestens 10 Zeichen oder leer lassen."
- ✅ validateScriptDescription("123456789") → "Mindestens 10 Zeichen oder leer lassen."
- ✅ validateScriptDescription("1234567890") → ""
- ✅ validateScriptDescription("Eine vollständige Beschreibung des Skripts.") → ""

### isDeadlineFormValid

- ✅ returns true for valid title + future date
- ✅ returns false for empty title
- ✅ returns false for too-short title
- ✅ returns false for past date
- ✅ returns false for missing date
- ✅ returns false for title exceeding max length
