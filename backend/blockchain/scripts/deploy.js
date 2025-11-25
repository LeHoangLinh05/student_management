// deploy.js (CommonJS)

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("⏳ Deploying EduChain...");

  const EduChain = await ethers.getContractFactory("EduChain");
  const contract = await EduChain.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ EduChain deployed at:", address);

  // ----------- AUTO UPDATE .env -----------
  // __dirname = D:\Blockchain\student_management\backend\blockchain\scripts
  // -> ..\.. = D:\Blockchain\student_management\backend
  const envPath = path.join(__dirname, "..", "..", ".env");

  let env = "";
  try {
    env = fs.readFileSync(envPath, "utf8");
  } catch (err) {
    console.error("❌ Cannot read .env file:", err);
    return;
  }

  if (env.includes("EDUCHAIN_CONTRACT=")) {
    env = env.replace(/EDUCHAIN_CONTRACT=.*/g, `EDUCHAIN_CONTRACT=${address}`);
  } else {
    env += `\nEDUCHAIN_CONTRACT=${address}`;
  }

  try {
    fs.writeFileSync(envPath, env);
    console.log("🔁 .env updated with new contract address.");
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
