const hre = require("hardhat");

/**
 * Deployment script for TokenVault contract
 * 
 * This script deploys the TokenVault contract to the configured network.
 * The deployer address will become the owner of the contract.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.js --network <network-name>
 * 
 * For local development:
 *   npx hardhat run scripts/deploy.js --network hardhat
 */
async function main() {
  console.log("Deploying TokenVault contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy the TokenVault contract
  // The deployer will be set as the initial owner
  const TokenVault = await hre.ethers.getContractFactory("TokenVault");
  const tokenVault = await TokenVault.deploy(deployer.address);

  // Wait for deployment to be mined
  await tokenVault.waitForDeployment();

  const tokenVaultAddress = await tokenVault.getAddress();
  console.log("TokenVault deployed to:", tokenVaultAddress);
  console.log("Owner address:", deployer.address);

  // Verify deployment by checking owner
  const owner = await tokenVault.owner();
  console.log("Contract owner verified:", owner === deployer.address);

  // Save deployment info (useful for frontend/backend integration)
  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", tokenVaultAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("========================\n");

  // Verification can be done manually using:
  // npm run verify:custom
  // or
  // npx hardhat verify --network <network> <contract-address> <constructor-args>
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
