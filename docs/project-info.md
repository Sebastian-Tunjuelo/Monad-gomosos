# Project Info — Monad Session Arena

## Metodología oficial

El proyecto se desarrollará usando **SDD — Spec-Driven Development**.

La fuente de verdad para funcionalidades, arquitectura y criterios de aceptación será el directorio:

```text
specs/
```

## Regla principal

```text
Spec primero → implementación mínima → verificación → demo estable
```

## Prioridad del proyecto

1. UX clara.
2. Seguridad mínima sólida.
3. Demo estable en Monad testnet.
4. Infraestructura reutilizable en fases posteriores.

## Demo principal

```text
Connect wallet
→ Create session
→ Play without wallet popups
→ Buy item with ARENA under spend limit
→ Show dashboard
→ Revoke session
→ Action fails after revoke
```

## Estructura documental

| Carpeta | Rol |
|---|---|
| `specs/` | Fuente de verdad SDD |
| `docs/planning/` | Planificación, roadmap y guion |
| `packages/contracts/` | Contratos Solidity |
| `apps/relayer/` | Relayer Express + SQLite |
| `packages/sdk/` | SDK TypeScript |
| `apps/frontend/` | Demo React + Vite |

## Specs iniciales

- `specs/00-process/sdd-methodology.md`
- `specs/01-product/product-scope.spec.md`
- `specs/02-architecture/system-architecture.spec.md`
- `specs/03-contracts/session-lifecycle.spec.md`
- `specs/03-contracts/permission-model.spec.md`
- `specs/03-contracts/eip712-signatures.spec.md`
- `specs/04-relayer/relayer-api-initial.spec.md`
- `specs/05-sdk/sdk-initial.spec.md`
- `specs/06-frontend/ux-initial.spec.md`
- `specs/07-testing/verification-plan.spec.md`
- `specs/08-demo/vertical-slice-01-move.spec.md`

## Orden recomendado de implementación

1. Completar vertical slice `MOVE`.
2. Añadir revocación visible.
3. Añadir dashboard mínimo.
4. Añadir `ATTACK` y `COLLECT`.
5. Añadir `GameToken` y `BUY_ITEM`.
6. Añadir spend limit.
7. Pulir UX y pruebas.
