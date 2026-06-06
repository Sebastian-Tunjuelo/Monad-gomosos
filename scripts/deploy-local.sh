#!/usr/bin/env bash
# deploy-local.sh
#
# Despliega los contratos en Anvil local, luego llama a setup-local.js
# para escribir los .env del relayer y del frontend con las direcciones.
#
# Ejecutar desde una terminal WSL (con Anvil ya corriendo en otra terminal):
#   cd /mnt/c/Users/1/Desktop/Samuel/Pre-Hackaton
#   bash scripts/deploy-local.sh

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC="http://127.0.0.1:8545"

echo ""
echo "━━━ deploy-local.sh ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Repo  : $REPO_ROOT"
echo "RPC   : $RPC"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Verificar que Anvil responde ──────────────────────────────────────────
echo ""
echo "==> Checking Anvil at $RPC ..."
if ! ~/.foundry/bin/cast chain-id --rpc-url "$RPC" > /dev/null 2>&1; then
  echo ""
  echo "✗  Anvil is not reachable at $RPC"
  echo "   Start it first in another terminal:"
  echo "     bash scripts/start-anvil.sh"
  echo ""
  exit 1
fi
echo "    OK — chain id $(~/.foundry/bin/cast chain-id --rpc-url $RPC)"

# ── 2. Forge deploy ─────────────────────────────────────────────────────────
echo ""
echo "==> Running forge deploy script..."
cd "$REPO_ROOT"
~/.foundry/bin/forge script packages/contracts/script/Deploy.s.sol \
  --rpc-url "$RPC" \
  --broadcast \
  -vv

echo ""
echo "==> Deploy complete."

# ── 3. Setup .env files ──────────────────────────────────────────────────────
echo ""
echo "==> Writing .env files via setup-local.js..."
node scripts/setup-local.js 31337

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Stack ready. Open 3 more terminals and run:"
echo ""
echo "  Terminal 3 (WSL or PowerShell):"
echo "    pnpm mint:local"
echo ""
echo "  Terminal 4:"
echo "    pnpm dev:relayer"
echo ""
echo "  Terminal 5:"
echo "    pnpm dev:frontend"
echo ""
echo "  MetaMask → Add network:"
echo "    RPC URL  : http://127.0.0.1:8545"
echo "    Chain ID : 31337"
echo "    Symbol   : ETH"
echo ""
echo "  Import account (Anvil #0):"
echo "    0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
