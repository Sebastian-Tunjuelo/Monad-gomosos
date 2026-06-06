// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SessionManager.sol";
import "../src/demo/DemoGame.sol";
import "../src/token/GameToken.sol";

contract SessionManagerSpendTest is Test {
    SessionManager manager;
    DemoGame game;
    GameToken token;

    uint256 ownerPk = 0xA11CE;
    address owner = vm.addr(ownerPk);

    uint256 sessionPk = 0xB0B;
    address sessionKey = vm.addr(sessionPk);

    function setUp() public {
        manager = new SessionManager();
        game = new DemoGame();
        token = new GameToken();

        // Give the owner some tokens and set allowance for SessionManager
        vm.startPrank(owner);
        token.mint();
        token.approve(address(manager), type(uint256).max);
        vm.stopPrank();
    }

    function _hashSessionGrant(
        SessionTypes.SessionPolicy memory policy
    ) internal view returns (bytes32) {
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
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("MonadSessionArena")),
                keccak256(bytes("1")),
                block.chainid,
                address(manager)
            )
        );

        return
            keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
            );
    }

    function _hashSessionAction(
        SessionTypes.SessionAction memory action
    ) internal view returns (bytes32) {
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
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("MonadSessionArena")),
                keccak256(bytes("1")),
                block.chainid,
                address(manager)
            )
        );

        return
            keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
            );
    }

    function _createSessionSetup(uint256 maxSpend) internal returns (bytes32) {
        SessionTypes.SessionPolicy memory policy = SessionTypes.SessionPolicy({
            owner: owner,
            sessionKey: sessionKey,
            validUntil: uint48(block.timestamp + 1000),
            maxCalls: 10,
            gameContract: address(game),
            allowedActions: 16, // BUY_ITEM (1 << 4 = 16)
            token: address(token),
            maxTokenSpend: maxSpend,
            salt: bytes32(uint256(1))
        });

        bytes32 digest = _hashSessionGrant(policy);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        return manager.createSession(policy, signature);
    }

    function test_executeAction_buyItem_success() public {
        bytes32 sessionId = _createSessionSetup(50 * 1e18); // 50 ARENA limit

        bytes memory params = abi.encode(uint256(1)); // mock params
        bytes32 paramsHash = keccak256(params);

        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 4, // BUY_ITEM
            nonce: 0,
            deadline: uint48(block.timestamp + 1000),
            paramsHash: paramsHash
        });

        bytes32 digest = _hashSessionAction(action);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionPk, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        uint256 ownerBalBefore = token.balanceOf(owner);
        uint256 managerBalBefore = token.balanceOf(address(manager));

        manager.executeAction(action, params, signature);

        // Verify state changed
        (, uint256 tokenSpent, , ) = manager.sessionStates(sessionId);
        assertEq(tokenSpent, 10 * 1e18);
        assertEq(game.playerItems(owner), 1);

        // Verify tokens transferred
        assertEq(token.balanceOf(owner), ownerBalBefore - 10 * 1e18);
        assertEq(
            token.balanceOf(address(manager)),
            managerBalBefore + 10 * 1e18
        );
    }

    function test_executeAction_spendLimitExceeded() public {
        bytes32 sessionId = _createSessionSetup(15 * 1e18); // 15 ARENA limit, 1 item is 10

        bytes memory params = abi.encode(uint256(1));
        bytes32 paramsHash = keccak256(params);

        // First buy should succeed
        SessionTypes.SessionAction memory action1 = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 4,
            nonce: 0,
            deadline: uint48(block.timestamp + 1000),
            paramsHash: paramsHash
        });
        bytes32 digest1 = _hashSessionAction(action1);
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(sessionPk, digest1);
        manager.executeAction(action1, params, abi.encodePacked(r1, s1, v1));

        // Second buy should fail (10 + 10 = 20 > 15)
        SessionTypes.SessionAction memory action2 = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 4,
            nonce: 1,
            deadline: uint48(block.timestamp + 1000),
            paramsHash: paramsHash
        });
        bytes32 digest2 = _hashSessionAction(action2);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(sessionPk, digest2);

        vm.expectRevert(SessionErrors.SpendLimitExceeded.selector);
        manager.executeAction(action2, params, abi.encodePacked(r2, s2, v2));
    }

    function test_executeAction_buyItem_afterRevocation() public {
        bytes32 sessionId = _createSessionSetup(50 * 1e18);

        // Revoke the session as the owner
        vm.prank(owner);
        manager.revokeSession(sessionId);

        // Prepare a BUY_ITEM action
        bytes memory params = abi.encode(uint256(1));
        bytes32 paramsHash = keccak256(params);

        SessionTypes.SessionAction memory action = SessionTypes.SessionAction({
            sessionId: sessionId,
            actionId: 4, // BUY_ITEM
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
