const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  
  console.log("⏳ Deploying EduChainAdvanced (MultiSig + ZKProof)...");

  const [owner, signer1, signer2, signer3] = await ethers.getSigners();
  const signatories = [owner.address, signer1.address, signer2.address];
  const requiredApprovals = 2;

  const EduChainAdvanced = await ethers.getContractFactory("EduChainAdvanced");
  const contract = await EduChainAdvanced.deploy(signatories, requiredApprovals);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ EduChainAdvanced deployed at:", address);
  console.log("   Signatories:", signatories);
  console.log("   Required Approvals:", requiredApprovals);

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

  if (env.includes("EDUCHAIN_ADVANCED_CONTRACT=")) {
    env = env.replace(/EDUCHAIN_ADVANCED_CONTRACT=.*/g, `EDUCHAIN_ADVANCED_CONTRACT=${address}`);
  } else {
    env += `\nEDUCHAIN_ADVANCED_CONTRACT=${address}`;
  }

  try {
    fs.writeFileSync(envPath, env);
    console.log("🔁 .env updated with new Advanced contract address.");
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
