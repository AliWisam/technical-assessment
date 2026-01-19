# Task 2: Node.js Backend API

## Objective

Build a RESTful Node.js backend API that interacts with the TokenVault smart contract from Task 1 and provides endpoints for the mobile frontend.

## Requirements

Create a **Node.js backend service** using Express (or similar framework) that:

### Core Functionality

1. **Blockchain Integration**
   - Connect to blockchain network (testnet or local node)
   - Interact with the TokenVault contract using ethers.js or web3.js
   - Read contract state (user balances, total deposits, etc.)
   - Build and sign transactions (for admin operations if needed)

2. **REST API Endpoints**
   - `GET /api/vault/balance/:userAddress/:tokenAddress` - Get user's token balance in vault
   - `GET /api/vault/total/:tokenAddress` - Get total deposits for a token
   - `GET /api/vault/status` - Get contract status (paused/unpaused)
   - `POST /api/vault/estimate-deposit` - Estimate gas for deposit transaction
   - `POST /api/vault/estimate-withdraw` - Estimate gas for withdraw transaction
   - `GET /api/health` - Health check endpoint

3. **Error Handling & Validation**
   - Validate input parameters (addresses, amounts)
   - Handle blockchain errors gracefully
   - Return appropriate HTTP status codes
   - Provide clear error messages

4. **Configuration & Environment**
   - Use environment variables for sensitive data (private keys, RPC URLs)
   - Support multiple networks (testnet, mainnet, local)
   - Include proper logging

### Technical Requirements

- Use Node.js (v16+ recommended)
- Use Express.js or Fastify for the API framework
- Use ethers.js v6 or web3.js for blockchain interactions
- Include input validation (use a library like Joi or express-validator)
- Add proper error handling middleware
- Include API documentation (comments or OpenAPI/Swagger)
- Use TypeScript (optional but preferred)

### Deliverables

1. Backend API code in `backend/` directory
2. `package.json` with all dependencies
3. `.env.example` file showing required environment variables
4. `README.md` in backend directory with setup instructions
5. API endpoint documentation

### Example API Response

```json
// GET /api/vault/balance/0x123.../0x456...
{
  "success": true,
  "data": {
    "userAddress": "0x123...",
    "tokenAddress": "0x456...",
    "balance": "1000000000000000000",
    "balanceFormatted": "1.0"
  }
}
```

### Project Structure

```
backend/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── utils/
│   └── config/
├── package.json
├── .env.example
└── README.md
```

## Evaluation Criteria

- ✅ Correct blockchain integration
- ✅ Well-structured REST API
- ✅ Proper error handling and validation
- ✅ Code organization and architecture
- ✅ Security best practices (no hardcoded keys)
- ✅ Documentation and code comments

## Bonus Points

- Add rate limiting
- Implement caching for read operations
- Add request logging and monitoring
- Support WebSocket for real-time updates
- Include unit tests for API endpoints
- Add API authentication/authorization

## Notes

- You can use a testnet (Sepolia, Mumbai, etc.) for testing
- Include the contract address and ABI in your configuration
- Use a local Hardhat node for development if preferred
- Focus on clean architecture and maintainable code
