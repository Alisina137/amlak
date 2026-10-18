# AmlakLink — Final Completion Step 5: Database, Media and Backups

## Engineering changes merged in this step

- **Restore safety:** staged restores now fail closed unless `RESTORE_CONFIRM=RESTORE_TO_STAGING_ONLY`, a full production `DATABASE_URL`, a separate `STAGING_DATABASE_URL`, and an exact `RESTORE_EXPECT_DATABASE` all agree. Production and staging on the same hostname/port are refused by default; `RESTORE_ALLOW_SAME_HOST=true` is an exceptional operator override, but **never allows the same production database**. The destination database must have a standalone staging/test/sandbox/restore label, with no prod/production/live marker. Validation happens before decrypting or connecting.
- **Authenticated encrypted backups:** `pnpm db:backup:verify <path>` authenticates the full AES-256-GCM archive in disposable private local storage and uses `pg_restore --list` to verify the archive format **without contacting or modifying a database**. This is an archive check, *not* a complete disaster recovery test.
- **Remote PostgreSQL TLS:** `pg_dump` and `pg_restore` now require certificate/hostname checking via `PGSSLMODE=verify-full` for remote databases. Environments with private CA certificates must install their trusted CA using standard PostgreSQL client configuration; do not downgrade TLS.
- **Database integrity:** new read-only `pnpm db:integrity` reports incorrect listing → current/approved revision references, published listings lacking an approved revision and repeated image fingerprints. Per-category counts are capped at 100, and outputs contain totals but no user names, credentials or private listing records. This does not replace SQL constraints or a full security audit.
- **Media integrity:** new read-only `pnpm ops:media:audit --limit=10` samples recent photo records, reads their actual local/S3 WebP bytes, and compares stored SHA256 fingerprints and sizes. Requests are limited to 1–100 objects. A failed S3 read or mismatch produces a non-zero process result. Audits do not modify media or expose signed customer details. A sample **cannot** prove all objects are backed up.
- **Safer media deletion:** deleting a photo checks editor access and locks the listing against draft/submit changes. Referenced approved/submitted photos remain protected. DB photo removal is committed **before** attempting deletion of the underlying local/S3 object. An object-removal failure leaves a logged orphan requiring maintenance rather than a broken live DB photo reference; the API returns `mediaCleanupPending:true`.
- **Tests:** staging-restore guards, remote TLS, checksums/limits, photo-deletion integration and existing cryptographic backup tamper detection are covered. The new commands are independently invokable from PowerShell.

## Commands (Windows PowerShell)

```powershell
git pull origin main
pnpm install
pnpm db:diagnose
pnpm db:migrate
pnpm db:integrity
pnpm ops:media:audit --limit=10
pnpm db:backup
# Copy the printed backup path into the next command:
pnpm db:backup:verify "C:\path\to\amlak-backup.pg.enc"
pnpm check
```

**Do not run a staging restore on production.** When a disposable database has been separately provisioned and access reviewed:

```powershell
$env:STAGING_DATABASE_URL = "<private disposable staging DB URL>"
$env:RESTORE_EXPECT_DATABASE = "amlak_staging"
$env:RESTORE_CONFIRM = "RESTORE_TO_STAGING_ONLY"
pnpm db:restore:staging "C:\path\to\amlak-backup.pg.enc"
```

Do not paste URLs, passwords or AES keys into chat, version control, or command logs. The backup encryption key must be kept separately by authorized staff. After restoration, independently compare a sample of table counts, reference integrity, roles/permissions, photos and API query results. Clear `RESTORE_*` variables after use.

## What the encrypted DB backup does and does not protect

The database backup includes listing descriptions, metadata, image storage **references**, accounts and other relational data. **It does not include the image bytes stored in S3 or local development directories.** Back up the object store separately, ideally with versioning, restricted read/write roles, offsite replication and measured retention/restore drills. Coordinate database and S3 snapshot timestamps and store the version inventory with the recovery plan. For local development, copy `.amlak-media` separately to restricted encrypted storage. Do not expose image bucket names, object keys, or backups publicly.

A properly tested release recovery plan needs actual evidence of:
1. An encrypted DB archive has been generated and authenticated using the correct key.
2. A disposable isolated staging database has been restored, inspected and compared with the original.
3. The media bucket has a separate independently restorable backup/version history and storage-role permissions have been reviewed.
4. Image bytes and hashes match image references in the restored DB, and privacy/safety/moderation state remains correct.
5. Restoration procedure, maximum tolerable data-loss and recovery time, on-call owners, key custody and backup retention are documented and approved.

## External blockers and limitations

- No real Neon or S3 backup was made by this code change; all live operations require the user's credentials/environment and a suitable PostgreSQL client.
- The media audit scans **database → storage** only. It cannot find unreferenced orphan objects. A future orphan-cleanup flow should use a separately reviewed retention policy and a **dry-run-first** inventory comparison, never arbitrary S3 deletion.
- Media deletion may leave orphan files if the storage delete fails, intentionally preferring recovery over irreversible breakage; the warning must be investigated.
- Staging and production databases may be on separate hosts to reduce accidental damage. The same-host exception requires explicit authorization.
- A passing unit test or CI migration rerun cannot certify a fully restorable production dataset.
- **No new SQL migration is required for this step.**
