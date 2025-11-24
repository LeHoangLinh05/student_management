const hre = require("hardhat");

async function main() {
  const EduChain = await hre.ethers.getContractFactory("EduChain");
  const educhain = await EduChain.deploy();

  await educhain.waitForDeployment();

  console.log("EduChain deployed to:", await educhain.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
