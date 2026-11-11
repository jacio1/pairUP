#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then
  echo 'Missing root .env. Generate it with node deploy/configure.mjs before upload.' >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  if [[ "$(id -u)" != 0 ]]; then
    echo 'Initial Docker installation requires root. Run sudo bash deploy/bootstrap.sh.' >&2
    exit 1
  fi
  . /etc/os-release
  if [[ "$ID" != ubuntu ]]; then
    echo 'Automatic installation supports Ubuntu. Install Docker Engine and Compose, then rerun.' >&2
    exit 1
  fi
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
docker compose version >/dev/null
docker compose config --quiet
docker compose up -d --build
docker compose ps
