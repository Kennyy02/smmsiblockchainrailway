# Quick Start: Get Test Tokens & Deploy Contract

## Step 1: Get Test MATIC from Faucet

### On the Polygon Faucet Page:

1. **Select Chain & Token:**
   - Make sure "Polygon Amoy" is selected (this is the new Mumbai testnet)
   - Token should be "POL" (Polygon's native token)

2. **Add Chain to Wallet (if needed):**
   - Click "Add Chain to Wallet" if you haven't added Polygon Amoy to MetaMask yet
   - This will open MetaMask and prompt you to add the network

3. **Verify Your Identity:**
   - You need to verify using either:
     - **GitHub**: Click the GitHub button and authorize
     - **X.COM (Twitter)**: Click the X.COM button and authorize
   - This prevents abuse of the faucet

4. **Enter Your Wallet Address:**
   - Open MetaMask
   - Copy your wallet address (starts with `0x...`)
   - Paste it into the "Enter Wallet Address" field

5. **Claim Tokens:**
   - Click the purple "Claim" button
   - Wait a few seconds
   - You should receive test POL tokens in your MetaMask wallet

### If You Need More Tokens:
- The faucet gives a small amount per day
- If you need bulk tokens for testing, click "Apply for Bulk POL Tokens" below

---

## Step 2: Verify You Have Tokens

1. Open MetaMask
2. Make sure you're on "Polygon Amoy" network
3. Check your balance - you should see POL tokens

---

## Step 3: Deploy Smart Contract

### Using Remix IDE:

1. **Go to Remix:** https://remix.ethereum.org/

2. **Create New File:**
   - Click "File Explorer" (left sidebar)
   - Click "New File"
   - Name it: `CertificateRegistry.sol`

3. **Copy Contract Code:**
   - Open `contracts/CertificateRegistry.sol` from this project
   - Copy all the code
   - Paste into Remix

4. **Compile:**
   - Click "Solidity Compiler" tab (left sidebar)
   - Select compiler version: `0.8.20` or higher
   - Click "Compile CertificateRegistry.sol"
   - Should see green checkmark ✓

5. **Deploy:**
   - Click "Deploy & Run Transactions" tab
   - Environment: Select "Injected Provider - MetaMask"
   - Connect your MetaMask wallet
   - **IMPORTANT:** Make sure MetaMask is on "Polygon Amoy" network
   - Click "Deploy" button
   - Confirm transaction in MetaMask
   - Wait for confirmation (usually 2-5 seconds)

6. **Copy Contract Address:**
   - After deployment, you'll see the contract in "Deployed Contracts" section
   - Click the copy icon next to the contract address
   - **Save this address!** You'll need it for `.env` file

---

## Step 4: Configure Laravel

1. **Open `.env` file** in your project root

2. **Add these lines:**
```env
# Blockchain Configuration
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_NETWORK=mumbai
BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
BLOCKCHAIN_CONTRACT_ADDRESS=0xPASTE_YOUR_CONTRACT_ADDRESS_HERE
BLOCKCHAIN_PRIVATE_KEY=your_private_key_from_metamask
BLOCKCHAIN_WALLET_ADDRESS=your_wallet_address_from_metamask
```

3. **Get Your Private Key:**
   - ⚠️ **SECURITY WARNING:** Never share this!
   - In MetaMask: Click account icon → Account Details → Show Private Key
   - Copy the key (starts with `0x`)
   - Paste into `.env` as `BLOCKCHAIN_PRIVATE_KEY`

4. **Get Your Wallet Address:**
   - In MetaMask, copy your wallet address
   - Paste into `.env` as `BLOCKCHAIN_WALLET_ADDRESS`

---

## Step 5: Test It!

1. **Clear config cache:**
   ```bash
   php artisan config:clear
   ```

2. **Go to Admin Panel:**
   - Navigate to: Admin → Blockchain → Certificates

3. **Create a Certificate:**
   - Click "Create Certificate"
   - Fill in the form
   - Submit
   - The certificate will be registered on Polygon Amoy testnet!

4. **View on Blockchain:**
   - Click "View Details" on the certificate
   - Click "View on PolygonScan" link
   - You'll see the transaction on the blockchain explorer!

---

## Troubleshooting

### "Insufficient funds"
- Get more test POL from the faucet
- Make sure you're on Polygon Amoy network

### "Contract not found"
- Verify contract address in `.env` is correct
- Make sure contract was deployed to Polygon Amoy

### "Transaction failed"
- Check you have enough POL for gas fees
- Verify RPC URL is correct: `https://rpc-amoy.polygon.technology`

### MetaMask won't connect
- Make sure MetaMask is unlocked
- Try refreshing the page
- Check browser extensions aren't blocking MetaMask

---

## Network Information

**Polygon Amoy Testnet:**
- Network Name: Polygon Amoy
- RPC URL: https://rpc-amoy.polygon.technology
- Chain ID: 80002
- Currency Symbol: POL
- Block Explorer: https://amoy.polygonscan.com

---

## Need Help?

- Check `POLYGON_DEPLOYMENT_GUIDE.md` for detailed instructions
- Polygon Docs: https://docs.polygon.technology/
- Remix IDE Docs: https://remix-ide.readthedocs.io/

