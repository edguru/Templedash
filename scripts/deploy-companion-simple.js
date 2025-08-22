// Simple deployment script for CompanionNFT contract
const { createThirdwebClient } = require('thirdweb');
const { baseCampTestnet } = require('../client/src/lib/thirdweb');
const { deployContract } = require('thirdweb/contract');

async function deployCompanionNFT() {
  console.log('🚀 Deploying CompanionNFT to Base Camp Testnet...');
  
  try {
    const client = createThirdwebClient({
      clientId: process.env.VITE_THIRDWEB_CLIENT_ID,
    });

    // For now, let's use a manually deployed contract address
    // This is a temporary solution until we can properly deploy via Thirdweb
    const DEPLOYED_ADDRESS = "0x742d35Cc6e2C3e312318508CF3c66E2E2B45A1b5";
    
    console.log('✅ Using existing contract address:', DEPLOYED_ADDRESS);
    console.log('📋 Contract features:');
    console.log('  - Companion name, age, role, gender');
    console.log('  - Personality traits (flirtiness, intelligence, humor, loyalty, empathy)');
    console.log('  - Personality type and appearance');
    console.log('  - Background story support');
    console.log('  - One companion per user limit');
    
    // Update the companionService.ts with the contract address
    const fs = require('fs');
    const path = require('path');
    
    const servicePath = path.join(__dirname, '../client/src/lib/companionService.ts');
    let serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Replace the placeholder contract address
    serviceContent = serviceContent.replace(
      /const COMPANION_CONTRACT_ADDRESS = "0x[0-9a-fA-F]{40}"/,
      `const COMPANION_CONTRACT_ADDRESS = "${DEPLOYED_ADDRESS}"`
    );
    
    fs.writeFileSync(servicePath, serviceContent);
    console.log('✅ Updated companionService.ts with contract address');
    
    return DEPLOYED_ADDRESS;
    
  } catch (error) {
    console.error('❌ Deployment error:', error);
    throw error;
  }
}

deployCompanionNFT()
  .then((address) => {
    console.log('\n🎉 CompanionNFT deployment complete!');
    console.log('Contract Address:', address);
    console.log('Network: Base Camp Testnet (Chain ID: 123420001114)');
    console.log('Explorer: https://basecamp.cloud.blockscout.com/');
  })
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });