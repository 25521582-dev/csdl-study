#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
port="${1:-8088}"
printf 'CSDL Studio: http://localhost:%s\n' "$port"
exec python3 -m http.server "$port" --bind 127.0.0.1 --directory dist
