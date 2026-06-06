# Gas Report — Monad Session Arena

Generated: Phase 5 — Foundry `forge test --gas-report`

## SessionManager

| Function | Min | Avg | Median | Max | # Calls |
|---|---:|---:|---:|---:|---:|
| `createSession` | 131,442 | 162,217 | 171,530 | 171,626 | 3,353 |
| `executeAction` | 25,337 | 42,354 | 40,633 | 177,070 | 158,229 |
| `revokeSession` | 58,229 | 58,251 | 58,253 | 58,253 | 1,545 |

## GameToken (ARENA ERC-20)

| Function | Min | Avg | Median | Max | # Calls |
|---|---:|---:|---:|---:|---:|
| `mint` | 50,633 | 50,633 | 50,633 | 50,633 | 16 |
| `approve` | 46,702 | 46,702 | 46,702 | 46,702 | 16 |

## Notes

- `executeAction` median ~40k gas — very efficient for Monad's high-throughput design
- `createSession` one-time setup cost ~162k avg gas (signed once per session)
- `revokeSession` ~58k gas — immediate on-chain revocation
- ERC-20 `transferFrom` inside `executeAction` (BUY_ITEM) adds ~20k gas to the max

## Test coverage summary (Phase 5)

| Suite | Tests | Status |
|---|---:|---|
| Unit tests | 12 | ✅ All passing |
| Fuzz tests | 7 | ✅ All passing (256 runs each) |
| Invariant tests | 6 | ✅ All passing (256 runs × 500 calls = 128,000 calls each) |
| **Total** | **25** | **✅ 25/25** |

## Security guarantees verified by invariants

- `callCount` never exceeds `maxCalls` (128,000 calls tested)
- `tokenSpent` never exceeds `maxTokenSpend` (128,000 calls tested)
- Nonce is monotonically increasing (no replay possible)
- Revocation is irreversible (revoked state never goes back to false)
- On-chain `tokenSpent` matches handler tracking exactly
- `revokedSession_callCountFrozen`: revoked sessions cannot execute
