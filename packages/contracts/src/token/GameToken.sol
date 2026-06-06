// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title GameToken
/// @notice Token ERC-20 para Monad Session Arena con funcionalidad de faucet
contract GameToken is ERC20, Ownable {
    uint256 public constant MINT_AMOUNT = 100 * 10**18; // 100 ARENA

    constructor() ERC20("Arena Token", "ARENA") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10**18); // Initial supply for owner
    }

    /// @notice Permite a cualquier usuario hacer mint de tokens para pruebas (Faucet)
    function mint() external {
        _mint(msg.sender, MINT_AMOUNT);
    }
}
