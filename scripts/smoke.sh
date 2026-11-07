#!/usr/bin/env bash
# Smoke-test a built production server. Run `npm run build` first.
set -euo pipefail

PORT="${PORT:-3210}"
BASE="http://127.0.0.1:${PORT}"
LOG="$(mktemp -t kyb-smoke-server.XXXXXX)"
BODY="$(mktemp -t kyb-smoke-body.XXXXXX)"
SERVER_PID=""

cleanup() {
  if [ -n "$SERVER_PID" ]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  rm -f "$LOG" "$BODY"
}
trap cleanup EXIT

if [ ! -f .next/BUILD_ID ]; then
  echo "FAIL: no production build found. Run npm run build first."
  exit 1
fi

npx next start -p "$PORT" >"$LOG" 2>&1 &
SERVER_PID=$!

ready=0
for _ in $(seq 1 60); do
  if curl -fsS "$BASE/" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 0.5
done
if [ "$ready" -ne 1 ]; then
  echo "FAIL: server did not start"
  cat "$LOG"
  exit 1
fi

check() {
  local path="$1" expected="${2:-200}" code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  if [ "$code" != "$expected" ]; then
    echo "FAIL $path: $code (expected $expected)"
    exit 1
  fi
  echo "PASS $path: $code"
}

check_header() {
  local name="$1" value="$2"
  if ! curl -sI "$BASE/" | grep -qi "^${name}: ${value}"; then
    echo "FAIL header $name"
    exit 1
  fi
  echo "PASS header $name"
}

check /
check /race/president
check /candidate/president--ndc
check /state/lagos
check /economy
check /promises
check /data
check /search-index.json
check /lga-points.json
check /og

check_header "x-content-type-options" "nosniff"
check_header "referrer-policy" "strict-origin-when-cross-origin"
check_header "x-frame-options" "DENY"
check_header "content-security-policy" "default-src 'self'"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "content-type: text/plain" -d x "$BASE/api/search-miss")
[ "$code" = "415" ] || { echo "FAIL api text/plain: $code"; exit 1; }
echo "PASS api rejects text/plain: $code"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "content-type: application/json" -H "origin: https://evil.example" -d '{"q":"test"}' "$BASE/api/search-miss")
[ "$code" = "403" ] || { echo "FAIL api cross-origin: $code"; exit 1; }
echo "PASS api rejects cross-origin: $code"

node -e 'process.stdout.write(JSON.stringify({q:"a".repeat(600)}))' >"$BODY"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "content-type: application/json" -H "origin: $BASE" --data-binary @"$BODY" "$BASE/api/search-miss")
[ "$code" = "413" ] || { echo "FAIL api oversized body: $code"; exit 1; }
echo "PASS api rejects oversized body: $code"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/search-miss")
[ "$code" = "404" ] || { echo "FAIL api report without key: $code"; exit 1; }
echo "PASS api report without key: $code"

got429=0
for _ in $(seq 1 35); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "content-type: application/json" -H "origin: $BASE" -d '{"q":"rate test"}' "$BASE/api/search-miss")
  [ "$code" = "429" ] && got429=1
done
[ "$got429" = "1" ] || { echo "FAIL api rate limit did not trigger"; exit 1; }
echo "PASS api rate limit triggers"

echo "smoke ok"
