# TokenVault Mobile App

Prebuilt React Native mobile application for interacting with the TokenVault contract.

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac), Android Emulator, or Web Browser

### Installation

1. Install dependencies:
```bash
npm install
```

**Note:** The app has been configured to avoid native build dependencies. If you encounter any installation issues, try:
```bash
npm install --legacy-peer-deps
```

2. Configure the app:

   a. Update API configuration in `src/config/api.js`:
   ```javascript
   export const API_BASE_URL = 'http://YOUR_BACKEND_URL:3000';
   export const CONTRACT_ADDRESS = '0x...'; // Your deployed contract address
   ```

   b. Configure Wallet (Optional - for Task 3):
   - Option A: WalletConnect v2 - Install `@walletconnect/react-native-compat`
   - Option B: MetaMask Mobile - Install `@metamask/sdk-react-native`
   - Get Project ID from https://cloud.walletconnect.com (if using WalletConnect)
   - Update `WALLETCONNECT_PROJECT_ID` in `src/config/api.js`

3. Install web dependencies (if using web support):
```bash
npx expo install react-native-web react-dom @expo/webpack-config
```

4. Run the app:
```bash
# Start Expo
npm start

# Or run on specific platform
npm run ios     # iOS Simulator (Mac only)
npm run android # Android Emulator
npm run web     # Web browser
```

## Configuration Tasks

### 1. Backend API URL

Update `src/config/api.js`:
```javascript
export const API_BASE_URL = 'http://localhost:3000'; // Change to your backend URL
```

**For physical device testing:**
- Use your computer's local IP address instead of `localhost`
- Example: `http://192.168.1.100:3000`
- Ensure your device and computer are on the same network

### 2. Contract Address

Update `src/config/api.js`:
```javascript
export const CONTRACT_ADDRESS = '0x...'; // Your deployed TokenVault contract
```

### 3. Network Configuration

Update network settings in `src/config/api.js`:
```javascript
export const NETWORK_CONFIG = {
  chainId: 1337, // Change to your network chain ID
  name: 'Local Network',
  rpcUrl: 'http://localhost:8545',
};
```

### 4. Wallet Integration (Optional for Task 3)

The wallet connection is a TODO in `src/context/WalletContext.js`. You can implement it using:

#### Option A: WalletConnect v2

1. Install: `npm install @walletconnect/react-native-compat`
2. Get Project ID from https://cloud.walletconnect.com
3. Update `WALLETCONNECT_PROJECT_ID` in `src/config/api.js`
4. Implement connection in `src/context/WalletContext.js`

#### Option B: MetaMask Mobile SDK

1. Install: `npm install @metamask/sdk-react-native`
2. Follow MetaMask SDK documentation for setup
3. Update `src/context/WalletContext.js` with MetaMask implementation

#### Option C: Mock/Test Mode

For testing without wallet integration, you can temporarily set a mock address in `WalletContext.js` to test the app flow.

## Features

- ✅ Wallet connection UI
- ✅ Backend API integration
- ✅ Vault balance viewing
- ✅ Deposit/Withdraw operations
- ✅ Gas estimation
- ✅ Transaction status tracking
- ✅ Error handling

## Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   └── api.js           # API and network configuration
│   ├── context/
│   │   ├── WalletContext.js # Wallet state management
│   │   └── VaultContext.js  # Vault operations state
│   ├── screens/
│   │   ├── HomeScreen.js    # Home/Connection screen
│   │   └── VaultScreen.js   # Vault operations screen
│   └── services/
│       └── api.js           # API service functions
├── App.js                   # Root component
├── package.json
└── README.md
```

## Testing

1. **Test Backend Connection:**
   - Open the app
   - Enter your backend URL
   - Click "Check Backend Health"

2. **Test Wallet Connection:**
   - Click "Connect Wallet"
   - Complete wallet connection flow

3. **Test Vault Operations:**
   - Navigate to "Vault Operations"
   - Enter token address
   - Fetch balance or total deposits
   - Test deposit/withdraw operations

## Troubleshooting

### Backend Connection Issues

- Ensure backend is running
- Check CORS settings on backend
- Use IP address instead of localhost for physical devices
- Verify API URL format

### Wallet Connection Issues

- Ensure WalletConnect/MetaMask is properly configured
- Check network configuration matches your blockchain
- Verify contract address is correct

### Transaction Issues

- Ensure wallet has sufficient funds
- Check contract is not paused
- Verify token address is correct
- Check gas estimation is working

## Notes

- This is a prebuilt application - focus on configuration and backend integration
- Wallet connection implementation needs to be completed in `WalletContext.js`
- Transaction execution needs wallet SDK integration
- Customize UI/UX as needed for bonus points
