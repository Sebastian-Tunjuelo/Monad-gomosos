# Product Scope Spec — Monad Session Arena

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `PRODUCT-SCOPE-001` |
| Estado | `Ready` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsable | Equipo completo |

## Problema

Los juegos on-chain requieren muchas acciones pequeñas y frecuentes. Si cada movimiento, ataque o compra abre una wallet para firmar, la experiencia se vuelve lenta, frustrante e inviable para usuarios no técnicos.

Monad permite transacciones rápidas y de bajo costo, pero esa ventaja técnica necesita una capa de UX que permita a los usuarios ejecutar acciones frecuentes sin sacrificar seguridad.

## Solución

Construir **Monad Session Arena**, una demo de gaming on-chain donde el usuario:

1. conecta su wallet,
2. autoriza una session key temporal con una sola firma,
3. ejecuta múltiples acciones vía relayer,
4. visualiza límites y actividad en dashboard,
5. puede revocar la sesión,
6. y verifica que una acción posterior a la revocación falla.

## Objetivo principal

Demostrar UX superior para juegos on-chain en Monad usando session keys temporales con permisos limitados.

## Usuarios objetivo

| Usuario | Necesidad |
|---|---|
| Jugador | Jugar sin firmar cada acción |
| Desarrollador de dApps | Integrar session keys simples y seguras |
| Jurado de hackathon | Ver valor claro, demo estable y encaje con Monad |

## Demo objetivo

```text
Connect wallet
→ Create session
→ Play without wallet popups
→ Buy item with ARENA under spend limit
→ Show dashboard
→ Revoke session
→ Action fails after revoke
```

## Alcance incluido

- Demo gaming en grid `5x5`.
- Session key temporal.
- Relayer obligatorio.
- Ejecución directa contra `DemoGame`.
- EIP-712 para autorización de sesión.
- Firma de acciones con session key.
- Nonce secuencial.
- Expiración de sesión.
- Revocación inmediata.
- Límite máximo de acciones.
- Acciones permitidas explícitas.
- Token ERC-20 mock `ARENA`.
- Spend limit simple para `BUY_ITEM`.
- Dashboard con estado y actividad.
- Deploy en Monad testnet.

## Fuera de alcance para hackathon

- ERC-4337.
- Paymasters.
- Smart accounts universales.
- ERC-2771 formal.
- Compatibilidad con cualquier contrato EVM.
- Nonce lanes.
- Batch execution.
- Calldata validators avanzados.
- Multi-token spend limits.
- Multi-relayer.
- Auditoría formal.
- SDK publicado en npm.

## Parámetros de demo

| Parámetro | Valor |
|---|---|
| Nombre del juego | Monad Session Arena |
| Token | ARENA |
| Duración de sesión | 5 minutos |
| Máximo de acciones | 30 |
| Spend limit | 50 ARENA |
| Costo de item | 10 ARENA |
| Acciones | `MOVE`, `ATTACK`, `COLLECT`, `BUY_ITEM` |

## Métricas de éxito

La demo es exitosa si se puede mostrar:

- una sola firma inicial,
- al menos 5 acciones sin wallet popup,
- dashboard actualizando actividad,
- compra con ARENA bajo límite,
- rechazo de acción no permitida o límite excedido,
- revocación efectiva,
- fallo posterior a revocación.

## Criterios de aceptación

- [ ] El flujo de demo puede completarse en menos de 4 minutos.
- [ ] La session key no puede ejecutar después de expiración.
- [ ] La session key no puede ejecutar después de revocación.
- [ ] El usuario entiende visualmente qué autorizó.
- [ ] El dashboard muestra estado, acciones usadas y gasto usado.
- [ ] El proyecto corre sobre Monad testnet.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Alcance demasiado amplio | Mantener demo centrado en vertical slice |
| EIP-712 retrasa integración | Probar hashing Solidity/TypeScript desde la Phase 1 |
| Relayer falla | Logs, health check y video backup |
| Spend limit consume demasiado tiempo | Tratar como P1; core primero |
| UX poco clara | Priorizar `PermissionPreview` y dashboard |
