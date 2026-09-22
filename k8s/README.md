# Kubernetes Deployment

These manifests deploy Ktebna to the local Docker Desktop cluster:

- MySQL with a persistent volume (`Recreate` strategy: the old pod stops before the new one starts, since two MySQL instances can't share one data volume)
- Spring Boot backend with persistent uploads (runs as uid 10001; `fsGroup` makes the uploads volume writable)
- React/nginx frontend (non-root nginx on port 8080; proxies `/api` and `/uploads` to the backend)
- Cluster services for MySQL and backend
- A LoadBalancer service for the frontend (port 80 → 8080)

## 1. Create the secrets (required, once)

No credentials are committed to this repository. The Deployments read them from two Secrets that you create yourself. The backend refuses to start with a missing, short, or publicly known JWT secret.

```sh
kubectl apply -f k8s/namespace.yaml

# Database credentials: generate strong random values
kubectl create secret generic mysql-secret \
  --namespace ktebna \
  --from-literal=mysql-password="$(openssl rand -base64 24)" \
  --from-literal=mysql-root-password="$(openssl rand -base64 24)"

# JWT signing key: at least 32 random characters
kubectl create secret generic backend-secret \
  --namespace ktebna \
  --from-literal=jwt-secret="$(openssl rand -base64 48)"
```

To rotate a value later, re-create the Secret with `--dry-run=client -o yaml | kubectl apply -f -` and restart the affected Deployment. MySQL only reads its passwords when the data volume is first initialised, so for the database passwords run `ALTER USER` inside MySQL **first**, then update the Secret, then restart `mysql` (its readiness check uses the root password) and `backend`.

## 2. Load the images

The local node can't pull from the GitLab registry (see the main README's Known issues), so the images built by Docker Compose are copied straight into the node:

```sh
docker compose build backend frontend
scripts/k8s-load-images.sh <tag>     # e.g. the short commit SHA
```

The `image:` tag in `backend.yaml` and `frontend.yaml` must match `<tag>`. They use `imagePullPolicy: Never`, so a tag that was never loaded fails with `ErrImageNeverPull` instead of trying the broken registry pull.

## 3. Apply

```sh
kubectl apply -f k8s/
```

The manifests contain no Secret objects, so re-applying them never overwrites your credentials.

## 4. Verify

```sh
kubectl get pods -n ktebna                       # all 1/1 Running
kubectl port-forward -n ktebna svc/frontend 8081:80
```

Then open http://localhost:8081. The backend only becomes Ready once `/actuator/health` reports the app **and** its database as UP.

## Notes

- The frontend reads `VITE_API_URL` and `VITE_GOOGLE_MAPS_*` at Docker **build** time, not at container runtime. Leave `VITE_API_URL` empty so the browser calls its own origin and nginx proxies `/api`.
- MySQL and the backend are `ClusterIP` services and are not reachable from outside the cluster; only the frontend is exposed.
- The cluster has its own database, separate from Docker Compose and XAMPP.
