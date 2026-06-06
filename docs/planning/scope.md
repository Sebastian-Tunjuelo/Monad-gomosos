# Scope — Monad Session Arena

## Resumen

**Monad Session Arena** es una demo de infraestructura Web3 para juegos on-chain en Monad. El objetivo es permitir que un jugador cree una **session key temporal** con permisos limitados para ejecutar múltiples acciones de juego sin firmar cada acción con su wallet principal.

La solución está enfocada en UX, pero mantiene controles técnicos esenciales:

- expiración de sesión,
- revocación inmediata,
- nonce secuencial,
- límites de acciones,
- permisos por acción,
- límite de gasto ERC-20,
- relayer obligatorio,
- trazabilidad mediante dashboard.

## Tagline

> Session keys seguras para juegos on-chain de alta frecuencia en Monad.

## Pitch corto

Monad permite ejecutar muchas acciones on-chain rápidas y baratas. Monad Session Arena convierte esa capacidad en UX real: el jugador firma una sola vez, obtiene una session key temporal con permisos limitados y puede jugar sin popups constantes, manteniendo revocación, límites de gasto y trazabilidad on-chain.

## Objetivo principal

El objetivo principal del proyecto es demostrar una mejora clara de UX para juegos on-chain en Monad:

1. Una sola firma inicial del usuario.
2. Múltiples acciones on-chain vía session key.
3. Acciones enviadas por relayer.
4. Dashboard visible de actividad y límites.
5. Revocación inmediata.
6. Validación de permisos on-chain.

## Demo elegido

Categoría: **Gaming**

Nombre de demo: **Monad Session Arena**

El jugador interactúa con un juego simple en un grid `5x5`. Puede moverse, atacar, recoger items y comprar un power-up con un token ERC-20 mock llamado `ARENA`.

## Stack acordado

| Área | Tecnología |
|---|---|
| Blockchain | Monad testnet |
| Smart contracts | Solidity |
| Framework contratos | Foundry |
| Backend / relayer | TypeScript + Express |
| Cliente blockchain backend | Viem |
| Base de datos | SQLite |
| Frontend | React + Vite |
| Wallet | Wagmi |
| Estilos | Tailwind CSS |
| Package manager | pnpm |
| Testing contratos | Foundry tests, fuzz básico, invariants básicos |

## Decisiones de arquitectura

| Decisión | Elección |
|---|---|
| Relayer | Obligatorio |
| Modelo de ejecución | Ejecución directa |
| Account abstraction completa | Fuera de alcance |
| ERC-2771 | Fuera de alcance para hackathon |
| ERC-4337 | Fuera de alcance |
| Smart accounts universales | Fuera de alcance |
| Dashboard | Sí |
| Spend limit ERC-20 | Sí, versión simple |
| Red objetivo | Monad testnet |

## Modelo de sesión del demo

Parámetros por defecto:

| Parámetro | Valor |
|---|---|
| Duración | 5 minutos |
| Máximo de acciones | 30 |
| Token permitido | ARENA |
| Gasto máximo | 50 ARENA |
| Costo de comprar item | 10 ARENA |
| Contrato permitido | DemoGame |
| Relayer | Obligatorio |
| Revocación | Sí |

## Acciones permitidas

| Acción | Descripción | Consume ARENA |
|---|---|---:|
| `MOVE` | Mover jugador en el grid | No |
| `ATTACK` | Atacar enemigo dummy | No |
| `COLLECT` | Recoger item del mapa | No |
| `BUY_ITEM` | Comprar power-up con ERC-20 | Sí |

## Contratos previstos

| Contrato | Responsabilidad |
|---|---|
| `SessionManager` | Crear sesiones, validar permisos, ejecutar acciones y revocar sesiones |
| `SessionTypes` | Definir estructuras compartidas |
| `SessionErrors` | Definir custom errors |
| `SessionEvents` | Definir eventos |
| `SessionEIP712` | Hashing y validación EIP-712 |
| `PolicyValidator` | Validar acciones, límites y spend limit |
| `DemoGame` | Juego de prueba compatible con session keys |
| `GameToken` | ERC-20 mock `ARENA` |

## Relayer previsto

Responsabilidades:

- recibir solicitudes del frontend/SDK,
- verificar formato básico,
- simular transacciones,
- enviar transacciones a Monad testnet,
- persistir sesiones y acciones en SQLite,
- exponer datos para el dashboard,
- manejar errores legibles,
- aplicar rate limiting básico si el tiempo lo permite.

Endpoints tentativos:

```text
GET  /health
POST /sessions/register
POST /sessions/execute
POST /sessions/revoke
GET  /sessions/:sessionId
GET  /owners/:owner/sessions
GET  /dashboard/events
```

## SDK previsto

El SDK será básico, pero debe demostrar que el proyecto es infraestructura reusable.

Responsabilidades:

- generar session key temporal,
- construir política de sesión,
- generar typed data EIP-712,
- firmar acciones con session key,
- llamar al relayer,
- consultar estado de sesión,
- revocar sesión.

## Frontend previsto

Pantallas o componentes:

- conexión de wallet,
- panel de creación de sesión,
- preview de permisos,
- tablero del juego,
- controles de acción,
- balance de token ARENA,
- estado de sesión,
- dashboard de actividad,
- botón de revocación,
- panel de errores.

## Qué entra en el hackathon

- Demo gaming funcional.
- Session keys temporales.
- Relayer obligatorio.
- Dashboard.
- EIP-712 para autorización.
- Firma de acciones con session key.
- Revocación inmediata.
- Expiración.
- Nonce secuencial.
- `maxCalls`.
- Permisos por acción.
- ERC-20 spend limit simple.
- Foundry tests principales.
- Deploy en Monad testnet.
- README y demo script.

## Qué queda fuera del hackathon

- ERC-4337.
- Paymasters.
- Smart accounts universales.
- ERC-2771 formal.
- Compatibilidad con cualquier contrato EVM.
- Nonce lanes.
- Batch execution.
- Calldata validators avanzados.
- Múltiples tokens de gasto.
- The Graph o indexer complejo.
- Multi-relayer.
- Auditoría formal.
- SDK publicado en npm.

## Alcance futuro

Posibles extensiones:

- ERC-2771 para dApps compatibles.
- Soporte para smart accounts.
- Soporte EIP-1271.
- Nonce lanes.
- Policy modules.
- ERC-20 multi-token spend limits.
- SDK publicado.
- React hooks oficiales.
- Dashboard más completo.
- Ponder o Envio para indexación.
- Auditoría externa.

## Criterio de éxito del proyecto

El proyecto se considera exitoso si durante la demo se puede mostrar:

1. El usuario conecta wallet.
2. El usuario autoriza una sesión con una sola firma.
3. El jugador ejecuta múltiples acciones sin popups de wallet.
4. Las acciones se reflejan en Monad testnet.
5. El dashboard muestra actividad y límites.
6. Una compra con ARENA respeta el spend limit.
7. Una acción no permitida falla.
8. Tras revocar la sesión, la session key ya no puede ejecutar acciones.
