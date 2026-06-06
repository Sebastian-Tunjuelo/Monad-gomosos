# Task Board — Monad Session Arena

Estado actual al final de la Phase 5 + mejoras.

## Leyenda de estados

```
TODO         → No iniciado
IN_PROGRESS  → En curso
DONE         → Completado y verificado
```

---

# Smart Contracts ✅

| ID | Tarea | Prioridad | Estado |
|---|---|---:|---|
| CONTRACT-01 | Setup Foundry | P0 | DONE |
| CONTRACT-02 | Crear `SessionTypes` | P0 | DONE |
| CONTRACT-03 | Crear `SessionErrors` | P0 | DONE |
| CONTRACT-04 | Crear `SessionEvents` | P0 | DONE |
| CONTRACT-05 | Crear `SessionEIP712` | P0 | DONE |
| CONTRACT-06 | Crear `SessionManager` | P0 | DONE |
| CONTRACT-07 | Implementar `createSession` | P0 | DONE |
| CONTRACT-08 | Implementar `executeAction` | P0 | DONE |
| CONTRACT-09 | Implementar `revokeSession` | P0 | DONE |
| CONTRACT-10 | Implementar expiración | P0 | DONE |
| CONTRACT-11 | Implementar nonce secuencial | P0 | DONE |
| CONTRACT-12 | Implementar `maxCalls` | P0 | DONE |
| CONTRACT-13 | Implementar allowed actions bitmask | P0 | DONE |
| CONTRACT-14 | Crear `GameToken` ERC-20 | P1 | DONE |
| CONTRACT-15 | Crear `DemoGame` | P0 | DONE |
| CONTRACT-16 | Implementar ERC-20 spend limit | P1 | DONE |
| CONTRACT-17 | Tests unitarios principales (12 tests) | P0 | DONE |
| CONTRACT-18 | Fuzz tests (7 tests, 256 runs cada uno) | P1 | DONE |
| CONTRACT-19 | Invariant tests (6 invariantes, 128k calls) | P1 | DONE |
| CONTRACT-20 | Deploy script para local y Monad testnet | P0 | DONE |
| CONTRACT-21 | Gas report | P2 | DONE |
| CONTRACT-22 | Crear `DemoSocial` (POST/LIKE/FOLLOW/REPOST) | P1 | DONE |
| CONTRACT-23 | Fix `incorrect-shift` warning en SessionManager | P1 | DONE |

## Tests de contratos — resultado final

| Caso | Estado |
|---|---|
| Crear sesión válida | ✅ DONE |
| Rechazar firma inválida | ✅ DONE |
| Ejecutar acción válida | ✅ DONE |
| Rechazar nonce repetido | ✅ DONE |
| Rechazar sesión revocada | ✅ DONE |
| Rechazar sesión expirada | ✅ DONE |
| Rechazar acción no permitida | ✅ DONE |
| Rechazar exceso de `maxCalls` | ✅ DONE |
| Ejecutar compra con ARENA válida | ✅ DONE |
| Rechazar exceso de spend limit | ✅ DONE |
| Fuzz: nonce inválido siempre revierte | ✅ DONE |
| Fuzz: deadline expirado siempre revierte | ✅ DONE |
| Fuzz: acción no permitida siempre revierte | ✅ DONE |
| Fuzz: maxCalls se respeta con cualquier valor | ✅ DONE |
| Fuzz: spend limit con cualquier monto | ✅ DONE |
| Fuzz: firma incorrecta siempre rechazada | ✅ DONE |
| Fuzz: sesión expirada nunca ejecuta | ✅ DONE |
| Invariant: callCount ≤ maxCalls | ✅ DONE |
| Invariant: tokenSpent ≤ maxTokenSpend | ✅ DONE |
| Invariant: nonce monótonamente creciente | ✅ DONE |
| Invariant: revocación irreversible | ✅ DONE |
| Invariant: sesión revocada no ejecuta | ✅ DONE |
| Invariant: estado on-chain coincide con tracking | ✅ DONE |

**Total: 25/25 tests ✅**

---

# Relayer ✅

| ID | Tarea | Prioridad | Estado |
|---|---|---:|---|
| RELAYER-01 | Setup Express + TypeScript | P0 | DONE |
| RELAYER-02 | Configurar Viem | P0 | DONE |
| RELAYER-03 | Configurar SQLite | P0 | DONE |
| RELAYER-04 | Configurar wallet del relayer desde `.env` | P0 | DONE |
| RELAYER-05 | Endpoint `GET /health` mejorado | P0 | DONE |
| RELAYER-06 | Endpoint `POST /sessions/register` (on-chain) | P0 | DONE |
| RELAYER-07 | Endpoint `POST /sessions/execute` | P0 | DONE |
| RELAYER-08 | Endpoint `POST /sessions/revoke` | P0 | DONE |
| RELAYER-09 | Simular tx antes de enviar | P0 | DONE |
| RELAYER-10 | Guardar sesiones en SQLite | P0 | DONE |
| RELAYER-11 | Guardar acciones en SQLite | P0 | DONE |
| RELAYER-12 | API para dashboard (`/sessions/:id/dashboard`) | P0 | DONE |
| RELAYER-13 | Manejo de errores legibles | P0 | DONE |
| RELAYER-14 | Rate limit básico (60 req/min, configurable) | P1 | DONE |
| RELAYER-15 | Logs estructurados JSON | P1 | DONE |
| RELAYER-16 | Endpoint `GET /social/feed` | P1 | DONE |
| RELAYER-17 | Endpoint `GET /social/live-events` | P1 | DONE |
| RELAYER-18 | Endpoint `GET /social/leaderboard` | P1 | DONE |
| RELAYER-19 | Endpoint `GET /social/stats/:address` | P1 | DONE |

