# AmlakLink — Getting Started

The current implementation milestone is Phase 2. Detailed Phase 2 configuration is in docs/PHASE-2-IDENTITY.md.

PowerShell quick start from an existing local clone:

    cd C:\projects\amlak
    git pull origin main
    corepack enable
    corepack pnpm install
    Copy-Item .env.example .env
    # Populate your own secret values in the root .env; do not commit it.
    corepack pnpm db:migrate
    corepack pnpm dev:api

To run mobile: configure apps/mobile/.env from apps/mobile/.env.example with an HTTPS ngrok tunnel to localhost:4000, then use corepack pnpm dev:mobile.
To run admin: in a second terminal run corepack pnpm dev:admin, and open http://localhost:3000/admin/login. Provision staff according to docs/PHASE-2-IDENTITY.md.

Backend port 4000 is mandatory; ngrok port 4040 is the inspector only. Email account verification requires SMTP or explicitly approved local-only dev OTP logging.

CI tests do not configure, migrate, or validate your Neon environment: they run against a dedicated temporary PostgreSQL container.

Phase 3 listing setup, S3-compatible photo storage and the moderator panel are documented in docs/PHASE-3-INVENTORY.md.

Phase 4 search, favorites, map/list configuration and external call handling are documented in docs/PHASE-4-DISCOVERY.md.

If migrations fail with `CONNECT_TIMEOUT`, follow docs/DATABASE-CONNECTIVITY.md and run `pnpm db:diagnose` before retrying. Neon port-443 WebSocket transport is optionally supported via root `.env` `DATABASE_TRANSPORT=websocket`.

For Phase 5 messages, viewings, agency lead queues, and in-app alerts, see docs/PHASE-5-ENGAGEMENT.md. Check `pnpm db:diagnose` for the earlier Neon connection timeout before running `pnpm db:migrate`.

For Phase 6 reporting, appeals, staff verification, safety moderation and migration 0005_safety.sql, see docs/PHASE-6-SAFETY.md. Always run pnpm db:diagnose before migrating your own Neon instance.
