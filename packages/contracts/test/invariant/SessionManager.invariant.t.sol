// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/SessionManager.sol";
import "../../src/demo/DemoGame.sol";
import "../../src/token/GameToken.sol";

/// @title SessionManagerHandler
/// @notice Handler para tests de invariantes del SessionManager.
///         El fuzzer de Foundry llama a las funciones de este handler
///         para generar secuencias de operaciones válidas e inválidas.
contract SessionManagerHandler is Test {
    SessionManager public manager;
    DemoGame public game;
    GameToken public token;

    uint256 internal constant OWNER_PK = 0xA11CE;
    address public owner = vm.addr(OWNER_PK);
    uint256 internal constant SESSION_PK = 0xB0B;
    address public sessionKey = vm.addr(SESSION_PK);

    bytes32 public activeSessionId;
    bool public sessionCreated;
    bool public sessionRevoked;
    uint32 public maxCallsForSession;
    uint256 public maxTokenSpendForSession;
    uint256 public executedCalls;
    uint256 public executedSpend;

    constructor(SessionManager _manager, DemoGame _game, GameToken _token) {
        manager = _manager;
        game = _game;
        token = _token;
    }

    function _hashSessionGrant(SessionTypes.SessionPolicy memory policy) internal view returns (bytes32) {
        bytes32 typehash = keccak256(
            "SessionGrant(address owner,address sessionKey,uint48 validUntil,uint32 maxCalls,address gameContract,uint16 allowedActions,address token,uint256 maxTokenSpend,bytes32 salt)"
        );
        bytes32 structHash = keccak256(
            abi.encode(typehash, policy.owner, policy.sessionKey, policy.validUntil,
                policy.maxCalls, policy.gameContract, policy.allowedActions, policy.token, policy.maxTokenSpend, policy.salt)
        );
        bytes32 domainSep = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MonadSessionArena")),
                keccak256(bytes("1")),
                block.chainid,
                address(manager)
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
    }

    function _hashSessionAction(SessionTypes.SessionAction memory action) internal view returns (bytes32) {
        bytes32 typehash = keccak256(
            "SessionAction(bytes32 sessionId,uint256 nonce,uint16 actionId,bytes32 paramsHash,uint48 deadline)"
        );
        bytes32 structHash = keccak256(
            abi.encode(typehash, action.sessionId, action.nonce, action.actionId, action.paramsHash, action.deadline)
        );
        bytes32 domainSep = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MonadSessionArena")),
                keccak256(bytes("1")),
                block.chainid,
                address(manager)
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSep, structHash));
    }

    /// @dev Crea una sesión válida con parámetros acotados
    function createSession(uint32 maxCalls, uint256 maxTokenSpend) external {
        if (sessionCreated) return; // solo una sesión activa a la vez para simplificar

        maxCalls = uint32(bound(maxCalls, 1, 50));
        maxTokenSpend = bound(maxTokenSpend, 0, 500 * 1e18);

        // MOVE (2) | ATTACK (4) | COLLECT (8) | BUY_ITEM (16) = 30
        uint16 allowedActions = maxTokenSpend > 0 ? 30 : 14; // incluir BUY_ITEM solo si hay spend limit

        SessionTypes.SessionPolicy memory policy = SessionTypes.SessionPolicy({
            owner: owner,
            sessionKey: sessionKey,
            validUntil: uint48(block.timestamp + 86400),
            maxCalls: maxCalls,
            gameContract: address(game),
            allowedActions: allowedActions,
            token: maxTokenSpend > 0 ? address(token) : address(0),
            maxTokenSpend: maxTokenSpend,
            salt: bytes32(uint256(block.timestamp))
        });

        bytes32 digest = _hashSessionGrant(policy);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(OWNER_PK, digest);

        try manager.createSession(policy, abi.encodePacked(r, s, v)) returns (bytes32 sid) {
            activeSessionId = sid;
            sessionCreated = true;
            sessionRevoked = false;
            maxCallsForSession = maxCalls;
            maxTokenSpendForSession = maxTokenSpend;
            executedCalls = 0;
            executedSpend = 0;
        } catch {}
    }

    /// @dev Ejecuta una acción MOVE válida
    function executeMove() external {
        if (!sessionCreated || sessionRevoked) return;
        (uint32 callCount, , uint256 nonce,) = manager.sessionStates(activeSessionId);
        if (callCount >= maxCallsForSession) return;

        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: activeSessionId,
            actionId: 1, // MOVE
            nonce: nonce,
            deadline: uint48(block.timestamp + 3600),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

        try manager.executeAction(action, params, abi.encodePacked(r, s, v)) {
            executedCalls++;
        } catch {}
    }

    /// @dev Ejecuta una acción BUY_ITEM válida cuando hay token configurado
    function executeBuyItem() external {
        if (!sessionCreated || sessionRevoked) return;
        if (maxTokenSpendForSession == 0) return;

        (uint32 callCount, uint256 tokenSpent, uint256 nonce,) = manager.sessionStates(activeSessionId);
        if (callCount >= maxCallsForSession) return;
        if (tokenSpent + 10 * 1e18 > maxTokenSpendForSession) return;

        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: activeSessionId,
            actionId: 4, // BUY_ITEM
            nonce: nonce,
            deadline: uint48(block.timestamp + 3600),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

        try manager.executeAction(action, params, abi.encodePacked(r, s, v)) {
            executedCalls++;
            executedSpend += 10 * 1e18;
        } catch {}
    }

    /// @dev Revoca la sesión activa como owner
    function revokeSession() external {
        if (!sessionCreated || sessionRevoked) return;
        vm.prank(owner);
        try manager.revokeSession(activeSessionId) {
            sessionRevoked = true;
        } catch {}
    }

    /// @dev Intenta ejecutar después de revocar — siempre debe fallar
    function tryExecuteAfterRevoke() external {
        if (!sessionCreated || !sessionRevoked) return;
        (, , uint256 nonce,) = manager.sessionStates(activeSessionId);

        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: activeSessionId,
            actionId: 1,
            nonce: nonce,
            deadline: uint48(block.timestamp + 3600),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

        // Esto DEBE revertir siempre
        vm.expectRevert(SessionErrors.SessionRevoked.selector);
        manager.executeAction(action, params, abi.encodePacked(r, s, v));
    }
}

