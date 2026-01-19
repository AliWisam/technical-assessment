# Task 3: Frontend Integration

## Objective

Connect the prebuilt React Native frontend application to your backend API (Task 2) and configure it to interact with the TokenVault contract.

## Overview

A React Native mobile application is already provided in the `mobile/` directory. Your task is to:

1. **Configure the frontend** to connect to your backend API
2. **Set up wallet integration** (WalletConnect or MetaMask Mobile)
3. **Test the complete flow** from frontend → backend → blockchain

## Prebuilt Application Features

The prebuilt app includes:

1. **Wallet Connection UI**
   - WalletConnect integration setup
   - MetaMask Mobile SDK support
   - Connection status display
   - Wallet address display

2. **Vault Operations UI**
   - Balance display components
   - Deposit/Withdraw forms
   - Transaction status indicators
   - Transaction history list

3. **API Service Layer**
   - Pre-configured API client
   - Service functions for all backend endpoints
   - Error handling utilities
   - Loading state management

4. **Navigation & State Management**
   - React Navigation setup
   - Context API for global state
   - Screen components ready to use

## Requirements

### Your Tasks

1. **Backend API Configuration**
   - Update API base URL in `mobile/src/config/api.js`
   - Ensure all backend endpoints match the API service calls
   - Test API connectivity

2. **Wallet Integration**
   - Configure WalletConnect Project ID (or MetaMask SDK)
   - Set up network configuration
   - Test wallet connection flow

3. **Environment Setup**
   - Configure environment variables (`.env` file)
   - Set up contract addresses
   - Configure network settings

4. **Integration Testing**
   - Verify frontend → backend → blockchain flow
   - Test deposit functionality
   - Test withdraw functionality
   - Ensure error handling works correctly

### Technical Requirements

- Connect the prebuilt frontend to your backend API from Task 2
- Configure wallet connection (WalletConnect or MetaMask Mobile)
- Ensure all API endpoints work correctly
- Test the complete user flow

### Deliverables

1. Updated configuration files (API URL, wallet settings, etc.)
2. Working frontend connected to your backend
3. Brief documentation of any configuration changes made
4. Screenshots or screen recordings showing the working app (optional but appreciated)

### Example User Flow

```
1. User opens the app
2. App shows "Connect Wallet" button
3. User taps button → WalletConnect/MetaMask opens
4. User approves connection
5. App shows: "Connected: 0x1234..."
6. App fetches user's vault balance from backend API
7. User enters token address and amount
8. User taps "Deposit" → Transaction details shown
9. User confirms in wallet → Transaction sent
10. App shows: "Transaction pending..." → "Confirmed!"
```

### Project Structure

```
mobile/
├── src/
│   ├── screens/
│   ├── components/
│   ├── services/
│   ├── navigation/
│   ├── context/ or store/
│   └── utils/
├── App.tsx or App.js
├── package.json
└── README.md
```

## Evaluation Criteria

- ✅ Frontend successfully connects to backend API
- ✅ Wallet integration works correctly
- ✅ All API endpoints are properly integrated
- ✅ Complete user flow works (connect wallet → view balance → deposit → withdraw)
- ✅ Error handling works correctly
- ✅ Configuration is properly documented

## Bonus Points

- Customize or enhance the UI
- Add additional features beyond the basic flow
- Optimize API calls or add caching
- Improve error messages or user feedback

## Notes

- The frontend app is located in the `mobile/` directory
- Follow the setup instructions in `mobile/README.md`
- You can use Expo or run it with React Native CLI
- Test on iOS simulator, Android emulator, or physical device
- Focus on configuration and integration, not building from scratch
- If you encounter issues, document them and explain your approach
