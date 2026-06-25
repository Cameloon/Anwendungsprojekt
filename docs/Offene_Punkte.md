# Offene Punkte & bekannte Einschränkungen

Auflistung bekannter Lücken und Einschränkungen der Anwendung - ergänzend zu der Anforderungsdokumentation (`docs/Funktionale_Anforderungen.md`)

---

## Ausstehende Tests

Folgende Tests sind als `Todo` markiert und noch nicht grün (Stand: `docs/test-uebersicht.md`):

| Test | Datei | Verweis |
|---|---|---|
| Dashboard: Skripte nach Vorlesung filtern | `tests/dashboard/filter.test.tsx` | Issue #47 |
| Forum: Autor sieht Bearbeiten/Löschen am eigenen Beitrag | `tests/forum/author_controls.test.tsx` | — |
| Forum: Eigener Kommentar zeigt Löschen-Button | `tests/forum/author_controls.test.tsx` | — |
| Forum: Klick auf Bearbeiten öffnet Inline-Formular | `tests/forum/author_controls.test.tsx` | — |
| Upload: Submit-Button deaktiviert ohne Dateiauswahl | `tests/skripte/upload_ui.test.tsx` | — |
| Upload: Fehlermeldung bei ungültigem Dateityp | `tests/skripte/upload_ui.test.tsx` | — |

---

## Bekannte Bugs

Konkrete Bugs mit Fundort, Priorität und Status werden in [`docs/BugTracker.md`](BugTracker.md) geführt.

---

## Bekannte Einschränkungen

### Cloud-Abhängigkeit
Die Anwendung setzt vollständig auf externe Cloud-Dienste (Clerk, Convex, Supabase). Eine Integration in die DHBW-IT-Landschaft (z. B. DHBW-SSO, On-Premise-Betrieb) ist nicht vorbereitet.

### Kein öffentliches Deployment
Es existiert kein dauerhaft erreichbares Produktiv-Deployment. Die Anwendung wird lokal oder über das Convex-Dev-Backend betrieben.