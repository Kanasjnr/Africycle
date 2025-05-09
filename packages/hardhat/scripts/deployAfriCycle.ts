import "@nomicfoundation/hardhat-toolbox";
import { ethers } from "hardhat";

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");

  // Get the cUSD token address from environment variables
  const cUSDTokenAddress = process.env.CUSD_TOKEN_ADDRESS;
  if (!cUSDTokenAddress) {
    throw new Error("CUSD_TOKEN_ADDRESS environment variable is not set");
  }
  console.log("Using cUSD token at:", cUSDTokenAddress);

  // Deploy the AfriCycle contract
  console.log("Deploying AfriCycle contract...");
  const AfriCycle = await ethers.getContractFactory("AfriCycle");
  const africycle = await AfriCycle.deploy(cUSDTokenAddress);
  await africycle.waitForDeployment();

  const africycleAddress = await africycle.getAddress();
  console.log("AfriCycle deployed to:", africycleAddress);

  // Verify contract deployment
  console.log("Verifying contract deployment...");
  const deployedCode = await deployer.provider.getCode(africycleAddress);
  if (deployedCode === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }
  console.log("Contract code verified successfully");

  // Set up essential roles
  console.log("Setting up roles...");
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
    console.log(`Granted ${role} to deployer`);
  }

  // Initialize reward rates
  console.log("Setting up reward rates...");
  const rewardRates = {
    PLASTIC: ethers.parseEther("0.5"), // 0.5 cUSD per kg
    EWASTE: ethers.parseEther("2"),    // 2 cUSD per kg
    METAL: ethers.parseEther("1"),     // 1 cUSD per kg
    GENERAL: ethers.parseEther("0.2")  // 0.2 cUSD per kg
  };

  // Define WasteStream enum values
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
    console.log(`Set reward rate for ${wasteType} to ${ethers.formatEther(rate)} cUSD`);
  }

  // Initialize quality multipliers
  console.log("Setting up quality multipliers...");
  const qualityMultipliers = {
    PLASTIC: {
      LOW: 8000,    // 80%
      MEDIUM: 10000, // 100%
      HIGH: 12000,   // 120%
      PREMIUM: 15000 // 150%
    },
    EWASTE: {
      LOW: 8000,    // 80%
      MEDIUM: 10000, // 100%
      HIGH: 12000,   // 120%
      PREMIUM: 15000 // 150%
    },
    METAL: {
      LOW: 8000,    // 80%
      MEDIUM: 10000, // 100%
      HIGH: 12000,   // 120%
      PREMIUM: 15000 // 150%
    },
    GENERAL: {
      LOW: 8000,    // 80%
      MEDIUM: 10000, // 100%
      HIGH: 12000,   // 120%
      PREMIUM: 15000 // 150%
    }
  };

  // Define QualityGrade enum values
  const QualityGrade = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    PREMIUM: 3
  };

  for (const [wasteType, multipliers] of Object.entries(qualityMultipliers)) {
    for (const [quality, multiplier] of Object.entries(multipliers)) {
      const tx = await africycle.setQualityMultiplier(
        WasteStream[wasteType as keyof typeof WasteStream],
        QualityGrade[quality as keyof typeof QualityGrade],
        multiplier
      );
      await tx.wait();
      console.log(`Set ${quality} quality multiplier for ${wasteType} to ${multiplier / 100}%`);
    }
  }

  // Set verification thresholds
  console.log("Setting verification thresholds...");
  const verificationThresholds = {
    PLASTIC: ethers.parseEther("10"),  // 10 kg
    EWASTE: ethers.parseEther("5"),    // 5 kg
    METAL: ethers.parseEther("8"),     // 8 kg
    GENERAL: ethers.parseEther("15")   // 15 kg
  };

  for (const [wasteType, threshold] of Object.entries(verificationThresholds)) {
    const tx = await africycle.setVerificationThreshold(
      WasteStream[wasteType as keyof typeof WasteStream],
      threshold
    );
    await tx.wait();
    console.log(`Set verification threshold for ${wasteType} to ${ethers.formatEther(threshold)} kg`);
  }

  console.log("\nDeployment completed successfully!");
  console.log("Contract address:", africycleAddress);
  console.log("Deployer address:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 