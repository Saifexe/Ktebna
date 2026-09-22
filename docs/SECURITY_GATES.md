# Security Gates

This project uses GitLab CI/CD to run automated quality and security checks before Docker images are considered ready.

## Current Pipeline Gates

| Stage | Job | Tool | Purpose | Current behavior |
| --- | --- | --- | --- | --- |
| `test` | `backend-test` | Maven + Testcontainers | 63 unit and integration tests against a real MySQL 8, including security regression tests (auth, ownership, privacy, rate limits, upload validation); publishes JUnit + JaCoCo coverage | Fails on any test failure |
| `test` | `frontend-lint` | ESLint | Checks frontend code quality | Fails on lint errors |
| `sonarcloud` | `sonarcloud-check` | SonarCloud | Static code analysis | Advisory, allowed to fail |
| `security` | `gitleaks` | Gitleaks v8.30.1 | Detects secrets in the working tree and the full git history | Fails on detected secrets |
| `security` | `trivy-fs-backend` | Trivy 0.74.0 FS | Scans backend (Maven) dependencies | Fails on fixable HIGH/CRITICAL |
| `security` | `trivy-fs-frontend` | Trivy 0.74.0 FS | Scans frontend (npm) dependencies | Fails on fixable HIGH/CRITICAL |
| `build` | `build-backend` | Docker | Builds backend image, saves it as an artifact (no push) | Fails on build errors |
| `build` | `build-frontend` | Docker | Builds frontend image, saves it as an artifact (no push) | Fails on build errors |
| `scan` | `trivy-backend-image` | Trivy image | Scans the saved backend image | Fails on fixable HIGH/CRITICAL |
| `scan` | `trivy-frontend-image` | Trivy image | Scans the saved frontend image | Fails on fixable HIGH/CRITICAL |
| `publish` | `publish-backend` | Docker | Pushes the scanned backend image to the registry | Runs only if its scan passed |
| `publish` | `publish-frontend` | Docker | Pushes the scanned frontend image to the registry | Runs only if its scan passed |

## Vulnerability Severity Policy

Trivy scans are split into two severity levels:

- `LOW` and `MEDIUM` findings are logged with `--exit-code 0`.
- `HIGH` and `CRITICAL` findings return a failing command with `--exit-code 1`.

Trivy jobs block the pipeline. Each one runs twice:

- A report pass over every severity with `--exit-code 0`. It never fails and keeps LOW/MEDIUM and unfixed findings visible in the job log.
- A gate pass with `--severity HIGH,CRITICAL --ignore-unfixed --exit-code 1`, which fails the job on any HIGH/CRITICAL finding that has a fixed version.

Findings with no fix yet don't block, because upgrading can't remediate them. Blocking on them would leave the pipeline stuck with no possible action.

Images are pushed to the registry only in the `publish` stage, after their own scan passed. The build stage only saves them as job artifacts, and `publish` pushes that same artifact.

## Target Enforcement Policy

The intended production gate is:

- Secret leaks must block the pipeline.
- Test and lint failures must block the pipeline.
- Docker build failures must block the pipeline.
- `HIGH` and `CRITICAL` vulnerabilities in release images should block deployment.
- `LOW` and `MEDIUM` vulnerabilities should be tracked and reviewed, but should not block development builds.

## Validation Notes

**Latest validation: 22 Sep 2026 (input-validation fixes and database-backed Library)**

| Check | Result |
| --- | --- |
| GitLab pipeline #2872104317 on `main` (`a1e79d1`) | **All 12 jobs passed** in 10 min 2 s: 76 backend tests, lint, SonarCloud, Gitleaks, both Trivy FS gates, both Trivy image gates (blocking), and both images published |
| Docker Compose stack | Rebuilt backend and frontend; uploads served through Nginx at `/uploads/`; no CSP errors in the browser; Library pages verified in the browser |

**Previous validation: 21 Sep 2026 (v2 release)**

