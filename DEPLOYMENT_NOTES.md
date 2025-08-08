# Contract Deployment Issue

## Problem
The NFT contract `0x00005A2F0e8F4303F719A9f45F25cA578F4AA500` appears to not be deployed on Base Camp testnet (chain ID: 123420001114).

## Error
```
TransactionError: Execution Reverted: {"code":3,"message":"execution reverted"}
```

## Solution Options

### Option 1: Deploy New Contract
Deploy the `TempleRunnerNFT.sol` contract to Base Camp testnet:

1. Configure Hardhat for Base Camp testnet
2. Add RPC URL: `https://rpc.camp-network-testnet.gelato.digital`
3. Deploy with private key
4. Update `VITE_NFT_CONTRACT_ADDRESS` environment variable

### Option 2: Use Different Network
Switch to a network where the contract is already deployed (if any).

### Option 3: Mock Implementation
For demo purposes, use a mock NFT service that simulates minting without blockchain interaction.

## Current Status
- Contract address: `0x00005A2F0e8F4303F719A9f45F25cA578F4AA500`
- Network: Base Camp testnet (123420001114)
- RPC: `https://rpc.camp-network-testnet.gelato.digital`
- User has: 0.01 CAMP tokens (sufficient for 0.001 CAMP mint fee)

## Recommended Action
Deploy the contract to Base Camp testnet using the deployment script in `scripts/deploy-contract.js`.