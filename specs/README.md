# Specs — Monad Session Arena

Este directorio es la **fuente de verdad técnica y funcional** del proyecto bajo la metodología **SDD — Spec-Driven Development**.

Antes de implementar una parte importante del sistema, debe existir una spec mínima que explique:

- qué problema resuelve,
- qué comportamiento se espera,
- qué queda fuera,
- qué interfaces toca,
- cómo se valida,
- y cuáles son los criterios de aceptación.

## Principio del proyecto

```text
Spec primero → implementación mínima → verificación → demo estable
```

## Estructura

```text
specs/
  00-process/       Proceso SDD, reglas de trabajo y definición de done
  01-product/       Alcance funcional, usuarios, objetivos y límites
  02-architecture/  Arquitectura del sistema y decisiones técnicas
  03-contracts/     Specs de contratos, firmas, permisos y seguridad on-chain
  04-relayer/       API, persistencia, envío de transacciones y errores
  05-sdk/           API TypeScript para frontend e integradores
  06-frontend/      UX, componentes, estados y dashboard
  07-testing/       Plan de verificación, tests, fuzzing e invariants
  08-demo/          Flujo de demo y vertical slices
```

## Estado de una spec

Cada spec debe tener uno de estos estados:

| Estado | Significado |
|---|---|
| `Draft` | En redacción o pendiente de revisión |
| `Ready` | Lista para implementar |
| `In Progress` | Implementación en curso |
| `Implemented` | Implementada, pendiente de verificación final |
| `Verified` | Implementada y validada con evidencia |
| `Deferred` | Pospuesta para versiones futuras |

## Specs iniciales

| Spec | Propósito |
|---|---|
| `00-process/sdd-methodology.md` | Define cómo trabajará el equipo con SDD |
| `01-product/product-scope.spec.md` | Congela el alcance funcional del hackathon |
| `02-architecture/system-architecture.spec.md` | Define componentes, confianza y flujo principal |
| `03-contracts/session-lifecycle.spec.md` | Define creación, ejecución, expiración y revocación |
| `03-contracts/permission-model.spec.md` | Define acciones permitidas, límites y spend limit |
| `03-contracts/eip712-signatures.spec.md` | Define typed data y protección anti-replay |
| `04-relayer/relayer-api-initial.spec.md` | Define API inicial del relayer |
| `05-sdk/sdk-initial.spec.md` | Define API conceptual inicial del SDK |
| `06-frontend/ux-initial.spec.md` | Define UX inicial y estados de sesión |
| `07-testing/verification-plan.spec.md` | Define verificación mínima del proyecto |
| `08-demo/vertical-slice-01-move.spec.md` | Primer vertical slice: crear sesión y ejecutar `MOVE` |

## Regla de alcance

Si una funcionalidad no está cubierta por una spec o no contribuye al demo principal, no entra al hackathon salvo aprobación explícita.

Demo principal:

```text
Connect wallet
→ Create session
→ Execute MOVE without wallet popup
→ Relayer submits tx
→ SessionManager validates
→ DemoGame updates state
→ Dashboard shows action
→ Revoke session
→ Action fails after revoke
```
