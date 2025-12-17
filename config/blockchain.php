<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Blockchain Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Polygon blockchain integration
    |
    */

    // Network: 'mumbai' (testnet) or 'polygon' (mainnet)
    'network' => env('BLOCKCHAIN_NETWORK', 'mumbai'),

    // RPC URL for Polygon network
    'rpc_url' => env('BLOCKCHAIN_RPC_URL', 'https://rpc-mumbai.maticvigil.com'),

    // Smart contract address (set after deployment)
    'contract_address' => env('BLOCKCHAIN_CONTRACT_ADDRESS'),

    // Wallet private key (for signing transactions)
    // IMPORTANT: Never commit this to version control!
    'private_key' => env('BLOCKCHAIN_PRIVATE_KEY'),

    // Wallet address (derived from private key)
    'wallet_address' => env('BLOCKCHAIN_WALLET_ADDRESS'),

    // Explorer URLs
    'explorer_url' => [
        'mumbai' => 'https://mumbai.polygonscan.com',
        'polygon' => 'https://polygonscan.com',
    ],

    // Gas settings
    'gas_limit' => env('BLOCKCHAIN_GAS_LIMIT', 300000),
    'gas_price' => env('BLOCKCHAIN_GAS_PRICE', '20000000000'), // 20 Gwei

    // Enable/disable blockchain registration
    'enabled' => env('BLOCKCHAIN_ENABLED', false),
];

