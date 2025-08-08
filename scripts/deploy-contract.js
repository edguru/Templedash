// Contract deployment script for Puppet Runner NFT
const { ethers } = require('hardhat');
const hre = require('hardhat');

async function main() {
  const network = hre.network.name;
  console.log(`Deploying Puppet Runner NFT Contract to ${network}...`);

  // Get the contract factory
  const TempleRunnerNFT = await ethers.getContractFactory('TempleRunnerNFT');

  // Deploy the contract
  console.log('Deploying contract...');
  const templeRunnerNFT = await TempleRunnerNFT.deploy();
  await templeRunnerNFT.deployed();

  console.log('✅ Puppet Runner NFT deployed to:', templeRunnerNFT.address);
  
  if (network === 'baseCamp') {
    console.log('🚀 View on Base Camp Explorer:', `https://explorer.camp-network-testnet.gelato.digital/address/${templeRunnerNFT.address}`);
  } else {
    console.log('🚀 View on Explorer:', `https://polygonscan.com/address/${templeRunnerNFT.address}`);
  }
  
  // Update the contract address in the client
  console.log('\n📝 Update your .env with this contract address:');
  console.log(`VITE_NFT_CONTRACT_ADDRESS="${templeRunnerNFT.address}"`);

  // Test minting (skip for now to avoid issues)
  console.log('\n🎯 Contract ready for use!');
  console.log('Chain ID:', await templeRunnerNFT.provider.getNetwork().then(n => n.chainId));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });