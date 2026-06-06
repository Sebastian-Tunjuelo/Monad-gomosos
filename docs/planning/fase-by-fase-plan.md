# Development Plan — Monad Session Arena

Plan general de desarrollo en 6 fases. El enfoque recomendado es construir primero un vertical slice completo y luego añadir features.

## Regla principal

No construir todas las capas en aislamiento. Primero lograr este flujo mínimo:

```text
Wallet firma sesión
  → session key firma acción
  → relayer envía tx
  → SessionManager valida
  → DemoGame actualiza estado
  → dashboard muestra actividad
```

Cuando ese flujo funcione, se agregan permisos, spend limit, tests y pulido.

## Equipo

| Rol | Responsable sugerido | Foco |
|---|---|---|
| Dev 1 | Smart contracts lead | Solidity, Foundry, tests, deploy |
| Dev 2 | Relayer / SDK lead | Express, Viem, SQLite, EIP-712 TS |
| Dev 3 | Frontend / UX lead | React, Vite, Wagmi, Tailwind, dashboard |

---

# Fase 1 — Setup y contratos base

## Objetivo de la fase

Tener el proyecto estructurado y la creación/revocación de sesiones encaminada.

## Dev 1 — Smart contracts

Tareas:

- Inicializar Foundry.
- Crear estructura `packages/contracts`.
- Crear `SessionTypes`.
- Crear `SessionErrors`.
- Crear `SessionEvents`.
- Crear `SessionEIP712`.
- Crear `SessionManager` base.
- Implementar estructura de estado de sesión.
- Implementar `createSession` inicial.
- Implementar `revokeSession` inicial.
- Empezar tests de creación y revocación.

Entregable:

```text
SessionManager puede crear y revocar una sesión en tests locales.
```

## Dev 2 — Relayer / SDK

Tareas:

- Inicializar workspace `pnpm`.
- Crear estructura `apps/relayer`.
- Configurar Express + TypeScript.
- Configurar Viem.
- Configurar SQLite.
- Crear endpoint `GET /health`.
- Crear estructura `packages/sdk`.
- Preparar helpers de typed data EIP-712.
- Definir `.env.example` inicial.

Entregable:

```text
Relayer levanta, responde /health y tiene conexión base con Viem.
```

## Dev 3 — Frontend / UX

Tareas:

- Inicializar React + Vite.
- Configurar Wagmi.
- Configurar Tailwind CSS.
- Crear layout base.
- Crear componente `WalletConnect`.
- Crear mock de `PermissionPreview`.
- Crear mock de dashboard.
- Crear mock visual del tablero 5x5.

Entregable:

```text
Frontend abre, conecta wallet y muestra layout inicial del juego.
```

## Criterio de éxito de la fase

- Repo organizado.
- Contratos base creados.
- Relayer base funcionando.
- Frontend base funcionando.
- Equipo alineado sobre nombres y flujo.

---

# Fase 2 — Ejecución con session key

## Objetivo de la fase

Lograr que una session key ejecute una acción válida en el contrato de juego.

## Dev 1 — Smart contracts

Tareas:

- Implementar validación de firma de session key.
- Implementar nonce secuencial.
- Implementar expiración por `validUntil`.
- Implementar `executeAction`.
- Crear `DemoGame`.
- Implementar acción `MOVE`.
- Emitir eventos de ejecución.
- Tests de acción válida.
- Tests de nonce inválido o repetido.

Entregable:

```text
Una session key puede ejecutar MOVE en DemoGame mediante SessionManager.
```

## Dev 2 — Relayer / SDK

Tareas:

- Implementar endpoint `POST /sessions/execute`.
- Implementar envío de tx con Viem.
- Implementar simulación previa con `eth_call` o equivalente.
- Implementar helper SDK para generar session key.
- Implementar helper SDK para firmar action.
- Crear script end-to-end sin frontend.

Entregable:

```text
Script TypeScript crea/firma acción y el relayer la envía al contrato.
```

## Dev 3 — Frontend / UX

Tareas:

- Crear `GameBoard` funcional visualmente.
- Crear controles básicos de movimiento.
- Integrar generación de session key si el SDK está listo.
- Mostrar estado de sesión mock o real parcial.
- Mejorar `PermissionPreview`.

Entregable:

```text
UI puede representar movimiento y está lista para conectarse al relayer.
```

## Criterio de éxito de la fase

- Vertical slice técnico mínimo funcionando desde script.
- MOVE ejecuta en contrato.
- Nonce básico protege contra replay.

