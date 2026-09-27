# Kubernetes Deployment

These manifests deploy Ktebna to the local Docker Desktop cluster:

- MySQL with a persistent volume (`Recreate` strategy: the old pod stops before the new one starts, since two MySQL instances can't share one data volume)
- Spring Boot backend (runs as uid 10001), storing uploaded images in Garage
- Garage, S3-compatible object storage for the uploaded images (single node, private bucket, non-root, read-only filesystem)
- Nightly backups of the database and of the uploaded images, each to its own volume
- React/nginx frontend (non-root nginx on port 8080; proxies `/api` and `/uploads` to the backend)
- Cluster services for MySQL and backend
- A LoadBalancer service for the frontend (port 80 → 8080)

## 1. Create the secrets (required, once)

No credentials are committed to this repository. The Deployments read them from three Secrets that you create yourself. The backend refuses to start with a missing, short, or publicly known JWT secret.

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

# Garage: its internal secret, and the key the backend uses for the uploads bucket
kubectl create secret generic garage-secret   --namespace ktebna   --from-literal=rpc-secret="$(openssl rand -hex 32)"   --from-literal=access-key="GK$(openssl rand -hex 16)"   --from-literal=secret-key="$(openssl rand -hex 32)"
```

Garage creates the `ktebna-uploads` bucket and grants that key access on its first start. The key only works for Garage's S3 API inside the cluster; the bucket is private, and browsers get images through the backend's `/uploads/` endpoint.

To rotate a value later, re-create the Secret with `--dry-run=client -o yaml | kubectl apply -f -` and restart the affected Deployment. MySQL only reads its passwords when the data volume is first initialised, so for the database passwords run `ALTER USER` inside MySQL **first**, then update the Secret, then restart `mysql` (its readiness check uses the root password) and `backend`.

## 2. Load the images

The cluster runs the images CI built, scanned and published on `main`. The local node can't pull from the GitLab registry itself (see the main README's Known issues), so the host pulls them and copies them into the node:

```sh
docker login registry.gitlab.com     # once; a personal access token with read_registry
scripts/k8s-load-images.sh <tag>     # 8-character short SHA of a green main pipeline
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

## Moving existing uploads into Garage (once)

Clusters that stored images on the old `backend-uploads` volume copy them into Garage once, after `garage.yaml` is applied and the `garage` pod is Ready:

```sh
kubectl apply -f k8s/jobs/garage-import-uploads.yaml
kubectl -n ktebna logs -f job/garage-import-uploads     # "Transferred: N / N, 100%"
```

The job mounts the old volume read-only and never deletes anything, so it is safe to re-run. Check that covers and avatars load in the app; to go back, set `STORAGE_TYPE` to `disk` in `backend.yaml` and re-apply. The old volume can be removed once the Garage copy has been checked.

## Backups

`mysql-backup.yaml` dumps the `ktebna` database every night at 02:00 (Africa/Tunis) to the `mysql-backups` volume and keeps the 7 newest files. If the cluster was off at 02:00, the backup runs once when it comes back (within 24 h). The job uses the app's own database user, runs as non-root with a read-only filesystem, and only renames a dump to `ktebna-<UTC time>.sql.gz` once it is complete.

```sh
# Run a backup now and read its output
kubectl create job -n ktebna --from=cronjob/mysql-backup mysql-backup-manual
kubectl logs -n ktebna job/mysql-backup-manual
kubectl delete job -n ktebna mysql-backup-manual

# Copy the newest backup to this PC (backups/, git-ignored)
./scripts/k8s-pull-backup.sh
```

The volume lives inside the cluster, so it protects against bad data or a bad migration but not against a cluster reset ("Reset Kubernetes" in Docker Desktop). Copy a backup to the PC regularly and before any risky change.

To restore, stop the backend so nothing writes during the restore, load the dump, then start the backend again:

```sh
kubectl scale deploy/backend -n ktebna --replicas=0
gzip -dc backups/k8s-ktebna-<time>.sql.gz | kubectl exec -i -n ktebna deploy/mysql -- \
  sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"'
kubectl scale deploy/backend -n ktebna --replicas=1
```

The dump includes `DROP TABLE IF EXISTS`, so it replaces the current tables with the backed-up ones.

### Uploaded images

`garage-backup.yaml` backs up the Garage bucket every night at 02:30 (after the database) to the `garage-backups` volume, with the same catch-up rule. Uploads never change once written, so it keeps one mirror (`current/`) instead of seven full copies, plus every image removed from Garage since the previous run, in `deleted/<UTC time>/`, for 7 days. A database dump from any of the last 7 days therefore still finds all of its images. Like the database volume, it does not survive a cluster reset.

```sh
# Run an image backup now and read its output
kubectl create job -n ktebna --from=cronjob/garage-backup garage-backup-manual
kubectl logs -n ktebna job/garage-backup-manual       # "Mirror: N files; ..."
kubectl delete job -n ktebna garage-backup-manual

# Put the backed-up images back into Garage (adds what is missing, deletes nothing)
kubectl apply -f k8s/jobs/garage-restore-uploads.yaml
kubectl logs -n ktebna -f job/garage-restore-uploads
kubectl delete job -n ktebna garage-restore-uploads
```

After restoring a database dump from an earlier day, also run the restore job: the images that dump refers to are in `current/` or, if removed since, in `deleted/`. To bring back such an image, copy it from `deleted/<time>/` into Garage the same way (change the job's source path to that folder).

## Notes

- The frontend reads `VITE_API_URL` and `VITE_GOOGLE_MAPS_*` at Docker **build** time, not at container runtime. Leave `VITE_API_URL` empty so the browser calls its own origin and nginx proxies `/api`.
- MySQL and the backend are `ClusterIP` services and are not reachable from outside the cluster; only the frontend is exposed.
- The cluster has its own database, separate from Docker Compose and XAMPP.
