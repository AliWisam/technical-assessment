// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice A simple ERC20 token for testing purposes
 * @dev Used in test cases to simulate token deposits and withdrawals
 */
contract MockERC20 is ERC20 {
    /**
     * @notice Constructor that mints initial supply to deployer
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply to mint to the deployer
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice Mint tokens to a specific address (for testing)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
