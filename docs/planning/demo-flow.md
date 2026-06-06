# Demo Flow — Monad Session Arena

Este documento define el guion operativo de la demo. El objetivo es que el equipo construya alrededor de este flujo y evite agregar complejidad que no ayude a demostrar valor.

## Mensaje central

> En juegos on-chain, firmar cada movimiento destruye la UX. Monad permite muchas acciones rápidas y baratas. Monad Session Arena usa session keys temporales con permisos limitados para que el jugador firme una sola vez y pueda jugar sin popups constantes, manteniendo revocación, límites y trazabilidad.

## Duración objetivo

La demo en vivo debe durar entre **3 y 4 minutos**.

## Personajes del demo

| Actor | Rol |
|---|---|
| Usuario / jugador | Conecta wallet, crea sesión y juega |
| Session key | Clave temporal que firma acciones de juego |
| Relayer | Envía las acciones a Monad testnet |
| SessionManager | Valida permisos, nonces, expiración y límites |
| DemoGame | Juego on-chain compatible con el kit |
| Dashboard | Muestra estado, límites, acciones y errores |

## Precondiciones

Antes de presentar:

- Contratos desplegados en Monad testnet.
- Relayer funcionando.
- Frontend conectado a la red correcta.
- Wallet con fondos de testnet.
- Usuario con tokens `ARENA` o capacidad de mintearlos.
- `.env` configurados.
- Video backup grabado.
- Explorer abierto opcionalmente con las direcciones.

## Configuración del demo

| Parámetro | Valor |
|---|---|
| Juego | Monad Session Arena |
| Mapa | Grid 5x5 |
| Token | ARENA |
| Duración de sesión | 5 minutos |
| Máximo de acciones | 30 |
| Spend limit | 50 ARENA |
| Costo de item | 10 ARENA |
| Acciones permitidas | MOVE, ATTACK, COLLECT, BUY_ITEM |

---

# Guion principal

## Paso 1 — Presentar el problema

Mensaje sugerido:

> Los juegos on-chain necesitan muchas acciones pequeñas: moverse, atacar, recoger items o comprar power-ups. Si cada acción abre la wallet, la experiencia es lenta e injugable. Monad hace viables muchas acciones rápidas y baratas, pero necesitamos una capa de UX y seguridad para aprovecharlo.

Mostrar:

- Pantalla inicial del juego.
- Botón de conectar wallet.

Resultado esperado:

- El jurado entiende el problema antes de ver contratos.

---

## Paso 2 — Conectar wallet

Acción:

1. Click en `Connect Wallet`.
2. Seleccionar wallet.
3. Confirmar conexión.

Mostrar en UI:

```text
Wallet connected: 0xabc...123
Network: Monad Testnet
```

Resultado esperado:

- Usuario conectado correctamente.

Posibles fallos:

| Fallo | Manejo |
|---|---|
| Wallet en red incorrecta | Mostrar CTA para cambiar a Monad testnet |
| Wallet sin fondos | Usar wallet backup |
| Wallet no conecta | Usar video backup o navegador alternativo |

---

## Paso 3 — Preparar token ARENA

Acción:

1. Mostrar balance de `ARENA`.
2. Si es necesario, mintear tokens mock.
3. Aprobar gasto limitado al `SessionManager`.

Mensaje sugerido:

> Para demostrar límites de gasto, usamos un token mock llamado ARENA. La sesión podrá gastar como máximo 50 ARENA durante el juego.

Mostrar:

```text
ARENA balance: 100
Approved to SessionManager: 50
```

Resultado esperado:

- Usuario tiene tokens y allowance suficiente.

Nota:

Si el flujo de approve consume demasiado tiempo, se puede preaprobar antes de la demo y solo explicar el límite en la UI.

---

## Paso 4 — Crear sesión de juego

Acción:

1. Click en `Create Game Session`.
2. Mostrar `PermissionPreview`.
3. Usuario firma autorización EIP-712.

La UI debe mostrar permisos en lenguaje humano:

```text
Authorize Game Session

Duration: 5 minutes
Max actions: 30
Token spend limit: 50 ARENA
Allowed contract: DemoGame
Allowed actions:
- Move
- Attack
- Collect
- Buy item

Revocable at any time.
```

Mensaje sugerido:

> Esta es la única firma manual necesaria para jugar. La wallet principal autoriza una session key temporal con límites claros.

Resultado esperado:

- Session key creada.
- Sesión registrada.
- Dashboard muestra estado `Active`.

Dashboard esperado:

```text
Status: Active
Actions: 0 / 30
Spend: 0 / 50 ARENA
Time left: 05:00
Nonce: 0
```

---

## Paso 5 — Ejecutar acciones sin popups

Acción:

1. Mover al jugador varias veces.
2. Atacar.
3. Recoger item.
4. Comprar item.

Mensaje sugerido:

> Ahora el jugador ejecuta acciones on-chain sin volver a abrir la wallet. Cada acción es firmada por la session key y enviada por el relayer a Monad.

Mostrar:

