# Phase 2 — Identity & Scoped Roles

**Status:** Implemented; CI integration tests verify real PostgreSQL identity flows. External SMTP, local device UX, and production identity proof require operational configuration.

## Delivered

- Guest search still works without sign-in. Register with display name, normalized email, and a strong password; receive six-digit expiring email code.
- Verify code to activate login. Sign in only after verification. Email-based password recovery revokes old sessions.
- Store password as adaptive bcrypt hash; store only session token hash in DB; mobile token goes to OS SecureStore.
- Activate a private seller only after verified email and acceptance of advertiser rules. Live listing submission is Phase 3.
- Verified member applies for an agency. Staff approval is mandatory; agency owner is activated only after review.
- Agency managers and owners invite verified members to their agency. Invitees must explicitly accept. Memberships are agency-scoped; revoked agents lose access.
- Standalone Next.js admin with provisioned staff, mandatory TOTP MFA, encrypted MFA seeds, anti-replay, dedicated audience, secure HTTP-only cookie, and staff-only agency approval queue.
- Audit log records agency approvals, member changes, password resets and staff authentication.

## Set up locally (Windows PowerShell)

1. Pull main and run: corepack pnpm install.
2. Copy .env.example to .env in the repository root and add DATABASE_URL (Neon/PostgreSQL), AUTH_CODE_PEPPER (random 32+ characters), STAFF_TOTP_ENCRYPTION_KEY_HEX (32 random bytes encoded as 64 hex characters).
3. Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM for real emails. In LOCAL DEVELOPMENT ONLY you may set AUTH_DEV_PRINT_CODES=true to print codes in API terminal. Never use this mode on a publicly accessible API.
4. Run corepack pnpm db:migrate to create the identity tables, then corepack pnpm dev:api. API listens on port 4000, and /ready checks database connectivity.
5. Copy apps/mobile/.env.example to apps/mobile/.env and set EXPO_PUBLIC_API_URL to a reachable HTTPS ngrok tunnel forwarding localhost:4000; use corepack pnpm dev:mobile. Port 4040 is ngrok's inspector, NOT an API port.
6. Start admin with corepack pnpm dev:admin. If API is not on localhost:4000, set AMLAK_API_INTERNAL_URL in apps/admin/.env.local.
7. Provision staff only if authorized: in your PowerShell session set STAFF_EMAIL, STAFF_PASSWORD (12+ chars), STAFF_ROLE=super_admin (or verification) and STAFF_NAME, then run corepack pnpm staff:create. The tool prints a one-time TOTP enrollment URI. Store its secret securely; it cannot be recovered from the printed URI after closing terminal. On production also set STAFF_ALLOW_PROVISION=true.
8. Open http://localhost:3000/admin/login; use the staff account and six-digit authenticator code. Verify agency requests at /admin/agencies.
9. Run corepack pnpm check; GitHub CI also uses isolated PostgreSQL to test login, verified seller activation, separate staff sessions, MFA and cross-agency restrictions, builds admin and exports Android.

## Limitations and safety

- Phone/SMS OTP is intentionally not offered before verification of an Afghan SMS delivery provider. Email is the pilot contact-verification channel.
- Agency documentation storage and richer proof workflows belong to Phase 6. Staff review is manual, not automatic ownership certification.
- Any public tunnel must use real SMTP and strong credentials, NOT dev printed codes.
- Database secrets, MFA secrets, verification papers and live contact data must not be committed.
- New listing submission, pricing/payments, chat and marketplace browsing with inventory are later phases as described in the approved specification.