| Check | Result |
| --- | --- |
| GitLab pipeline #2868466261 on `main` (`2a24f62`) | **All 9 jobs passed, none advisory-failed**: first run with Gitleaks scanning the full history (`GIT_DEPTH: 0`) and with pinned scanner images; both Trivy image scans clean in CI (5 min 23 s) |
| Backend image (`eclipse-temurin:17-jre-jammy` + `backend.jar`) | Builds; **0 HIGH / 0 CRITICAL** (68 LOW/MEDIUM in the OS base, 4 MEDIUM in the jar) |
| Frontend image (`nginx:1.30.4-alpine3.24` + static build) | Builds; **0 HIGH / 0 CRITICAL**, 0 LOW/MEDIUM |
| Docker Compose stack (mysql, backend, frontend, prometheus, grafana) | All five containers up; backend `/actuator/health` = `UP`; Prometheus target `ktebna-backend` = `up`; Grafana healthy |
| End-to-end through Nginx | SPA routes, `/api` proxying, sign-up, listing with a 1.98 MB photo, messaging, unread counts, and account deletion all verified |

Local scans used Trivy 0.74.0 with the same flags as CI (`--severity HIGH,CRITICAL --exit-code 1`).

The first v2 pipeline (`f421805`) raised warnings on both image scans: 3 CRITICAL in the embedded Tomcat and 7 HIGH in Alpine `libuuid`. Both were fixed in `bb09eb8`; see the remediation log in [SECURITY.md](../SECURITY.md#vulnerability-remediation-log).

**22 Sep 2026 (local only, not yet re-validated in CI):** added Alertmanager as a sixth Compose service, plus a Prometheus rule file (`monitoring/prometheus/alerts.yml`, 8 rules) and an expanded Grafana dashboard. Verified locally: all 8 rules load with `health: ok` and sit `inactive` under normal load, and Prometheus discovers `alertmanager:9093` as an active Alertmanager target. Not yet verified that a rule actually transitions to `firing` under a real breach, and not yet run through a GitLab pipeline.

**22 Sep 2026: Trivy switched from advisory to blocking.** Before the switch, the same Trivy 0.74.0 commands were run locally:

- Backend dependencies: 0 HIGH/CRITICAL.
- Frontend dependencies: 40 HIGH/CRITICAL, all fixable. These were fixed first; see the remediation log in [SECURITY.md](../SECURITY.md#vulnerability-remediation-log).
- Both rebuilt images, scanned from saved `.tar.gz` files as the pipeline now does: 0 HIGH/CRITICAL.

The first GitLab pipeline with the new stages (`0c8a003`) passed: all 12 jobs green across 6 stages, including both blocking image scans and both `publish` jobs.

New CVEs are published continuously, so a pipeline can turn red with no code change. That is intended: the fix is to upgrade the flagged component. If a finding has to be accepted temporarily, add it to a `.trivyignore` with a comment giving the reason and a review date.

## Handling a Trivy Warning

1. **Find the component.** Open the failed job log and note each HIGH/CRITICAL finding's *Library*, *Installed Version*, and *Fixed Version*. To reproduce locally without the registry, scan the public base image (`trivy image <base>`) and the build output (`trivy rootfs <dir with backend.jar>`) separately.
2. **Pick the smallest fix:**
   - *OS package in a base image:* bump the base image tag, or rely on the existing `apk upgrade` (frontend) step.
   - *Java library managed by Spring Boot:* upgrade Spring Boot if a patch release exists; otherwise override that library's version property in `backend/pom.xml` (for example `tomcat.version`) with a comment explaining when to remove it.
   - *Direct dependency:* bump it in `pom.xml` or `package.json`.
3. **Verify:** rebuild, re-run the scan with `--exit-code 1`, and boot the service to confirm nothing regressed.
4. **Record it** in the SECURITY.md remediation log: finding, root cause, fix, and verification.
