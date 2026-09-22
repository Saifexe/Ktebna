# Security

This document covers Ktebna's security gates, vulnerability remediation history, application-level security controls, and credential management practices. The per-job pipeline policy lives in **[docs/SECURITY_GATES.md](./docs/SECURITY_GATES.md)**.

**Last reviewed:** 22 Sep 2026 (input-validation fixes and the database-backed Library). Pipeline #2872104317 (`a1e79d1`): all 12 jobs green, including the blocking Gitleaks and Trivy gates, so both images were published with **no fixable HIGH / CRITICAL** findings. The previous full review is pipeline #2868466261 (`2a24f62`, 21 Sep 2026).

---

## Contents

- [Security gates](#security-gates)
- [Vulnerability remediation log](#vulnerability-remediation-log)
- [Application security controls](#application-security-controls)
- [Known gaps and recommended hardening](#known-gaps-and-recommended-hardening)
- [Credential management](#credential-management)
- [What the gates catch, and what they don't](#what-the-gates-catch-and-what-they-dont)

---

## Security gates

Automated gates run on every push through GitLab CI/CD (SonarCloud runs on `main` only):

| Gate | Tool | What it catches | Blocking? |
|---|---|---|---|
| Tests / lint | JUnit + Testcontainers, ESLint | Regressions in auth, authorization, privacy, rate limiting, input limits and upload validation (76 tests, 94.6% line coverage); lint errors | **Blocking** |
| Static Application Security Testing (SAST) | SonarCloud | Code quality issues, security hotspots, code smells | Non-blocking (`allow_failure: true`) |
| Secret scanning | Gitleaks v8.30.1 | Credentials, tokens, keys in the checked-out files **and in every commit of the history** (`GIT_DEPTH: 0`) | **Blocking** |
| Filesystem vulnerability scanning | Trivy FS | Known CVEs in backend (Maven, offline DB) and frontend (npm) dependencies | **Blocking** on fixable HIGH/CRITICAL |
| Container image vulnerability scanning | Trivy image | Known CVEs in the built backend and frontend images | **Blocking** on fixable HIGH/CRITICAL; images are pushed only after this passes |

Leaked secrets block unconditionally: a leaked secret needs immediate rotation, not a later review. Reviewed false positives are suppressed one at a time, by fingerprint, in [`.gitleaksignore`](./.gitleaksignore). Scanner images are pinned (`gitleaks:v8.30.1`, `trivy:0.74.0`), so gate results are reproducible.

**Trivy gate policy.** Each Trivy job prints a full report (every severity, never fails), then runs the gate with `--severity HIGH,CRITICAL --ignore-unfixed --exit-code 1`. A HIGH or CRITICAL finding with a fixed version available fails the pipeline. One with no fix yet can't be remediated by upgrading, so it stays visible in the report without blocking. Images are built and saved as job artifacts, scanned, and pushed to the registry only by the `publish` stage once their scan has passed. A vulnerable image therefore never reaches the registry.

---

## Vulnerability remediation log

### 22 Sep 2026: Input validation, logic holes and broken uploads (fixed)

**Detected by:** a full code review of the app, and, for the uploads bug, by re-adding the Library books through the API against the running Compose stack.

| Finding | Impact | Fix |
|---|---|---|
| Request DTOs had no length limits beyond the DB columns | A long message or description reached MySQL and came back as a `500` | `@Size` on every text field, matching its column; passwords capped at 72 characters (BCrypt's input limit) |
| `size` query parameter unbounded | One request with `?size=1000000` could load a whole table | Page size clamped to 1–50, negative pages to 0 |
| Users could message themselves | A conversation with the same user on both sides | Rejected with `400` |
| Hidden listings could be bookmarked | Confirmed that a hidden post id exists | `404`, the same answer as a missing post |
| No unique key on the conversation pair | Two simultaneous first messages could create duplicate conversations | Unique constraint `uk_conversation_pair`; a concurrent duplicate returns `409` |
| Uploads stored as absolute `APP_BASE_URL` links | Every image broke when the host changed; the CSP had to allow `http://localhost:8080` | Relative `/uploads/…` paths proxied by Nginx; existing rows rewritten by `scripts/migrate-relative-upload-urls.sql`; the CSP exception removed |
| Uploads volume still owned by root after the non-root switch (`94977d6`) | Every cover and avatar upload in Compose failed with "Failed to store file" | One-time `chown` of the existing volume (new volumes inherit the right owner from the image); `fsGroup: 10001` on the k8s backend pod |
| The k8s cluster's Secrets still held placeholder values (the public JWT placeholder, and 8- and 13-character MySQL passwords), and it ran August images (root backend; frontend calling `localhost:8080` with no `/api` proxy) | Anyone knowing the placeholder could forge JWTs for the cluster's backend; the cluster app didn't work | Found when the current backend's startup check refused the placeholder. All three values rotated to random ones (`ALTER USER` first, so no data loss); current images loaded into the node; CI no longer bakes `localhost:8080` into published frontend images |

**Verification:** 13 new regression tests (76 in total) and pipeline #2872104317. In the running Compose stack, covers and avatars load through `/uploads/`, and new uploads succeed. In the k8s cluster, sign-up, a listing with a photo upload, the image served back through nginx, and the Library API all work with the rotated secrets.

### 22 Sep 2026: Frontend dependencies, found while making Trivy blocking

**Detected by:** a local run of Trivy 0.74.0 against `ktebna/`, before the new `trivy-fs-frontend` gate was added. The frontend's npm dependencies had never been scanned by Trivy until then.

| Finding | Components | Fix |
|---|---|---|
| 40 HIGH/CRITICAL (1 CRITICAL), all with fixed versions | Shipped to the browser: `axios` 1.11.0 (+ `form-data`), `react-router` 7.8.1. Build-time only: `vite` 7.1.3, `rollup`, `postcss` (+ `nanoid`), `picomatch`, `tar` 7.4.3 (via `@tailwindcss/oxide`) | `npm audit fix` (no `--force`, no major-version changes; only `package-lock.json` changed). Now `axios` 1.20.0, `react-router` 7.18.4, `vite` 7.3.6, `tar` 7.5.22 |

**Verification:** `npm audit` reports 0 vulnerabilities, `npm run lint` and `npm run build` pass, the Trivy FS gate on `ktebna/` returns 0, and both rebuilt images scan at **0 HIGH / 0 CRITICAL**, read from their saved `.tar.gz` files as the pipeline now does.

### 21 Sep 2026: Trivy image scans flagged the v2 release

**Detected by:** `trivy-backend-image` and `trivy-frontend-image` (both advisory) on the first v2 pipeline (`f421805`). Neither finding came from application code; both came from components shipped inside the images.

| Image | Finding | Component | Fix |
|---|---|---|---|
| backend | 3 × CRITICAL: CVE-2026-65182, CVE-2026-65905, CVE-2026-68525 | Embedded Tomcat `10.1.55`, managed by Spring Boot 3.5.16 (the newest 3.5 release, so a Boot upgrade was not available) | Pinned `<tomcat.version>10.1.60</tomcat.version>` in `backend/pom.xml`. Remove the pin once a Spring Boot release manages a fixed Tomcat. |
| frontend | 7 × HIGH: CVE-2026-53612, CVE-2026-53613, CVE-2026-53614, CVE-2026-76642, CVE-2026-78408, CVE-2026-78409, CVE-2026-78410 | Alpine `libuuid` (util-linux) `2.42.1-r0` in the `nginx:1.30.4-alpine3.24` base | Added `RUN apk upgrade --no-cache` to the runtime stage of `ktebna/Dockerfile`, which picks up `2.42.3-r1` and any later Alpine fixes on every build |

**How it was reproduced without CI logs:** Trivy 0.74.0 (official release, checksum verified) scanned the public base images and the built `backend.jar` separately. Each final image is just its base image plus our build output, so this located both findings before any image was rebuilt.

**Verification:**
- Rebuilt `backend.jar` bundles `tomcat-embed-core-10.1.60` and scans clean.
- The backend boots and serves normally on `Apache Tomcat/10.1.60`.
- The fixed `libuuid 2.42.3-r1` is present in Alpine v3.24 `main`.
- Pipeline `bb09eb8` passed.
- Both images, rebuilt locally with Docker Compose, scan at **0 HIGH / 0 CRITICAL** (`--exit-code 1` gate returns 0).

**Residual (advisory):** backend image 68 LOW/MEDIUM in the Ubuntu 22.04 base plus 4 MEDIUM in the jar; frontend image none. These are tracked and reviewed, not blocking.

### 21 Sep 2026: Docker verification findings (fixed)

- **Upload limit mismatch:** Nginx's default `client_max_body_size` (1 MB) returned `413` for most phone photos before they reached Spring (limit 10 MB). This only affected Docker/Kubernetes, not local dev. Fixed in `ktebna/nginx.conf` (`client_max_body_size 10m` on `/api/`). Verified: a 1.98 MB image uploads and is served back byte-for-byte; an 11 MB file is still rejected with `413`.
- **Version disclosure:** Nginx advertised its exact version in headers and error pages. Fixed with `server_tokens off`.

### 21 Sep 2026: Repository and runtime hardening

A full audit of the repository, its history, Docker Compose, the Kubernetes manifests and the API.

**Git history:** all 71 commits scanned with Gitleaks 8.30.1. There were 4 hits, all false positives: file-metadata entries in a once-committed `graphify-out/cache/stat-index.json`. No `.env`, dump, key or certificate was ever committed, and none of the real secret values in the local `.env` appear anywhere in history.

| # | Finding | Risk | Fix |
|---|---|---|---|
| 1 | Compose, `application.properties` and k8s fell back to `changeme` passwords, Grafana `admin/admin`, and a **publicly known JWT secret** when `.env` was missing | Anyone could forge login tokens or log in with default credentials | Compose uses required `${VAR:?}` variables and refuses to start; Spring has no defaults for `DB_PASSWORD`/`JWT_SECRET`; `JwtUtil` refuses secrets under 32 bytes or equal to the old placeholder |
| 2 | MySQL (3307), backend and actuator (8080), Prometheus (9090) and Grafana (3000) published on `0.0.0.0` | Reachable from any machine on the same network; Grafana was still `admin/admin` | Every Compose port is bound to `127.0.0.1` |
| 3 | `k8s/*.yaml` contained Secret objects with placeholder values | `kubectl apply -f k8s/` would silently overwrite real credentials with `changeme` | Secret objects removed; `k8s/README.md` creates them with random values |
| 4 | MySQL root password baked into the Compose healthcheck command | Visible in `docker inspect` | Healthcheck reads `$MYSQL_ROOT_PASSWORD` inside the container |
| 5 | Every public listing (and conversations, and `/api/users/{id}`) returned users' **email addresses** | Anyone could harvest all users' emails without logging in | Emails are returned only to their owner (`/api/auth/me`, own `/api/users/{id}`) |
| 6 | Hidden listings readable by id | Private data exposure | `GET /api/posts/{id}` returns `404` unless public or requested by the owner |
| 7 | CORS allowed every origin with credentials | Any website could call the API from a victim's browser | Explicit allow-list (`CORS_ALLOWED_ORIGINS`, default `http://localhost:5173`) |
| 8 | No rate limiting | Password guessing, account and message spam | Nginx `limit_req` (10/min on `/api/auth/`, 20/s per client on `/api/`) and an in-app limiter (login 10/min, register 5/min per IP; messages 30/min, listings 10/min per user) |
| 9 | No browser security headers | XSS and clickjacking impact | CSP, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` |
| 10 | Uploads trusted the client's file name and type | Non-image content stored and served from our origin | Magic-byte check (JPEG/PNG/GIF/WebP only); the extension comes from the detected format |
| 11 | Unhandled errors returned `ex.getMessage()` to clients | Leaked SQL, constraint names, file paths | Generic message to the client, full error in the server log; Spring's own 4xx errors keep their status |
| 12 | Login skipped BCrypt for unknown emails | Timing attack revealed which emails are registered | A dummy BCrypt check makes both paths cost the same |
| 13 | CI scanned only the working tree; scanner images floated on `:latest` | Secrets in old commits went unnoticed; unreproducible results | Gitleaks scans the full history; Gitleaks and Trivy images pinned |
| 14 | `.gitignore` missed `.env.*`, keys/certs, `*.sql`, and uploads outside `backend/` | Easy to commit a secret or personal data by accident | Broadened patterns (templates like `.env.example` stay tracked); `.dockerignore` files exclude `.env*` too |

**Local credentials rotated.** The local `.env` used 4-character database passwords and had no Grafana password. The `ktebna_user` passwords (XAMPP MariaDB and Docker MySQL) and the Docker MySQL `root` password were replaced with 32-character random values; each was verified before being written to `.env`. The Grafana admin password was changed from `admin` through its API.

**Verification:** Compose rebuilt from the hardened tree, with all services healthy and every port on `127.0.0.1`. An 18-check attack script passed: headers, fake-image upload rejected, hidden listing `404` for others, no emails in the feed, generic errors, CORS refusal, `429` on brute-force login at both Nginx and the backend. The backend refuses to start with the old placeholder, a short, or a missing `JWT_SECRET`. Every page loads in Chrome with no CSP violations. Both images still report 0 HIGH/CRITICAL.

### 21 Sep 2026: SonarCloud blockers (Docker build secrets)

**Detected by:** SonarCloud's first analysis with coverage (pipeline on `496acd3`): 2 × **Blocker**, "Make sure that using ARG/ENV to handle a secret is safe here" on `ktebna/Dockerfile` lines 9–10 (`VITE_GOOGLE_MAPS_API_KEY`).

**Assessment:** the practical exposure was low. The value only existed in the discarded build stage, never in the shipped Nginx image, and a Maps *browser* key is public by design (Vite embeds it in the JS bundle, which is why the key must be referrer-restricted). But build args and `ENV` values are recorded in image metadata and build history, which is the wrong pattern for anything secret.

**Fix:** the key is now a BuildKit secret mounted only for the `npm run build` step (`RUN --mount=type=secret,id=maps_key,required=false`). CI passes it with `--secret id=maps_key,env=VITE_GOOGLE_MAPS_API_KEY` (with `DOCKER_BUILDKIT=1`), and Compose uses a build `secrets:` entry. Non-secret settings (`VITE_API_URL`, the Map ID) stay as build args.

**Verification:** built with a fake key, the key appears in the JS bundle (as intended) and **0 times** in `docker image inspect` or `docker history --no-trunc`. With an empty or absent secret, the build succeeds and the bundle contains no key. Tested for plain `docker build`, the CI invocation, and Compose.

**Caveat found while testing:** BuildKit doesn't include secret values in its cache key, so a cached build step can keep an old key. CI is unaffected (every job gets a fresh Docker daemon); locally, rebuild the frontend with `--no-cache` after changing the key (documented in the README).

---

## Application security controls

| Area | Control |
|---|---|
| Authentication | Email + password (BCrypt hashes); stateless JWT (HMAC-SHA, HS256 or stronger depending on key length; 7-day lifetime) sent as `Authorization: Bearer`. The signing secret comes from `JWT_SECRET` (at least 32 characters). |
| Authorization | Ownership checks on every listing mutation (edit, visibility, delete → `403` otherwise) and on reading hidden listings (`404`); participant checks on every conversation, message, and mark-read call. |
| Privacy | Email addresses are only ever returned to their owner. |
| Abuse limits | Rate limits at Nginx and in the backend (see finding 8 above); `429` with `Retry-After`. |
| Browser | CSP and related security headers on every page; `server_tokens off`. |
| Errors | Clients get generic messages; details are logged server-side. |
| Account deletion | Deletes the user's bookmarks, bookmarks others made on their posts, messages and conversations they took part in, their posts, then the user, in one transaction (fixed in v2; it previously failed on foreign keys). |
| Input limits | Every text field is length-limited to its database column (a longer value is a `400`); page sizes are capped at 50. |
| Uploads | Only real JPEG/PNG/GIF/WebP files (checked by magic bytes), stored under random UUID names with an extension derived from the content. Size is capped at 10 MB by both Nginx and Spring. Stored as relative `/uploads/…` paths and served same-origin through Nginx. |
| Library links | Shared PDFs are external links: only `http(s)` URLs are accepted (no `javascript:` or `data:`), they open in a new tab with `noopener,noreferrer`, only the sharer can remove a book, and sharing is rate-limited per user. The share form asks for public-domain or publisher-provided books only. |
| Maps | Pickup pins are optional and user-chosen; the UI tells sellers to pick a public meeting place and never a home address. Coordinates outside valid ranges are discarded server-side. |
| Outbound calls | The mailer is called asynchronously with 10 s connect / 90 s read timeouts, so a slow or unreachable mailer can't tie up request threads or delay chat messages. |
| Secrets in config | No secret has a default value anywhere in the repository; Compose and Spring refuse to start without them. `.env*` files (except the empty `.env.example` templates), keys, certificates, SQL dumps and uploads are git-ignored and excluded from Docker build contexts. |
| Network exposure | Compose publishes every port on `127.0.0.1` only; in Kubernetes, MySQL and the backend are `ClusterIP`. |
| Google Maps key | Browser keys are public by design. It must be **restricted by HTTP referrer** in Google Cloud Console and stored as a **masked** CI/CD variable. Docker builds receive it as a BuildKit secret, never a build arg, so it isn't recorded in image history. |

---

## Known gaps and recommended hardening

Six of the seven gaps listed in the previous review were fixed in the hardening pass above. What remains:

1. **JWT stored in `localStorage`,** which is readable by any script on the page. The CSP now limits which scripts can run, which lowers the risk. Moving to an `HttpOnly` cookie would remove it, but needs CSRF protection in return.
2. **The CSP's Google Maps allowances are unverified,** because no Maps key was configured when it was tested. After setting `VITE_GOOGLE_MAPS_API_KEY`, open a page with a map and check the browser console for "Refused to…" messages.
3. **Rate limits are in-memory, per instance.** That fits the single-replica deployments here; scaling the backend out would need a shared store (e.g. Redis) or edge-only limiting.
4. **Actuator metrics, Prometheus, Alertmanager and Grafana are all unauthenticated or use a single shared admin password**, and none sit behind Nginx. All are bound to `127.0.0.1` only (Compose) or stay inside the cluster (Kubernetes). Keep it that way, or add auth in front of each before exposing the backend directly.
5. **Traffic between the backend and MySQL is unencrypted** (`useSSL=false`). It stays on the private Docker network or inside the cluster; enable TLS if the database ever moves to another host.

---

## Credential management

Credentials are rotated whenever there's reason to believe they may have been exposed or drifted out of sync with what's actually deployed. This has happened a small number of times over the project's history. Each time, the response was: revoke the old credential, issue a new one, update every place that references it (GitLab CI/CD variables and/or the relevant Kubernetes Secret), and verify that the new credential works before considering it resolved.

**Verification method used for Kubernetes registry credentials:** a direct, tool-independent check against GitLab's own token endpoint, used to confirm a credential is valid before assuming a pull failure is caused by something else:
```bash
curl -u "<username>:<password>" \
  "https://gitlab.com/jwt/auth?service=container_registry&scope=repository:saifexd-group/ktebna/backend:pull"
```
A `200` response with a `token` field confirms the credential and scope are valid.

**Where credentials live:**
- **Kubernetes:** Secret objects (`mysql-secret`, `backend-secret`, `gitlab-registry`), injected as environment variables at pod startup
- **GitLab CI/CD:** protected/masked CI/CD variables (`SONAR_TOKEN`, optionally `VITE_GOOGLE_MAPS_API_KEY`), never committed to the repository
- **Local development:** git-ignored `.env` files (repo root for Compose and the backend, `ktebna/.env` for Vite)

**Current status:** all credentials in active use have been rotated and verified; no known outstanding exposures.

---

## What the gates catch, and what they don't

Automated scanning (SAST, secret scanning, dependency/image scanning) covers a specific, valuable category of risk, but it isn't a substitute for testing the deployed application. Two examples from this project:

- A JavaScript reference error that only showed up when the app was opened in a browser passed every automated gate cleanly.
- The 1 MB Nginx upload limit passed every gate and every local test, and was only caught by an end-to-end upload through the real Docker stack.

Automated gates and manual end-to-end testing are complementary, not interchangeable. Since 21 Sep 2026 the security behaviour verified by hand (the 18-check attack script) is also encoded as backend tests, so it's re-checked on every push. Writing them found one more bug: requests without a valid login got `403` instead of `401`, so the frontend never cleared an expired token. Fixed with a 401 authentication entry point.
