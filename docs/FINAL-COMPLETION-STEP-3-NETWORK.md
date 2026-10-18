# AmlakLink — Final Completion Step 3: Offline & Network Reliability

## Delivered in code

1. **Bounded API reads.** GET requests make at most three attempts with increasing delays when a connection fails, times out or returns transient HTTP 408/429/502/503/504. A client-side request timeout is distinct from general network failure. **POST, PUT and DELETE are sent once only**: a timeout never proves the server rejected a write.
2. **Foreground connectivity.** The public API health check cancels superseded checks, rechecks when Android returns to foreground and periodically while active, and refreshes the public Home feed after a confirmed offline→online transition. This avoids attempting to refresh private data under an old account.
3. **Safe search fallback.** Search can show the user's last *public* discovery result for a maximum of 48 hours, clearly labeled as offline/stale rather than confirmed live inventory. Corrupt, future-dated and oversized cache entries are ignored. Only 24 query variants and 50 listing cards per key are retained, instead of unlimited growth.
4. **No stale search results.** Search, sponsored cards and load-more responses are bound to the current exact filter key and request sequence. Switching province, category, price or other filters cannot display an old request's results as the new search. Offline search never displays cached sponsored placements.
5. **Offline property draft recovery.** Draft data, including private contact/address fields, are keyed per authenticated user and listing ID; previous users' drafts cannot be restored in another account. If the API is unavailable, a valid previously cached editable draft can be reopened for local editing without automatic submission.
6. **Serialized draft saving.** On-device writes are ordered to prevent an older asynchronous write from overwriting a newer local edit. Saving a server snapshot cannot mark a newer local edit as synchronized. Automated save requests back off briefly during outages and explicit Save still attempts the server.
7. **Conflict resolution.** When server and offline drafts diverge, the app preserves the local copy and requires an explicit choice to keep the server draft or restore the local draft. Nothing silently overwrites a newer server version. Offline steps may be navigated, but public submission still requires server success and moderation.
8. **User-initiated recovery.** The Home listing feed offers Retry when it cannot load and automatically attempts a refresh after connectivity returns. Property editor offers a Save/recovery action when an error occurs; photo upload remains explicit/manual, with no automatic retry that could duplicate uploaded media.
9. **CI checks.** `pnpm qa:network` verifies source contracts for the above, in addition to TypeScript, API/database integration tests, admin production build and Android export.

## Commands

```powershell
git pull origin main
pnpm qa:network
pnpm check
pnpm dev:api
# separate terminal
pnpm dev:mobile
```

**No SQL migration.** The v5 client cache key deliberately does not load prior v4 search cache or legacy unscoped draft keys. They are stale or unsafe to reuse. The legacy entries can be purged during future storage migration; they are never served by the new code.

## Still requiring physical-device testing

- Simulate Android airplane mode and cellular reconnection on an actual Android handset (including the 10-second timeout / slow ngrok routes).
- Verify a cached draft is shown only for the account that created it and remains intact if logout occurs during a save.
- Edit a draft offline, reconnect, and choose restore/keep when another device has changed its server version. Test 409 version conflicts and rejected/submitted revisions.
- Upload a 5–6 MB photo on 3G/4G then interrupt network. The client must **not** automatically retry multipart POST. Reselect/retry manually only after reviewing the listing's photos: server-side processing might already have completed before the timeout; a retry can otherwise create an orphan or duplicate photo.
- Disable/re-enable Wi‑Fi while changing search filters; ensure latest filters own all results, featured cards and pagination.
- Confirm retry indicators, form/keyboard focus, translated outage messages, memory behavior and battery usage on low-memory Android phones.

**Limitations:** Private chat messages and privileged server operations are not queued for automatic background sending. Public search cache is only a stale preview, not evidence a property is still available. Actual network/device performance and cloud image recovery still require the Phase 7 pilot and Step 10 physical-device acceptance.
