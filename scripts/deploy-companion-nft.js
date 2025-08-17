import pkg from 'hardhat';
const { ethers } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployCompanionNFT() {
  console.log("🚀 Deploying Companion NFT contract...");
  
  try {
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy Companion NFT Contract
    const CompanionNFT = await ethers.getContractFactory("CompanionNFT");
    const companionNft = await CompanionNFT.deploy();
    await companionNft.deployed();

    console.log("✅ Companion NFT deployed to:", companionNft.address);

    // Save deployment info
    const deploymentInfo = {
      contractName: "CompanionNFT",
      address: companionNft.address,
      deployer: deployer.address,
      chainId: (await deployer.provider.getNetwork()).chainId,
      deployedAt: new Date().toISOString(),
      blockNumber: companionNft.deployTransaction.blockNumber,
      transactionHash: companionNft.deployTransaction.hash
    };

    // Save to file
    const deploymentPath = path.join(__dirname, '..', 'deployments', 'companion-nft.json');
    const deploymentsDir = path.dirname(deploymentPath);
    
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("📄 Deployment info saved to:", deploymentPath);

    // Store contract in database via API
    try {
      const response = await fetch('http://localhost:5000/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'CompanionNFT',
          contractAddress: companionNft.address,
          chainId: deploymentInfo.chainId
        })
      });

      if (response.ok) {
        console.log("✅ Contract stored in database");
      } else {
        console.log("⚠️  Failed to store contract in database");
      }
    } catch (apiError) {
      console.log("⚠️  Could not reach API to store contract");
    }

    console.log("\n🎉 Companion NFT deployment complete!");
    console.log("Contract address:", companionNft.address);
    
    return companionNft;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCompanionNFT()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployCompanionNFT };