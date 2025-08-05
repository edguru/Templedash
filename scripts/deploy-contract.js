// Contract deployment script for Temple Runner NFT
const { ethers } = require('hardhat');

async function main() {
  console.log('Deploying Temple Runner NFT Contract...');

  // Get the contract factory
  const TempleRunnerNFT = await ethers.getContractFactory('TempleRunnerNFT');

  // Deploy the contract
  const templeRunnerNFT = await TempleRunnerNFT.deploy();
  await templeRunnerNFT.deployed();

  console.log('✅ Temple Runner NFT deployed to:', templeRunnerNFT.address);
  console.log('🚀 View on Polygonscan:', `https://polygonscan.com/address/${templeRunnerNFT.address}`);
  
  // Update the contract address in the client
  console.log('\n📝 Update your client with this contract address:');
  console.log(`export const NFT_CONTRACT_ADDRESS = "${templeRunnerNFT.address}";`);

  // Test minting (optional)
  console.log('\n🎮 Testing character minting...');
  const mintTx = await templeRunnerNFT.mintCharacter('shadow_stick_human', {
    value: ethers.utils.parseEther('0.001')
  });
  await mintTx.wait();
  
  console.log('✅ Test mint successful! Token ID: 1');
  console.log('🎯 Contract ready for use!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });