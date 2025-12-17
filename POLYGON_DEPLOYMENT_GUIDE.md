# Polygon Blockchain Integration - Deployment Guide

## Overview

This guide will help you deploy the certificate registry smart contract to Polygon Mumbai Testnet (free testing) and configure your Laravel application to interact with it.

## Prerequisites

1. **MetaMask Wallet** (or any Web3 wallet)
   - Install: https://metamask.io/
   - Create a new wallet or import existing

2. **Get Test MATIC** (for Mumbai Testnet)
   - Visit: https://faucet.polygon.technology/
   - Select "Mumbai" network
   - Enter your wallet address
   - Request test MATIC (free)

3. **Remix IDE** (for deploying smart contract)
   - Visit: https://remix.ethereum.org/
   - No installation needed (web-based)

## Step 1: Deploy Smart Contract

### 1.1 Open Remix IDE
1. Go to https://remix.ethereum.org/
2. Create a new file: `CertificateRegistry.sol`
3. Copy the contents from `contracts/CertificateRegistry.sol` in this project

### 1.2 Compile Contract
1. Click on "Solidity Compiler" tab (left sidebar)
2. Select compiler version: `0.8.20` or higher
3. Click "Compile CertificateRegistry.sol"

### 1.3 Deploy to Mumbai Testnet
1. Click "Deploy & Run Transactions" tab
2. Select environment: "Injected Provider - MetaMask"
3. Connect your MetaMask wallet
4. Switch MetaMask network to "Mumbai Testnet"
5. Click "Deploy"
6. Confirm transaction in MetaMask
7. **Copy the contract address** (shown after deployment)

## Step 2: Configure Laravel

### 2.1 Add to .env file

```env
# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=mumbai
BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCKCHAIN_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
BLOCKCHAIN_PRIVATE_KEY=your_private_key_here
BLOCKCHAIN_WALLET_ADDRESS=your_wallet_address_here
```

### 2.2 Get Your Private Key
⚠️ **SECURITY WARNING**: Never share your private key!

1. Open MetaMask
2. Click account icon → Account Details → Show Private Key
3. Copy the private key (starts with `0x`)
4. Paste into `.env` as `BLOCKCHAIN_PRIVATE_KEY`

### 2.3 Get Your Wallet Address
1. In MetaMask, copy your wallet address
2. Paste into `.env` as `BLOCKCHAIN_WALLET_ADDRESS`

## Step 3: Test the Integration

### 3.1 Create a Certificate
1. Go to Admin → Blockchain → Certificates
2. Click "Create Certificate"
3. Fill in the form and submit
4. The certificate will be registered on Polygon Mumbai Testnet

### 3.2 Verify on Blockchain Explorer
1. After creating a certificate, click "View Details"
2. Click "View on PolygonScan" link
3. You'll see the transaction on Mumbai PolygonScan

## Step 4: Production (Polygon Mainnet)

When ready for production:

1. **Deploy contract to Polygon Mainnet**
   - Same process as Step 1, but select "Polygon Mainnet" in MetaMask
   - You'll need real MATIC (not test tokens)

2. **Update .env**
```env
BLOCKCHAIN_NETWORK=polygon
BLOCKCHAIN_RPC_URL=https://polygon-rpc.com
BLOCKCHAIN_CONTRACT_ADDRESS=0xYOUR_MAINNET_CONTRACT_ADDRESS
```

3. **Fund your wallet**
   - Buy MATIC from an exchange
   - Send to your wallet address
   - Each certificate registration costs ~$0.01-0.10 in gas fees

## Troubleshooting

### "Insufficient funds"
- Get more test MATIC from the faucet
- For mainnet, ensure you have enough MATIC

### "Contract not deployed"
- Verify contract address in `.env` is correct
- Check that contract was deployed to the correct network

### "Transaction failed"
- Check gas limit in `config/blockchain.php`
- Ensure wallet has enough funds
- Verify RPC URL is correct

## Cost Estimates

**Mumbai Testnet:** FREE (test tokens from faucet)

**Polygon Mainnet:**
- Contract deployment: ~$0.50-2.00 (one-time)
- Certificate registration: ~$0.01-0.10 per certificate
- For 100 certificates: ~$1-10 total

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use environment-specific keys** (testnet vs mainnet)
3. **Store private keys securely** (consider using Laravel Vault or AWS Secrets Manager for production)
4. **Monitor wallet balance** and set up alerts
5. **Test thoroughly on testnet** before mainnet deployment

## Support

For issues or questions:
- Polygon Docs: https://docs.polygon.technology/
- Remix IDE Docs: https://remix-ide.readthedocs.io/
- Check Laravel logs: `storage/logs/laravel.log`

