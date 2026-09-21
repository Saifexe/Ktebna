# Security Gates

This project uses GitLab CI/CD to run automated quality and security checks before Docker images are considered ready.

## Current Pipeline Gates

| Stage | Job | Tool | Purpose | Current behavior |
| --- | --- | --- | --- | --- |
| `test` | `backend-test` | Maven | Runs backend tests | Fails on test errors |
| `test` | `frontend-lint` | ESLint | Checks frontend code quality | Fails on lint errors |
| `sonarcloud` | `sonarcloud-check` | SonarCloud | Static code analysis | Advisory, allowed to fail |
| `security` | `gitleaks` | Gitleaks | Detects committed secrets | Fails on detected secrets |
| `security` | `trivy-fs-backend` | Trivy FS | Scans backend dependencies/filesystem | Advisory, allowed to fail |
| `build` | `build-backend` | Docker | Builds and pushes backend image | Fails on build/push errors |
| `build` | `build-frontend` | Docker | Builds and pushes frontend image | Fails on build/push errors |
| `scan` | `trivy-backend-image` | Trivy image | Scans backend Docker image | Advisory, allowed to fail |
| `scan` | `trivy-frontend-image` | Trivy image | Scans frontend Docker image | Advisory, allowed to fail |

## Vulnerability Severity Policy

Trivy scans are split into two severity levels:

- `LOW` and `MEDIUM` findings are logged with `--exit-code 0`.
- `HIGH` and `CRITICAL` findings return a failing command with `--exit-code 1`.

At the moment, Trivy jobs are marked with `allow_failure: true`, so they report security risk without blocking the full pipeline. This keeps development moving while the security baseline is still being stabilized.

## Target Enforcement Policy

The intended production gate is:

- Secret leaks must block the pipeline.
- Test and lint failures must block the pipeline.
- Docker build failures must block the pipeline.
- `HIGH` and `CRITICAL` vulnerabilities in release images should block deployment.
- `LOW` and `MEDIUM` vulnerabilities should be tracked and reviewed, but should not block development builds.

## Validation Notes

**Latest validation: 21 Sep 2026 (v2 release)**

| Check | Result |
| --- | --- |
| GitLab pipeline on `main` (`bb09eb8`) | Passed |
| Backend image (`eclipse-temurin:17-jre-jammy` + `backend.jar`) | Builds; **0 HIGH / 0 CRITICAL** (68 LOW/MEDIUM in the OS base, 4 MEDIUM in the jar) |
| Frontend image (`nginx:1.30.4-alpine3.24` + static build) | Builds; **0 HIGH / 0 CRITICAL**, 0 LOW/MEDIUM |
| Docker Compose stack (mysql, backend, frontend, prometheus, grafana) | All five containers up; backend `/actuator/health` = `UP`; Prometheus target `ktebna-backend` = `up`; Grafana healthy |
| End-to-end through Nginx | SPA routes, `/api` proxying, sign-up, listing with a 1.98 MB photo, messaging, unread counts, and account deletion all verified |

Local scans used Trivy 0.74.0 with the same flags as CI (`--severity HIGH,CRITICAL --exit-code 1`).

The first v2 pipeline (`f421805`) raised warnings on both image scans: 3 CRITICAL in the embedded Tomcat and 7 HIGH in Alpine `libuuid`. Both were fixed in `bb09eb8`; see the remediation log in [SECURITY.md](../SECURITY.md#vulnerability-remediation-log).

Before switching Trivy image scans from advisory to blocking, confirm the full GitLab image scans complete reliably for both images over several pipelines. New CVEs are published continuously, so a previously clean image can start warning without any code change.

## Handling a Trivy Warning

1. **Find the component.** Open the failed job log and note each HIGH/CRITICAL finding's *Library*, *Installed Version*, and *Fixed Version*. To reproduce locally without the registry, scan the public base image (`trivy image <base>`) and the build output (`trivy rootfs <dir with backend.jar>`) separately.
2. **Pick the smallest fix:**
   - *OS package in a base image:* bump the base image tag, or rely on the existing `apk upgrade` (frontend) step.
   - *Java library managed by Spring Boot:* upgrade Spring Boot if a patch release exists; otherwise override that library's version property in `backend/pom.xml` (for example `tomcat.version`) with a comment explaining when to remove it.
   - *Direct dependency:* bump it in `pom.xml` or `package.json`.
3. **Verify:** rebuild, re-run the scan with `--exit-code 1`, and boot the service to confirm nothing regressed.
4. **Record it** in the SECURITY.md remediation log: finding, root cause, fix, and verification.
