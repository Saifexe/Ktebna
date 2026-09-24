#!/usr/bin/env bash
# Copy the images CI published (built, Trivy-scanned and pushed by the pipeline
# on main) into the Docker Desktop Kubernetes node. The host pulls them from
# the GitLab registry; only the node's own registry pull is broken (see README
# Known Issues), so this sidesteps it without running anything CI didn't scan.
#
#   docker login registry.gitlab.com      # once; a token with read_registry
#   scripts/k8s-load-images.sh 6586d1f0    # the 8-character short SHA CI tagged
#   # then set the same tag in k8s/backend.yaml and k8s/frontend.yaml
#   kubectl apply -f k8s/
set -euo pipefail

tag="${1:?usage: scripts/k8s-load-images.sh <tag>  (the 8-character short commit SHA of a green main pipeline)}"
registry="${KTEBNA_REGISTRY:-registry.gitlab.com/saifexd-group/ktebna}"
node="${K8S_NODE:-desktop-control-plane}"

for app in backend frontend; do
  image="$registry/$app:$tag"
  echo "Pulling $image"
  docker pull "$image"
  echo "Loading $image into $node"
  docker save "$image" | docker exec -i "$node" ctr -n k8s.io images import --all-platforms -
done

docker exec "$node" crictl images | grep "$registry/" || true
