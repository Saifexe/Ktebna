# Security

This document covers Ktebna's security gates, vulnerability remediation history, application-level security controls, and credential management practices. The per-job pipeline policy lives in **[docs/SECURITY_GATES.md](./docs/SECURITY_GATES.md)**.

**Last reviewed:** 21 Sep 2026 (v2 release, commit `bb09eb8` and follow-ups). Pipeline green; both release images report **0 HIGH / 0 CRITICAL** vulnerabilities.

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
| Unit tests / lint | Maven, ESLint | Build breaks, lint errors | **Blocking** |
| Static Application Security Testing (SAST) | SonarCloud | Code quality issues, security hotspots, code smells | Non-blocking (`allow_failure: true`) |
| Secret scanning | Gitleaks (`--no-git`) | Credentials, tokens, keys present in the checked-out files | **Blocking** |
| Filesystem vulnerability scanning | Trivy FS | Known CVEs in backend dependencies (offline DB) | Non-blocking; job fails on HIGH/CRITICAL and shows as a warning |
| Container image vulnerability scanning | Trivy image | Known CVEs in the built backend and frontend images | Non-blocking; job fails on HIGH/CRITICAL and shows as a warning |

Gitleaks is intentionally the one hard-blocking *security* gate: a leaked secret is treated as requiring immediate rotation, not a warning to review later.

A Trivy job showing **"Failed" with a warning icon** means the job found HIGH/CRITICAL findings, not that the pipeline broke. It is treated as a ticket to fix promptly (see the log below), not something to ignore.

---

## Vulnerability remediation log

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

---

## Application security controls

| Area | Control |
|---|---|
| Authentication | Email + password (BCrypt hashes); stateless JWT (HMAC-SHA, HS256 or stronger depending on key length; 7-day lifetime) sent as `Authorization: Bearer`. The signing secret comes from `JWT_SECRET` (at least 32 characters). |
| Authorization | Ownership checks on every listing mutation (edit, visibility, delete → `403` otherwise); participant checks on every conversation, message, and mark-read call. |
| Account deletion | Deletes the user's bookmarks, bookmarks others made on their posts, messages and conversations they took part in, their posts, then the user, in one transaction (fixed in v2; it previously failed on foreign keys). |
| Uploads | Stored under random UUID file names, never the client's name. Size is capped at 10 MB by both Nginx and Spring. |
| Maps | Pickup pins are optional and user-chosen; the UI tells sellers to pick a public meeting place and never a home address. Coordinates outside valid ranges are discarded server-side. |
| Outbound calls | The mailer is called asynchronously with 10 s connect / 90 s read timeouts, so a slow or unreachable mailer can't tie up request threads or delay chat messages. |
| Secrets in config | `.env` files are git-ignored; `.env.example` holds empty placeholders; database dumps (`backups/`) are git-ignored because they contain emails and password hashes. |
| Google Maps key | Browser keys are public by design. It must be **restricted by HTTP referrer** in Google Cloud Console and stored as a **masked** CI/CD variable. |

---

## Known gaps and recommended hardening

These are known, not yet addressed, and ordered roughly by value:

1. **Private listings are readable by id.** `GET /api/posts/{id}` returns hidden posts to anyone who knows the id; only the frontend hides them. Return `404` unless the caller is the owner.
2. **CORS is fully open with credentials** (`allowedOriginPatterns("*")`). Restrict it to the real frontend origin(s).
3. **No rate limiting** on `/api/auth/login`, `/api/auth/register`, or `/api/messages`. Add throttling at Nginx or with a filter.
4. **No browser security headers** (CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame protection) on the Nginx site. Add them; the CSP must allow Google Fonts and, if enabled, Google Maps.
5. **JWT stored in `localStorage`,** which is readable by any script on the page. It is acceptable for this project's threat model; move to an `HttpOnly` cookie if XSS risk grows.
6. **Upload content isn't validated.** Only size and emptiness are checked; check that files really are images (magic bytes) before storing.
7. **`GET /api/users/{id}` returns email addresses** to any authenticated user. Drop the email from public user lookups.

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

Automated gates and manual end-to-end testing are complementary, not interchangeable.
