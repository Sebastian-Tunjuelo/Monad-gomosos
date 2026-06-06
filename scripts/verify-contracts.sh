#!/usr/bin/env bash
# =============================================================================
# verify-contracts.sh
# Verifies all deployed contracts on Monad testnet using the monskills
# unified verification API — one call verifies on MonadVision, Socialscan,
# and Monadscan simultaneously.
#
# Usage:
#   bash scripts/verify-contracts.sh [chainId]
#
# chainId defaults to 10143 (Monad testnet). Use 143 for mainnet.
#
# Prerequisites:
#   - forge installed in WSL
#   - DEPLOY_JSON env var pointing to the deploy report (default: reports/deploy-10143.json)
#   - jq installed (brew install jq / apt install jq)
#   - curl installed
# =============================================================================

set -euo pipefail

CHAIN_ID="${1:-10143}"
DEPLOY_JSON="${DEPLOY_JSON:-reports/deploy-${CHAIN_ID}.json}"
VERIFY_API="https://agents.devnads.com/v1/verify"
FORGE="wsl ~/.foundry/bin/forge"

# ── Validate pre-conditions ───────────────────────────────────────────────────
if [ ! -f "$DEPLOY_JSON" ]; then
  echo "ERROR: Deploy report not found at $DEPLOY_JSON"
  echo "       Run 'pnpm deploy:monad' first, then re-run this script."
  exit 1
fi

command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required. Install it with: apt install jq"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl is required."; exit 1; }

echo "=== Monad Contract Verifier ==="
echo "    Chain ID    : $CHAIN_ID"
echo "    Deploy file : $DEPLOY_JSON"
echo ""

# ── Read addresses from deploy report ────────────────────────────────────────
SESSION_MANAGER=$(jq -r '.SessionManager' "$DEPLOY_JSON")
DEMO_GAME=$(jq -r '.DemoGame' "$DEPLOY_JSON")
DEMO_SOCIAL=$(jq -r '.DemoSocial' "$DEPLOY_JSON")
GAME_TOKEN=$(jq -r '.GameToken' "$DEPLOY_JSON")

echo "    SessionManager : $SESSION_MANAGER"
echo "    DemoGame       : $DEMO_GAME"
echo "    DemoSocial     : $DEMO_SOCIAL"
echo "    GameToken      : $GAME_TOKEN"
echo ""

# ── Helper: verify one contract ───────────────────────────────────────────────
verify_contract() {
  local CONTRACT_PATH="$1"   # e.g.  src/SessionManager.sol:SessionManager
  local CONTRACT_ADDR="$2"   # e.g.  0xAbC...
  local CONTRACT_NAME        # extracted from CONTRACT_PATH

  CONTRACT_NAME="${CONTRACT_PATH##*:}"

  echo "--- Verifying $CONTRACT_NAME ($CONTRACT_ADDR) ---"

  # 1. Get standard JSON input
  $FORGE verify-contract "$CONTRACT_ADDR" "$CONTRACT_PATH" \
    --chain "$CHAIN_ID" \
    --show-standard-json-input > /tmp/standard-input.json 2>/dev/null

  # 2. Get foundry metadata
  jq '.metadata' "packages/contracts/out/${CONTRACT_NAME}.sol/${CONTRACT_NAME}.json" > /tmp/metadata.json 2>/dev/null

  # 3. Extract compiler version from metadata
  COMPILER_VERSION=$(jq -r '.compiler.version' /tmp/metadata.json | sed 's/^/v/')

  # 4. Call unified verification API
  STANDARD_INPUT=$(cat /tmp/standard-input.json)
  FOUNDRY_METADATA=$(cat /tmp/metadata.json)

  PAYLOAD=$(jq -n \
    --argjson chainId "$CHAIN_ID" \
    --arg contractAddress "$CONTRACT_ADDR" \
    --arg contractName "src/${CONTRACT_NAME}.sol:${CONTRACT_NAME}" \
    --arg compilerVersion "$COMPILER_VERSION" \
    --argjson standardJsonInput "$STANDARD_INPUT" \
    --argjson foundryMetadata "$FOUNDRY_METADATA" \
    '{
      chainId: $chainId,
      contractAddress: $contractAddress,
      contractName: $contractName,
      compilerVersion: $compilerVersion,
      standardJsonInput: $standardJsonInput,
      foundryMetadata: $foundryMetadata
    }')

  RESPONSE=$(curl -s -X POST "$VERIFY_API" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  echo "    Response: $RESPONSE"

  # Check for success
  if echo "$RESPONSE" | jq -e '.success == true' >/dev/null 2>&1; then
    echo "    ✅ $CONTRACT_NAME verified on all explorers"
  else
    echo "    ⚠️  $CONTRACT_NAME verification may have failed — check response above"
    echo "    Falling back to Sourcify direct verification..."
    $FORGE verify-contract "$CONTRACT_ADDR" "$CONTRACT_PATH" \
      --chain "$CHAIN_ID" \
      --verifier sourcify \
      --verifier-url "https://sourcify-api-monad.blockvision.org/" || true
  fi
  echo ""
}

# ── Verify all contracts ──────────────────────────────────────────────────────
verify_contract "src/SessionManager.sol:SessionManager" "$SESSION_MANAGER"
verify_contract "src/demo/DemoGame.sol:DemoGame" "$DEMO_GAME"
verify_contract "src/demo/DemoSocial.sol:DemoSocial" "$DEMO_SOCIAL"
verify_contract "src/token/GameToken.sol:GameToken" "$GAME_TOKEN"

echo "=== Verification complete ==="
echo ""
echo "    MonadVision : https://monadvision.com/address/$SESSION_MANAGER"
echo "    Socialscan  : https://monad-testnet.socialscan.io/address/$SESSION_MANAGER"
echo "    Monadscan   : https://testnet.monadscan.com/address/$SESSION_MANAGER"