/// @title SessionManagerInvariantTest
/// @notice Tests de invariantes para las garantías de seguridad del SessionManager
contract SessionManagerInvariantTest is Test {
    SessionManager internal manager;
    DemoGame internal game;
    GameToken internal token;
    SessionManagerHandler internal handler;

    address internal owner = vm.addr(0xA11CE);

    function setUp() public {
        manager = new SessionManager();
        game = new DemoGame();
        token = new GameToken();

        // Dar tokens y allowance al owner
        vm.prank(owner);
        token.mint();
        vm.prank(owner);
        token.approve(address(manager), type(uint256).max);

        handler = new SessionManagerHandler(manager, game, token);

        // Enfocar el fuzzer solo en el handler
        targetContract(address(handler));
    }

    // ─────────────────────────────────────────────────────────────────
    // Invariante 1: callCount nunca supera maxCalls
    // ─────────────────────────────────────────────────────────────────
    function invariant_callCount_neverExceedsMaxCalls() public view {
        if (!handler.sessionCreated()) return;
        bytes32 sid = handler.activeSessionId();
        (uint32 callCount, , ,) = manager.sessionStates(sid);
        assertLe(
            callCount,
            handler.maxCallsForSession(),
            "INVARIANT VIOLATED: callCount > maxCalls"
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Invariante 2: tokenSpent nunca supera maxTokenSpend
    // ─────────────────────────────────────────────────────────────────
    function invariant_tokenSpent_neverExceedsMaxTokenSpend() public view {
        if (!handler.sessionCreated()) return;
        bytes32 sid = handler.activeSessionId();
        (, uint256 tokenSpent, ,) = manager.sessionStates(sid);
        assertLe(
            tokenSpent,
            handler.maxTokenSpendForSession(),
            "INVARIANT VIOLATED: tokenSpent > maxTokenSpend"
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Invariante 3: nonce siempre avanza (nunca retrocede)
    // ─────────────────────────────────────────────────────────────────
    function invariant_nonce_isMonotonicallyIncreasing() public view {
        if (!handler.sessionCreated()) return;
        bytes32 sid = handler.activeSessionId();
        (, , uint256 nonce,) = manager.sessionStates(sid);
        // El nonce debe ser igual al número de llamadas ejecutadas
        assertEq(
            nonce,
            handler.executedCalls(),
            "INVARIANT VIOLATED: nonce != executedCalls"
        );
    }

    // ─────────────────────────────────────────────────────────────────
    // Invariante 4: sesión revocada nunca puede tener callCount adicional
    //               después de la revocación (el handler valida esto)
    // ─────────────────────────────────────────────────────────────────
    function invariant_revokedSession_callCountFrozen() public view {
        if (!handler.sessionCreated() || !handler.sessionRevoked()) return;
        bytes32 sid = handler.activeSessionId();
        (, , , bool revoked) = manager.sessionStates(sid);
        assertTrue(revoked, "INVARIANT VIOLATED: session should be marked revoked");
    }

    // ─────────────────────────────────────────────────────────────────
    // Invariante 5: el estado de revocación nunca puede volver a false
    // ─────────────────────────────────────────────────────────────────
    function invariant_revocation_isIrreversible() public view {
        if (!handler.sessionCreated() || !handler.sessionRevoked()) return;
        bytes32 sid = handler.activeSessionId();
        (, , , bool revoked) = manager.sessionStates(sid);
        assertTrue(revoked, "INVARIANT VIOLATED: revocation was reversed");
    }

    // ─────────────────────────────────────────────────────────────────
    // Invariante 6: tokenSpent en handler coincide con el estado on-chain
    // ─────────────────────────────────────────────────────────────────
    function invariant_tokenSpent_matchesOnChainState() public view {
        if (!handler.sessionCreated()) return;
        bytes32 sid = handler.activeSessionId();
        (, uint256 onChainSpent, ,) = manager.sessionStates(sid);
        assertEq(
            onChainSpent,
            handler.executedSpend(),
            "INVARIANT VIOLATED: on-chain tokenSpent != handler tracking"
        );
    }
}
