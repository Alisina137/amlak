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
