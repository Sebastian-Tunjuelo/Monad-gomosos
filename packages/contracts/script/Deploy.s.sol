// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SessionManager.sol";
import "../src/demo/DemoGame.sol";
import "../src/demo/DemoSocial.sol";
import "../src/token/GameToken.sol";

/// @notice Deploys SessionManager, DemoGame, DemoSocial, and GameToken.
contract Deploy is Script {
    function run() external {
        uint256 deployerPk = vm.envOr(
            "DEPLOYER_PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );
        address deployer = vm.addr(deployerPk);

        vm.startBroadcast(deployerPk);

        GameToken token = new GameToken();
        DemoGame game = new DemoGame();
        DemoSocial social = new DemoSocial();
        SessionManager manager = new SessionManager();

        vm.stopBroadcast();

        console2.log("=== Deploy complete ===");
        console2.log("Deployer        :", deployer);
        console2.log("GameToken       :", address(token));
        console2.log("DemoGame        :", address(game));
        console2.log("DemoSocial      :", address(social));
        console2.log("SessionManager  :", address(manager));
        console2.log("ChainId         :", block.chainid);

        string memory json = string.concat(
            "{\n",
            '  "chainId": ', vm.toString(block.chainid), ",\n",
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "GameToken": "', vm.toString(address(token)), '",\n',
            '  "DemoGame": "', vm.toString(address(game)), '",\n',
            '  "DemoSocial": "', vm.toString(address(social)), '",\n',
            '  "SessionManager": "', vm.toString(address(manager)), '"\n',
            "}"
        );

        string memory path = string.concat("reports/deploy-", vm.toString(block.chainid), ".json");
        vm.writeFile(path, json);
        console2.log("Report saved to:", path);

        // Remind deployer to verify contracts on Monad
        if (block.chainid == 10143 || block.chainid == 143) {
            console2.log("");
            console2.log("=== Next step: verify contracts ===");
            console2.log("Run: pnpm verify:monad");
            console2.log("This verifies on MonadVision, Socialscan, and Monadscan with one call.");
        }
    }
}
