const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  const EduDegreeNFT = await ethers.getContractFactory("EduDegreeNFT");
  const nft = await EduDegreeNFT.deploy();
  await nft.waitForDeployment();

  const addr = await nft.getAddress();
  console.log("🎉 EduDegreeNFT deployed to:", addr);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
