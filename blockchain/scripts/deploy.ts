import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("-----------------------------------------------");
  console.log("Deploying BloodChain Smart Contract...");
  console.log("-----------------------------------------------");

  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log(`Deploying with account (ADMIN): ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  const BloodChainFactory = await ethers.getContractFactory("BloodChain");
  const bloodChain = await BloodChainFactory.deploy();
  await bloodChain.waitForDeployment();

  const contractAddress = await bloodChain.getAddress();
  console.log(`BloodChain successfully deployed to: ${contractAddress}`);

  // Load ABI from compiled artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/BloodChain.sol/BloodChain.json"
  );
  const artifactData = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const deploymentExport = {
    address: contractAddress,
    network: network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifactData.abi,
  };

  // Ensure backend/config directory exists
  const backendConfigDir = path.join(__dirname, "../../backend/config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }

  const exportPath = path.join(backendConfigDir, "BloodChainContract.json");
  fs.writeFileSync(exportPath, JSON.stringify(deploymentExport, null, 2), "utf8");
  console.log(`Exported contract configuration to: ${exportPath}`);

  // Update backend/.env with contract address
  const envPath = path.join(__dirname, "../../backend/.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("BLOODCHAIN_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /BLOODCHAIN_CONTRACT_ADDRESS=.*/,
        `BLOODCHAIN_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nBLOODCHAIN_CONTRACT_ADDRESS=${contractAddress}`;
    }
    fs.writeFileSync(envPath, envContent, "utf8");
    console.log(`Updated BLOODCHAIN_CONTRACT_ADDRESS in backend/.env`);
  }

  console.log("-----------------------------------------------");
  console.log("Deployment complete!");
  console.log("-----------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
