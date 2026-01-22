# Solution Documentation

## Approach

I first understood the assignment requirements and reviewed the existing codebase structure. Then I created the TokenVault and MockERC20 smart contracts and wrote comprehensive test cases for them. After that, I deployed the contracts to Ethereum Sepolia testnet so they could be used by the backend and frontend. Next, I connected the smart contract with the backend API and tested all endpoints. Then I ran the frontend to understand the flow, but encountered issues with the MetaMask wallet connection. I replaced the existing wallet connection code with MetaMask SDK and integrated all APIs in the frontend. Finally, I tested the complete integration to ensure all three components work together seamlessly.

## Task 1: Smart Contract Development

**Created TokenVault Contract** (`contracts/TokenVault.sol`):
- Implemented ERC20 token deposit/withdraw functionality
- User balance tracking per token using nested mappings
- Total deposits tracking per token
- Pausable functionality (owner can pause/unpause operations)
- Access control using OpenZeppelin's Ownable pattern
- Reentrancy protection using ReentrancyGuard
- SafeERC20 for secure token transfers
- Events for deposits and withdrawals with timestamps

**Deployment Scripts Created**:
- `scripts/deploy.js` - Main deployment script for TokenVault
- `scripts/deploy-token.js` - Helper script for deploying test tokens
- `scripts/verify-contract.js` - Contract verification script
- `scripts/get-verification-info.js` - Verification helper

**Test Suite** (`test/TokenVault.test.js`):
Comprehensive test coverage with 71+ test cases covering:
- Deployment and initialization (owner, pause status, initial balances)
- Deposit operations (single, multiple, multiple users, edge cases)
- Withdraw operations (partial, full, insufficient balance)
- Access control (pause/unpause by owner, non-owner restrictions)
- Query functions (getBalance, getTotalDeposits)
- Multiple token support
- Reentrancy protection
- Edge cases (small/large amounts, zero addresses, zero amounts)

**Deployment**: Contract deployed to Sepolia testnet at `0x7C3a568F5238E77Ff74Ad6381B31A81F6810EB75`

## Task 2: Backend API Configuration

**Backend Integration**:
- Configured Express.js backend to connect to deployed contract
- Set up environment variables (CONTRACT_ADDRESS, RPC_URL, PORT)
- Updated contract ABI in `src/config/contract-abi.json`
- Implemented blockchain service layer in `src/services/vaultService.js`

**API Endpoints Implemented**:
- `GET /api/vault/balance/:userAddress/:tokenAddress` - Get user's balance in vault
- `GET /api/vault/total/:tokenAddress` - Get total deposits for a token
- `GET /api/vault/status` - Get contract pause status
- `POST /api/vault/estimate-deposit` - Estimate gas for deposit transaction
- `POST /api/vault/estimate-withdraw` - Estimate gas for withdraw transaction
- `GET /api/health` - Health check endpoint

All endpoints return consistent response format: `{success: true/false, data/error: ...}`

## Task 3: Next.js Frontend Integration

**Wallet Integration**:
- Replaced direct `window.ethereum` access with MetaMask SDK (`@metamask/sdk`)
- Fixed connection issues (error 4001 handling, provider detection)
- Implemented connection state management
- Added account/network change listeners
- Configured webpack to handle React Native dependencies

**API Integration Fixes**:
- Fixed API response double-wrapping issue (backend returns `{success: true, data: {...}}`, extracted inner data correctly)
- Fixed balance display showing 0 (was accessing nested data structure incorrectly)
- Updated all API service functions to handle response structure properly

**Vault Operations Implementation**:
- **Deposit**: 
  - Checks token approval before deposit
  - Automatically requests approval if needed
  - Handles token decimals dynamically (fetches from contract, not hardcoded)
  - Waits for transaction confirmation
  - Auto-refreshes balance after successful deposit
  
- **Withdraw**: 
  - Validates sufficient balance in vault
  - Handles token decimals correctly
  - Auto-refreshes balance after successful withdrawal

- **Gas Estimation**:
  - For deposits: Checks token approval first, provides clear error if approval needed
  - For withdrawals: Estimates gas and provides helpful error if insufficient balance
  - Uses actual token decimals for accurate calculations

**Code Quality Improvements**:
- Used `useCallback` and `useMemo` to prevent unnecessary re-renders
- Fixed infinite re-render loops by properly managing useEffect dependencies
- Proper TypeScript typing throughout
- Clean error handling with operation-specific messages

## Design Decisions

1. **MetaMask SDK**: Replaced direct `window.ethereum` with SDK for better error handling and cross-platform support
2. **Frontend gas estimation**: Moved to frontend to check approval status with connected wallet
3. **Dynamic token decimals**: Fetches decimals from contract instead of assuming 18, works with any ERC20 token
4. **Auto-approval flow**: Checks and requests approval automatically before deposit transactions
5. **Operation-specific errors**: Different error messages for deposit vs withdraw to help users understand issues

## Integration

The three components work together in the following flow:

1. **Wallet Connection**: User connects → Frontend (WalletContext) → MetaMask SDK → User approves
2. **View Balance**: Frontend → Backend API → Smart contract → Returns formatted balance
3. **Deposit**: Check approval → Request if needed → MetaMask transaction → Smart contract → Auto-refresh balance
4. **Withdraw**: MetaMask transaction → Smart contract → Auto-refresh balance

## Assumptions

1. Users have MetaMask browser extension installed and are familiar with wallet interactions
2. The contract is deployed on Sepolia testnet (as configured in environment variables)
3. Users understand they need to approve tokens before depositing
4. The backend server is running on port 4000 (default configuration)
5. Token addresses provided are valid ERC20 tokens on the configured network
6. Users have sufficient ETH in their wallets for gas fees

## Challenges & Solutions

1. **MetaMask Connection Errors (4001)**: Implemented proper error handling for user rejections and improved provider detection
2. **Balance Display Showing 0**: Fixed API response structure - backend returns nested `{success: true, data: {...}}`, extracted correctly
3. **Deposit Gas Estimation Failing**: Added approval checking before estimation, returns clear error if approval needed
4. **Token Decimals Assumption**: Implemented dynamic decimal fetching from ERC20 contract with fallback to 18
5. **Balance Not Updating After Transactions**: Added auto-refresh with 3-second delay and retry logic for blockchain indexing
6. **Infinite Re-render Loops**: Memoized functions with `useCallback`, context values with `useMemo`, fixed useEffect dependencies

## Setup Instructions

### Smart Contract
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract (optional)
npx hardhat run scripts/verify-contract.js --network sepolia
```

### Backend API Configuration
```bash
cd backend
npm install

# Create .env file
CONTRACT_ADDRESS=0x7C3a568F5238E77Ff74Ad6381B31A81F6810EB75
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/
PORT=4000

# Start server
npm start
```

### Next.js Frontend
```bash
cd frontend
npm install

# Create .env.local file
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_CONTRACT_ADDRESS=0x7C3a568F5238E77Ff74Ad6381B31A81F6810EB75
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=Sepolia Testnet
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/

# Run development server
npm run dev
```

## Additional Notes

- Token approvals set to exact amount needed (not unlimited) for better security
- All user inputs validated before sending transactions
- Error messages are operation-specific and user-friendly
- Balance auto-refreshes after transactions (3-second delay with retries for blockchain indexing)
- Code is production-ready with comprehensive error handling
- All transactions tested successfully on Sepolia testnet
