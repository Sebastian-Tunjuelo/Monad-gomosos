#!/usr/bin/env bash
# deploy-monad.sh
#
# Despliega los contratos en Monad Testnet, luego llama a setup-local.js
# para escribir los .env del relayer y del frontend con las direcciones.
#
# Ejecutar desde una terminal WSL:
#   pnpm deploy:monad

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load .env if exists to get MONAD_RPC_URL (fallback to default)
if [ -f "$REPO_ROOT/.env" ]; then
    export $(sed 's/\r$//' "$REPO_ROOT/.env" | grep -v '^#' | xargs)
fi

RPC="${MONAD_RPC_URL:-https://testnet-rpc.monad.xyz}"
CHAIN_ID="${MONAD_CHAIN_ID:-10143}"

echo ""
echo "━━━ deploy-monad.sh ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Repo     : $REPO_ROOT"
echo "RPC      : $RPC"
echo "Chain ID : $CHAIN_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "==> Checking RPC at $RPC ..."
if ! ~/.foundry/bin/cast chain-id --rpc-url "$RPC" > /dev/null 2>&1; then
  echo ""
  echo "✗  RPC is not reachable at $RPC"
  echo "   Please check your connection or MONAD_RPC_URL."
  echo ""
  exit 1
fi
echo "    OK — chain id $(~/.foundry/bin/cast chain-id --rpc-url $RPC)"

# ── 1. Forge deploy ─────────────────────────────────────────────────────────
echo ""
echo "==> Running forge deploy script..."
cd "$REPO_ROOT"

# Aseguramos que existe el directorio reports
mkdir -p reports

~/.foundry/bin/forge script packages/contracts/script/Deploy.s.sol \
  --rpc-url "$RPC" \
  --broadcast \
  -vvvv

echo ""
echo "==> Deploy complete."

# ── 2. Setup .env files ──────────────────────────────────────────────────────
echo ""
echo "==> Env setup will be executed on host node."


echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Monad Testnet deployment complete. Open 2 more terminals and run:"
echo ""
echo "  Terminal 2:"
echo "    pnpm dev:relayer"
echo ""
echo "  Terminal 3:"
echo "    pnpm dev:frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
