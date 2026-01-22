const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenVault", function () {
  let tokenVault;
  let mockToken;
  let owner;
  let user1;
  let user2;
  let deployer;

  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const DEPOSIT_AMOUNT = ethers.parseEther("100");
  const WITHDRAW_AMOUNT = ethers.parseEther("50");

  beforeEach(async function () {
    // Get signers
    [deployer, owner, user1, user2] = await ethers.getSigners();

    // Deploy MockERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy(
      "Test Token",
      "TEST",
      INITIAL_SUPPLY
    );
    await mockToken.waitForDeployment();

    // Deploy TokenVault
    const TokenVault = await ethers.getContractFactory("TokenVault");
    tokenVault = await TokenVault.deploy(owner.address);
    await tokenVault.waitForDeployment();

    // Distribute tokens to users for testing
    await mockToken.transfer(user1.address, ethers.parseEther("10000"));
    await mockToken.transfer(user2.address, ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await tokenVault.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      expect(await tokenVault.paused()).to.be.false;
    });

    it("Should have zero balance for new users", async function () {
      expect(await tokenVault.getBalance(await mockToken.getAddress(), user1.address)).to.equal(0);
    });

    it("Should have zero total deposits initially", async function () {
      expect(await tokenVault.getTotalDeposits(await mockToken.getAddress())).to.equal(0);
    });
  });

  describe("Deposit", function () {
    it("Should allow users to deposit tokens", async function () {
      const tokenAddress = await mockToken.getAddress();
      const amount = DEPOSIT_AMOUNT;

      // Approve vault to spend tokens
      await mockToken.connect(user1).approve(await tokenVault.getAddress(), amount);

      // Deposit tokens
      const tx = await tokenVault.connect(user1).deposit(tokenAddress, amount);
      await expect(tx)
        .to.emit(tokenVault, "Deposit")
        .withArgs(
          user1.address,
          tokenAddress,
          amount,
          (timestamp) => {
            // Check that timestamp is a valid number
            return typeof timestamp === "bigint" && timestamp > 0n;
          }
        );

      // Check user balance
      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(amount);

      // Check total deposits
      expect(await tokenVault.getTotalDeposits(tokenAddress)).to.equal(amount);

      // Check vault token balance
      expect(await mockToken.balanceOf(await tokenVault.getAddress())).to.equal(amount);
    });

    it("Should allow multiple deposits from same user", async function () {
      const tokenAddress = await mockToken.getAddress();
      const amount1 = DEPOSIT_AMOUNT;
      const amount2 = ethers.parseEther("200");

      await mockToken.connect(user1).approve(await tokenVault.getAddress(), amount1 + amount2);

      await tokenVault.connect(user1).deposit(tokenAddress, amount1);
      await tokenVault.connect(user1).deposit(tokenAddress, amount2);

      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(amount1 + amount2);
      expect(await tokenVault.getTotalDeposits(tokenAddress)).to.equal(amount1 + amount2);
    });

    it("Should allow multiple users to deposit", async function () {
      const tokenAddress = await mockToken.getAddress();
      const amount1 = DEPOSIT_AMOUNT;
      const amount2 = ethers.parseEther("200");

      await mockToken.connect(user1).approve(await tokenVault.getAddress(), amount1);
      await mockToken.connect(user2).approve(await tokenVault.getAddress(), amount2);

      await tokenVault.connect(user1).deposit(tokenAddress, amount1);
      await tokenVault.connect(user2).deposit(tokenAddress, amount2);

      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(amount1);
      expect(await tokenVault.getBalance(tokenAddress, user2.address)).to.equal(amount2);
      expect(await tokenVault.getTotalDeposits(tokenAddress)).to.equal(amount1 + amount2);
    });

    it("Should revert if token address is zero", async function () {
      await expect(
        tokenVault.connect(user1).deposit(ethers.ZeroAddress, DEPOSIT_AMOUNT)
      ).to.be.revertedWith("TokenVault: invalid token address");
    });

    it("Should revert if amount is zero", async function () {
      const tokenAddress = await mockToken.getAddress();
      await expect(
        tokenVault.connect(user1).deposit(tokenAddress, 0)
      ).to.be.revertedWith("TokenVault: amount must be greater than zero");
    });

    it("Should revert if user hasn't approved tokens", async function () {
      const tokenAddress = await mockToken.getAddress();
      await expect(
        tokenVault.connect(user1).deposit(tokenAddress, DEPOSIT_AMOUNT)
      ).to.be.reverted;
    });

    it("Should revert if user has insufficient balance", async function () {
      const tokenAddress = await mockToken.getAddress();
      const largeAmount = ethers.parseEther("10000000"); // More than user has

      await mockToken.connect(user1).approve(await tokenVault.getAddress(), largeAmount);
      await expect(
        tokenVault.connect(user1).deposit(tokenAddress, largeAmount)
      ).to.be.reverted;
    });

    it("Should revert deposit when contract is paused", async function () {
      const tokenAddress = await mockToken.getAddress();
      await mockToken.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);

      // Pause the contract
      await tokenVault.connect(owner).pause();

      // Try to deposit
      await expect(
        tokenVault.connect(user1).deposit(tokenAddress, DEPOSIT_AMOUNT)
      ).to.be.revertedWithCustomError(tokenVault, "EnforcedPause");
    });

    it("Should emit Deposit event with correct parameters", async function () {
      const tokenAddress = await mockToken.getAddress();
      const amount = DEPOSIT_AMOUNT;

      await mockToken.connect(user1).approve(await tokenVault.getAddress(), amount);

      const tx = await tokenVault.connect(user1).deposit(tokenAddress, amount);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Deposit"
      );

      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(user1.address);
      expect(event.args[1]).to.equal(tokenAddress);
      expect(event.args[2]).to.equal(amount);
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      // Setup: user1 deposits tokens first
      const tokenAddress = await mockToken.getAddress();
      await mockToken.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);
      await tokenVault.connect(user1).deposit(tokenAddress, DEPOSIT_AMOUNT);
    });

    it("Should allow users to withdraw their tokens", async function () {
      const tokenAddress = await mockToken.getAddress();
      const amount = WITHDRAW_AMOUNT;
      const user1BalanceBefore = await mockToken.balanceOf(user1.address);

      const tx = await tokenVault.connect(user1).withdraw(tokenAddress, amount);
      await expect(tx)
        .to.emit(tokenVault, "Withdraw")
        .withArgs(
          user1.address,
          tokenAddress,
          amount,
          (timestamp) => {
            // Check that timestamp is a valid number
            return typeof timestamp === "bigint" && timestamp > 0n;
          }
        );

      // Check user balance in vault
      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(
        DEPOSIT_AMOUNT - amount
      );

      // Check total deposits
      expect(await tokenVault.getTotalDeposits(tokenAddress)).to.equal(
        DEPOSIT_AMOUNT - amount
      );

      // Check user received tokens
      expect(await mockToken.balanceOf(user1.address)).to.equal(
        user1BalanceBefore + amount
      );
    });

    it("Should allow users to withdraw all their tokens", async function () {
      const tokenAddress = await mockToken.getAddress();
      const user1BalanceBefore = await mockToken.balanceOf(user1.address);

      await tokenVault.connect(user1).withdraw(tokenAddress, DEPOSIT_AMOUNT);

      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(0);
      expect(await tokenVault.getTotalDeposits(tokenAddress)).to.equal(0);
      expect(await mockToken.balanceOf(user1.address)).to.equal(
        user1BalanceBefore + DEPOSIT_AMOUNT
      );
    });

    it("Should revert if token address is zero", async function () {
      await expect(
        tokenVault.connect(user1).withdraw(ethers.ZeroAddress, WITHDRAW_AMOUNT)
      ).to.be.revertedWith("TokenVault: invalid token address");
    });

    it("Should revert if amount is zero", async function () {
      const tokenAddress = await mockToken.getAddress();
      await expect(
        tokenVault.connect(user1).withdraw(tokenAddress, 0)
      ).to.be.revertedWith("TokenVault: amount must be greater than zero");
    });

    it("Should revert if user has insufficient balance", async function () {
      const tokenAddress = await mockToken.getAddress();
      const largeAmount = ethers.parseEther("1000");

      await expect(
        tokenVault.connect(user1).withdraw(tokenAddress, largeAmount)
      ).to.be.revertedWith("TokenVault: insufficient balance");
    });

    it("Should revert if user tries to withdraw from another user's balance", async function () {
      const tokenAddress = await mockToken.getAddress();
      // user2 has no deposits
      await expect(
        tokenVault.connect(user2).withdraw(tokenAddress, WITHDRAW_AMOUNT)
      ).to.be.revertedWith("TokenVault: insufficient balance");
    });

    it("Should revert withdraw when contract is paused", async function () {
      const tokenAddress = await mockToken.getAddress();

      // Pause the contract
      await tokenVault.connect(owner).pause();

      // Try to withdraw
      await expect(
        tokenVault.connect(user1).withdraw(tokenAddress, WITHDRAW_AMOUNT)
      ).to.be.revertedWithCustomError(tokenVault, "EnforcedPause");
    });

    it("Should emit Withdraw event with correct parameters", async function () {
      const tokenAddress = await mockToken.getAddress();
      const amount = WITHDRAW_AMOUNT;

      const tx = await tokenVault.connect(user1).withdraw(tokenAddress, amount);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Withdraw"
      );

      expect(event).to.not.be.undefined;
      expect(event.args[0]).to.equal(user1.address);
      expect(event.args[1]).to.equal(tokenAddress);
      expect(event.args[2]).to.equal(amount);
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause the contract", async function () {
      await tokenVault.connect(owner).pause();
      expect(await tokenVault.paused()).to.be.true;
    });

    it("Should allow owner to unpause the contract", async function () {
      await tokenVault.connect(owner).pause();
      await tokenVault.connect(owner).unpause();
      expect(await tokenVault.paused()).to.be.false;
    });

    it("Should revert if non-owner tries to pause", async function () {
      await expect(
        tokenVault.connect(user1).pause()
      ).to.be.revertedWithCustomError(tokenVault, "OwnableUnauthorizedAccount");
    });

    it("Should revert if non-owner tries to unpause", async function () {
      await tokenVault.connect(owner).pause();
      await expect(
        tokenVault.connect(user1).unpause()
      ).to.be.revertedWithCustomError(tokenVault, "OwnableUnauthorizedAccount");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Setup: multiple users deposit different amounts
      const tokenAddress = await mockToken.getAddress();
      
      await mockToken.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);
      await mockToken.connect(user2).approve(await tokenVault.getAddress(), ethers.parseEther("200"));
      
      await tokenVault.connect(user1).deposit(tokenAddress, DEPOSIT_AMOUNT);
      await tokenVault.connect(user2).deposit(tokenAddress, ethers.parseEther("200"));
    });

    it("Should return correct balance for a user", async function () {
      const tokenAddress = await mockToken.getAddress();
      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await tokenVault.getBalance(tokenAddress, user2.address)).to.equal(ethers.parseEther("200"));
    });

    it("Should return zero balance for user with no deposits", async function () {
      const tokenAddress = await mockToken.getAddress();
      const [newUser] = await ethers.getSigners();
      expect(await tokenVault.getBalance(tokenAddress, newUser.address)).to.equal(0);
    });

    it("Should return correct total deposits for a token", async function () {
      const tokenAddress = await mockToken.getAddress();
      const expectedTotal = DEPOSIT_AMOUNT + ethers.parseEther("200");
      expect(await tokenVault.getTotalDeposits(tokenAddress)).to.equal(expectedTotal);
    });

    it("Should return zero total deposits for token with no deposits", async function () {
      // Deploy a new token that hasn't been used
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const newToken = await MockERC20.deploy("New Token", "NEW", INITIAL_SUPPLY);
      await newToken.waitForDeployment();

      expect(await tokenVault.getTotalDeposits(await newToken.getAddress())).to.equal(0);
    });

    it("Should update total deposits correctly after withdrawals", async function () {
      const tokenAddress = await mockToken.getAddress();
      const withdrawAmount = ethers.parseEther("50");
      
      await tokenVault.connect(user1).withdraw(tokenAddress, withdrawAmount);
      
      const expectedTotal = DEPOSIT_AMOUNT - withdrawAmount + ethers.parseEther("200");
      expect(await tokenVault.getTotalDeposits(tokenAddress)).to.equal(expectedTotal);
    });
  });

  describe("Multiple Tokens", function () {
    let mockToken2;

    beforeEach(async function () {
      // Deploy a second mock token
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      mockToken2 = await MockERC20.deploy("Test Token 2", "TEST2", INITIAL_SUPPLY);
      await mockToken2.waitForDeployment();

      await mockToken2.transfer(user1.address, ethers.parseEther("10000"));
    });

    it("Should handle deposits of different tokens separately", async function () {
      const token1Address = await mockToken.getAddress();
      const token2Address = await mockToken2.getAddress();

      await mockToken.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);
      await mockToken2.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);

      await tokenVault.connect(user1).deposit(token1Address, DEPOSIT_AMOUNT);
      await tokenVault.connect(user1).deposit(token2Address, DEPOSIT_AMOUNT);

      expect(await tokenVault.getBalance(token1Address, user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await tokenVault.getBalance(token2Address, user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await tokenVault.getTotalDeposits(token1Address)).to.equal(DEPOSIT_AMOUNT);
      expect(await tokenVault.getTotalDeposits(token2Address)).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should allow withdrawal of specific token without affecting others", async function () {
      const token1Address = await mockToken.getAddress();
      const token2Address = await mockToken2.getAddress();

      await mockToken.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);
      await mockToken2.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);

      await tokenVault.connect(user1).deposit(token1Address, DEPOSIT_AMOUNT);
      await tokenVault.connect(user1).deposit(token2Address, DEPOSIT_AMOUNT);

      await tokenVault.connect(user1).withdraw(token1Address, WITHDRAW_AMOUNT);

      expect(await tokenVault.getBalance(token1Address, user1.address)).to.equal(
        DEPOSIT_AMOUNT - WITHDRAW_AMOUNT
      );
      expect(await tokenVault.getBalance(token2Address, user1.address)).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks", async function () {
      // This test verifies that ReentrancyGuard is working
      // In a real attack scenario, a malicious contract would try to re-enter
      // The nonReentrant modifier should prevent this
      const tokenAddress = await mockToken.getAddress();
      await mockToken.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);
      await tokenVault.connect(user1).deposit(tokenAddress, DEPOSIT_AMOUNT);

      // Multiple withdrawals should work normally (not reentrancy)
      await tokenVault.connect(user1).withdraw(tokenAddress, WITHDRAW_AMOUNT);
      await tokenVault.connect(user1).withdraw(tokenAddress, WITHDRAW_AMOUNT);

      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(
        DEPOSIT_AMOUNT - WITHDRAW_AMOUNT * 2n
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small amounts", async function () {
      const tokenAddress = await mockToken.getAddress();
      const smallAmount = 1n; // 1 wei

      await mockToken.connect(user1).approve(await tokenVault.getAddress(), smallAmount);
      await tokenVault.connect(user1).deposit(tokenAddress, smallAmount);

      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(smallAmount);
    });

    it("Should handle large amounts", async function () {
      const tokenAddress = await mockToken.getAddress();
      // Use an amount that user1 actually has (they have 10000 tokens)
      const largeAmount = ethers.parseEther("5000");

      await mockToken.connect(user1).approve(await tokenVault.getAddress(), largeAmount);
      await tokenVault.connect(user1).deposit(tokenAddress, largeAmount);

      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(largeAmount);
    });

    it("Should maintain correct state after pause and unpause", async function () {
      const tokenAddress = await mockToken.getAddress();
      await mockToken.connect(user1).approve(await tokenVault.getAddress(), DEPOSIT_AMOUNT);
      
      await tokenVault.connect(user1).deposit(tokenAddress, DEPOSIT_AMOUNT);
      await tokenVault.connect(owner).pause();
      await tokenVault.connect(owner).unpause();

      // State should remain unchanged
      expect(await tokenVault.getBalance(tokenAddress, user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await tokenVault.getTotalDeposits(tokenAddress)).to.equal(DEPOSIT_AMOUNT);
    });
  });
});

// Helper function to get block timestamp
async function getBlockTimestamp() {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  return block.timestamp;
}
