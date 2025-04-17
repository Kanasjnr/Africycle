import { run } from "hardhat";

async function main() {
  const contractAddress = "0x138D1154250b3efD7A7243EdF798127EbB9E05d0";
  const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

  console.log("Starting verification process...");
  
  try {
    console.log("Verifying contract...");
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [cUSDTokenAddress],
      network: "alfajores",
      contract: "contracts/Africycle.sol:AfriCycle"
    });
    console.log("Contract verified successfully!");
  } catch (error) {
    console.error("Verification failed:", error);
    
    // If verification fails, try with flattened contract
    console.log("Trying with flattened contract...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [cUSDTokenAddress],
        network: "alfajores",
        contract: "contracts/Africycle.sol:AfriCycle",
        flattened: true
      });
      console.log("Contract verified successfully with flattened code!");
    } catch (flattenedError) {
      console.error("Flattened verification also failed:", flattenedError);
      console.log("\nManual verification steps:");
      console.log("1. Go to https://alfajores.celoscan.io/address/" + contractAddress);
      console.log("2. Click on 'Contract' tab");
      console.log("3. Click 'Verify and Publish'");
      console.log("4. Use the flattened contract code from AfricycleFlattened.sol");
      console.log("5. Constructor arguments: " + cUSDTokenAddress);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 