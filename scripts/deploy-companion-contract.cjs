const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying CompanionNFT contract to Base Camp testnet...');
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  
  // Get the contract factory
  const CompanionNFT = await ethers.getContractFactory('CompanionNFT');
  
  // Deploy the contract
  console.log('Deploying contract...');
  const contract = await CompanionNFT.deploy();
  
  // Wait for deployment to complete
  await contract.deployed();
  
  console.log('✅ CompanionNFT deployed to:', contract.address);
  console.log('Transaction hash:', contract.deployTransaction.hash);
  
  // Verify on block explorer (optional)
  if (process.env.VERIFY_CONTRACT === 'true') {
    console.log('Waiting for block confirmations...');
    await contract.deployTransaction.wait(5);
    
    try {
      await hre.run('verify:verify', {
        address: contract.address,
        constructorArguments: [],
      });
      console.log('✅ Contract verified on block explorer');
    } catch (error) {
      console.log('❌ Verification failed:', error.message);
    }
  }
  
  // Update the companionService.ts with the new contract address
  const fs = require('fs');
  const path = require('path');
  
  const servicePath = path.join(__dirname, '../client/src/lib/companionService.ts');
  let serviceContent = fs.readFileSync(servicePath, 'utf8');
  
  // Replace the contract address
  serviceContent = serviceContent.replace(
    /const COMPANION_CONTRACT_ADDRESS = "0x[a-fA-F0-9]{40}"/,
    `const COMPANION_CONTRACT_ADDRESS = "${contract.address}"`
  );
  
  fs.writeFileSync(servicePath, serviceContent);
  console.log('✅ Updated companionService.ts with new contract address');
  
  // Output summary
  console.log('\n📋 Deployment Summary:');
  console.log('====================');
  console.log('Contract Address:', contract.address);
  console.log('Deployer Address:', deployer.address);
  console.log('Network:', 'Base Camp Testnet (123420001114)');
  console.log('Gas Used:', contract.deployTransaction.gasLimit.toString());
  console.log('Mint Fee:', '0.001 CAMP');
  console.log('\n🎉 Deployment complete! Users can now create and mint companion soulbound tokens.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });