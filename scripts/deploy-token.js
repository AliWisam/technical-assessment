const hre = require("hardhat");

/**
 * Deployment script for MockERC20 token contract
 * 
 * This script deploys a MockERC20 token to the configured network.
 * Useful for testing the TokenVault contract.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-token.js --network <network-name>
 * 
 * For Sepolia:
 *   npx hardhat run scripts/deploy-token.js --network sepolia
 */
async function main() {
  console.log("Deploying MockERC20 token contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Token parameters
  const tokenName = process.env.TOKEN_NAME || "Test Token";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "TEST";
  const initialSupply = process.env.TOKEN_SUPPLY || hre.ethers.parseEther("1000000"); // 1M tokens by default

  console.log("\nToken Parameters:");
  console.log("Name:", tokenName);
  console.log("Symbol:", tokenSymbol);
  console.log("Initial Supply:", initialSupply.toString());

  // Deploy the MockERC20 contract
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy(
    tokenName,
    tokenSymbol,
    initialSupply
  );

  // Wait for deployment to be mined
  await mockToken.waitForDeployment();

  const tokenAddress = await mockToken.getAddress();
  console.log("\n✅ MockERC20 deployed to:", tokenAddress);
  console.log("Network:", hre.network.name);

  // Verify token details
  const name = await mockToken.name();
  const symbol = await mockToken.symbol();
  const totalSupply = await mockToken.totalSupply();
  const deployerBalance = await mockToken.balanceOf(deployer.address);

  console.log("\n=== Deployment Summary ===");
  console.log("Token Address:", tokenAddress);
  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Total Supply:", totalSupply.toString());
  console.log("Deployer Balance:", deployerBalance.toString());
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("========================\n");

  console.log("💡 Save this token address for use in:");
  console.log("   - Backend configuration (.env)");
  console.log("   - Frontend configuration");
  console.log("   - Testing the TokenVault contract");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
