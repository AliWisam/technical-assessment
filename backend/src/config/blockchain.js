import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables early
dotenv.config();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the contract ABI from the JSON file
// This ABI is automatically generated from the compiled contract
let CONTRACT_ABI;
try {
  const abiPath = join(__dirname, 'contract-abi.json');
  const abiData = readFileSync(abiPath, 'utf8');
  CONTRACT_ABI = JSON.parse(abiData);
} catch (error) {
  console.error('Error loading contract ABI:', error.message);
  console.error('Make sure to run: npm run compile in the root directory first');
  // Fallback to minimal ABI if file not found
  CONTRACT_ABI = [
    'function getBalance(address, address) external view returns (uint256)',
    'function getTotalDeposits(address) external view returns (uint256)',
    'function paused() external view returns (bool)',
    'function deposit(address, uint256) external',
    'function withdraw(address, uint256) external',
    'event Deposit(address indexed user, address indexed token, uint256 amount, uint256 timestamp)',
    'event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 timestamp)',
  ];
}

let provider = null;
let contract = null;

function getProvider() {
  if (!provider) {
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

function getContract() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.warn('CONTRACT_ADDRESS not set in environment variables');
    return null;
  }

  if (!ethers.isAddress(contractAddress)) {
    console.error('Invalid CONTRACT_ADDRESS format');
    return null;
  }

  if (!contract) {
    const provider = getProvider();
    contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
  }

  return contract;
}

export { getProvider, getContract };
