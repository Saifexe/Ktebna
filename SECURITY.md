# Security

This document covers Ktebna's security gate configuration and the full incident history from this project's DevSecOps work. The incidents below are included deliberately, in full, rather than summarized away — they demonstrate the actual value of the gates and processes this project set out to build, not just their theoretical existence.

---

## Security Gates

Four automated gates run on every push to `main`, enforced through GitLab CI/CD:

| Gate | Tool | What it catches | Blocking? |
|---|---|---|---|
| Static Application Security Testing (SAST) | SonarCloud | Code quality issues, security hotspots, code smells | Non-blocking (`allow_failure: true`) |
| Secret scanning | Gitleaks | Credentials, tokens, keys committed to git history | **Blocking** (`allow_failure: false`) |
| Filesystem vulnerability scanning | Trivy | Known CVEs in backend dependencies (offline scan) | Non-blocking for LOW/MEDIUM, would block on HIGH/CRITICAL |
| Container image vulnerability scanning | Trivy | Known CVEs in built Docker images (both backend and frontend) | Non-blocking for LOW/MEDIUM, would block on HIGH/CRITICAL |

Gitleaks is intentionally the one hard-blocking gate — a leaked secret is treated as an incident requiring immediate action (see below), not a warning to review later.

### A known gap
None of the four gates above caught the earliest bug in this project's history — a missing `framer-motion` import that caused a runtime crash (`ReferenceError: motion is not defined`) only visible when the deployed app was actually opened in a browser. This is expected: `no-unused-vars`-style linting and SAST tools generally don't validate that every referenced global actually resolves at runtime, especially inside JSX. It's a useful, concrete example that automated gates catch a specific category of problem (known vulnerability patterns, leaked secrets, code smells) and are not a substitute for actually running and testing the deployed application end-to-end.

---

## Credential Incident History

Three separate credential-handling incidents occurred over the course of this project. All three were caught, addressed, and used to establish better practices going forward — the record is kept here in full rather than condensed, since the diagnostic process itself is representative of real incident response.

### Incident 1 — GitLab Deploy Token pasted in plaintext (first occurrence)
A GitLab Deploy Token (`gitlab+deploy-token-15032344`) was pasted in full plaintext into a chat session during `docker login` testing.
**Response:** old token revoked in GitLab, new token generated.

### Incident 2 — GitLab Deploy Token pasted in plaintext (second occurrence)
A newly rotated deploy token (username `gitlab+deploy-token-15033301`) was pasted in full plaintext into chat multiple times during a separate debugging session, while diagnosing an unrelated Docker config encoding issue.
**Response:** old token revoked, new token created (`read_registry` scope), the `gitlab-registry` Kubernetes Secret recreated with the new credentials, and both `backend` and `frontend` Deployments confirmed pulling successfully afterward.

**Practice established after these two incidents:** prefer masked views (GitLab's Variables list view shows `••••••`) over raw values when sharing debug output; avoid pasting `kubectl create secret` or `docker login` commands with real values filled in; redact response bodies even when testing token validity directly against an API.

### Incident 3 — Deploy token / Kubernetes Secret drift (credential rotation, not exposure)
During later Kubernetes deployment work, `kubectl set image` began failing with `401 Unauthorized` on image pulls, despite the deploy token appearing valid and unexpired in GitLab's UI. This was not a leaked-secret incident — no credential was exposed — but a **silent drift** between the token GitLab considered current and the credentials actually stored in the cluster's `gitlab-registry` Secret.

**Diagnosis method:** rather than guessing, the credential was verified directly against GitLab's own token-issuing endpoint, independent of Docker or Kubernetes entirely:
```bash
curl -u "<username>:<password>" \
  "https://gitlab.com/jwt/auth?service=container_registry&scope=repository:saifexd-group/ktebna/backend:pull"
```
A `200` response with a `token` field in the body proves the credential and scope are valid, isolating the problem to whichever layer (Docker's local config, or the Kubernetes Secret) is actually failing. This test returned `401` for the stored Secret's credentials and `200` for a freshly-rotated token — confirming the drift.

**Response:** old token revoked, new token created (`ktebna-k8s-pull-token`, `read_registry` scope), the `gitlab-registry` Secret recreated, and the new credential re-verified with the same direct check before being wired back into the cluster.

**Note:** this exact drift (token valid in GitLab, but the cluster's stored Secret out of sync with it) has now happened twice across this project's history, under slightly different circumstances each time. It is treated as a recurring risk rather than a one-off, and re-verifying the Secret against a direct GitLab check — rather than assuming it still matches the visible token — is now standard practice before troubleshooting any image-pull failure on this project.

### `SONAR_TOKEN` exposure
The SonarCloud analysis token was exposed in chat on two separate occasions (once pasted directly, once visible in a GitLab variable-edit panel screenshot).
**Response:** regenerated in SonarCloud, updated in GitLab CI/CD variables, verified via a subsequent green pipeline run.

---

## Where Credentials Actually Live

For clarity, since this has been a recurring point of confusion during the project:

- **No `.env` file is involved in the Kubernetes deployment.** `.env` is used only for local Docker Compose and is git-ignored.
- **In Kubernetes**, credentials live as Secret objects (`mysql-secret`, `backend-secret`, `gitlab-registry`), base64-encoded (not encrypted by default on this local cluster) and injected into containers as environment variables at pod startup.
- **In GitLab CI/CD**, credentials live as protected/masked CI/CD variables (Settings → CI/CD → Variables) — never in a file in the repository.
- **On the local development host**, Docker's registry credentials live in `~/.docker/config.json`, managed via Docker Desktop's credential helper.

---

## Current Status

As of the most recent update: no outstanding credential exposures. All credential verification during recent work was performed by having values typed and checked locally, with only HTTP status codes (not secret values) shared for diagnosis — a pattern that should continue.
