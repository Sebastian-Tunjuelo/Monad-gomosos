# SDD Methodology — Monad Session Arena

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `PROCESS-SDD-001` |
| Estado | `Verified` |
| Fecha | `2026-06-02` |
| Responsable | Equipo completo |
| Alcance | Metodología de desarrollo |

## Objetivo

Definir cómo se desarrollará Monad Session Arena usando **Spec-Driven Development**.

El objetivo no es producir documentación extensa por adelantado, sino crear specs suficientemente claras para que el equipo implemente con menos ambigüedad, menor riesgo y mejor validación.

## Principios SDD del proyecto

1. **Toda funcionalidad importante empieza con una spec.**
2. **Las specs deben ser ejecutables mentalmente**, no ensayos abstractos.
3. **Cada spec debe tener criterios de aceptación verificables.**
4. **Las specs deben favorecer vertical slices**, no capas aisladas.
5. **Si una spec amenaza el demo principal, se reduce el alcance.**
6. **No se declara una tarea como terminada sin verificación.**

## Flujo de trabajo

```text
1. Redactar spec mínima
2. Revisar alcance y riesgos
3. Marcar spec como Ready
4. Implementar la menor versión funcional
5. Ejecutar verificación definida por la spec
6. Actualizar estado a Implemented o Verified
7. Registrar desviaciones o decisiones
```

## Definición de Ready

Una spec está `Ready` cuando incluye:

- objetivo claro,
- alcance incluido,
- fuera de alcance,
- dependencias,
- criterios de aceptación,
- validación esperada,
- riesgos principales.

## Definición de Done

Una funcionalidad está `Done` cuando:

- implementa la spec correspondiente,
- pasa las pruebas o validaciones indicadas,
- no rompe el vertical slice principal,
- los errores relevantes son visibles o manejables,
- el README o la documentación operativa se actualiza si aplica.

## Convención de nombres

Formato recomendado:

```text
<domain>/<short-name>.spec.md
```

Ejemplos:

```text
03-contracts/session-lifecycle.spec.md
04-relayer/execute-action-api.spec.md
06-frontend/session-dashboard.spec.md
08-demo/vertical-slice-01-move.spec.md
```

## Priorización

Las specs se clasifican por prioridad:

| Prioridad | Significado |
|---|---|
| `P0` | Crítica para demo |
| `P1` | Importante si el core funciona |
| `P2` | Nice-to-have |

## Regla para hackathon

Durante la hackathon, solo se implementan specs `P0` y algunas `P1` si no comprometen estabilidad.

## Orden recomendado de specs

1. Producto y alcance.
2. Arquitectura.
3. Ciclo de sesión.
4. Firmas EIP-712.
5. Modelo de permisos.
6. Vertical slice `MOVE`.
7. Relayer execute endpoint.
8. Frontend session creation.
9. Dashboard mínimo.
10. ERC-20 spend limit.

## Gestión de cambios

Si cambia una decisión importante, actualizar primero la spec afectada.

Ejemplos de cambios que requieren actualizar spec:

- cambiar de ejecución directa a ERC-2771,
- cambiar estructura de `SessionGrant`,
- agregar nuevo tipo de permiso,
- cambiar el modelo de nonce,
- cambiar el flujo del relayer,
- cambiar el demo principal.

## Qué no debe pasar

Evitar:

- implementar features no especificadas,
- crear specs demasiado largas que bloqueen avance,
- documentar detalles que no se van a construir,
- usar SDD como excusa para no hacer vertical slices,
- cerrar tareas sin verificación real.

## Fuente de verdad

Orden de autoridad:

1. Specs en `specs/`.
2. Planificación en `docs/planning/`.
3. Código implementado.
4. Conversaciones o notas informales.

Si hay conflicto, actualizar la spec correspondiente antes de implementar.