---

# Fase 3 — Permisos, límites y primera integración completa

## Objetivo de la fase

Tener demo funcional sin ERC-20 spend limit todavía.

## Dev 1 — Smart contracts

Tareas:

- Añadir allowed actions.
- Añadir allowed target o game contract permitido.
- Añadir `maxCalls`.
- Añadir acción `ATTACK`.
- Añadir acción `COLLECT`.
- Tests de acción no permitida.
- Tests de max calls excedido.
- Tests de sesión expirada.
- Tests de sesión revocada.

Entregable:

```text
SessionManager valida acción, target, expiración, revocación y maxCalls.
```

## Dev 2 — Relayer / SDK

Tareas:

- Implementar endpoint `POST /sessions/register`.
- Implementar endpoint `POST /sessions/revoke`.
- Guardar sesiones en SQLite.
- Guardar acciones en SQLite.
- Crear API básica de dashboard.
- Mejorar errores devueltos al frontend.
- Conectar SDK con endpoints reales.

Entregable:

```text
Relayer registra sesiones, ejecuta acciones, revoca y expone datos para dashboard.
```

## Dev 3 — Frontend / UX

Tareas:

- Integrar frontend con SDK/relayer.
- Crear flujo real de crear sesión.
- Ejecutar MOVE desde UI.
- Añadir botones ATTACK y COLLECT.
- Mostrar acciones usadas.
- Mostrar tiempo restante.
- Crear botón de revocación.
- Mostrar error después de revocar.

Entregable:

```text
Demo funcional: crear sesión, jugar, ver dashboard, revocar, acción falla.
```

## Criterio de éxito de la fase

Debe funcionar este flujo:

```text
Connect wallet → create session → move → attack → collect → dashboard → revoke → move fails
```

---

# Fase 4 — ERC-20 spend limit y UX final de permisos

## Objetivo de la fase

Añadir el diferenciador de gasto controlado con token `ARENA`.

## Dev 1 — Smart contracts

Tareas:

- Crear `GameToken` ERC-20 mock.
- Implementar mint inicial o faucet simple.
- Añadir estructura de spend limit.
- Añadir gasto acumulado por sesión.
- Implementar acción `BUY_ITEM`.
- Validar `maxTokenSpend`.
- Tests de compra válida.
- Tests de spend limit excedido.
- Tests de compra después de revocación.

Entregable:

```text
La sesión puede comprar un item con ARENA sin superar el spend limit.
```

## Dev 2 — Relayer / SDK

Tareas:

- Añadir soporte SDK para spend limit.
- Añadir lectura de balance y allowance.
- Añadir endpoint/servicio para estado de gasto.
- Persistir gasto usado en SQLite o derivarlo de eventos.
- Mejorar errores de spend limit.

Entregable:

```text
Relayer y SDK soportan acciones BUY_ITEM y reportan gasto usado.
```

## Dev 3 — Frontend / UX

Tareas:

- Mostrar balance de ARENA.
- Mostrar allowance si el tiempo lo permite.
- Crear UI de comprar item.
- Mostrar gasto usado y restante.
- Pulir `PermissionPreview` con spend limit.
- Crear mensajes de error claros.

Entregable:

```text
Frontend muestra compra de item, gasto restante y errores de límite.
```

## Criterio de éxito de la fase

Debe funcionar:

```text
Crear sesión con 50 ARENA de límite → comprar item por 10 ARENA → dashboard muestra 10/50 → intento excedido falla
```

---

# Fase 5 — Testing, seguridad y observabilidad

## Objetivo de la fase

Hacer el proyecto defendible ante un jurado técnico.

## Dev 1 — Smart contracts

Tareas:

- Completar tests unitarios críticos.
- Añadir fuzz básico.
- Añadir invariants básicos.
- Ejecutar gas report.
- Intentar ejecutar Slither si el setup no consume demasiado tiempo.
- Revisar custom errors.
- Revisar orden de validaciones.

Invariants mínimos:

```text
Una sesión revocada nunca ejecuta.
Una sesión expirada nunca ejecuta.
Un nonce no puede ejecutarse dos veces.
callCount no supera maxCalls.
spentAmount no supera maxTokenSpend.
Una acción no permitida nunca actualiza DemoGame.
```

Entregable:

```text
Tests críticos pasando y lista corta de garantías de seguridad.
```

## Dev 2 — Relayer / SDK

