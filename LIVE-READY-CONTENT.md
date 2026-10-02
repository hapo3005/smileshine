# Smile & Shine · Live-Ready Content Handoff

This project is intentionally prepared so the presentation version can become Birgit's real content version without rewriting the UI or workflows.

## Single source of truth

Edit `studio-config.js` after the presentation. It owns:

- studio name, owner, phone, address and location
- legal business fields
- opening hours, slot interval and buffer
- service names, categories, durations, prices, deposits and visibility state
- personalized website copy
- public media slots
- the checklist that must be confirmed before live launch

The current values with `verification: "market"` are presentation working values, not final studio-confirmed prices.

## Photo handoff

Replace the URLs in `studio-config.js > media`. The UI already has stable slots for:

| Slot | Intended real photo |
| --- | --- |
| `hero` | premium studio/beauty key visual with negative space |
| `about` | authentic portrait of Birgit in the studio |
| `brows` | natural eyebrow treatment/result detail |
| `eyes` | natural eye/lashline treatment/result detail |
| `lips` | natural lip treatment/result detail |

Every slot contains a `shotBrief`. Temporary stock imagery remains a fallback until the real image is supplied.

## What stays demo-only

Synthetic customers, appointments, treatment history, nail simulation, waitlist examples and local demo login are presentation fixtures. They are not future live customer data and must not be migrated as real records.

## Backend handoff later

The current runtime explicitly identifies the temporary providers:

- data: `local-demo`
- media: `config`
- auth: `demo`
- backend target: `api`

When the project is approved for real use, the UI should keep the same domain objects while those providers are replaced by authenticated API/database/storage adapters. Real customer or health-related data must not be put into the current public GitHub Pages demo.

## Post-presentation content sequence

1. Confirm Birgit's complete service catalogue.
2. Replace working prices/deposits with studio-confirmed values.
3. Confirm real opening hours, buffers and booking rules.
4. Confirm contact and legal data.
5. Replace all five required temporary media slots with Birgit's own photos.
6. Review public copy and WhatsApp/communication templates with Birgit.
7. Only then connect production auth, database, media storage and notifications.

The target is that steps 1–6 are content/configuration work, not application re-development.
