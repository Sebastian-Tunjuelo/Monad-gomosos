// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../src/SessionManager.sol";
import "../../src/demo/DemoGame.sol";
import "../../src/token/GameToken.sol";

/// @title SessionManagerFuzzTest
/// @notice Fuzz tests para las propiedades de seguridad críticas del SessionManager
contract SessionManagerFuzzTest is Test {
    SessionManager internal manager;
    DemoGame internal game;
    GameToken internal token;

    uint256 internal constant OWNER_PK = 0xA11CE;
    address internal owner = vm.addr(OWNER_PK);
    uint256 internal constant SESSION_PK = 0xB0B;
    address internal sessionKey = vm.addr(SESSION_PK);

    function setUp() public {
        manager = new SessionManager();
        game = new DemoGame();
        token = new GameToken();
        vm.prank(owner);
        token.mint();
        vm.prank(owner);
        token.approve(address(manager), type(uint256).max);
    }

    // ─────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────

    function _hashSessionGrant(SessionTypes.SessionPolicy memory policy) internal view returns (bytes32) {
        bytes32 typehash = keccak256(
            "SessionGrant(address owner,address sessionKey,uint48 validUntil,uint32 maxCalls,address gameContract,uint16 allowedActions,address token,uint256 maxTokenSpend,bytes32 salt)"
        );
        bytes32 structHash = keccak256(
            abi.encode(
                typehash,
                policy.owner, policy.sessionKey, policy.validUntil, policy.maxCalls,
                policy.gameContract, policy.allowedActions, policy.token, policy.maxTokenSpend, policy.salt
            )
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

    function _createSession(
        uint48 validUntil,
        uint32 maxCalls,
        uint16 allowedActions,
        uint256 maxTokenSpend
    ) internal returns (bytes32) {
        SessionTypes.SessionPolicy memory policy = SessionTypes.SessionPolicy({
            owner: owner,
            sessionKey: sessionKey,
            validUntil: validUntil,
            maxCalls: maxCalls,
            gameContract: address(game),
            allowedActions: allowedActions,
            token: address(token),
            maxTokenSpend: maxTokenSpend,
            salt: bytes32(uint256(1))
        });
        bytes32 digest = _hashSessionGrant(policy);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(OWNER_PK, digest);
        return manager.createSession(policy, abi.encodePacked(r, s, v));
    }

    function _executeAction(bytes32 sessionId, uint16 actionId, uint256 nonce) internal {
        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: actionId,
            nonce: nonce,
            deadline: uint48(block.timestamp + 3600),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);
        manager.executeAction(action, params, abi.encodePacked(r, s, v));
    }

    // ─────────────────────────────────────────────────────────────────
    // Fuzz: replay protection — misma firma nunca ejecuta dos veces
    // ─────────────────────────────────────────────────────────────────

    /// @notice Un nonce incorrecto siempre revierte, cualquiera que sea su valor
    function testFuzz_invalidNonce_alwaysReverts(uint256 wrongNonce) public {
        // Bound para que no sea 0 (nonce inicial correcto)
        wrongNonce = bound(wrongNonce, 1, type(uint256).max);

        bytes32 sessionId = _createSession(
            uint48(block.timestamp + 1000), 10, 2, 0
        );

        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: wrongNonce, // incorrecto
            deadline: uint48(block.timestamp + 3600),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

        vm.expectRevert(SessionErrors.InvalidNonce.selector);
        manager.executeAction(action, params, abi.encodePacked(r, s, v));
    }

    // ─────────────────────────────────────────────────────────────────
    // Fuzz: expiración — cualquier timestamp pasado siempre revierte
    // ─────────────────────────────────────────────────────────────────

    /// @notice Una sesión cuyo validUntil ya pasó nunca puede ejecutar
    function testFuzz_expiredSession_neverExecutes(uint48 offset) public {
        // offset entre 1 y 10000 segundos en el pasado
        offset = uint48(bound(offset, 1, 10000));

        // Creamos con tiempo válido y luego hacemos warp para forzar expiración
        bytes32 sessionId = _createSession(
            uint48(block.timestamp + 1000), 10, 2, 0
        );

        // Avanzamos el tiempo más allá del validUntil
        vm.warp(block.timestamp + 1001);

        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: 0,
            deadline: uint48(block.timestamp + 100),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

        vm.expectRevert(SessionErrors.SessionExpired.selector);
        manager.executeAction(action, params, abi.encodePacked(r, s, v));
    }

    // ─────────────────────────────────────────────────────────────────
    // Fuzz: acción no permitida — cualquier actionId fuera del bitmask revierte
    // ─────────────────────────────────────────────────────────────────

    /// @notice Cualquier actionId que no esté en el bitmask siempre revierte
    function testFuzz_actionNotAllowed_reverts(uint16 randomActionId) public {
        // Sesión solo permite MOVE (bit 1 → allowedActions = 2)
        uint16 allowedActions = 2; // solo bit 1

        // Aseguramos que el actionId fuzzed no esté permitido
        // Esto pasa cuando (allowedActions & (1 << actionId)) == 0
        // Para bit 1 (actionId=1), se permite. Probamos actionIds != 1
        vm.assume(randomActionId != 1);
        vm.assume(randomActionId < 16); // actionId razonables

        bytes32 sessionId = _createSession(
            uint48(block.timestamp + 1000), 10, allowedActions, 0
        );

        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: randomActionId,
            nonce: 0,
            deadline: uint48(block.timestamp + 3600),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

        vm.expectRevert(SessionErrors.ActionNotAllowed.selector);
        manager.executeAction(action, params, abi.encodePacked(r, s, v));
    }

    // ─────────────────────────────────────────────────────────────────
    // Fuzz: callCount nunca supera maxCalls
    // ─────────────────────────────────────────────────────────────────

    /// @notice Después de maxCalls ejecuciones, la siguiente siempre revierte
    function testFuzz_maxCalls_enforced(uint32 maxCalls) public {
        maxCalls = uint32(bound(maxCalls, 1, 20)); // mantener gas razonable

        bytes32 sessionId = _createSession(
            uint48(block.timestamp + 100000), maxCalls, 2, 0
        );

        // Ejecutar exactamente maxCalls veces
        for (uint256 i = 0; i < maxCalls; i++) {
            _executeAction(sessionId, 1, i);
        }

        // La siguiente debe fallar
        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: maxCalls,
            deadline: uint48(block.timestamp + 3600),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

        vm.expectRevert(SessionErrors.MaxCallsExceeded.selector);
        manager.executeAction(action, params, abi.encodePacked(r, s, v));
    }

    // ─────────────────────────────────────────────────────────────────
    // Fuzz: spend limit — spentAmount nunca supera maxTokenSpend
    // ─────────────────────────────────────────────────────────────────

    /// @notice El gasto acumulado nunca puede superar maxTokenSpend
    function testFuzz_spendLimit_enforced(uint256 maxSpend) public {
        // Item cost es 10e18. Limitamos maxSpend para que sean ≥1 compra posible pero acotado.
        uint256 itemCost = 10 * 1e18;
        maxSpend = bound(maxSpend, itemCost, 50 * 1e18);

        // Calculamos cuántas compras caben
        uint256 maxBuys = maxSpend / itemCost;
        // forge-lint: disable-next-line(unsafe-typecast)
        uint32 maxCalls = uint32(maxBuys + 5); // más calls que compras (maxBuys ≤ 5, so safe)

        bytes32 sessionId = _createSession(
            uint48(block.timestamp + 100000), maxCalls, 16, maxSpend // BUY_ITEM bit=16
        );

        // Ejecutar maxBuys compras exitosas
        for (uint256 i = 0; i < maxBuys; i++) {
            _executeAction(sessionId, 4, i);
        }

        // La siguiente compra debe fallar si el gasto ya supera el límite
        (, uint256 tokenSpent, ,) = manager.sessionStates(sessionId);
        if (tokenSpent + itemCost > maxSpend) {
            bytes memory params = abi.encode(uint256(1));
            SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
                sessionId: sessionId,
                actionId: 4,
                nonce: maxBuys,
                deadline: uint48(block.timestamp + 3600),
                paramsHash: keccak256(params)
            });
            bytes32 digest = _hashSessionAction(action);
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

            vm.expectRevert(SessionErrors.SpendLimitExceeded.selector);
            manager.executeAction(action, params, abi.encodePacked(r, s, v));
        }

        // Verificar la invariante: tokenSpent <= maxTokenSpend
        (, uint256 finalSpent, ,) = manager.sessionStates(sessionId);
        assertLe(finalSpent, maxSpend, "tokenSpent excede maxTokenSpend");
    }

    // ─────────────────────────────────────────────────────────────────
    // Fuzz: firmas de wallets arbitrarias son rechazadas
    // ─────────────────────────────────────────────────────────────────

    /// @notice Firmas de session keys distintas a la registrada siempre fallan
    function testFuzz_wrongSessionKey_rejected(uint256 wrongPk) public {
        // Evitar PK 0 y la PK correcta
        wrongPk = bound(wrongPk, 1, type(uint128).max);
        vm.assume(wrongPk != SESSION_PK);

        bytes32 sessionId = _createSession(
            uint48(block.timestamp + 1000), 10, 2, 0
        );

        bytes memory params = abi.encode(uint256(1));
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: 0,
            deadline: uint48(block.timestamp + 3600),
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPk, digest);

        vm.expectRevert(SessionErrors.InvalidSignature.selector);
        manager.executeAction(action, params, abi.encodePacked(r, s, v));
    }

    // ─────────────────────────────────────────────────────────────────
    // Fuzz: acción expirada siempre revierte independientemente del deadline
    // ─────────────────────────────────────────────────────────────────

    /// @notice Un deadline en el pasado siempre revierte
    function testFuzz_expiredDeadline_reverts(uint48 secondsAgo) public {
        // Asegurar un timestamp base razonable para que el deadline pueda estar en el pasado
        vm.warp(200_000);
        secondsAgo = uint48(bound(secondsAgo, 1, 100_000));

        bytes32 sessionId = _createSession(
            uint48(block.timestamp + 10000), 10, 2, 0
        );

        bytes memory params = abi.encode(uint256(1));
        uint48 expiredDeadline = uint48(block.timestamp) - secondsAgo;
        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: 0,
            deadline: expiredDeadline,
            paramsHash: keccak256(params)
        });
        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SESSION_PK, digest);

        vm.expectRevert(SessionErrors.ActionExpired.selector);
        manager.executeAction(action, params, abi.encodePacked(r, s, v));
    }
}
