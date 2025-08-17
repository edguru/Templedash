import { createThirdwebClient, getContract } from "thirdweb";
import { baseCampTestnet } from "thirdweb/chains";
import { deployERC721Contract } from "thirdweb/deploys";

async function deployCompanionNFT() {
  try {
    console.log("🚀 Deploying CompanionNFT contract with Thirdweb...");

    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY environment variable is required");
    }

    // Initialize SDK for Base Camp testnet
    const sdk = ThirdwebSDK.fromPrivateKey(
      process.env.PRIVATE_KEY,
      {
        chainId: 123420001114, // Base Camp testnet
        rpc: ["https://rpc.camp-network-testnet.gelato.digital"],
      }
    );

    const address = await sdk.wallet.getAddress();
    console.log("Deploying from address:", address);

    // Deploy NFT Collection contract
    const contractAddress = await sdk.deployer.deployNFTCollection({
      name: "Companion NFT",
      symbol: "COMP",
      description: "AI Companion NFTs for personalized chat experiences - one per user",
      primary_sale_recipient: address,
      fee_recipient: address,
      seller_fee_basis_points: 0, // 0% royalty for companions
      platform_fee_basis_points: 0,
      platform_fee_recipient: address,
      trusted_forwarders: [],
    });

    console.log("✅ CompanionNFT deployed at:", contractAddress);

    // Store in database
    try {
      const response = await fetch('http://localhost:5000/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'CompanionNFT',
          contractAddress: contractAddress,
          chainId: 123420001114
        })
      });

      if (response.ok) {
        console.log("✅ Contract stored in database");
      } else {
        const errorText = await response.text();
        console.log("⚠️  Failed to store contract in database:", errorText);
      }
    } catch (apiError) {
      console.log("⚠️  Could not reach API:", apiError.message);
    }

    // Set up companion metadata
    const contract = await sdk.getContract(contractAddress);
    
    console.log("\n📋 CompanionNFT Contract Details:");
    console.log("Address:", contractAddress);
    console.log("Network: Base Camp Testnet");
    console.log("Chain ID: 123420001114");
    console.log("Purpose: One-per-user AI companions");

    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Run deployment if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deployCompanionNFT()
    .then((address) => {
      console.log("\n🎉 Deployment complete!");
      console.log("Contract Address:", address);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}

export { deployCompanionNFT };