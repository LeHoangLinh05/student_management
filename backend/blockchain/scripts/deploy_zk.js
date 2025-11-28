const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  
  console.log("⏳ Deploying ZKProofEduChain...");

  const ZKProofEduChain = await ethers.getContractFactory("ZKProofEduChain");
  const contract = await ZKProofEduChain.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ ZKProofEduChain deployed at:", address);

  // Update .env
  const fs = require("fs");
  const path = require("path");
  const envPath = path.join(__dirname, "..", "..", ".env");

  let env = "";
  try {
    env = fs.readFileSync(envPath, "utf8");
  } catch (err) {
    console.error("❌ Cannot read .env file:", err);
    return;
  }

  if (env.includes("ZK_EDUCHAIN_CONTRACT=")) {
    env = env.replace(/ZK_EDUCHAIN_CONTRACT=.*/g, `ZK_EDUCHAIN_CONTRACT=${address}`);
  } else {
    env += `\nZK_EDUCHAIN_CONTRACT=${address}`;
  }

  try {
    fs.writeFileSync(envPath, env);
    console.log("🔁 .env updated with new ZK contract address.");
  } catch (err) {
    console.error("❌ Cannot write to .env:", err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
