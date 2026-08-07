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

Local validation confirmed:

- Backend Docker image builds successfully.
- Frontend Docker image builds successfully.
- Frontend Trivy image scan reports `0` HIGH/CRITICAL vulnerabilities.
- Backend OS-level Trivy image scan reports `0` HIGH/CRITICAL vulnerabilities.

Before switching Trivy image scans from advisory to blocking, confirm the full GitLab image scans complete reliably for both backend and frontend images.
