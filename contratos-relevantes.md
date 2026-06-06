# Contratos Relevantes — Monad Session Arena

Todos los contratos viven en `packages/contracts/src/` y se despliegan juntos con el script `packages/contracts/script/Deploy.s.sol`.

---

## 1. `SessionManager.sol` ⭐ — El núcleo del proyecto

Es el contrato central. Implementa el sistema de **session keys**: permite que un usuario (owner) delegue permisos acotados a una clave temporal (sessionKey) para que un relayer ejecute acciones en su nombre sin exponer su clave privada.

Responsabilidades principales:
- `createSession` — crea una sesión firmada por el owner (EIP-712), define límites de llamadas, tiempo de expiración, acciones permitidas y gasto máximo de tokens.
- `executeAction` — valida la firma del sessionKey, verifica todos los límites de la política y delega la ejecución al contrato de juego.
- `revokeSession` — permite al owner invalidar una sesión antes de que expire.

Depende de: `SessionTypes`, `SessionErrors`, `SessionEvents`, `SessionEIP712`, OpenZeppelin `IERC20`.

---

## 2. `SessionEIP712.sol` — Firma segura

Hereda de OpenZeppelin `EIP712` y provee la lógica de hashing y recuperación de firma para:
- `SessionGrant` — el mensaje que el owner firma para crear una sesión.
- `SessionAction` — el mensaje que el sessionKey firma para ejecutar cada acción.

Usa ECDSA para recuperar el firmante y revertir con `InvalidSignature` si no coincide.

---

## 3. `SessionTypes.sol` — Estructuras de datos

Librería con los tres structs que circulan por todo el sistema:
- `SessionPolicy` — política de permisos (owner, sessionKey, expiración, maxCalls, acciones permitidas como bitmask, token y gasto máximo).
- `SessionState` — estado mutable de la sesión (callCount, tokenSpent, nonce, revoked).
- `SessionAction` — datos de una acción individual (sessionId, nonce, actionId, paramsHash, deadline).

---

## 4. `GameToken.sol` — Token ERC-20 (ARENA)

Token ERC-20 estándar de OpenZeppelin con una función `mint()` pública (faucet) que reparte 100 ARENA por llamada. Se usa en el flujo `BUY_ITEM` del SessionManager para demostrar el control de gasto (`maxTokenSpend`).

Supply inicial: 1,000,000 ARENA acuñados al deployer.

---

## 5. `DemoGame.sol` — Aplicación demo: juego

Implementa la interfaz `IDemoGame`. Recibe llamadas del SessionManager y registra contadores por jugador para las acciones:
- `1` → MOVE
- `2` → ATTACK
- `3` → COLLECT
- `4` → BUY_ITEM

Es un contrato demo mínimo; su función es demostrar que el SessionManager funciona con cualquier contrato de juego.

---

## 6. `DemoSocial.sol` — Aplicación demo: red social

También implementa `IDemoGame`. Demuestra que el sistema de session keys no es exclusivo de juegos — funciona para **cualquier dApp**. Gestiona un feed social on-chain con:
- `1` → POST (crear publicación)
- `2` → LIKE (dar me gusta, idempotente)
- `3` → FOLLOW (seguir usuario, idempotente)
- `4` → REPOST (repostear)

Incluye helpers de lectura (`getRecentPosts`, `getPostsByUser`, `getPost`).

---

## 7. Contratos de soporte (no desplegados por separado)

| Contrato | Rol |
|---|---|
| `SessionErrors.sol` | Interface con todos los errores custom (reverts legibles) |
| `SessionEvents.sol` | Interface con los eventos `SessionCreated`, `SessionActionExecuted`, `SessionRevoked` |

---

## Diagrama de dependencias

```
SessionManager
├── SessionTypes      (structs)
├── SessionErrors     (errores)
├── SessionEvents     (eventos)
├── SessionEIP712     (firmas EIP-712)
│   └── SessionErrors
└── IERC20 (OpenZeppelin)

DemoGame   → IDemoGame (definida en SessionManager)
DemoSocial → IDemoGame (definida en SessionManager)
GameToken  → ERC20 + Ownable (OpenZeppelin)
```

---

## Flujo principal

```
Usuario (owner)
  │─ firma SessionGrant (EIP-712) ──────────────────────────────────────────►
  │                                                                SessionManager.createSession()
  │
Relayer (con sessionKey)
  │─ firma SessionAction (EIP-712) ─────────────────────────────────────────►
  │                                                                SessionManager.executeAction()
  │                                                                      │
  │                                                                      └── DemoGame / DemoSocial
  │                                                                               .executeAction()
```
