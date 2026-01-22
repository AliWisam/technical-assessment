// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenVault
 * @author Ali Wisam
 * @notice A vault contract that allows users to deposit and withdraw ERC20 tokens
 * @dev Implements access control, pausable functionality, and reentrancy protection
 */
contract TokenVault is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * @notice Emitted when a user deposits tokens into the vault
     * @param user The address of the user making the deposit
     * @param token The address of the ERC20 token being deposited
     * @param amount The amount of tokens deposited
     * @param timestamp The block timestamp when the deposit occurred
     */
    event Deposit(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a user withdraws tokens from the vault
     * @param user The address of the user making the withdrawal
     * @param token The address of the ERC20 token being withdrawn
     * @param amount The amount of tokens withdrawn
     * @param timestamp The block timestamp when the withdrawal occurred
     */
    event Withdraw(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @notice Mapping from token address to user address to balance
     * @dev token => user => balance
     */
    mapping(address => mapping(address => uint256)) private _balances;

    /**
     * @notice Mapping from token address to total deposits
     * @dev token => totalDeposits
     */
    mapping(address => uint256) private _totalDeposits;

    /**
     * @notice Constructor sets the initial owner
     * @param initialOwner The address that will own the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Deposit ERC20 tokens into the vault
     * @param token The address of the ERC20 token to deposit
     * @param amount The amount of tokens to deposit
     * @dev Requires the contract to not be paused
     * @dev Requires the user to have approved the contract to spend tokens
     * @dev Uses SafeERC20 for safe token transfers
     */
    function deposit(address token, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(token != address(0), "TokenVault: invalid token address");
        require(amount > 0, "TokenVault: amount must be greater than zero");

        IERC20 tokenContract = IERC20(token);
        
        // Transfer tokens from user to vault
        tokenContract.safeTransferFrom(msg.sender, address(this), amount);

        // Update user balance
        _balances[token][msg.sender] += amount;
        
        // Update total deposits for the token
        _totalDeposits[token] += amount;

        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @notice Withdraw ERC20 tokens from the vault
     * @param token The address of the ERC20 token to withdraw
     * @param amount The amount of tokens to withdraw
     * @dev Requires the contract to not be paused
     * @dev Requires the user to have sufficient balance
     * @dev Uses SafeERC20 for safe token transfers
     */
    function withdraw(address token, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        require(token != address(0), "TokenVault: invalid token address");
        require(amount > 0, "TokenVault: amount must be greater than zero");
        require(
            _balances[token][msg.sender] >= amount,
            "TokenVault: insufficient balance"
        );

        // Update user balance before transfer (checks-effects-interactions pattern)
        _balances[token][msg.sender] -= amount;
        
        // Update total deposits for the token
        _totalDeposits[token] -= amount;

        // Transfer tokens from vault to user
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, token, amount, block.timestamp);
    }

    /**
     * @notice Get the balance of a specific token for a specific user
     * @param token The address of the ERC20 token
     * @param user The address of the user
     * @return The balance of the token for the user
     */
    function getBalance(address token, address user) 
        external 
        view 
        returns (uint256) 
    {
        return _balances[token][user];
    }

    /**
     * @notice Get the total deposits for a specific token
     * @param token The address of the ERC20 token
     * @return The total amount of tokens deposited in the vault
     */
    function getTotalDeposits(address token) 
        external 
        view 
        returns (uint256) 
    {
        return _totalDeposits[token];
    }

    /**
     * @notice Pause the contract (only owner)
     * @dev Prevents deposits and withdrawals when paused
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract (only owner)
     * @dev Allows deposits and withdrawals to resume
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
