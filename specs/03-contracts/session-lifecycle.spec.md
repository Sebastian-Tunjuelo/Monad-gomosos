# Session Lifecycle Spec — Contracts

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `CONTRACT-SESSION-LIFECYCLE-001` |
| Estado | `Ready` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsable | Dev 1 |

## Objetivo

Definir el ciclo de vida de una sesión en `SessionManager`: creación, ejecución, expiración y revocación.

## Estados de sesión

| Estado | Descripción |
|---|---|
| `NotCreated` | La sesión no existe on-chain |
| `Active` | La sesión existe, no expiró y no fue revocada |
| `Expired` | `block.timestamp > validUntil` |
| `Revoked` | El owner revocó la sesión |
| `Exhausted` | La sesión alcanzó `maxCalls` o spend limit |

Para hackathon no es obligatorio guardar un enum de estado; puede derivarse de storage.

## Creación de sesión

### Entrada conceptual

`createSession` debe recibir una autorización firmada por el owner.

Campos mínimos de la política:

- `owner`,
- `sessionKey`,
- `validUntil`,
- `maxCalls`,
- `gameContract`,
- `allowedActions`,
- `token`,
- `maxTokenSpend`,
- `salt`.

### Validaciones

- El owner no puede ser `address(0)`.
- La session key no puede ser `address(0)`.
- `validUntil` debe estar en el futuro.
- `maxCalls` debe ser mayor que cero.
- La firma del owner debe ser válida.
- El `sessionId` no debe existir previamente.

### Resultado

Crear estado inicial:

- nonce = `0`,
- callCount = `0`,
- tokenSpent = `0`,
- revoked = `false`.

Emitir evento `SessionCreated`.

## Ejecución de acción

### Entrada conceptual

`executeAction` debe recibir:

- política o datos de sesión necesarios,
- acción solicitada,
- parámetros de acción,
- firma de session key.

### Validaciones obligatorias

En cada ejecución:

- la sesión existe,
- la sesión no está revocada,
- la sesión no expiró,
- nonce esperado,
- firma de session key válida,
- acción permitida,
- `callCount < maxCalls`,
- si la acción gasta token, `tokenSpent + amount <= maxTokenSpend`.

### Efectos

Antes de llamar a `DemoGame`, actualizar:

- nonce,
- callCount,
- tokenSpent si aplica.

Esto reduce riesgo de replay y reentrancy.

### Resultado

- Llamar a `DemoGame` con `owner` y acción.
- Emitir `SessionActionExecuted`.

## Expiración

Una sesión expira cuando:

```text
block.timestamp > validUntil
```

La expiración se valida en cada ejecución.

No es necesario ejecutar una función para expirar sesiones.

## Revocación

`revokeSession` debe permitir que el owner revoque una sesión.

Para hackathon, revocación vía relayer puede hacerse si el owner firma una operación de revocación o si se acepta que el relayer envíe una tx solicitada desde frontend con autorización clara. La validación final debe impedir revocar sesiones ajenas.

Validaciones:

- la sesión existe,
- quien revoca debe ser el owner o una firma válida del owner,
- si ya está revocada, puede revertir o ser idempotente.

Resultado:

- `revoked = true`,
- emitir `SessionRevoked`.

## Eventos requeridos

| Evento | Uso |
|---|---|
| `SessionCreated` | Dashboard y trazabilidad |
| `SessionActionExecuted` | Historial de acciones |
| `SessionRevoked` | Seguridad visible |
| `SessionActionRejected` | Opcional; útil si se decide no revertir en algunos fallos |

Para MVP, los rechazos pueden ser reverts con custom errors.

## Custom errors esperados

- `InvalidOwner()`
- `InvalidSessionKey()`
- `SessionAlreadyExists()`
- `SessionNotFound()`
- `SessionExpired()`
- `SessionRevoked()`
- `InvalidSignature()`
- `InvalidNonce()`
- `MaxCallsExceeded()`
- `ActionNotAllowed()`
- `SpendLimitExceeded()`

## Criterios de aceptación

- [ ] Se puede crear una sesión válida.
- [ ] No se puede crear una sesión con firma inválida.
- [ ] Se puede ejecutar una acción válida con session key.
- [ ] No se puede reutilizar el mismo nonce.
- [ ] No se puede ejecutar después de revocar.
- [ ] No se puede ejecutar después de expirar.
- [ ] No se puede superar `maxCalls`.
- [ ] Los eventos mínimos se emiten correctamente.

## Validación mínima

Foundry tests:

- creación válida,
- firma inválida,
- ejecución válida,
- replay de nonce,
- expiración,
- revocación,
- max calls.

## Dependencias

- `eip712-signatures.spec.md`
- `permission-model.spec.md`
- `system-architecture.spec.md`
