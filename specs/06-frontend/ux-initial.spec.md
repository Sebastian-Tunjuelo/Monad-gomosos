# Initial UX Spec — Monad Session Arena

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `FRONTEND-UX-001` |
| Estado | `Draft` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsable | Dev 3 |

## Objetivo

Definir la experiencia inicial que debe soportar la demo: conectar wallet, crear sesión, jugar sin popups, ver dashboard y revocar.

## Principio UX

El usuario debe entender tres cosas rápidamente:

1. Qué está autorizando.
2. Qué puede hacer la session key.
3. Cómo detenerla.

## Pantallas o secciones

| Sección | Propósito |
|---|---|
| Header | Estado de wallet y red |
| PermissionPreview | Mostrar permisos antes de firmar |
| GameBoard | Grid 5x5 y jugador |
| ActionControls | Botones de acción |
| SessionStatus | Estado, tiempo, nonce, acciones restantes |
| Dashboard | Historial de acciones y txs |
| ErrorPanel | Errores legibles |

## PermissionPreview mínimo

Debe mostrar:

```text
Duration: 5 minutes
Max actions: 30
Allowed actions: MOVE, ATTACK, COLLECT, BUY_ITEM
Spend limit: 50 ARENA
Revocable at any time
```

## Estados visuales de sesión

| Estado | UI esperada |
|---|---|
| No session | CTA para crear sesión |
| Active | Badge verde o claro |
| Revoked | Badge rojo y acciones deshabilitadas |
| Expired | Badge amarillo/neutral y CTA nueva sesión |
| Error | Mensaje visible y accionable |

## Errores legibles

| Error | Mensaje UX |
|---|---|
| `SessionRevoked` | Session revoked. Create a new session. |
| `SessionExpired` | Session expired. Create a new session. |
| `InvalidNonce` | Action order invalid. Please retry. |
| `ActionNotAllowed` | This action is not allowed. |
| `SpendLimitExceeded` | Token spend limit exceeded. |
| Relayer error | Relayer could not submit the transaction. |

## Criterios de aceptación

- [ ] Usuario puede conectar wallet.
- [ ] Usuario entiende permisos antes de firmar.
- [ ] `MOVE` no abre wallet popup.
- [ ] Dashboard muestra última acción.
- [ ] Revocación es visible.
- [ ] Acción después de revocar muestra error claro.

## Estado

Esta spec queda en `Draft` hasta que existan componentes reales y se definan estilos finales.
