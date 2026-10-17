# Database connection troubleshooting — Neon / Windows

## Symptom

`pnpm db:migrate` reports `Error: write CONNECT_TIMEOUT undefined:undefined`.
This is a PostgreSQL **network connection timeout**, occurring before migration SQL executes. It does not establish that the SQL is invalid. Neon may be waking, the hostname may be wrong, or a firewall/ISP may block outbound TCP **5432**.

## Use the diagnostics

1. Verify that `C:\projects\amlak\.env` contains `DATABASE_URL` copied **exactly** from the Neon Console under **Connect**. Do not share the connection URL, as it contains a password.
2. Run `pnpm install` to install the optional Neon WebSocket driver.
3. Run `pnpm db:diagnose` to check URL format, DNS lookup, whether TCP 5432 is reachable from **your PC**, and perform a read-only `SELECT 1` with the configured transport.
4. If port 5432 is blocked on your network, change this **one line** in the root `.env`:

   ```dotenv
   DATABASE_TRANSPORT=websocket
   ```

   This uses the official Neon serverless WebSocket protocol over port **443**, retaining interactive transactions. Leave your existing `DATABASE_URL` unchanged. For localhost/other providers, use `DATABASE_TRANSPORT=tcp`.
5. Run `pnpm db:diagnose` again. Only after the read-only query succeeds, run `pnpm db:migrate`.
6. Restart `pnpm dev:api` from the same root `.env` configuration; the app needs the **same working transport**. Its own listening port remains **4000**. Port **4040** is only the optional ngrok inspector.

## If both transports fail

- Confirm your Neon project is active, database credentials and hostname are correct, and no copied quotation/newline/placeholder is present in the value. You can regenerate the connection string in the Neon Console.
- A transient cold start may take longer than ten seconds; TCP now allows 25 seconds.
- If DNS resolution fails, check Windows DNS/network/proxy or try a permitted alternative network. If TCP 5432 fails and WebSocket 443 also fails, a proxy, corporate firewall or ISP may be blocking both. A VPN or allowed different connection may be required.
- If password is rejected, obtain a new connection string instead of sharing credentials here.
- `pnpm db:diagnose` reports only the database hostname, port, DNS results and error code, never passwords.

## Notes

- The WebSocket setting only supports Neon's `.neon.tech` endpoints. The original Postgres.js TCP driver remains the default and is used in CI against temporary local PostgreSQL.
- Drizzle interactive transactions still require a session-capable driver, so this option uses Neon's **WebSocket Pool**, not the HTTP-only Neon adapter.
- CI successes do **not** prove your personal computer can reach Neon. WebSocket mode must still be smoke-tested with `pnpm db:diagnose` and a local account/listing flow.
- Never paste `DATABASE_URL`, tokens or entire `.env` into issues or chat. Safely share redacted diagnostic output instead.
