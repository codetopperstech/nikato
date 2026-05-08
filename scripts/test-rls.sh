#!/usr/bin/env bash
# ============================================================
# NIKATO · scripts/test-rls.sh
# Validates RLS policies using the anon key.
# Run locally after: supabase start && supabase db reset
# Usage: bash scripts/test-rls.sh
# ============================================================

set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Config — defaults to local Supabase
# ─────────────────────────────────────────────────────────────
BASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-$(supabase status --output env | grep ANON_KEY | cut -d= -f2)}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$(supabase status --output env | grep SERVICE_ROLE_KEY | cut -d= -f2)}"

PASS=0
FAIL=0

pass() { echo "  ✅ PASS: $1"; ((PASS++)); }
fail() { echo "  ❌ FAIL: $1 — $2"; ((FAIL++)); }

http_status() {
  curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $ANON_KEY" \
    -H "Authorization: Bearer $1" \
    "$2"
}

echo ""
echo "═══════════════════════════════════════════"
echo "  NIKATO RLS Validation Suite"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────
# 1. ANON cannot read profiles
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ PROFILES"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $ANON_KEY" \
  "$BASE_URL/rest/v1/profiles?select=id")

if [ "$STATUS" = "200" ]; then
  # Should return empty array (RLS blocks), not 200 with data
  DATA=$(curl -s -H "apikey: $ANON_KEY" "$BASE_URL/rest/v1/profiles?select=id")
  if [ "$DATA" = "[]" ]; then
    pass "Anon receives empty profiles (RLS active)"
  else
    fail "Anon can read profiles" "$DATA"
  fi
else
  pass "Anon blocked from profiles (status $STATUS)"
fi

# ─────────────────────────────────────────────────────────────
# 2. ANON can read approved shops
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ SHOPS"
DATA=$(curl -s -H "apikey: $ANON_KEY" "$BASE_URL/rest/v1/shops?select=id,name,is_approved")
UNAPPROVED=$(echo "$DATA" | grep -c '"is_approved":false' || true)

if [ "$UNAPPROVED" -eq 0 ]; then
  pass "Anon only sees approved shops"
else
  fail "Anon can see unapproved shops" "Found $UNAPPROVED unapproved"
fi

# ─────────────────────────────────────────────────────────────
# 3. ANON cannot read orders
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ ORDERS"
DATA=$(curl -s -H "apikey: $ANON_KEY" "$BASE_URL/rest/v1/orders?select=id")
if [ "$DATA" = "[]" ]; then
  pass "Anon receives empty orders (RLS active)"
else
  fail "Anon can read orders" "$DATA"
fi

# ─────────────────────────────────────────────────────────────
# 4. ANON cannot read notifications
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ NOTIFICATIONS"
DATA=$(curl -s -H "apikey: $ANON_KEY" "$BASE_URL/rest/v1/notifications?select=id")
if [ "$DATA" = "[]" ]; then
  pass "Anon receives empty notifications (RLS active)"
else
  fail "Anon can read notifications" "$DATA"
fi

# ─────────────────────────────────────────────────────────────
# 5. ANON cannot read commissions
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ COMMISSIONS"
DATA=$(curl -s -H "apikey: $ANON_KEY" "$BASE_URL/rest/v1/commissions?select=id")
if [ "$DATA" = "[]" ]; then
  pass "Anon receives empty commissions (RLS active)"
else
  fail "Anon can read commissions" "$DATA"
fi

# ─────────────────────────────────────────────────────────────
# 6. ANON cannot read shop_analytics
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ SHOP ANALYTICS"
DATA=$(curl -s -H "apikey: $ANON_KEY" "$BASE_URL/rest/v1/shop_analytics?select=id")
if [ "$DATA" = "[]" ]; then
  pass "Anon receives empty shop_analytics (RLS active)"
else
  fail "Anon can read shop_analytics" "$DATA"
fi

# ─────────────────────────────────────────────────────────────
# 7. ANON cannot read payments
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ PAYMENTS"
DATA=$(curl -s -H "apikey: $ANON_KEY" "$BASE_URL/rest/v1/payments?select=id")
if [ "$DATA" = "[]" ]; then
  pass "Anon receives empty payments (RLS active)"
else
  fail "Anon can read payments" "$DATA"
fi

# ─────────────────────────────────────────────────────────────
# 8. ANON cannot read addresses
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ ADDRESSES"
DATA=$(curl -s -H "apikey: $ANON_KEY" "$BASE_URL/rest/v1/addresses?select=id")
if [ "$DATA" = "[]" ]; then
  pass "Anon receives empty addresses (RLS active)"
else
  fail "Anon can read addresses" "$DATA"
fi

# ─────────────────────────────────────────────────────────────
# 9. PostGIS RPC accessible
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ POSTGIS RPC"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/rest/v1/rpc/nearby_shops" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_lat":19.059,"p_lng":72.829,"p_radius_m":5000}')

if [ "$STATUS" = "200" ]; then
  pass "nearby_shops RPC returns 200"
else
  fail "nearby_shops RPC failed" "Status $STATUS"
fi

# ─────────────────────────────────────────────────────────────
# 10. Service role can read everything
# ─────────────────────────────────────────────────────────────
echo ""
echo "▸ SERVICE ROLE BYPASS"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  "$BASE_URL/rest/v1/profiles?select=id&limit=1")

if [ "$STATUS" = "200" ]; then
  pass "Service role bypasses RLS on profiles"
else
  fail "Service role cannot read profiles" "Status $STATUS"
fi

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "  Results: $PASS passed · $FAIL failed"
echo "═══════════════════════════════════════════"
echo ""

if [ $FAIL -gt 0 ]; then
  exit 1
fi
