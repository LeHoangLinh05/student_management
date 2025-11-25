// backend/worker/educhain-listener.js
import "dotenv/config.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

import { connectDB } from "../src/lib/db.js";
import Student from "../src/models/Student.js";
import Record from "../src/models/Record.js";
import Certificate from "../src/models/Certificate.js";

// 1) Kết nối MongoDB
await connectDB();
console.log("✅ MongoDB connected (listener)");

// 2) Tự tạo provider + wallet + contract từ .env + ABI

const rpcUrl = process.env.SEPOLIA_RPC_URL;
let privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.EDUCHAIN_CONTRACT;

if (!rpcUrl) throw new Error("Missing SEPOLIA_RPC_URL in .env");
if (!privateKey) throw new Error("Missing PRIVATE_KEY in .env");
if (!contractAddress) throw new Error("Missing EDUCHAIN_CONTRACT in .env");

if (!privateKey.startsWith("0x")) {
  privateKey = `0x${privateKey}`;
}

const pkRegex = /^0x[0-9a-fA-F]{64}$/;
if (!pkRegex.test(privateKey)) {
  throw new Error(
    `PRIVATE_KEY must be 0x + 64 hex chars. Got length=${privateKey.length}`
  );
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);

// đọc ABI ở backend/src/lib/educhain.abi.json
const abiPath = path.join(process.cwd(), "src", "lib", "educhain.abi.json");
const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));

const eduChain = new ethers.Contract(contractAddress, abi, wallet);

console.log("✅ EduChain listener attached to:", contractAddress);

// helper lấy txHash từ event
function getTxHashFromEvent(event) {
  return event?.log?.transactionHash || event?.transactionHash || null;
}

// 3) Lắng nghe RecordAdded
eduChain.on(
  "RecordAdded",
  async (id, studentWallet, studentCode, subject, grade, semester, event) => {
    try {
      const txHash = getTxHashFromEvent(event);
      console.log(
        "[RecordAdded]",
        "code=",
        studentCode,
        "subject=",
        subject,
        "grade=",
        grade,
        "tx=",
        txHash
      );

      if (txHash) {
        const exists = await Record.findOne({ txHash });
        if (exists) {
          console.log("  -> Record đã tồn tại trong DB, bỏ qua.");
          return;
        }
      }

      const student = await Student.findOne({ code: studentCode });
      if (!student) {
        console.warn(
          "  -> Không tìm thấy sinh viên với code:",
          studentCode,
          "=> bỏ qua sự kiện."
        );
        return;
      }

      const rec = await Record.create({
        studentId: student._id,
        subject,
        grade: Number(grade),
        semester,
        txHash: txHash || undefined,
      });

      console.log("  -> Đã lưu record vào DB với id:", rec._id.toString());
    } catch (e) {
      console.error("Error handling RecordAdded event:", e);
    }
  }
);

// 4) Lắng nghe CertificateIssued
eduChain.on(
  "CertificateIssued",
  async (id, studentWallet, studentCode, certType, metadata, event) => {
    try {
      const txHash = getTxHashFromEvent(event);
      console.log(
        "[CertificateIssued]",
        "code=",
        studentCode,
        "type=",
        certType,
        "metadata/cid=",
        metadata,
        "tx=",
        txHash
      );

      if (txHash) {
        const exists = await Certificate.findOne({ txHash });
        if (exists) {
          console.log("  -> Certificate đã tồn tại trong DB, bỏ qua.");
          return;
        }
      }

      const student = await Student.findOne({ code: studentCode });
      if (!student) {
        console.warn(
          "  -> Không tìm thấy sinh viên với code:",
          studentCode,
          "=> bỏ qua sự kiện."
        );
        return;
      }

      const cert = await Certificate.create({
        studentId: student._id,
        type: certType,
        date: new Date(), // hoặc dùng timestamp block
        txHash: txHash || undefined,
        nftCode:
          "#NFT-" +
          String(Math.floor(Math.random() * 900) + 100).padStart(3, "0"),
        ipfsCid: metadata && metadata.length > 0 ? metadata : null,
      });

      console.log(
        "  -> Đã lưu certificate vào DB với id:",
        cert._id.toString()
      );
    } catch (e) {
      console.error("Error handling CertificateIssued event:", e);
    }
  }
);

console.log("👂 EduChain listener is now listening for events...");

// giữ process sống
process.stdin.resume();