---

# SDK ✅

| ID | Tarea | Prioridad | Estado |
|---|---|---:|---|
| SDK-01 | Crear paquete `sdk` | P0 | DONE |
| SDK-02 | Helper para generar session key | P0 | DONE |
| SDK-03 | Helper EIP-712 para session grant | P0 | DONE |
| SDK-04 | Helper para firmar session grant | P0 | DONE |
| SDK-05 | Helper para firmar action | P0 | DONE |
| SDK-06 | Cliente del relayer (`RelayerClient`) | P0 | DONE |
| SDK-07 | Helper para revocar sesión | P0 | DONE |
| SDK-08 | Helper para spend limit y balance | P1 | DONE |
| SDK-09 | `createSessionOnChain` | P0 | DONE |
| SDK-10 | `getSessionNonce` | P0 | DONE |

---

# Frontend / UX ✅

| ID | Tarea | Prioridad | Estado |
|---|---|---:|---|
| FRONTEND-01 | Setup React + Vite | P0 | DONE |
| FRONTEND-02 | Configurar Wagmi | P0 | DONE |
| FRONTEND-03 | Configurar Tailwind CSS | P0 | DONE |
| FRONTEND-04 | Sistema de 6 tabs | P0 | DONE |
| FRONTEND-05 | `WalletConnect` | P0 | DONE |
| FRONTEND-06 | `PermissionPreview` mejorado | P0 | DONE |
| FRONTEND-07 | `GameBoard` 5x5 | P0 | DONE |
| FRONTEND-08 | `ActionControls` | P0 | DONE |
| FRONTEND-09 | `TokenBalance` | P1 | DONE |
| FRONTEND-10 | `Dashboard` con estados visuales y tx links | P0 | DONE |
| FRONTEND-11 | `StatsBar` — "1 signature → ∞ actions · 0 popups" | P0 | DONE |
| FRONTEND-12 | `SessionKeyBadge` — EPHEMERAL badge con copy | P0 | DONE |
| FRONTEND-13 | `SecurityRejection` — overlay on-chain error | P0 | DONE |
| FRONTEND-14 | `AutoPlay` — Monad Speed Test | P0 | DONE |
| FRONTEND-15 | `SocialFeed` — POST/LIKE/FOLLOW on-chain | P1 | DONE |
| FRONTEND-16 | `LiveExplorer` — eventos en tiempo real | P1 | DONE |
| FRONTEND-17 | `Leaderboard` — ranking on-chain en vivo | P1 | DONE |
| FRONTEND-18 | `ThreatModel` — 6 ataques interactivos | P1 | DONE |
| FRONTEND-19 | `GasComparison` — análisis de costos | P1 | DONE |
| FRONTEND-20 | `ArchitecturePanel` — flujo + "Why Monad?" | P1 | DONE |
| FRONTEND-21 | `Notification` system | P0 | DONE |
| FRONTEND-22 | Faucet & Approve ARENA flow | P0 | DONE |

---

# Integración ✅

| ID | Tarea | Prioridad | Estado |
|---|---|---:|---|
| INT-01 | Frontend ↔ SDK | P0 | DONE |
| INT-02 | SDK ↔ Relayer | P0 | DONE |
| INT-03 | Relayer ↔ Contratos (Viem) | P0 | DONE |
| INT-04 | Estado real del juego desde contrato | P0 | DONE |
| INT-05 | Dashboard desde SQLite + contrato | P0 | DONE |
| INT-06 | Deploy en Monad testnet | P0 | TODO — Phase 6 |
| INT-07 | `.env.example` definitivo | P0 | DONE |
| INT-08 | README completo | P0 | DONE |

---

# Presentación y demo

| ID | Tarea | Prioridad | Estado |
|---|---|---:|---|
| DEMO-01 | Guion de demo (3-4 min) | P0 | DONE — ver `docs/planning/demo-flow.md` |
| DEMO-02 | Video backup | P0 | TODO — Phase 6 |
| DEMO-03 | Datos precargados | P1 | TODO — Phase 6 |
| DEMO-04 | Ensayo general | P0 | TODO — Phase 6 |
| DEMO-05 | Contratos desplegados en Monad testnet | P0 | TODO — Phase 6 |

---

# Pendiente para Phase 6

- [ ] Deploy en Monad testnet
- [ ] Actualizar `.env` con direcciones de Monad testnet
- [ ] Grabar video backup de la demo completa
- [ ] Ensayo: demo en menos de 4 minutos
- [ ] Verificar que `pnpm test:contracts` pase antes del deploy final
