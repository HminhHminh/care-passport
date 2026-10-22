#!/usr/bin/env bash
set -euo pipefail

# Care Passport - Provision Real TideCloak Realm Users & Generate Account Link URLs
CONFIG_FILE="$(dirname "$0")/../data/tidecloak.json"
AUTH_URL="${TIDECLOAK_URL:-http://localhost:8080}"
REALM_NAME="${REALM_NAME:-care-passport}"
ADMIN_USER="${KC_ADMIN_USER:-admin}"
ADMIN_PASSWORD="${KC_ADMIN_PASSWORD:-admin}"

echo "======================================================="
echo "  CARE PASSPORT — TIDECLOAK REALM USERS PROVISIONER"
echo "======================================================="
echo "Server: $AUTH_URL"
echo "Realm:  $REALM_NAME"

TOKEN=$(curl -s -X POST "$AUTH_URL/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=admin-cli&grant_type=password&username=$ADMIN_USER&password=$ADMIN_PASSWORD" \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4 || true)

if [ -z "$TOKEN" ]; then
  echo "⚠️ Could not obtain admin token from $AUTH_URL. Please ensure TideCloak is running."
  exit 1
fi

declare -A USERS=(
  ["sarah_connor"]="Sarah:Connor:sarah.connor@carepassport.local:_tide_enabled,_tide_encryptor,_tide_decryptor,appUser"
  ["dr_marcus"]="Alice:Marcus:alice.marcus@carepassport.local:_tide_enabled,_tide_decryptor,appUser"
  ["dr_chen"]="Marcus:Chen:marcus.chen@carepassport.local:_tide_enabled,_tide_decryptor,appUser"
)

for USERNAME in "${!USERS[@]}"; do
  IFS=':' read -r FIRST LAST EMAIL ROLES <<< "${USERS[$USERNAME]}"
  echo ""
  echo "▶ Processing $USERNAME ($FIRST $LAST)..."

  # Create user
  curl -s -X POST "$AUTH_URL/admin/realms/$REALM_NAME/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"firstName\":\"$FIRST\",\"lastName\":\"$LAST\",\"enabled\":true,\"emailVerified\":true,\"requiredActions\":[\"link-tide-account-action\"]}" > /dev/null || true

  # Fetch userId
  USER_ID=$(curl -s "$AUTH_URL/admin/realms/$REALM_NAME/users?username=$USERNAME" \
    -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -n1 | cut -d'"' -f4 || true)

  if [ -n "$USER_ID" ]; then
    # Generate Link
    LINK=$(curl -s -X POST "$AUTH_URL/admin/realms/$REALM_NAME/tideAdminResources/get-required-action-link?userId=$USER_ID&lifespan=43200" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '["link-tide-account-action"]' | tr -d '"')

    echo "   ✓ User ID: $USER_ID"
    echo "   🔗 One-Time Account Link URL:"
    echo "      $LINK"
  fi
done

echo ""
echo "======================================================="
echo "  Done. Open each link in a browser to link Tide accounts."
echo "======================================================="
