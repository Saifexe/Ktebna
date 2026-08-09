# Security

This document covers Ktebna's security gate configuration and credential management practices.

---

## Security Gates

Four automated gates run on every push to `main`, enforced through GitLab CI/CD, all currently passing:

| Gate | Tool | What it catches | Blocking? |
|---|---|---|---|
| Static Application Security Testing (SAST) | SonarCloud | Code quality issues, security hotspots, code smells | Non-blocking (`allow_failure: true`) |
| Secret scanning | Gitleaks | Credentials, tokens, keys committed to git history | **Blocking** (`allow_failure: false`) |
| Filesystem vulnerability scanning | Trivy | Known CVEs in backend dependencies (offline scan) | Non-blocking for LOW/MEDIUM, would block on HIGH/CRITICAL |
| Container image vulnerability scanning | Trivy | Known CVEs in built Docker images (both backend and frontend) | Non-blocking for LOW/MEDIUM, would block on HIGH/CRITICAL |

Gitleaks is intentionally the one hard-blocking gate — a leaked secret is treated as requiring immediate rotation, not a warning to review later.

---

## Credential Management

Credentials are rotated whenever there's reason to believe they may have been exposed or drifted out of sync with what's actually deployed. This has happened a small number of times over the project's history — each time, the response was: revoke the old credential, issue a new one, update every place that references it (GitLab CI/CD variables and/or the relevant Kubernetes Secret), and verify the new credential works before considering it resolved.

**Verification method used for Kubernetes registry credentials** — a direct, tool-independent check against GitLab's own token endpoint, used to confirm a credential is valid before assuming a pull failure is caused by something else:
```bash
curl -u "<username>:<password>" \
  "https://gitlab.com/jwt/auth?service=container_registry&scope=repository:saifexd-group/ktebna/backend:pull"
```
A `200` response with a `token` field confirms the credential and scope are valid.

**Where credentials live:**
- **Kubernetes** — Secret objects (`mysql-secret`, `backend-secret`, `gitlab-registry`), injected as environment variables at pod startup
- **GitLab CI/CD** — protected/masked CI/CD variables, never committed to the repository
- **Local development** — a git-ignored `.env` file, used only by Docker Compose

**Current status:** all credentials in active use have been rotated and verified; no known outstanding exposures.

---

## What the Gates Catch, and What They Don't

Automated scanning (SAST, secret scanning, dependency/image scanning) covers a specific, valuable category of risk — but it isn't a substitute for actually testing the deployed application. One runtime bug in this project's history (a JavaScript reference error only visible when the app was opened in a browser) passed every automated gate cleanly, because none of the four tools above validate runtime behavior. It's a useful, concrete reminder that automated gates and manual end-to-end testing are complementary, not interchangeable.
