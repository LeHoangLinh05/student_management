const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  
  console.log("⏳ Deploying MultiSigEduChain...");

  // Example signatories
  const [owner, signer1, signer2, signer3] = await ethers.getSigners();
  const signatories = [owner.address, signer1.address, signer2.address];
  const requiredApprovals = 2; // Cần 2/3 signatures

  const MultiSigEduChain = await ethers.getContractFactory("MultiSigEduChain");
  const contract = await MultiSigEduChain.deploy(signatories, requiredApprovals);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ MultiSigEduChain deployed at:", address);
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

  if (env.includes("MULTISIG_EDUCHAIN_CONTRACT=")) {
    env = env.replace(/MULTISIG_EDUCHAIN_CONTRACT=.*/g, `MULTISIG_EDUCHAIN_CONTRACT=${address}`);
  } else {
    env += `\nMULTISIG_EDUCHAIN_CONTRACT=${address}`;
  }

  try {
    fs.writeFileSync(envPath, env);
    console.log("🔁 .env updated with new MultiSig contract address.");
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
