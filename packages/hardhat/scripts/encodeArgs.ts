import { ethers } from "hardhat";
import { Interface } from "@ethersproject/abi";

async function main() {
  const cUSDTokenAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
  
  // Create interface with constructor
  const constructorFragment = {
    inputs: [{ type: "address", name: "_cUSDToken" }],
    stateMutability: "nonpayable",
    type: "constructor"
  };

  const iface = new Interface([constructorFragment]);
  
  // Encode constructor arguments
  const encodedArgs = iface.encodeDeploy([cUSDTokenAddress]).slice(2); // Remove 0x prefix

  console.log("ABI-encoded constructor arguments for CeloScan:");
  console.log(encodedArgs);
}

// Execute script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 