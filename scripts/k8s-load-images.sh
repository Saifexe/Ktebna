#!/usr/bin/env bash
# Copy the Compose-built images straight into the Docker Desktop Kubernetes node,
# bypassing the GitLab registry pull that fails there (see README Known Issues).
#
#   docker compose build backend frontend
#   scripts/k8s-load-images.sh a1e79d1        # any tag; use the commit you built
#   # then set the same tag in k8s/backend.yaml and k8s/frontend.yaml
#   kubectl apply -f k8s/
set -euo pipefail

tag="${1:?usage: scripts/k8s-load-images.sh <tag>  (e.g. the short commit SHA)}"
node="${K8S_NODE:-desktop-control-plane}"

for app in backend frontend; do
  docker tag "ktebna-springboot-mysql-$app:latest" "ktebna/$app:$tag"
  echo "Loading ktebna/$app:$tag into $node"
  docker save "ktebna/$app:$tag" | docker exec -i "$node" ctr -n k8s.io images import --all-platforms -
done

docker exec "$node" crictl images | grep "ktebna/" || true
