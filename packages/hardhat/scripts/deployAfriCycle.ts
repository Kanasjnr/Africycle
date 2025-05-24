import { network, run } from "hardhat";
import { ethers } from "hardhat";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Token addresses for Celo Mainnet
const TOKENS = {
  celo: {
    cUSD: "0x765de816845861e75a25fca122bb6898b8b1282a", // Celo Dollar (cUSD)
  },
  alfajores: {
    cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Alfajores cUSD
  }
};

async function main() {
  console.log("🚀 Starting Africycle Deployment");
  console.log("==========================================");
  console.log(`🌐 Network: ${network.name}`);
  console.log(`🔗 Chain ID: ${network.config.chainId}`);
  console.log("==========================================");

  // Get the appropriate cUSD address based on network
  const cUSDAddress = network.name === "mainnet" ? TOKENS.celo.cUSD : TOKENS.alfajores.cUSD;
  
  if (network.name === "mainnet") {
    console.log("⚠️  ATTENTION: Deploying to Celo Mainnet");
    console.log("💰 This will cost real CELO tokens");
    console.log("🔒 Make sure you have sufficient funds for deployment");
    console.log("==========================================");
    
    // Add a delay to allow for confirmation
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  // Check deployer balance
  const balance = await deployer.provider?.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance ?? 0n), "CELO");
  
  const minBalance = ethers.parseEther("0.1");
  if ((balance ?? 0n) < minBalance) {
    throw new Error(`Insufficient balance. Need at least ${ethers.formatEther(minBalance)} CELO`);
  }

  console.log("💎 Token Addresses:");
  console.log(`   💵 cUSD: ${cUSDAddress}`);
  console.log("==========================================");

  // Deploy Africycle contract
  console.log("📦 Deploying Africycle contract...");
  const Africycle = await ethers.getContractFactory("AfriCycle");
  const africycle = await Africycle.deploy(cUSDAddress);
  await africycle.waitForDeployment();

  const africycleAddress = await africycle.getAddress();
  console.log(`✅ Africycle deployed to: ${africycleAddress}`);
  console.log("==========================================");

  // Set up essential roles
  console.log("👥 Setting up roles...");
  const roles = [
    "ADMIN_ROLE",
    "COLLECTOR_ROLE",
    "COLLECTION_POINT_ROLE",
    "RECYCLER_ROLE",
    "CORPORATE_ROLE",
    "VERIFIER_ROLE"
  ];

  for (const role of roles) {
    const roleHash = await africycle[role]();
    const tx = await africycle.grantRole(roleHash, deployer.address);
    await tx.wait();
    console.log(`   ✅ Granted ${role} to deployer`);
  }

  // Initialize reward rates
  console.log("\n💰 Setting up reward rates...");
  const rewardRates = {
    PLASTIC: ethers.parseEther("0.05"),  // 0.05 cUSD per kg
    EWASTE: ethers.parseEther("0.25"),   // 0.25 cUSD per kg
    METAL: ethers.parseEther("0.1"),     // 0.1 cUSD per kg
    GENERAL: ethers.parseEther("0.025")  // 0.025 cUSD per kg
  };

  const WasteStream = {
    PLASTIC: 0,
    EWASTE: 1,
    METAL: 2,
    GENERAL: 3
  };

  for (const [wasteType, rate] of Object.entries(rewardRates)) {
    const tx = await africycle.setRewardRate(
      WasteStream[wasteType as keyof typeof WasteStream],
      rate
    );
    await tx.wait();
    console.log(`   ✅ Set reward rate for ${wasteType} to ${ethers.formatEther(rate)} cUSD`);
  }

  // Initialize quality multipliers
  console.log("\n⭐ Setting up quality multipliers...");
  const qualityMultipliers = {
    LOW: 8000,     // 80%
    MEDIUM: 10000, // 100%
    HIGH: 12000,   // 120%
    PREMIUM: 15000 // 150%
  };

  const QualityGrade = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    PREMIUM: 3
  };

  // Set multipliers for all waste types
  for (const wasteType of Object.keys(WasteStream)) {
    for (const [quality, multiplier] of Object.entries(qualityMultipliers)) {
      const tx = await africycle.setQualityMultiplier(
        WasteStream[wasteType as keyof typeof WasteStream],
        QualityGrade[quality as keyof typeof QualityGrade],
        multiplier
      );
      await tx.wait();
      console.log(`   ✅ Set ${quality} quality multiplier for ${wasteType} to ${multiplier / 100}%`);
    }
  }

  // Initialize carbon offset multipliers
  console.log("\n🌱 Setting up carbon offset multipliers...");
  const carbonOffsetMultipliers = {
    PLASTIC: 15000,  // 150% - highest impact
    EWASTE: 12000,   // 120% - high impact
    METAL: 10000,    // 100% - base impact
    GENERAL: 8000    // 80% - lower impact
  };

  for (const [wasteType, multiplier] of Object.entries(carbonOffsetMultipliers)) {
    const tx = await africycle.updateCarbonOffsetMultiplier(
      WasteStream[wasteType as keyof typeof WasteStream],
      multiplier
    );
    await tx.wait();
    console.log(`   ✅ Set carbon offset multiplier for ${wasteType} to ${multiplier / 100}%`);
  }

  // Set quality carbon multipliers
  console.log("\n🌍 Setting up quality carbon multipliers...");
  for (const [quality, multiplier] of Object.entries(qualityMultipliers)) {
    const tx = await africycle.updateQualityCarbonMultiplier(
      QualityGrade[quality as keyof typeof QualityGrade],
      multiplier
    );
    await tx.wait();
    console.log(`   ✅ Set quality carbon multiplier for ${quality} to ${multiplier / 100}%`);
  }

  // Verify contract on Celoscan
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n🔍 Verifying contract on Celoscan...");
    try {
      // Wait for a few blocks to ensure the contract is indexed
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      await run("verify:verify", {
        address: africycleAddress,
        constructorArguments: [cUSDAddress],
        contract: "contracts/Africycle.sol:AfriCycle"
      });
      console.log("✅ Contract verified on Celoscan!");
    } catch (error) {
      console.error("❌ Error verifying contract:", error);
      console.log("Please verify the contract manually on Celoscan");
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: africycleAddress,
    deployerAddress: deployer.address,
    cUSDTokenAddress: cUSDAddress,
    deploymentTimestamp: new Date().toISOString(),
    rewardRates: Object.fromEntries(
      Object.entries(rewardRates).map(([k, v]) => [k, ethers.formatEther(v)])
    ),
    qualityMultipliers,
    carbonOffsetMultipliers
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("==========================================");

  return deploymentInfo;
}

// Execute the deployment
main()
  .then((deploymentInfo) => {
    console.log("🎉 Deployment successful!");
    console.log("==========================================");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error during deployment:", error);
    console.log("==========================================");
    process.exit(1);
  }); 