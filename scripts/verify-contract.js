const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const https = require("https");

/**
 * Custom verification script using Etherscan API V2
 * This bypasses the hardhat-verify plugin's V1 API issue
 */
async function main() {
  const contractAddress = "0x7C3a568F5238E77Ff74Ad6381B31A81F6810EB75";
  const ownerAddress = "0x4fb57fC72969234Afd3049A7d6dB20c21ec71dFd";
  const apiKey = process.env.ETHERSCAN_API_KEY;

  if (!apiKey) {
    console.error("❌ ETHERSCAN_API_KEY not found in .env file");
    process.exit(1);
  }

  console.log("🔍 Starting contract verification...");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Sepolia\n");

  // Get the Standard JSON Input file
  const buildInfoPath = path.join(__dirname, "../artifacts/build-info");
  const buildInfoFiles = fs.readdirSync(buildInfoPath).filter(f => f.endsWith(".json"));
  
  if (buildInfoFiles.length === 0) {
    console.error("❌ No build-info files found. Run 'npm run compile' first.");
    process.exit(1);
  }

  const latestFile = buildInfoFiles[buildInfoFiles.length - 1];
  const buildInfo = JSON.parse(fs.readFileSync(path.join(buildInfoPath, latestFile), "utf8"));

  // Extract the input JSON
  const standardJsonInput = JSON.stringify(buildInfo.input);

  // Encode constructor arguments
  const { ethers } = require("ethers");
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [ownerAddress]
  ).slice(2); // Remove '0x' prefix

  // Use solcLongVersion which includes the commit hash (required by Etherscan)
  // Etherscan requires "v" prefix, so add it if not present
  const solcVersion = buildInfo.solcLongVersion || `${buildInfo.solcVersion}+commit.a1b79de6`;
  const compilerVersion = solcVersion.startsWith("v") ? solcVersion : `v${solcVersion}`;
  
  console.log("📦 Preparing verification data...");
  console.log("Compiler Version:", compilerVersion);
  console.log("Optimization:", buildInfo.input.settings.optimizer.enabled ? "Yes" : "No");
  if (buildInfo.input.settings.optimizer.enabled) {
    console.log("Optimizer Runs:", buildInfo.input.settings.optimizer.runs);
  }

  // Prepare form data for Etherscan API V2
  // Note: chainid and apikey should be query parameters, not form data
  const queryParams = new URLSearchParams();
  queryParams.append("apikey", apiKey);
  queryParams.append("chainid", "11155111"); // Sepolia chain ID (required for V2)
  queryParams.append("module", "contract");
  queryParams.append("action", "verifysourcecode");
  
  const formData = new URLSearchParams();
  formData.append("contractaddress", contractAddress);
  formData.append("codeformat", "solidity-standard-json-input");
  formData.append("contractname", "contracts/TokenVault.sol:TokenVault");
  formData.append("compilerversion", compilerVersion);
  formData.append("optimizationUsed", buildInfo.input.settings.optimizer.enabled ? "1" : "0");
  if (buildInfo.input.settings.optimizer.enabled) {
    formData.append("runs", buildInfo.input.settings.optimizer.runs.toString());
  }
  formData.append("sourceCode", standardJsonInput);
  formData.append("constructorArguments", constructorArgs);
  formData.append("licenseType", "3"); // MIT License

  console.log("\n📤 Submitting verification to Etherscan API V2...");

  // Submit verification request to V2 API endpoint
  // V2 API: chainid and apikey are query params, rest is form data
  const apiPath = `/v2/api?${queryParams.toString()}`;
  const options = {
    hostname: "api.etherscan.io",
    path: apiPath,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": formData.toString().length,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          
          if (response.status === "1" && response.result) {
            console.log("✅ Verification submitted successfully!");
            console.log("GUID:", response.result);
            console.log("\n⏳ Please wait a few moments and check:");
            console.log(`https://sepolia.etherscan.io/address/${contractAddress}#code`);
            console.log("\nOr check status with:");
            console.log(`curl "https://api.etherscan.io/v2/api?apikey=${apiKey}&chainid=11155111&module=contract&action=checkverifystatus&guid=${response.result}"`);
            resolve(response);
          } else {
            console.error("❌ Verification failed:");
            console.error("Status:", response.status);
            console.error("Message:", response.message || response.result);
            if (response.result) {
              console.error("Result:", response.result);
            }
            reject(new Error(response.message || "Verification failed"));
          }
        } catch (error) {
          console.error("❌ Error parsing response:", error);
          console.error("Raw response:", data);
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ Request error:", error);
      reject(error);
    });

    req.write(formData.toString());
    req.end();
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification script failed:", error.message);
    console.log("\n💡 Alternative: Use manual verification via Etherscan website");
    console.log("   See VERIFICATION.md for detailed instructions");
    process.exit(1);
  });