Tareas:

- Mejorar logs estructurados.
- Añadir health check más útil.
- Añadir rate limit básico si es rápido.
- Mejorar API de dashboard.
- Registrar latencia aproximada.
- Registrar errores de simulación.
- Preparar `.env.example` definitivo.

Entregable:

```text
Relayer estable, observable y con errores comprensibles.
```

## Dev 3 — Frontend / UX

Tareas:

- Pulir dashboard.
- Pulir estados visuales: Active, Revoked, Expired.
- Añadir historial de acciones.
- Añadir links a tx si hay explorer disponible.
- Pulir copy del modal de permisos.
- Crear pantalla o sección de arquitectura simple.

Entregable:

```text
Demo visualmente clara y lista para ensayo.
```

## Criterio de éxito de la fase

- Demo completa funciona.
- Tests principales pasan.
- Dashboard es entendible.
- Errores se ven claros.
- No se agregan features grandes nuevas después de esta fase.

---

# Fase 6 — Deploy, ensayo y presentación

## Objetivo de la fase

Estabilizar. No construir features nuevas.

## Todos

Tareas:

- Deploy final en Monad testnet.
- Guardar direcciones finales.
- Actualizar frontend con direcciones finales.
- Actualizar relayer con direcciones finales.
- Probar demo completa varias veces.
- Grabar video backup.
- Escribir README.
- Preparar pitch de 3-4 minutos.
- Preparar slides breves si aplica.
- Congelar cambios.
- Solo bugfixes.

## Dev 1

- Deploy final.
- Verificar contratos si es viable.
- Exportar ABIs.
- Confirmar tests finales.

## Dev 2

- Deploy/levantar relayer.
- Confirmar SQLite.
- Confirmar logs.
- Confirmar health check.
- Preparar fallback local.

## Dev 3

- Deploy/servir frontend.
- Ensayar demo.
- Preparar video backup.
- Preparar narrativa UX.
- Revisar responsive básico.

## Criterio de éxito final

La demo puede ejecutarse en menos de 4 minutos:

```text
Connect wallet
→ Mint/approve ARENA si hace falta
→ Create session
→ Play without popups
→ Buy item
→ Show dashboard
→ Revoke
→ Action fails
```

---

# Congelamiento de alcance

A partir de la mitad de la Fase 5:

```text
No nuevas features.
Solo bugs, estabilidad y demo.
```

Si una feature no está integrada al final de la Fase 4, se evalúa seriamente moverla a una iteración futura.

---

# Riesgos y mitigaciones

## EIP-712 se retrasa

Mitigación:

- Probar hashing Solidity + TypeScript desde la Fase 1.
- Mantener solo dos typed data principales: session grant y session action.

## Relayer falla

Mitigación:

- Logs claros.
- Script end-to-end.
- Video backup.
- No agregar complejidad innecesaria.

## ERC-20 spend limit retrasa

Mitigación:

- Tratarlo como P1.
- Si el core no está estable, mantenerlo simple o moverlo a stretch.

## Dashboard consume mucho tiempo

Mitigación:

- Dashboard simple con SQLite.
- No indexer complejo.
- Mostrar solo estado y últimas acciones.

## Demo falla en vivo

Mitigación:

- Ensayar en la Fase 6.
- Video backup.
- Wallet y RPC backup.
- Datos precargados.

---

# Checklist final

## Contratos

- [ ] `SessionManager` desplegado.
- [ ] `DemoGame` desplegado.
- [ ] `GameToken` desplegado.
- [ ] Tests principales pasan.
- [ ] Direcciones documentadas.

## Relayer

- [ ] `/health` responde.
- [ ] `/sessions/register` funciona.
- [ ] `/sessions/execute` funciona.
- [ ] `/sessions/revoke` funciona.
- [ ] SQLite guarda sesiones y acciones.
- [ ] Logs son legibles.

## Frontend

- [ ] Wallet conecta.
- [ ] Session preview claro.
- [ ] Crear sesión funciona.
- [ ] MOVE funciona.
- [ ] ATTACK funciona.
- [ ] COLLECT funciona.
- [ ] BUY_ITEM funciona si entra en alcance final.
- [ ] Dashboard muestra estado.
- [ ] Revocación funciona.
- [ ] Acción después de revocar falla.

## Presentación

- [ ] Pitch listo.
- [ ] Demo ensayada.
- [ ] Video backup listo.
- [ ] README listo.
- [ ] Slides listas si aplican.
