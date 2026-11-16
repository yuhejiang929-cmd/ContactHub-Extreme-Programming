#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^([[:alnum:]_.-]+@)?[[:alnum:]][[:alnum:].-]*$ ]]; then
  printf 'Usage: %s user@server-hostname\n' "$0" >&2
  exit 2
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."
npm ci
npm run build
COPYFILE_DISABLE=1 tar -C dist -czf - . | ssh -T "$1" '
  set -eu
  archive=$(mktemp)
  trap '\''rm -f "$archive"'\'' EXIT
  cat > "$archive"
  sudo -n install -d /var/www/contacthub/releases
  release=$(sudo -n mktemp -d /var/www/contacthub/releases/contacthub.XXXXXXXX)
  sudo -n tar -xzf "$archive" --no-same-owner -C "$release"
  sudo -n chmod 755 "$release"
  sudo -n test -s "$release/index.html"
  pointer="$release-link"
  sudo -n ln -s "$release" "$pointer"
  sudo -n mv -Tf "$pointer" /var/www/contacthub/current
  printf "Published %s\n" "$release"
'
