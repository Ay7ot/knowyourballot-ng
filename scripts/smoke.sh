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

env -u BLOB_READ_WRITE_TOKEN -u SEARCH_REPORT_KEY npx next start -p "$PORT" >"$LOG" 2>&1 &
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

check_present() {
  local path="$1" text="$2"
  if ! curl -fsS "$BASE$path" | grep -Fq "$text"; then
    echo "FAIL $path: missing '$text'"
    exit 1
  fi
  echo "PASS $path: has '$text'"
}

check_absent() {
  local path="$1" text="$2"
  if curl -fsS "$BASE$path" | grep -Fq "$text"; then
    echo "FAIL $path: unexpected '$text'"
    exit 1
  fi
  echo "PASS $path: no '$text'"
}

check /
check /race/president
check /candidate/president--ndc
check /state/lagos
check /state/lagos/agege
check /state/lagos/not-real 404
check "/api/candidate-details"
check "/api/candidate-details?ids=president--ndc"
check_present "/api/candidate-details?ids=president--ndc" '"policy"'
check_present "/api/candidate-details?ids=president--ndc" '"pledges"'
check "/api/candidate-details?ids=1,2,3,4,5,6,7,8,9,10,11" 400
check_present "/api/candidate-details?ids=not-real" '"missing"'
if ! curl -s -D - -o /dev/null "$BASE/api/candidate-details?ids=president--ndc" | grep -qi "^cache-control: .*s-maxage=3600"; then
  echo "FAIL cache header s-maxage"
  exit 1
fi
echo "PASS cache header s-maxage"
check /economy
check /promises
check /manifestos
check /manifesto/president--apc
check /manifesto/president--sdp
check /manifesto/party--adc
check /manifesto/gov--oyo--apm
check /manifesto/gov--kwara--pdp
check /data
check /search-index.json
check /lga-points.json
check /og
check /candidate/definitely-not-real 404
check /candidate/sha--benue--gboko-iii--sdp 200
check /race/not-real 404
check /state/not-real 404
check /manifesto/not-real 404

check_present /manifesto/president--apc "From Reforms to Prosperity"
check_present /manifesto/president--apc "p. 49"
check_present /manifesto/gov--oyo--apm "Read the abridged manifesto"
check_absent /manifesto/gov--oyo--apm "Read the full manifesto"
check_present /manifesto/gov--kwara--pdp "Manifesto not published yet"
check_absent /manifesto/gov--kwara--pdp "The commitments below"
check_present /manifesto/party--adc "African Democratic Congress"
check_absent /manifesto/party--adc "African Democratic Congress, African Democratic Congress"

code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/candidate/sha--benue--gboko-iii--s-d-p")
[ "$code" = "308" ] || { echo "FAIL redirect old candidate URL: $code"; exit 1; }
echo "PASS redirect old candidate URL: $code"

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
