// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PROVN Token
 * @dev Industry-standard ERC-20 token with auto-faucet functionality
 * @author PROVN Team
 */
contract PROVNToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    // Faucet configuration
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18; // 100 PROVN tokens
    uint256 public constant FAUCET_COOLDOWN = 24 hours; // 24 hour cooldown
    
    // Faucet tracking
    mapping(address => uint256) public lastFaucetTime;
    mapping(address => bool) public hasReceivedFaucet;
    
    // Events
    event TokensFauceted(address indexed recipient, uint256 amount);
    event FaucetPaused(address indexed by);
    event FaucetResumed(address indexed by);
    
    /**
     * @dev Constructor - mints initial supply to deployer
     */
    constructor() ERC20("PROVN", "PROVN") Ownable(msg.sender) {
        // Mint initial supply to deployer (1 million PROVN)
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    /**
     * @dev Auto-faucet function - gives PROVN tokens to new users
     * @param recipient Address to receive tokens
     */
    function autoFaucet(address recipient) external nonReentrant whenNotPaused {
        require(recipient != address(0), "Invalid recipient address");
        require(!hasReceivedFaucet[recipient], "Already received faucet tokens");
        
        // Check cooldown if user has received tokens before
        if (lastFaucetTime[recipient] > 0) {
            require(
                block.timestamp >= lastFaucetTime[recipient] + FAUCET_COOLDOWN,
                "Faucet cooldown not expired"
            );
        }
        
        // Update tracking
        hasReceivedFaucet[recipient] = true;
        lastFaucetTime[recipient] = block.timestamp;
        
        // Mint and transfer tokens
        _mint(recipient, FAUCET_AMOUNT);
        
        emit TokensFauceted(recipient, FAUCET_AMOUNT);
    }
    
    /**
     * @dev Manual faucet for testing/emergency
     * @param recipient Address to receive tokens
     * @param amount Amount to mint
     */
    function manualFaucet(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(recipient, amount);
        emit TokensFauceted(recipient, amount);
    }
    
    /**
     * @dev Pause faucet functionality
     */
    function pauseFaucet() external onlyOwner {
        _pause();
        emit FaucetPaused(msg.sender);
    }
    
    /**
     * @dev Resume faucet functionality
     */
    function resumeFaucet() external onlyOwner {
        _unpause();
        emit FaucetResumed(msg.sender);
    }
    
    /**
     * @dev Emergency pause all token operations
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Emergency resume all token operations
     */
    function emergencyResume() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override transfer to check for paused state
     */
    function transfer(address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to check for paused state
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Get faucet status for an address
     * @param user Address to check
     * @return canReceive Whether user can receive faucet tokens
     * @return timeUntilNextFaucet Time until next faucet (0 if can receive now)
     */
    function getFaucetStatus(address user) external view returns (bool canReceive, uint256 timeUntilNextFaucet) {
        if (hasReceivedFaucet[user]) {
            uint256 nextFaucetTime = lastFaucetTime[user] + FAUCET_COOLDOWN;
            if (block.timestamp >= nextFaucetTime) {
                canReceive = true;
                timeUntilNextFaucet = 0;
            } else {
                canReceive = false;
                timeUntilNextFaucet = nextFaucetTime - block.timestamp;
            }
        } else {
            canReceive = true;
            timeUntilNextFaucet = 0;
        }
    }
}
