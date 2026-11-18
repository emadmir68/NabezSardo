#!/usr/bin/env bash
# Chunked image generation — run: gen_chunk.sh <name> [<name>...]
# Spec lines live in scripts/images.conf as: name|size|prompt
set -u
CONF="/home/z/my-project/scripts/images.conf"
IMGDIR="/home/z/my-project/public/images"
cd "$IMGDIR" || exit 1

gen() {
  local name="$1"
  local line
  line="$(grep -m1 "^${name}|" "$CONF")"
  if [ -z "$line" ]; then echo "UNKNOWN: $name"; return 1; fi
  local size="${line#*|}"; size="${size%%|*}"
  local prompt="${line#*|*|}"
  if [ -s "$name.png" ] && [ "$(stat -c%s "$name.png" 2>/dev/null || echo 0)" -gt 50000 ]; then
    echo "SKIP (exists): $name"
    return 0
  fi
  local tries=0
  while [ $tries -lt 3 ]; do
    echo ">>> $name (try $((tries+1)), $size) $(date +%H:%M:%S)"
    if z-ai image -p "$prompt" -o "$name.png" -s "$size" 2>&1 | tail -2 | grep -q "completed"; then
      echo "OK: $name"
      return 0
    fi
    tries=$((tries+1))
    sleep 15
  done
  echo "FAILED: $name"
  return 1
}

for n in "$@"; do
  gen "$n"
  sleep 8
done
echo "===== CHUNK DONE $(date +%H:%M:%S) ====="
