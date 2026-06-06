# Verification Plan Spec — Hackathon

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `TEST-VERIFICATION-001` |
| Estado | `Draft` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsables | Equipo completo |

## Objetivo

Definir la verificación mínima necesaria para no declarar funcionalidades terminadas sin evidencia.

## Principio

```text
No completion claim without fresh verification evidence.
```

## Verificación por área

| Área | Verificación mínima |
|---|---|
| Contratos | `forge test` |
| Contratos seguridad | tests de replay, expiración, revocación, maxCalls |
| Relayer | `GET /health`, script end-to-end |
| SDK | firma EIP-712 compatible con Solidity |
| Frontend | flujo manual completo |
| Demo final | ensayo completo + video backup |

## Tests P0 de contratos

- crear sesión válida,
- rechazar firma inválida,
- ejecutar `MOVE`,
- rechazar nonce repetido,
- rechazar sesión expirada,
- rechazar sesión revocada,
- rechazar acción no permitida,
- rechazar exceso de `maxCalls`.

## Tests P1 de contratos

- `BUY_ITEM` válida,
- spend limit excedido,
- allowance insuficiente,
- token incorrecto,
- fuzz de nonces,
- invariant de sesión revocada.

## Checks de relayer

- `/health` responde,
- puede enviar tx,
- registra tx hash,
- registra error de simulación,
- no guarda private keys de usuario,
- no recibe session private key.

## Checks de frontend

- wallet conecta,
- permiso se entiende,
- session status visible,
- acción sin popup,
- errores visibles,
- revocación visible.

## Criterios de aceptación

- [ ] Cada feature marcada como done tiene evidencia.
- [ ] La demo principal pasa de punta a punta.
- [ ] Existen tests P0 para contratos.
- [ ] Existe script o flujo manual para relayer.
- [ ] Existe video backup en la Phase 6.

## Estado

Esta spec está en `Draft` porque debe actualizarse cuando existan comandos definitivos y scripts reales.
