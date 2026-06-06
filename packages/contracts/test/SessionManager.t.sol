// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SessionManager.sol";
import "../src/demo/DemoGame.sol";

contract SessionManagerTest is Test {
    SessionManager manager;
    DemoGame game;
    
    uint256 ownerPk = 0xA11CE;
    address owner = vm.addr(ownerPk);

    uint256 sessionPk = 0xB0B;
    address sessionKey = vm.addr(sessionPk);

    function setUp() public {
        manager = new SessionManager();
        game = new DemoGame();
    }

    function _hashSessionGrant(SessionTypes.SessionPolicy memory policy) internal view returns (bytes32) {
        bytes32 SESSION_GRANT_TYPEHASH = keccak256(
            "SessionGrant(address owner,address sessionKey,uint48 validUntil,uint32 maxCalls,address gameContract,uint16 allowedActions,address token,uint256 maxTokenSpend,bytes32 salt)"
        );
        
        bytes32 structHash = keccak256(
            abi.encode(
                SESSION_GRANT_TYPEHASH,
                policy.owner,
                policy.sessionKey,
                policy.validUntil,
                policy.maxCalls,
                policy.gameContract,
                policy.allowedActions,
                policy.token,
                policy.maxTokenSpend,
                policy.salt
            )
        );

        bytes32 DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MonadSessionArena")),
                keccak256(bytes("1")),
                block.chainid,
                address(manager)
            )
        );

        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function test_createSession() public {
        SessionTypes.SessionPolicy memory policy = SessionTypes.SessionPolicy({
            owner: owner,
            sessionKey: sessionKey,
            validUntil: uint48(block.timestamp + 1000),
            maxCalls: 10,
            gameContract: address(game),
            allowedActions: 2, // MOVE (1 << 1 = 2)
            token: address(0),
            maxTokenSpend: 0,
            salt: bytes32(uint256(1))
        });

        bytes32 digest = _hashSessionGrant(policy);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        bytes32 sessionId = manager.createSession(policy, signature);
        assertTrue(sessionId != bytes32(0));
    }

    function test_revokeSession() public {
        SessionTypes.SessionPolicy memory policy = SessionTypes.SessionPolicy({
            owner: owner,
            sessionKey: sessionKey,
            validUntil: uint48(block.timestamp + 1000),
            maxCalls: 10,
            gameContract: address(game),
            allowedActions: 2,
            token: address(0),
            maxTokenSpend: 0,
            salt: bytes32(uint256(1))
        });

        bytes32 digest = _hashSessionGrant(policy);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        bytes32 sessionId = manager.createSession(policy, signature);
        
        vm.prank(owner);
        manager.revokeSession(sessionId);

        // Check it was revoked
        (, , , bool revoked) = manager.sessionStates(sessionId);
        assertTrue(revoked);
    }

    function _hashSessionAction(SessionTypes.SessionAction memory action) internal view returns (bytes32) {
        bytes32 SESSION_ACTION_TYPEHASH = keccak256(
            "SessionAction(bytes32 sessionId,uint256 nonce,uint16 actionId,bytes32 paramsHash,uint48 deadline)"
        );

        bytes32 structHash = keccak256(
            abi.encode(
                SESSION_ACTION_TYPEHASH,
                action.sessionId,
                action.nonce,
                action.actionId,
                action.paramsHash,
                action.deadline
            )
        );

        bytes32 DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("MonadSessionArena")),
                keccak256(bytes("1")),
                block.chainid,
                address(manager)
            )
        );

        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function _createSessionSetup() internal returns (bytes32) {
        SessionTypes.SessionPolicy memory policy = SessionTypes.SessionPolicy({
            owner: owner,
            sessionKey: sessionKey,
            validUntil: uint48(block.timestamp + 1000),
            maxCalls: 10,
            gameContract: address(game),
            allowedActions: 2, // MOVE
            token: address(0),
            maxTokenSpend: 0,
            salt: bytes32(uint256(1))
        });

        bytes32 digest = _hashSessionGrant(policy);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        return manager.createSession(policy, signature);
    }

    function test_executeAction_valid() public {
        bytes32 sessionId = _createSessionSetup();
        
        bytes memory params = abi.encode(uint256(1)); // mock params
        bytes32 paramsHash = keccak256(params);

        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1, // MOVE
            nonce: 0,
            deadline: uint48(block.timestamp + 1000),
            paramsHash: paramsHash
        });

        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        manager.executeAction(action, params, signature);

        // Verify state changed
        (uint32 callCount, , uint256 nonce, ) = manager.sessionStates(sessionId);
        assertEq(nonce, 1);
        assertEq(callCount, 1);
        assertEq(game.playerMoves(owner), 1);
    }

    function test_executeAction_invalidNonce() public {
        bytes32 sessionId = _createSessionSetup();
        
        bytes memory params = abi.encode(uint256(1));
        bytes32 paramsHash = keccak256(params);

        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: 1, // Invalid nonce, should be 0
            deadline: uint48(block.timestamp + 1000),
            paramsHash: paramsHash
        });

        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(SessionErrors.InvalidNonce.selector);
        manager.executeAction(action, params, signature);
    }

    function test_executeAction_expiredAction() public {
        bytes32 sessionId = _createSessionSetup();
        
        bytes memory params = abi.encode(uint256(1));
        bytes32 paramsHash = keccak256(params);

        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: 0,
            deadline: uint48(block.timestamp - 1), // Expired deadline
            paramsHash: paramsHash
        });

        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(SessionErrors.ActionExpired.selector);
        manager.executeAction(action, params, signature);
    }

    function test_executeAction_actionNotAllowed() public {
        bytes32 sessionId = _createSessionSetup();
        
        bytes memory params = abi.encode(uint256(1));
        bytes32 paramsHash = keccak256(params);

        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 4, // Not allowed
            nonce: 0,
            deadline: uint48(block.timestamp + 1000),
            paramsHash: paramsHash
        });

        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(SessionErrors.ActionNotAllowed.selector);
        manager.executeAction(action, params, signature);
    }

    function test_executeAction_maxCallsExceeded() public {
        bytes32 sessionId = _createSessionSetup();
        
        bytes memory params = abi.encode(uint256(1));
        bytes32 paramsHash = keccak256(params);

        // Execute 10 times (maxCalls)
        for (uint256 i = 0; i < 10; i++) {
            SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
                sessionId: sessionId,
                actionId: 1, // MOVE
                nonce: i,
                deadline: uint48(block.timestamp + 1000),
                paramsHash: paramsHash
            });

            bytes32 digest = _hashSessionAction(action);
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionPk, digest);
            bytes memory signature = abi.encodePacked(r, s, v);

            manager.executeAction(action, params, signature);
        }

        // 11th should fail
        SessionTypes.SessionAction memory exceedAction = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: 10,
            deadline: uint48(block.timestamp + 1000),
            paramsHash: paramsHash
        });

        bytes32 digest2 = _hashSessionAction(exceedAction);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(sessionPk, digest2);
        bytes memory signature2 = abi.encodePacked(r2, s2, v2);

        vm.expectRevert(SessionErrors.MaxCallsExceeded.selector);
        manager.executeAction(exceedAction, params, signature2);
    }

    function test_executeAction_sessionExpired() public {
        bytes32 sessionId = _createSessionSetup();
        
        // Fast forward time
        vm.warp(block.timestamp + 1001);

        bytes memory params = abi.encode(uint256(1));
        bytes32 paramsHash = keccak256(params);

        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: 0,
            deadline: uint48(block.timestamp + 1000), // valid deadline relative to now
            paramsHash: paramsHash
        });

        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(SessionErrors.SessionExpired.selector);
        manager.executeAction(action, params, signature);
    }

    function test_executeAction_sessionRevoked() public {
        bytes32 sessionId = _createSessionSetup();
        
        vm.prank(owner);
        manager.revokeSession(sessionId);

        bytes memory params = abi.encode(uint256(1));
        bytes32 paramsHash = keccak256(params);

        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 1,
            nonce: 0,
            deadline: uint48(block.timestamp + 1000),
            paramsHash: paramsHash
        });

        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(SessionErrors.SessionRevoked.selector);
        manager.executeAction(action, params, signature);
    }
}
