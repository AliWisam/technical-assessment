const fs = require("fs");
const path = require("path");

/**
 * Script to get verification information for manual Etherscan verification
 */
async function main() {
  console.log("=== TokenVault Contract Verification Info ===\n");
  
  const contractAddress = "0x7C3a568F5238E77Ff74Ad6381B31A81F6810EB75";
  const ownerAddress = "0x4fb57fC72969234Afd3049A7d6dB20c21ec71dFd";
  
  console.log("Contract Address:", contractAddress);
  console.log("Network: Sepolia Testnet");
  console.log("Owner Address:", ownerAddress);
  console.log("\n--- Constructor Arguments (ABI-encoded) ---");
  console.log("0x0000000000000000000000004fb57fc72969234afd3049a7d6db20c21ec71dfd");
  
  console.log("\n--- Compiler Settings ---");
  console.log("Compiler Version: v0.8.20+commit.a1b79de6");
  console.log("Optimization: Enabled (200 runs)");
  console.log("License: MIT");
  
  console.log("\n--- Standard JSON Input File Location ---");
  const buildInfoPath = path.join(__dirname, "../artifacts/build-info");
  const buildInfoFiles = fs.readdirSync(buildInfoPath).filter(f => f.endsWith(".json"));
  
  if (buildInfoFiles.length > 0) {
    const latestFile = buildInfoFiles[buildInfoFiles.length - 1];
    const fullPath = path.join(buildInfoPath, latestFile);
    console.log(`File: ${fullPath}`);
    console.log("\nTo get the JSON content, run:");
    console.log(`cat ${fullPath}`);
    console.log("\nOr copy the file content and paste it in Etherscan's 'Standard JSON Input' field.");
  }
  
  console.log("\n--- Manual Verification Steps ---");
  console.log("1. Go to: https://sepolia.etherscan.io/address/" + contractAddress);
  console.log("2. Click 'Contract' tab → 'Verify and Publish'");
  console.log("3. Select 'Solidity (Standard JSON Input)'");
  console.log("4. Paste the JSON content from the build-info file");
  console.log("5. Enter constructor arguments: 0x0000000000000000000000004fb57fc72969234afd3049a7d6db20c21ec71dfd");
  console.log("6. Click 'Verify and Publish'");
  console.log("\n==========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
