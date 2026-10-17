# AmlakLink — Local Development (Windows PowerShell)

Requirements: Node.js >=22.13, Corepack and pnpm 10.27 (Corepack can provision it), Android phone with Expo Go for SDK 57.

1. In your existing folder: git clone https://github.com/Alisina137/amlak.git . (only if that folder is empty).
2. Run corepack enable, then corepack pnpm install.
3. Start backend in one terminal: corepack pnpm dev:api (port 4000); test http://localhost:4000/health and /v1/catalog/provinces.
4. Configure apps/mobile/.env from apps/mobile/.env.example. For a physical Android phone, set EXPO_PUBLIC_API_URL to a public HTTPS tunnel forwarding localhost:4000. No tunnel URL is hardcoded. This app works for province browsing even when API is unreachable.
5. In a second terminal: corepack pnpm dev:mobile (Expo Go); or corepack pnpm --filter @amlaklink/mobile start -- --tunnel.
6. Admin shell: corepack pnpm dev:admin, then open http://localhost:3000/admin/login.
7. Verification: corepack pnpm check.

The admin sign-in UI is purposefully **disabled** until Phase 2 implements protected staff sessions and MFA. Do not enter real credentials yet. No active property listing service exists before Phase 3.

Node package dependencies are not bundled with this repository. The initial setup requires internet access to install packages. Production configuration and migrations will be introduced in later phases, not simulated here.
