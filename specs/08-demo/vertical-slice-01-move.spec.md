# Vertical Slice 01 — Create Session and Execute MOVE

## Metadata

| Campo | Valor |
|---|---|
| Spec ID | `DEMO-VS-001` |
| Estado | `Ready` |
| Prioridad | `P0` |
| Fecha | `2026-06-02` |
| Responsables | Dev 1, Dev 2, Dev 3 |

## Objetivo

Implementar el primer vertical slice completo del sistema:

```text
Usuario crea sesión
→ session key firma MOVE
→ relayer envía tx
→ SessionManager valida
→ DemoGame mueve jugador
→ dashboard muestra acción
```

Este slice debe completarse antes de añadir `ATTACK`, `COLLECT`, `BUY_ITEM` o dashboard avanzado.

## Alcance incluido

### Contratos

- `SessionManager` mínimo.
- `DemoGame` con acción `MOVE`.
- Creación de sesión.
- Validación de firma de owner.
- Validación de firma de session key.
- Nonce secuencial.
- Expiración.
- Revocación básica.
- Evento de acción ejecutada.

### Relayer

- Endpoint health.
- Endpoint para registrar o crear sesión.
- Endpoint para ejecutar `MOVE`.
- Simulación antes de enviar si el tiempo lo permite.
- Guardar acción y tx hash en SQLite.

### SDK

- Generar session key.
- Construir policy default.
- Firmar `SessionGrant`.
- Firmar `SessionAction` para `MOVE`.
- Llamar relayer.

### Frontend

- Conectar wallet.
- Mostrar preview de permisos.
- Crear sesión.
- Mostrar grid `5x5`.
- Botones de movimiento.
- Mostrar estado básico de sesión.
- Mostrar última acción en dashboard.

## Fuera de alcance en este slice

- `ATTACK`.
- `COLLECT`.
- `BUY_ITEM`.
- ERC-20 spend limit.
- Fuzzing avanzado.
- Dashboard completo.
- Styling final.
- Deploy final.

## Flujo esperado

```text
1. Usuario abre frontend.
2. Usuario conecta wallet.
3. Frontend genera session key.
4. Usuario firma SessionGrant.
5. Relayer envía createSession.
6. Usuario hace click en MOVE_RIGHT.
7. SDK firma SessionAction.
8. Relayer recibe action.
9. Relayer envía executeAction.
10. SessionManager valida.
11. DemoGame actualiza posición.
12. Dashboard muestra MOVE_RIGHT y tx hash.
```

## Requisitos funcionales

- El usuario solo firma manualmente la creación de sesión.
- `MOVE` no debe abrir wallet popup.
- La posición del jugador debe cambiar en contrato.
- El dashboard debe mostrar al menos:
  - sessionId,
  - estado activo,
  - nonce,
  - acciones usadas,
  - última acción,
  - tx hash.

## Requisitos de seguridad

- `MOVE` requiere firma válida de session key.
- `MOVE` requiere nonce correcto.
- `MOVE` falla si la sesión está revocada.
- `MOVE` falla si la sesión expiró.
- Reutilizar la misma firma de `MOVE` debe fallar.

## Criterios de aceptación end-to-end

- [ ] El frontend conecta wallet.
- [ ] El usuario puede crear sesión con una firma.
- [ ] La session key se genera localmente.
- [ ] El relayer registra o crea la sesión.
- [ ] El usuario ejecuta `MOVE` sin popup de wallet.
- [ ] `DemoGame` actualiza posición.
- [ ] El dashboard muestra la acción.
- [ ] Reusar el mismo nonce falla.
- [ ] Revocar sesión impide ejecutar otro `MOVE`.

## Validación mínima

Comandos o pruebas esperadas:

```text
forge test para contratos base
script TS end-to-end para createSession + MOVE
relayer GET /health
frontend manual flow
```

## Given / When / Then

### Caso 1 — Crear sesión

```text
Given un usuario conectado
When firma un SessionGrant válido
Then SessionManager crea una sesión activa
```

### Caso 2 — Ejecutar MOVE

```text
Given una sesión activa
And una SessionAction firmada por la session key
When el relayer envía executeAction
Then DemoGame actualiza la posición del owner
```

### Caso 3 — Replay

```text
Given una acción MOVE ya ejecutada con nonce N
When se reenvía la misma acción
Then SessionManager revierte por nonce inválido
```

### Caso 4 — Revocación

```text
Given una sesión revocada
When la session key intenta ejecutar MOVE
Then SessionManager revierte por sesión revocada
```

## Dependencias

- `PRODUCT-SCOPE-001`
- `ARCH-SYSTEM-001`
- `CONTRACT-SESSION-LIFECYCLE-001`
- `CONTRACT-EIP712-001`
- `CONTRACT-PERMISSION-MODEL-001`

## Riesgos

| Riesgo | Mitigación |
|---|---|
| EIP-712 bloquea todo el slice | Probar firma desde script antes de frontend |
| Relayer no está listo | Permitir test script directo durante desarrollo, pero demo final usa relayer |
| Frontend espera demasiados datos | Mostrar dashboard mínimo primero |
| Contrato de juego se complica | Solo grid 5x5 y MOVE en este slice |
