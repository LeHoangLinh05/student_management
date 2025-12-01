import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import "dotenv/config.js";

const rpcUrl = process.env.SEPOLIA_RPC_URL;
let privateKey = process.env.PRIVATE_KEY;
const nftAddress = process.env.EDU_NFT_CONTRACT;

if (!rpcUrl) {
  throw new Error("Missing SEPOLIA_RPC_URL in .env");
}

if (!privateKey) {
  throw new Error("Missing PRIVATE_KEY in .env");
}

if (!nftAddress) {
  throw new Error("Missing EDU_NFT_CONTRACT in .env");
}

// Nếu dùng dev private key không có 0x ở đầu
if (!privateKey.startsWith("0x")) {
  privateKey = "0x" + privateKey;
}

// provider + wallet giống educhain.js
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// Đọc ABI từ file JSON (không import)
const abiPath = path.join(process.cwd(), "src", "lib", "edunft.abi.json");
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

// Tạo contract instance
const nftContract = new ethers.Contract(nftAddress, abi, wallet);

export { provider, wallet, nftContract };
