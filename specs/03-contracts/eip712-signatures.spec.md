# EIP-712 Signatures Spec — Contracts and SDK

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `CONTRACT-EIP712-001` |
| Estado | `Ready` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsables | Dev 1, Dev 2 |

## Objetivo

Definir las firmas EIP-712 necesarias para crear sesiones y ejecutar acciones con session keys, evitando replay attacks y manteniendo compatibilidad entre Solidity y TypeScript.

## Tipos firmables

Para hackathon solo se definen dos tipos principales:

1. `SessionGrant` — firmado por la wallet principal del usuario.
2. `SessionAction` — firmado por la session key temporal.

No se agregan más tipos salvo necesidad crítica.

## Domain separator

El dominio EIP-712 debe incluir:

| Campo | Valor |
|---|---|
| `name` | `MonadSessionArena` |
| `version` | `1` |
| `chainId` | Chain ID de Monad testnet |
| `verifyingContract` | Dirección de `SessionManager` |

Esto evita replay entre cadenas y entre contratos.

## `SessionGrant`

Firmado por el owner.

Campos conceptuales:

```text
owner
sessionKey
validUntil
maxCalls
gameContract
allowedActions
token
maxTokenSpend
salt
```

### Propósito

Autorizar la creación de una sesión limitada.

### Reglas

- `owner` debe coincidir con el firmante recuperado.
- `sessionKey` será la clave temporal autorizada.
- `validUntil` define expiración.
- `salt` evita colisión entre sesiones similares.
- `allowedActions` debe estar comprometido en la firma.
- `maxTokenSpend` debe estar comprometido en la firma.

## `SessionAction`

Firmado por la session key.

Campos conceptuales:

```text
sessionId
nonce
action
paramsHash
deadline
```

### Propósito

Autorizar una acción específica de juego.

### Reglas

- `sessionId` vincula la acción a una sesión concreta.
- `nonce` previene replay.
- `action` define qué acción se ejecuta.
- `paramsHash` compromete parámetros de acción.
- `deadline` evita ejecución tardía de acciones firmadas.

## `sessionId`

Debe derivarse de datos únicos de sesión.

Campos recomendados:

```text
owner
sessionKey
validUntil
maxCalls
gameContract
allowedActions
token
maxTokenSpend
salt
chainId
verifyingContract
```

El objetivo es que dos sesiones con permisos similares no colisionen.

## Nonce

Modelo para hackathon: nonce secuencial por sesión.

Regla:

```text
SessionAction.nonce == currentSessionNonce
```

Después de ejecución válida:

```text
currentSessionNonce += 1
```

## Deadline de acción

Cada `SessionAction` debe incluir un `deadline` corto.

Recomendación de demo:

```text
deadline = now + 30 seconds
```

Esto limita el riesgo de acciones firmadas pero enviadas tarde.

## Anti-replay checklist

Una firma no debe poder reutilizarse:

- en otra chain,
- en otro `SessionManager`,
- en otra sesión,
- con otro nonce,
- con otra acción,
- con otros parámetros,
- después del deadline,
- después de revocación,
- después de expiración.

## Compatibilidad Solidity/TypeScript

Dev 1 y Dev 2 deben validar desde la Phase 1 que:

- el hash generado en Solidity coincide con el typed data de TypeScript,
- la firma del owner se recupera correctamente,
- la firma de session key se recupera correctamente.

## Criterios de aceptación

- [ ] `SessionGrant` válido crea sesión.
- [ ] `SessionGrant` con chainId incorrecto falla.
- [ ] `SessionGrant` con verifyingContract incorrecto falla.
- [ ] `SessionAction` válido ejecuta acción.
- [ ] Reutilizar `SessionAction` con mismo nonce falla.
- [ ] Cambiar parámetros después de firmar falla.
- [ ] Acción con deadline vencido falla.

## Tests mínimos

Foundry:

- recover owner correcto,
- reject owner signature inválida,
- recover session key correcto,
- reject action signature inválida,
- reject nonce replay,
- reject expired deadline.

TypeScript script:

- generar session key,
- construir typed data,
- firmar grant,
- firmar action,
- enviar al contrato o simular.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Mismatch Solidity/TS | Test end-to-end temprano |
| Tipos dinámicos complican hashing | Usar tipos simples y `paramsHash` |
| Replay cross-chain | Incluir `chainId` en domain |
| Replay cross-contract | Incluir `verifyingContract` en domain |
