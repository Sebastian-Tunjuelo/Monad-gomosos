# Contexto del Proyecto — Monad Session Arena

**¡Bienvenido, Asistente de IA!**
Si estás iniciando una nueva sesión, lee este documento para comprender el proyecto al instante sin tener que explorar todo el repositorio.

## 1. Descripción General del Proyecto
**Monad Session Arena** es una demostración de infraestructura Web3 para juegos on-chain de alta frecuencia en la testnet de Monad.
Permite a los jugadores crear una **clave de sesión temporal** con permisos limitados (mediante una única firma inicial de billetera) para que puedan ejecutar múltiples acciones del juego (como `MOVE`, `ATTACK`, `COLLECT`, `BUY_ITEM`) a través de un relayer sin constantes ventanas emergentes (popups) de la billetera.

## 2. Stack Tecnológico
- **Blockchain:** Monad testnet
- **Contratos Inteligentes (Smart Contracts):** Solidity, construidos y probados con **Foundry**.
- **Backend (Relayer):** Node.js, Express, TypeScript, Viem, SQLite.
- **Frontend (Demo):** React, Vite, Wagmi, Tailwind CSS.
- **Gestor de Paquetes:** `pnpm` (Monorepo con workspaces: `@monad-session-arena/contracts`, `relayer`, `sdk`, `frontend`, `shared`).

## 3. Metodología: Desarrollo Guiado por Especificaciones (SDD)
Este proyecto sigue ESTRICTAMENTE el Desarrollo Guiado por Especificaciones (Spec-Driven Development).
- **NO INVENTES INTERFACES:** Lee siempre la especificación correspondiente en la carpeta `specs/` antes de implementar cualquier lógica. Las especificaciones (specs) son la fuente de verdad.
- **Gestión de Tareas:** Para saber qué hacer a continuación, consulta `docs/planning/task-board.md` y `docs/planning/day-by-day-plan.md`.
- **Flujo de Trabajo:**
  1. Elige una tarea del `task-board`.
  2. Lee la especificación correspondiente en `specs/`.
  3. Implementa la versión funcional mínima.
  4. Verifica que funcione.
  5. Actualiza el `task-board.md` a `DONE`.

## 4. Detalles Críticos del Entorno (Windows + WSL)
- El sistema operativo principal es **Windows**, pero **Foundry está instalado dentro de WSL**.
- **DEBES** anteponer `wsl ~/.foundry/bin/` a todos los comandos de Foundry.
  - ✅ Correcto: `wsl ~/.foundry/bin/forge build` o `wsl ~/.foundry/bin/forge test`
  - ❌ Incorrecto: `forge build`
- Los scripts de `package.json` (`pnpm build`, `pnpm test:contracts`) ya están configurados para usar WSL. Puedes ejecutarlos simplemente con `pnpm test:contracts` desde la terminal de Windows.

## 5. Flujo Principal de la Demo
```text
Conectar billetera → Crear sesión (firmar EIP-712) → Jugar sin popups de billetera → Comprar objeto con ERC-20 ARENA dentro del límite de gasto → Mostrar panel (dashboard) → Revocar sesión → Las acciones fallan tras revocar.
```