- El personaje cambia de posición en el grid.
- El contador de acciones sube.
- El dashboard registra cada acción.
- La compra reduce el spend disponible.

Dashboard esperado:

```text
Actions: 8 / 30
Spend: 10 / 50 ARENA
Nonce: 8
Last action: BUY_ITEM
Last tx: 0x...
```

Resultado esperado:

- No aparecen popups de wallet para cada acción.
- Las transacciones se envían vía relayer.
- El dashboard se actualiza.

---

## Paso 6 — Mostrar protección por permisos

Acción:

Intentar ejecutar una acción no permitida o inválida.

Opciones:

1. Botón oculto/dev: `Forbidden Action`.
2. Intentar comprar item por encima del spend limit.
3. Intentar acción cuando `maxCalls` está agotado, si se puede simular.

Mensaje sugerido:

> La session key no tiene control total. Si intenta ejecutar algo fuera de la política, el contrato lo rechaza.

UI esperada:

```text
Action rejected: action not allowed
```

o:

```text
Action rejected: spend limit exceeded
```

Resultado esperado:

- Se demuestra que la seguridad no depende del frontend ni del relayer.

---

## Paso 7 — Revocar sesión

Acción:

1. Click en `Revoke Session`.
2. Relayer envía revocación.
3. Dashboard cambia a `Revoked`.

Mensaje sugerido:

> Si el usuario sospecha que la session key fue comprometida o simplemente quiere terminar la sesión, puede revocarla inmediatamente.

Dashboard esperado:

```text
Status: Revoked
Actions: 9 / 30
Spend: 10 / 50 ARENA
```

Resultado esperado:

- Sesión revocada on-chain.

---

## Paso 8 — Intentar acción después de revocar

Acción:

Intentar mover el jugador de nuevo.

UI esperada:

```text
Action rejected: session revoked
```

Mensaje sugerido:

> Después de revocar, la session key queda inutilizada. Aunque el frontend o el relayer intenten usarla, el contrato bloquea la acción.

Resultado esperado:

- Acción falla.
- El jugador no se mueve.
- Dashboard registra el error.

---

# Cierre del demo

Mensaje final sugerido:

> Monad habilita juegos on-chain con muchas acciones rápidas. Monad Session Arena hace que esa experiencia sea usable: una sola firma inicial, múltiples acciones on-chain, límites claros, relayer, dashboard y revocación inmediata. Este patrón puede extenderse a social apps, micropagos, trading ligero y consumer dApps.

---

# Checklist de demo

Antes de presentar:

- [ ] Frontend abre correctamente.
- [ ] Wallet conecta en Monad testnet.
- [ ] Balance de ARENA disponible.
- [ ] SessionManager desplegado.
- [ ] DemoGame desplegado.
- [ ] GameToken desplegado.
- [ ] Relayer con fondos.
- [ ] SQLite inicializada.
- [ ] Dashboard carga datos.
- [ ] Crear sesión funciona.
- [ ] Mover jugador funciona.
- [ ] Comprar item funciona.
- [ ] Acción no permitida falla.
- [ ] Revocar funciona.
- [ ] Acción post-revocación falla.
- [ ] Video backup listo.

---

# Plan B de demo

Si Monad testnet o el RPC falla:

1. Mostrar video backup.
2. Mostrar contratos y dashboard local.
3. Explicar transacciones previamente ejecutadas.
4. Abrir explorer con transacciones anteriores si está disponible.

Si el relayer falla:

1. Mostrar logs del error.
2. Usar video backup.
3. Explicar que el contrato valida on-chain y el relayer solo transmite.

Si EIP-712 falla en wallet:

1. Usar sesión previamente creada.
2. Mostrar dashboard con estado activo.
3. Ejecutar acciones si la session key local sigue disponible.
4. Usar video backup para el flujo completo.

---

# Métricas que conviene destacar

Durante o después de la demo:

- Número de acciones ejecutadas sin popups.
- Tiempo entre click y tx enviada.
- Acciones restantes.
- Gasto restante.
- Estado de sesión.
- Revocación efectiva.
- Transacciones en Monad testnet.

---

# Errores visibles recomendados

La UI debe mapear errores técnicos a mensajes claros:

| Error técnico | Mensaje UX |
|---|---|
| `SessionExpired` | Session expired. Create a new session. |
| `SessionRevoked` | Session revoked. This key can no longer act. |
| `InvalidNonce` | Invalid action order. Please retry. |
| `ActionNotAllowed` | This action is not allowed by the session. |
| `MaxCallsExceeded` | Action limit reached. Create a new session. |
| `SpendLimitExceeded` | Token spend limit exceeded. |
| `InvalidSignature` | Invalid session signature. |
| Relayer error | Relayer failed to submit the transaction. |

---

# Lo que no debe mostrarse como core

Evitar gastar tiempo de demo en:

- explicar ERC-4337,
- explicar smart accounts avanzadas,
- explicar indexers complejos,
- mostrar arquitectura demasiado extensa,
- discutir compatibilidad con cualquier contrato.

El demo debe enfocarse en:

```text
UX rápida + permisos limitados + Monad + revocación
```
