## ADDED Requirements

### Requirement: Production stack is fully Dockerised

Production SHALL be deployed via `docker-compose.prod.yml` with these services: `backend` (NestJS), `frontend` (built static assets), `lw-postgres` (PostgreSQL 17), `adminer`, `nginx` (reverse proxy + TLS), and `certbot` (Let's Encrypt, profile `certbot`).

#### Scenario: Bringing the stack up

- **WHEN** a deployer runs `docker compose -f docker-compose.prod.yml up -d --build` on the VPS with a valid `.env`
- **THEN** all five always-on services (`backend`, `frontend`, `lw-postgres`, `adminer`, `nginx`) start and reach a healthy state
- **AND** the `certbot` service does NOT start (it is gated behind the `certbot` profile)

#### Scenario: Database is not exposed publicly

- **WHEN** the deployer inspects exposed ports on the host
- **THEN** PostgreSQL's port 5432 is NOT bound to a public interface; only `nginx` exposes 80 and 443

### Requirement: Nginx terminates TLS and routes by path

Nginx SHALL handle HTTP→HTTPS redirect and route `/api/*` and `/socket.io/*` to the backend container, `/adminer/` to Adminer, and the catch-all `/*` to the frontend container.

#### Scenario: HTTPS routing

- **WHEN** a browser requests `https://lightweight.daw.inspedralbes.cat/api/auth/me`
- **THEN** Nginx terminates TLS (TLS 1.2 or 1.3) using the certificate from the `letsencrypt` volume
- **AND** the request is proxied to `backend:3000`

#### Scenario: Socket.IO routing

- **WHEN** the SPA opens a Socket.IO connection over `wss://lightweight.daw.inspedralbes.cat/socket.io/`
- **THEN** Nginx upgrades the connection and proxies to `backend:3000` with the upgrade headers preserved

#### Scenario: HTTP request

- **WHEN** a browser requests `http://lightweight.daw.inspedralbes.cat`
- **THEN** Nginx redirects to the HTTPS equivalent

### Requirement: SSL via dockerised Certbot

Let's Encrypt certificates SHALL be obtained and renewed by a `certbot/certbot` container. Certificates SHALL persist in the named volume `letsencrypt` and the ACME challenge SHALL use the named volume `certbot-webroot`.

#### Scenario: First-time SSL initialisation

- **WHEN** the deployer runs `bash init-ssl.sh` on a freshly-deployed VPS
- **THEN** Nginx briefly switches to `nginx/default-init.conf` (HTTP-only)
- **AND** `docker compose --profile certbot run --rm certbot` obtains the certificate via the webroot challenge
- **AND** Nginx restores `nginx/default.conf` and reloads (`nginx -s reload`)
- **AND** `curl -I https://lightweight.daw.inspedralbes.cat` returns `HTTP/2 200`

#### Scenario: Periodic renewal

- **GIVEN** the host crontab schedules `0 3 * * 1` to run `docker compose --profile certbot run --rm certbot renew`
- **WHEN** the cron fires and certificates have less than 30 days remaining
- **THEN** Certbot renews them and Nginx is reloaded
- **AND** if more than 30 days remain, Certbot exits without re-issuing

#### Scenario: Certificates persist across redeploys

- **WHEN** a `git push` triggers GitHub Actions and the prod stack is recreated
- **THEN** the `letsencrypt` volume is preserved and HTTPS continues to work without a fresh challenge

### Requirement: GitHub Actions automates deploy on push to main

`.github/workflows/deploy.yml` SHALL run on every push to `main` and SHALL: rsync the repo to `/opt/lw-app/` on the VPS, write `.env` from the `ENV_FILE` secret, and run `docker compose -f docker-compose.prod.yml up -d --build`.

#### Scenario: Successful deploy

- **WHEN** a developer merges to `main`
- **THEN** the workflow succeeds and the production site reflects the new code within ~5 minutes (build time depending)

#### Scenario: Missing or invalid `ENV_FILE` secret

- **WHEN** the secret is missing or malformed
- **THEN** the workflow fails before bringing the stack down (the existing running stack is unaffected)

#### Scenario: A failing build

- **WHEN** the backend or frontend Dockerfile build fails
- **THEN** `docker compose up -d --build` returns non-zero; the previous containers continue running because Compose recreates services individually only if the new image builds — confirm exact behaviour in CI logs at apply time

### Requirement: Configuration is environment-driven

`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and `VITE_BACK_URL` (plus any future required key) SHALL be supplied via environment variables. They SHALL NOT be hardcoded anywhere in `src/`.

#### Scenario: Adding a new env var

- **WHEN** a future change introduces a new environment variable
- **THEN** the change MUST update `.env.example` (root and per-package), the `ENV_FILE` GitHub Actions secret template, and document the variable in the README "Variables d'entorn" section

### Requirement: HTTPS-only browser features work

WebRTC's `getUserMedia` requires HTTPS in production. The deploy spec SHALL guarantee that the production URL is always served over HTTPS so that the `video-call` capability functions.

#### Scenario: Production must serve HTTPS

- **WHEN** the user opens https://lightweight.daw.inspedralbes.cat and accepts a video call
- **THEN** `getUserMedia` succeeds (assuming the user grants camera/microphone permission)

#### Scenario: Localhost exemption

- **WHEN** a developer runs `docker compose up` locally and tests video calling at `http://localhost:5173`
- **THEN** `getUserMedia` succeeds because browsers exempt `localhost` from the secure-context requirement

### Requirement: Deploy is testable

The production deploy SHALL be verifiable via a smoke check after every release, and any change touching `nginx/`, `docker-compose.prod.yml`, `init-ssl.sh`, or `.github/workflows/` MUST add or update an entry in `doc/Proves_usuari.md`.

#### Scenario: Smoke check after release

- **WHEN** a deploy completes
- **THEN** the deployer runs `curl -I https://lightweight.daw.inspedralbes.cat` (expect `HTTP/2 200`), opens the SPA, and signs in
- **AND** the manual smoke list in `doc/Proves_usuari.md` (deploy section, to be created if absent) is run on every release that touches `nginx/`, `docker-compose.prod.yml`, `init-ssl.sh`, or `.github/workflows/`

### Requirement: Known gap — `events-debug` controller is a security follow-up

`src/back/src/events/events-debug.controller.ts` is **not** specified by `infra-deploy` and is treated as a **security follow-up**. A dedicated change MUST audit whether the controller is authenticated and either gate it (env flag, auth guard, or removal in production builds) or remove it altogether. Until that change ships, no other proposal may treat the debug controller as intentional production surface.

#### Scenario: Audit follow-up

- **WHEN** the security follow-up change is created
- **THEN** that change MUST: read `events-debug.controller.ts`, decide between (a) removing the controller, (b) gating it behind `NODE_ENV !== 'production'`, or (c) requiring an admin guard, and SHALL update or remove this "Known gap" requirement accordingly

#### Scenario: No proposal silently relies on the debug controller

- **WHEN** any future proposal references behaviour from `events-debug.controller.ts`
- **THEN** the reviewer SHALL block it pending the security follow-up
