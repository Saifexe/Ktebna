#!/usr/bin/env bash
# Copies the newest Kubernetes database backup to this PC (backups/, git-ignored),
# so a copy survives even if the cluster is reset.
#
# The backup volume is only mounted while a backup runs, so this starts a
# short-lived read-only helper pod on it, copies the file, and deletes the pod.
#
#   ./scripts/k8s-pull-backup.sh
set -euo pipefail
# Git Bash on Windows would rewrite "/backups/..." into a Windows path.
export MSYS_NO_PATHCONV=1

root="$(cd "$(dirname "$0")/.." && pwd)"
dest="$root/backups"
ns=ktebna
pod=backup-reader

mkdir -p "$dest"
trap 'kubectl delete pod "$pod" -n "$ns" --ignore-not-found --wait=false >/dev/null' EXIT

kubectl apply -n "$ns" -f - >/dev/null <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: $pod
spec:
  restartPolicy: Never
  automountServiceAccountToken: false
  activeDeadlineSeconds: 300
  securityContext:
    runAsNonRoot: true
    runAsUser: 999
    runAsGroup: 999
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: reader
      image: mysql:8.0
      command: ["sleep", "300"]
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      resources:
        requests: { cpu: 10m, memory: 16Mi }
        limits: { memory: 64Mi }
      volumeMounts:
        - name: backups
          mountPath: /backups
          readOnly: true
  volumes:
    - name: backups
      persistentVolumeClaim:
        claimName: mysql-backups
        readOnly: true
EOF

kubectl wait -n "$ns" --for=condition=Ready "pod/$pod" --timeout=120s >/dev/null

latest="$(kubectl exec -n "$ns" "$pod" -- sh -c 'ls -1t /backups/ktebna-*.sql.gz 2>/dev/null | head -n 1')"
if [[ -z "$latest" ]]; then
  echo "No backups yet. Run one first: kubectl create job -n $ns --from=cronjob/mysql-backup mysql-backup-manual" >&2
  exit 1
fi

name="k8s-$(basename "$latest")"
kubectl exec -n "$ns" "$pod" -- cat "$latest" > "$dest/$name.part"
gzip -t "$dest/$name.part"   # refuse a truncated copy
mv "$dest/$name.part" "$dest/$name"
echo "Copied to backups/$name ($(wc -c < "$dest/$name") bytes)"
