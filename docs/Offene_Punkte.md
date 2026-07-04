# Offene Punkte & bekannte Einschränkungen

Auflistung bekannter Lücken und Einschränkungen der Anwendung - ergänzend zu der Anforderungsdokumentation (`docs/Funktionale_Anforderungen.md`)

---

## Ausstehende Tests

Folgende Tests sind als `Todo` markiert und noch nicht grün (Stand: `docs/test-uebersicht.md`):

| Test | Datei | Verweis |
|---|---|---|
| Upload: Submit-Button deaktiviert ohne Dateiauswahl | `tests/skripte/upload_ui.test.tsx` | Widerspruch zur FA: aktuelle Implementierung erlaubt bewusst Submission ohne Datei ("Als Notiz speichern") — Klärung mit Product Owner nötig |

---

## Bekannte Bugs

Konkrete Bugs mit Fundort, Priorität und Status werden in [`docs/BugTracker.md`](BugTracker.md) geführt.

---

## Bekannte Einschränkungen

### Cloud-Abhängigkeit
Die Anwendung setzt vollständig auf externe Cloud-Dienste (Clerk, Convex). Eine Integration in die DHBW-IT-Landschaft (z. B. DHBW-SSO, On-Premise-Betrieb) ist nicht vorbereitet.

### Kein öffentliches Deployment
Es existiert kein dauerhaft erreichbares Produktiv-Deployment. Die Anwendung wird lokal oder über das Convex-Dev-Backend betrieben.