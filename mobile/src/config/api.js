// API Configuration
// TODO: Update this with your backend API URL
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Contract Configuration
// TODO: Update with your deployed contract address
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: process.env.CHAIN_ID || 1337, // Local network default
  name: process.env.NETWORK_NAME || 'Local Network',
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
};

// WalletConnect Configuration (Optional)
// TODO: If using WalletConnect v2, install @walletconnect/react-native-compat
// Get a project ID from https://cloud.walletconnect.com
export const WALLETCONNECT_PROJECT_ID = process.env.WALLETCONNECT_PROJECT_ID || '';

// MetaMask Mobile SDK (Optional)
// TODO: If using MetaMask, install @metamask/sdk-react-native
