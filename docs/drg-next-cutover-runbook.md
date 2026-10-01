# DRG 2.0 — Cutover runbook

## Current safety state

- Production domain remains on the legacy main branch.
- DRG 2.0 branch: migration/drg-next.
- Production code checkpoint: backup/pre-drg-next-2026-10-01.
- DRG 2.0 pre-write checkpoint: backup/drg-next-readonly-2026-10-01.
- Writes are blocked unless the deployment is a Vercel Preview, data mode is staging and NEXT_PUBLIC_DRG_ALLOW_WRITES=true.
- Proposed Firebase rules are validated in isolated emulators but are not deployed yet.
- Avalúos remains intentionally disconnected.

## Phase A — Mandatory backup

1. Authenticate to Google Cloud with an account that can export Firestore.
2. Run scripts/backup-firestore-before-migration.ps1.
3. Verify that the command reports BACKUP COMPLETADO and records the gs:// export path.
4. Keep the generated firestore-backup-*.json manifest.
5. Do not continue if the export fails.

Recommended before final production cutover: also retain a bucket-level Storage backup/snapshot if destructive production operations will be enabled.

## Phase B — Deploy migration security rules

1. Run scripts/deploy-migration-rules.ps1.
2. The script deploys only Firestore and Storage rules from security/*.proposed.
3. It does not deploy the website and it does not rewrite Firestore data.
4. Confirm the Firebase CLI finishes without errors.

Rollback of rules if necessary:

- checkout backup/pre-drg-next-2026-10-01
- deploy the saved production firestore.rules and storage.rules.

## Phase C — Enable writes only in Preview

Required build-time values:

- NEXT_PUBLIC_DRG_DATA_MODE=staging
- NEXT_PUBLIC_DRG_ALLOW_WRITES=true

The application also requires DRG_DEPLOYMENT_ENV=preview, which is injected from VERCEL_ENV at build time. Production is therefore blocked even if the public flags are mistakenly enabled.

Do not set the production environment to write-capable before Preview validation is complete.

## Phase D — Automated controlled smoke test

1. Open /migration-check on the Preview.
2. Sign in with an Admin account.
3. Verify the page reports Environment: preview and Writes: HABILITADAS.
4. Run the controlled test.
5. Expected checks:
   - create/read/update a private temporary property;
   - create comment and rating;
   - create public-form record;
   - create shared list;
   - upload temporary property image;
   - remove all temporary test records/files.
6. Every row must end in success.

## Phase E — Manual Preview write parity

Use disposable test data. Do not edit a valuable live listing for the first pass.

- Agent: update profile/photo.
- Agent: create property and submit for review.
- Agent: upload/reorder/cover images.
- Agent: add/remove legal PDF.
- Agent: map/geocoding.
- Agent: YouTube/TikTok.
- Agent: create shared list and open its public token URL.
- Agent: assisted listing for another authorized agent.
- Admin: see pending property and uploader audit.
- Admin: edit without taking ownership.
- Admin: reject with reason; agent sees reason.
- Agent: resubmit; Admin approves.
- Public: approved property appears in catalog/detail/map.
- Public: contact and seller forms reach Admin inbox.
- Public: signed-in comment/rating works.
- PDF: property sheet generates.

## Phase F — Production cutover

Only after Phases A-E pass:

1. Freeze legacy writes for the short cutover window or verify no concurrent edits are pending.
2. Take a final Firestore export/checkpoint.
3. Merge migration/drg-next into main.
4. Configure the production build for DRG production mode in a deliberate code/config change.
5. Deploy to Vercel Preview once more from the merged commit.
6. Promote only after smoke checks.
7. Verify diamantesrealtygroup.com and www.
8. Verify legacy redirects: *.html, property query links, agent/admin dashboard URLs, share tokens and property-sheet links.

## Rollback triggers

Rollback immediately if any of these occur:

- authentication role mismatch;
- properties disappear or ownership changes unexpectedly;
- public/private visibility regression;
- broken image or legal-document access;
- shared-token URLs fail;
- Admin cannot review/approve;
- legacy URLs stop resolving;
- Firestore permission-denied errors on normal production flows.

Rollback target for code: backup/pre-drg-next-2026-10-01.
Rollback target for data: latest verified Firestore export.

## Intentionally outside this migration

- Avalúos engine/data integration.
- Any redesign beyond the approved DRG migration UI.
- New business features that did not exist in the current production main branch.