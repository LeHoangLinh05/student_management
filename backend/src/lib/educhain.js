import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import "dotenv/config.js";

const rpcUrl = process.env.SEPOLIA_RPC_URL;
let privateKey = process.env.PRIVATE_KEY;

if (!rpcUrl) {
  throw new Error("Missing SEPOLIA_RPC_URL in .env");
}

if (!privateKey) {
  throw new Error("Missing PRIVATE_KEY in .env");
}

// đảm bảo có 0x
if (!privateKey.startsWith("0x")) {
  privateKey = `0x${privateKey}`;
}

// validate 0x + 64 hex
const pkRegex = /^0x[0-9a-fA-F]{64}$/;
if (!pkRegex.test(privateKey)) {
  throw new Error(
    `PRIVATE_KEY must be 0x + 64 hex chars. Got length=${privateKey.length}`
  );
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// đọc ABI đã export sẵn
const abiPath = path.join(process.cwd(), "src", "lib", "educhain.abi.json");
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

const contract = new ethers.Contract(
  process.env.EDUCHAIN_CONTRACT,
  abi,
  wallet
);

export { contract };
