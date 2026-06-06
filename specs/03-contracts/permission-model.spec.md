# Permission Model Spec — Contracts

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `CONTRACT-PERMISSION-MODEL-001` |
| Estado | `Ready` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsable | Dev 1 |

## Objetivo

Definir el modelo de permisos para session keys en el demo de gaming.

El modelo debe ser suficientemente seguro para demostrar valor, pero simple para completarse en la hackathon.

## Acciones soportadas

| Acción | ID conceptual | Gasta token | Descripción |
|---|---:|---:|---|
| `MOVE` | `1` | No | Mueve jugador en el grid |
| `ATTACK` | `2` | No | Ataca enemigo dummy |
| `COLLECT` | `3` | No | Recoge item del mapa |
| `BUY_ITEM` | `4` | Sí | Compra power-up con ARENA |

Los IDs exactos pueden definirse como enum o constantes, pero deben ser estables entre contrato, SDK y frontend.

## Permisos por sesión

Cada sesión debe restringir:

- owner,
- session key,
- contrato de juego permitido,
- acciones permitidas,
- duración,
- máximo de acciones,
- token ERC-20 permitido,
- gasto máximo de token.

## Política default del demo

```text
validUntil: now + 5 minutes
maxCalls: 30
gameContract: DemoGame
allowedActions: MOVE, ATTACK, COLLECT, BUY_ITEM
token: ARENA
maxTokenSpend: 50 ARENA
```

## Validación de acción

Antes de ejecutar cualquier acción:

- la acción debe estar permitida,
- el target debe ser `DemoGame`,
- la sesión debe estar activa,
- `callCount` no debe superar `maxCalls`,
- si hay gasto, no debe superar `maxTokenSpend`.

## Spend limit ERC-20

Para hackathon se soporta un solo token por sesión: `ARENA`.

Reglas:

- `BUY_ITEM` cuesta `10 ARENA`.
- `tokenSpent + itemCost <= maxTokenSpend`.
- El gasto acumulado debe guardarse on-chain.
- El contrato debe impedir gasto por encima del límite aunque el relayer lo permita.

## Allowance

El usuario debe aprobar previamente al `SessionManager` para gastar `ARENA`.

Si no hay allowance suficiente:

- la compra falla,
- el frontend debe mostrar error claro,
- el dashboard puede registrar el error vía relayer.

## Wildcards

Fuera de alcance para hackathon:

- permitir cualquier contrato,
- permitir cualquier acción,
- permitir cualquier token,
- permitir cualquier monto.

No se implementan wildcards.

## Representación recomendada

Para simplificar, `allowedActions` puede representarse como bitmask.

Ejemplo conceptual:

```text
MOVE      = 1 << 0
ATTACK    = 1 << 1
COLLECT   = 1 << 2
BUY_ITEM  = 1 << 3
```

Ventajas:

- barato,
- simple,
- fácil de validar,
- fácil de compartir entre SDK y contrato.

## Criterios de aceptación

- [ ] Una acción permitida se ejecuta correctamente.
- [ ] Una acción no permitida falla.
- [ ] `BUY_ITEM` incrementa gasto acumulado.
- [ ] `BUY_ITEM` falla si supera spend limit.
- [ ] Una sesión no puede ejecutar contra otro contrato de juego.
- [ ] La UI puede mostrar permisos de forma legible.

## Tests mínimos

- sesión con solo `MOVE` no puede ejecutar `ATTACK`,
- sesión con `BUY_ITEM` puede gastar dentro del límite,
- `BUY_ITEM` falla sobre el límite,
- acción inválida no cambia estado de `DemoGame`,
- `maxCalls` aplica a todas las acciones.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| IDs desalineados entre frontend y contrato | Exportar constantes compartidas |
| Spend limit mal interpretado por decimals | Usar `parseUnits` y mostrar valores normalizados |
| Gasto actualizado después de external call | Actualizar estado antes de llamar a `DemoGame` |
| `approve` confunde al usuario | Explicar allowance en UI o preaprobar en demo |
