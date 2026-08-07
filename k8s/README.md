# Kubernetes Deployment

These manifests provide a first deployment baseline for Ktebna:

- MySQL with a persistent volume
- Spring Boot backend with persistent uploads
- React/nginx frontend
- Cluster services for MySQL and backend
- A LoadBalancer service for the frontend

## Apply

```sh
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

## Verify

```sh
kubectl get pods -n ktebna
kubectl get svc -n ktebna
```

## Important Configuration

Replace the placeholder secret values before using this outside a demo cluster:

```sh
kubectl create secret generic mysql-secret \
  --namespace ktebna \
  --from-literal=mysql-password='<password>' \
  --from-literal=mysql-root-password='<root-password>' \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic backend-secret \
  --namespace ktebna \
  --from-literal=jwt-secret='<long-random-jwt-secret>' \
  --dry-run=client -o yaml | kubectl apply -f -
```

The frontend reads `VITE_API_URL` at Docker build time, not at container runtime. In GitLab CI, set `VITE_API_URL` to the public backend URL before building the frontend image for Kubernetes.
