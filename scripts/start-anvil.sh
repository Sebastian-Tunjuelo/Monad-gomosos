#!/usr/bin/env bash

# start-anvil.sh

#

# Mata cualquier instancia de Anvil en el puerto 8545 y arranca una nueva

# vinculada a 0.0.0.0 para que tanto Windows (MetaMask) como WSL puedan

# conectarse en http://127.0.0.1:8545.

#

# ┌─────────────────────────────────────────────────────────────────────────┐

# │  IMPORTANTE: ejecutar este script en una terminal WSL interactiva,      │

# │  NO con "wsl -e bash scripts/start-anvil.sh" desde PowerShell,         │

# │  porque los procesos background mueren al terminar la invocación.       │

# │                                                                          │

# │  Pasos correctos:                                                        │

# │    1. Abrir terminal WSL  (wsl en PowerShell o Windows Terminal → WSL)  │

# │    2. cd /mnt/c/Users/1/Desktop/Samuel/Pre-Hackaton                     │

# │    3. bash scripts/start-anvil.sh          ← esta terminal se bloquea   │

# │    4. Abrir OTRA terminal WSL para el siguiente paso:                    │

# │         bash scripts/deploy-local.sh                                    │

# └─────────────────────────────────────────────────────────────────────────┘



set -e



PORT=8545



echo "==> Checking for existing process on port $PORT..."



# Matar cualquier proceso que ya use el puerto

EXISTING_PID=$(ss -tlnp 2>/dev/null \

  | grep ":${PORT}" \

  | sed -n 's/.*pid=\([0-9]*\).*/\1/p' \

  | head -1)



if [ -n "$EXISTING_PID" ]; then

  echo "    Killing PID $EXISTING_PID on port $PORT..."

  kill -9 "$EXISTING_PID" 2>/dev/null || true

  sleep 1

  echo "    Done."

else

  echo "    Port $PORT is free."

fi



echo ""

echo "==> Starting Anvil on 0.0.0.0:$PORT (chainId 31337)..."

echo ""



# Mnemonic estándar de Anvil — mismas cuentas siempre

exec ~/.foundry/bin/anvil \

  --host 0.0.0.0 \

  --port "$PORT" \

  --chain-id 31337 \

  --block-time 0 \

  --mnemonic "test test test test test test test test test test test junk"