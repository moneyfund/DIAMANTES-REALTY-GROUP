# DRG 2.0 — Functional parity checkpoint

This document records the migration boundary before enabling writes or switching production traffic.

## Data boundary

- Firebase project: unchanged from current Diamantes Realty Group production.
- Firestore collections are reused; no collection rename or bulk migration is part of the frontend migration.
- Firebase Auth and Storage are reused.
- Preview mode remains read-only unless both `NEXT_PUBLIC_DRG_DATA_MODE` is a write-capable mode and `NEXT_PUBLIC_DRG_ALLOW_WRITES=true`.
- Production Firebase rules are not replaced by the files in `security/*.proposed` until backup and controlled write tests are complete.

## Public routes migrated

- Home
- Properties catalog and filters
- Dynamic property detail
- Interactive map
- Agents directory and agent profile
- About
- Education
- Sell your property
- Contact
- Privacy, terms and operating license
- Comments and ratings
- Private shared lists by token
- Shared-property detail
- Legacy URL compatibility for public and private routes

## Public writes prepared but disabled in Preview

- Contact -> `formularios`
- Sell your property -> `formularios`
- Property comments -> `properties/{id}/comments`
- Property ratings -> `properties/{id}/reviews`

## Agent workspace migrated

- Google authentication and role gate
- Profile and profile photo
- Personal property inventory
- Search and filters
- Publication / rejection feedback
- Contract dates and status
- Create and edit property
- Dynamic property fields by property type
- Highlight tags
- Price-per-area feedback
- YouTube / TikTok preview
- Nicaragua geocoding and Leaflet position editor
- Visual image manager, ordering and cover image
- Legal PDF
- Mark sold
- Property technical sheet / PDF
- Shared-property lists and history
- Brokerage / other-agent inventory
- Assisted listing for another agent with private `propertyListingAudit`

## Admin workspace migrated

- Google authentication and role gate
- Summary metrics
- Editorial review queue
- Approve / reject
- Review detail
- Full inventory
- Property editing without taking ownership
- Agent reassignment
- Ownership / uploader audit
- Agent inventory counts
- Agent public-name editing
- Forms inbox and statuses
- Contract indicators
- Map and geocoding
- Image manager
- Legal PDF replacement/removal
- Controlled property deletion and known Storage cleanup

## Intentionally not connected

### Avalúos

The Avalúos tab remains visible but disconnected during this migration.

`moneyfund/avaluos-platform` is a separate multi-tenant application with its own Firebase architecture. No appraisal engine, history, license data or appraisal Storage is connected to DRG 2.0 in this phase.

## Historical Firebase compatibility retained in proposed rules

The proposed rules preserve access patterns for existing historical collections such as:

- `users`
- `sharedLists`
- `sharedPropertyLists`
- `captaciones`
- `avaluos`
- global / property-level comments, reviews, likes and favorites
- legacy private forms

This compatibility does not imply that every historical feature is surfaced in the DRG 2.0 UI.

## Remaining activation gate

Before writes are enabled:

1. Confirm all CI jobs, including security-rule emulator compilation.
2. Take a Firebase backup/checkpoint.
3. Deploy proposed rules only after review.
4. Enable writes in Preview, not Production.
5. Test one controlled Admin account and one Agent account.
6. Test create/edit/media/legal PDF/review/forms/shared lists.
7. Verify resulting documents against legacy schema.
8. Disable Preview writes if any mismatch appears.
9. Only after parity is confirmed, plan production cutover.
