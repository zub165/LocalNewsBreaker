#!/usr/bin/env bash
# Test LocalNewsBreaker API on production (citizen-api.mywaitime.com).
# Usage:  bash tool/test_all_endpoints.sh
# Override: API_BASE=https://other-host bash tool/test_all_endpoints.sh

set -euo pipefail

API_BASE="${API_BASE:-https://citizen-api.mywaitime.com}"
API="${API_BASE%/}/api"
PASS=0
FAIL=0
SKIP=0
TOKEN=""
EDITOR_TOKEN=""
TEST_STORY_ID=""
CREATED_STORY_ID=""

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[1;33m'
BLU='\033[0;34m'
RST='\033[0m'

pass() { PASS=$((PASS + 1)); echo -e "${GRN}✓ PASS${RST}  $1"; }
fail() { FAIL=$((FAIL + 1)); echo -e "${RED}✗ FAIL${RST}  $1"; [[ -n "${2:-}" ]] && echo "         $2"; }
skip() { SKIP=$((SKIP + 1)); echo -e "${YLW}○ SKIP${RST}  $1"; [[ -n "${2:-}" ]] && echo "         $2"; }
info() { echo -e "${BLU}→${RST} $1"; }

# $1=label $2=method $3=path $4=expected_codes (pipe) $5=extra curl args
test_endpoint() {
  local label="$1" method="$2" path="$3" expected="$4"
  shift 4
  local url="${API}${path}"
  local resp code body
  resp=$(curl -sS -w "\n%{http_code}" -X "$method" "$url" "$@" 2>&1) || {
    fail "$label" "curl error: $resp"
    return
  }
  code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')
  local ok=0
  IFS='|' read -ra codes <<< "$expected"
  for c in "${codes[@]}"; do
    if [[ "$code" == "$c" ]]; then ok=1; break; fi
  done
  if [[ $ok -eq 1 ]]; then
    pass "$label  HTTP $code"
    echo "$body" | head -c 220 | tr '\n' ' '
    echo
  else
    fail "$label  expected [$expected] got HTTP $code" "$(echo "$body" | head -c 300 | tr '\n' ' ')"
  fi
}

echo "=============================================="
echo " LocalNewsBreaker API endpoint test"
echo " Base: $API_BASE"
echo " Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=============================================="
echo

info "── Public / health ──"
test_endpoint "GET /v1/health/" GET "/v1/health/" "200"
test_endpoint "GET /health (legacy)" GET "/health" "200"
test_endpoint "GET /status (legacy)" GET "/status" "200|404"

info "── News feed ──"
test_endpoint "GET /v1/news/?status=published" GET "/v1/news/?status=published&limit=5" "200"
NEWS_JSON=$(curl -sS "${API}/v1/news/?status=published&limit=5")
TEST_STORY_ID=$(echo "$NEWS_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
items=d.get('stories') or d.get('results') or (d if isinstance(d,list) else [])
print(items[0]['id'] if items else '')
" 2>/dev/null || true)
if [[ -n "$TEST_STORY_ID" ]]; then
  info "Using story id $TEST_STORY_ID for detail/delete tests"
  test_endpoint "GET /v1/stories/{id}/" GET "/v1/stories/${TEST_STORY_ID}/" "200"
else
  skip "GET /v1/stories/{id}/" "no published stories"
fi

test_endpoint "GET /v1/news/?status=pending" GET "/v1/news/?status=pending&limit=5" "200|403"
test_endpoint "GET /v1/search/?q=local" GET "/v1/search/?q=local" "200"
test_endpoint "GET /v1/generate-pdf/" GET "/v1/generate-pdf/" "200|404"

info "── Auth (demo accounts) ──"
LOGIN_RESP=$(curl -sS -X POST "${API}/v1/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"username":"appreview_reporter","password":"AppReview2026!"}' 2>/dev/null || echo '{}')
TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('access') or d.get('token') or '')" 2>/dev/null || true)
if [[ -n "$TOKEN" ]]; then
  pass "POST /v1/auth/login/ (reporter)  got token"
else
  fail "POST /v1/auth/login/ (reporter)" "$(echo "$LOGIN_RESP" | head -c 200)"
fi

EDITOR_LOGIN=$(curl -sS -X POST "${API}/v1/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"username":"appreview_editor","password":"AppReview2026!"}' 2>/dev/null || echo '{}')
EDITOR_TOKEN=$(echo "$EDITOR_LOGIN" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('access') or d.get('token') or '')" 2>/dev/null || true)
if [[ -n "$EDITOR_TOKEN" ]]; then
  pass "POST /v1/auth/login/ (editor)  got token"
else
  skip "POST /v1/auth/login/ (editor)" "account may not exist on server"
fi

if [[ -n "$TOKEN" ]]; then
  info "── Authenticated (reporter) ──"
  test_endpoint "GET /v1/users/me/" GET "/v1/users/me/" "200" -H "Authorization: Bearer $TOKEN"
  test_endpoint "GET /v1/news/my/" GET "/v1/news/my/" "200" -H "Authorization: Bearer $TOKEN"
  test_endpoint "GET /v1/users/me/settings/" GET "/v1/users/me/settings/" "200|404" -H "Authorization: Bearer $TOKEN"
  test_endpoint "PATCH /v1/users/me/settings/" PATCH "/v1/users/me/settings/" "200|404" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"dark_mode":false,"notifications_enabled":true}'
fi

if [[ -n "$EDITOR_TOKEN" ]]; then
  info "── Authenticated (editor) ──"
  test_endpoint "GET /v1/news/?status=pending (auth)" GET "/v1/news/?status=pending&limit=5" "200" \
    -H "Authorization: Bearer $EDITOR_TOKEN"
fi

info "── Submit story ──"
SUBMIT_BODY='{"title":"Endpoint test '"$(date +%s)"'","body":"Automated endpoint test from test_all_endpoints.sh","category":"local","location":"Test City","source":"endpoint_test"}'
SUBMIT_RESP=$(curl -sS -w "\n%{http_code}" -X POST "${API}/v1/submit/" \
  -H "Content-Type: application/json" \
  ${TOKEN:+-H "Authorization: Bearer $TOKEN"} \
  -d "$SUBMIT_BODY" 2>/dev/null || echo -e "\n000")
SUBMIT_CODE=$(echo "$SUBMIT_RESP" | tail -1)
SUBMIT_JSON=$(echo "$SUBMIT_RESP" | sed '$d')
CREATED_STORY_ID=$(echo "$SUBMIT_JSON" | python3 -c "
import json,sys
d=json.load(sys.stdin)
data=d.get('data') or d
print(data.get('id','') if isinstance(data,dict) else '')
" 2>/dev/null || true)
if [[ "$SUBMIT_CODE" == "201" || "$SUBMIT_CODE" == "200" ]]; then
  pass "POST /v1/submit/  HTTP $SUBMIT_CODE  id=${CREATED_STORY_ID:-?}"
else
  fail "POST /v1/submit/  HTTP $SUBMIT_CODE" "$(echo "$SUBMIT_JSON" | head -c 200)"
fi

info "── Approve / reject / delete ──"
MOD_ID="${CREATED_STORY_ID:-$TEST_STORY_ID}"
if [[ -n "$MOD_ID" ]]; then
  APPROVE_RESP=$(curl -sS -X POST "${API}/v1/approve/" \
    -H "Content-Type: application/json" \
    ${EDITOR_TOKEN:+-H "Authorization: Bearer $EDITOR_TOKEN"} \
    -d "{\"id\":$MOD_ID,\"status\":\"rejected\"}" 2>/dev/null || echo '{}')
  ACTUAL_STATUS=$(echo "$APPROVE_RESP" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d.get('status') or (d.get('data') or {}).get('status') or '')
" 2>/dev/null || true)
  if [[ "$ACTUAL_STATUS" == "rejected" ]]; then
    pass "POST /v1/approve/ reject  status=rejected"
  else
    fail "POST /v1/approve/ reject" "returned status='$ACTUAL_STATUS' (deploy GODADDY_DELETE_FIX.md)"
  fi

  PATCH_RESP=$(curl -sS -w "\n%{http_code}" -X PATCH "${API}/v1/stories/${MOD_ID}/" \
    -H "Content-Type: application/json" \
    -d '{"status":"rejected"}' 2>/dev/null || echo -e "\n000")
  PATCH_CODE=$(echo "$PATCH_RESP" | tail -1)
  if [[ "$PATCH_CODE" == "200" ]]; then
    pass "PATCH /v1/stories/{id}/  HTTP 200"
  elif [[ "$PATCH_CODE" == "405" ]]; then
    fail "PATCH /v1/stories/{id}/" "HTTP 405 — deploy story_detail from api/views.py"
  else
    skip "PATCH /v1/stories/{id}/" "HTTP $PATCH_CODE"
  fi

  DEL_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X DELETE "${API}/v1/stories/${MOD_ID}/" 2>/dev/null || echo "000")
  if [[ "$DEL_CODE" == "200" || "$DEL_CODE" == "204" ]]; then
    pass "DELETE /v1/stories/{id}/  HTTP $DEL_CODE"
  elif [[ "$DEL_CODE" == "405" ]]; then
    fail "DELETE /v1/stories/{id}/" "HTTP 405 — deploy story_detail from api/views.py"
  else
    skip "DELETE /v1/stories/{id}/" "HTTP $DEL_CODE"
  fi
else
  skip "approve/reject/delete tests" "no story id available"
fi

info "── Mobile extras (combined-api) ──"
test_endpoint "GET /v1/tasks/" GET "/v1/tasks/" "200|401|404" ${TOKEN:+-H "Authorization: Bearer $TOKEN"}
test_endpoint "GET /v1/projects/" GET "/v1/projects/" "200|401|404" ${TOKEN:+-H "Authorization: Bearer $TOKEN"}

if [[ -n "$TOKEN" ]]; then
  test_endpoint "POST /v1/auth/logout/" POST "/v1/auth/logout/" "200|204|404" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'
fi

echo
echo "=============================================="
echo -e " Results: ${GRN}$PASS passed${RST}, ${RED}$FAIL failed${RST}, ${YLW}$SKIP skipped${RST}"
echo "=============================================="
[[ "$FAIL" -eq 0 ]]
