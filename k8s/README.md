# Kubernetes Deployment

These manifests provide a first deployment baseline for Ktebna:

- MySQL with a persistent volume
- Spring Boot backend with persistent uploads
- React/nginx frontend
- Cluster services for MySQL and backend
- A LoadBalancer service for the frontend

## 1. Create the secrets (required, once)

No credentials are committed to this repository. The Deployments read them from three Secrets that you create yourself. The backend refuses to start without a valid JWT secret.

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

# Registry pull secret, from a GitLab Deploy Token with read_registry scope
kubectl create secret docker-registry gitlab-registry \
  --namespace ktebna \
  --docker-server=registry.gitlab.com \
  --docker-username='<deploy-token-username>' \
  --docker-password='<deploy-token>'
```

To rotate a value later, re-create the Secret with `--dry-run=client -o yaml | kubectl apply -f -` and restart the affected Deployment. Keep in mind that MySQL only reads its passwords when the data volume is first initialised; after that, change them with `ALTER USER` as well.

## 2. Apply

```sh
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

The manifests contain no Secret objects, so re-applying them never overwrites your credentials.

## 3. Verify

```sh
kubectl get pods -n ktebna
kubectl get svc -n ktebna
```

## Notes

- The frontend reads `VITE_API_URL` and `VITE_GOOGLE_MAPS_*` at Docker **build** time, not at container runtime. In GitLab CI, set them as CI/CD variables before the frontend image is built.
- MySQL and the backend are `ClusterIP` services and are not reachable from outside the cluster; only the frontend is exposed.
