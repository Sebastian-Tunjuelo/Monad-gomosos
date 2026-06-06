# SDK Initial Spec — Session Client

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `SDK-INITIAL-001` |
| Estado | `Draft` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsable | Dev 2 |

## Objetivo

Definir el comportamiento inicial del SDK TypeScript para permitir que el frontend cree sesiones y ejecute acciones mediante el relayer sin duplicar lógica crítica en la UI.

## Responsabilidades del SDK

El SDK debe proveer helpers para:

- generar session key temporal,
- construir policy default del demo,
- construir typed data EIP-712,
- solicitar firma del owner desde wallet,
- firmar acciones con session key,
- llamar al relayer,
- devolver errores legibles al frontend.

## No responsabilidades

El SDK no debe:

- guardar private keys en backend,
- custodiar fondos,
- sustituir validaciones on-chain,
- asumir que SQLite es fuente de verdad,
- implementar lógica compleja de account abstraction.

## API conceptual inicial

Funciones esperadas:

```text
createSessionKey()
buildDefaultSessionPolicy()
buildSessionGrantTypedData()
signSessionGrant()
buildSessionActionTypedData()
signSessionAction()
registerSession()
executeMove()
revokeSession()
getSessionStatus()
```

Los nombres pueden ajustarse durante implementación, pero las responsabilidades deben mantenerse.

## Datos compartidos

El SDK debe usar constantes compartidas para:

- action IDs,
- chain config,
- contract addresses,
- EIP-712 domain,
- default session duration,
- default max calls,
- default spend limit.

## Session key

Para hackathon:

- se genera en frontend,
- puede mantenerse en memoria o session storage,
- nunca se envía al relayer,
- solo se usa para firmar `SessionAction`.

## Flujo `MOVE`

```text
1. Frontend llama createSessionKey().
2. Frontend llama buildDefaultSessionPolicy().
3. Usuario firma SessionGrant.
4. SDK llama registerSession().
5. Usuario hace click MOVE.
6. SDK firma SessionAction.
7. SDK llama executeMove() en relayer.
8. SDK devuelve txHash o error al frontend.
```

## Criterios de aceptación

- [ ] El SDK puede generar una session key local.
- [ ] El SDK puede construir typed data compatible con Solidity.
- [ ] El SDK puede firmar `SessionAction` con la session key.
- [ ] El SDK puede llamar al relayer para ejecutar `MOVE`.
- [ ] El frontend no duplica hashing EIP-712 manualmente.
- [ ] Los errores se devuelven en formato legible.

## Dependencias

- `CONTRACT-EIP712-001`
- `RELAYER-API-001`
- `DEMO-VS-001`

## Estado

Esta spec queda en `Draft` hasta que se cierren los payloads exactos de contratos y relayer.
