# Relayer API Initial Spec

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `RELAYER-API-001` |
| Estado | `Draft` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsable | Dev 2 |

## Objetivo

Definir la API inicial del relayer para soportar el primer vertical slice: crear sesión y ejecutar `MOVE`.

## Responsabilidades del relayer

- Recibir requests del SDK/frontend.
- Validar forma básica del payload.
- Simular transacción si es viable.
- Enviar transacción a Monad testnet.
- Guardar sesión, acción, tx hash y errores en SQLite.
- Exponer datos mínimos para dashboard.

## No responsabilidades

El relayer no debe:

- custodiar la session private key,
- decidir seguridad crítica,
- modificar acciones firmadas,
- saltarse validaciones on-chain,
- ser fuente de verdad del estado final.

## Endpoints iniciales

```text
GET  /health
POST /sessions/register
POST /sessions/execute
POST /sessions/revoke
GET  /sessions/:sessionId
GET  /dashboard/events
```

## `GET /health`

Debe devolver:

```text
status
chainId
relayerAddress
sessionManagerAddress
```

## `POST /sessions/register`

Propósito:

- enviar o registrar la creación de una sesión.

Debe recibir conceptualmente:

- session policy,
- owner signature.

Debe devolver:

- sessionId,
- txHash,
- status.

## `POST /sessions/execute`

Propósito:

- ejecutar una acción firmada por la session key.

Debe recibir conceptualmente:

- sessionId,
- action,
- params,
- nonce,
- deadline,
- session signature.

Debe devolver:

- txHash,
- status,
- error si falla.

## `POST /sessions/revoke`

Propósito:

- revocar una sesión vía relayer.

Debe recibir:

- sessionId,
- autorización suficiente del owner según implementación final.

Debe devolver:

- txHash,
- status.

## SQLite mínimo

Tablas conceptuales:

- `sessions`,
- `actions`,
- `transactions`,
- `errors`.

## Criterios de aceptación

- [ ] `/health` responde correctamente.
- [ ] El relayer puede enviar `createSession`.
- [ ] El relayer puede enviar `executeAction` para `MOVE`.
- [ ] El relayer guarda tx hash.
- [ ] El dashboard puede leer últimas acciones.
- [ ] Los errores son legibles para frontend.

## Estado

Esta spec queda en `Draft` hasta que se definan payloads exactos desde las specs de contratos y SDK.
