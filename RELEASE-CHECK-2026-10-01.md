# Smile & Shine – Birthday RC2 Release Check
Stand: 01.10.2026

## Release-Kandidat
Build: `20261001-birthday-rc2`

## Bestanden
- Kundenseite und Admin verwenden denselben lokalen Studiodatenspeicher.
- Terminanfragen werden als **offen** gespeichert und müssen bestätigt werden.
- Warteliste speichert Tageszeit, Datumsfenster, Kontaktpräferenz, Erinnerung und Vorabfragen.
- Wartelistenübernahme erhält Notizen und Vorabdaten im bestätigten Termin.
- Neue Abholkundinnen werden in die Kundenkartei übernommen.
- Arbeitswerte für Preise/Anzahlungen bleiben intern; öffentlich erscheinen sie erst nach Studio-Bestätigung.
- Online-Zahlung wird im Präsentationsmodus nicht vorgetäuscht.
- Terminabschluss ist nur für bestätigte, bereits begonnene Termine möglich.
- „Abgeschlossen“ kann nicht über Schnellstatus am Abschluss-Workflow vorbeigesetzt werden.
- Terminvorbereitung wird nicht automatisch als vollständig angenommen.
- Kunden-Vorabfragen sind in Terminansicht und Warteliste sichtbar; Allergien/Medikamente werden hervorgehoben.
- Präsentationsdatensatz nutzt die kanonischen Leistungen und realistischen Dauern 120 / 90 / 150 / 30 Min.
- Vorbereiteter Mustertag enthält keine Termin-/Pausenüberschneidung und liegt innerhalb 09:00–19:00 Uhr.
- Mobile Navigation: semantischer Button, `aria-controls`, dynamisches Label, Escape-Schließen.
- Touch-/Focus-/Reduced-Motion-Härtung vorhanden.
- Fremde Personenportraits wurden aus den effektiv wirksamen Hero-/Über-mich-Regeln entfernt.
- Datenschutztext beschreibt lokale Vorabangaben und weist darauf hin, keine echten Gesundheitsdaten in der Präsentation zu verwenden.
- Impressumsdaten wurden nicht durch unbestätigte Platzhalter ersetzt.
- Alle geladenen Haupt- und Modulassets sind auf RC2 cache-versioniert.
- 25 geprüfte JavaScript-Dateien parsen ohne Syntaxfehler.
- 18 geprüfte CSS-Dateien haben ausgeglichene Klammerstruktur.
- Keine doppelten IDs in `index.html` und `admin.html`.
- Keine fehlenden lokalen Dateien in den statisch referenzierten Hauptassets.
- Alle internen Anker der Kundenseite zeigen auf vorhandene IDs.
- Buchungs-/Anfrageflow enthält vollständig die Schritte 1–6; Rücksprünge zeigen auf gültige Panels.
- Admin-Navigation/Jumps zeigen auf vorhandene statische Views.
- Repo-Suche: keine sichtbaren Altbegriffe `Demo-Preis`, `Online-Buchung`, `Termin simulieren`, `Bestellung simulieren`, `Vorschau aktiv`, `Gastbestellung`.
- Keine aktive September- oder RC1-Cacheversion mehr in der geladenen Kette.

## Bewusste Präsentationsgrenzen
- Kein produktiver Server-/Cloud-Backendbetrieb.
- Keine echte Onlinezahlung.
- Kein echter automatischer E-Mail-/SMS-/WhatsApp-Versand.
- Präsentationslogin `Birgit / 2026` ist kein Produktions-Sicherheitskonzept.
- Preise und Anzahlungen mit Arbeitswert-Status müssen von Birgit bestätigt werden.
- Persönliche Birgit-/Studiofotos folgen nach der Geburtstagspräsentation.

## Noch extern zu prüfen
Die veröffentlichte GitHub-/Pages-Ausgabe konnte aus der aktuellen Arbeitsumgebung nicht als echte Browserseite geladen bzw. gescreenshottet werden. Deshalb wurde **keine visuelle Pixel-QA behauptet**. Vor der Präsentation sollte der RC2 einmal in einem echten Browser auf ca. 390 px, Tablet und Desktop geöffnet und der Ablauf gemäß `PRESENTATION-11-10.md` durchgeklickt werden.

## Präsentationsregel
Für die Vorführung keine realen Gesundheits- oder Kundendaten verwenden. Vor dem Start Präsentationsdaten über die Studioansicht auf den vorbereiteten Ausgangsstand zurücksetzen.
