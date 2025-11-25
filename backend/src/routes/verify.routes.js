import { Router } from "express";
import Record from "../models/Record.js";
import VerifyLog from "../models/VerifyLog.js";
import Certificate from "../models/Certificate.js";
import { contract } from "../lib/educhain.js";

const r = Router();

// ====== 1) VERIFY QUA DATABASE (như cũ) ======
r.post("/hash", async (req, res) => {
  const { hash, company } = req.body || {};
  const isHex = typeof hash === "string" && /^0x[a-fA-F0-9]{6,}$/.test(hash);

  let result = "invalid";
  let targetType = null;
  let targetId = null;

  if (isHex) {
    const rec = await Record.findOne({ txHash: hash });
    const cert = !rec ? await Certificate.findOne({ txHash: hash }) : null;

    if (rec) {
      result = "valid";
      targetType = "record";
      targetId = rec._id;
    } else if (cert) {
      result = "valid";
      targetType = "certificate";
      targetId = cert._id;
    }
  }

  const log = await VerifyLog.create({
    input: hash || "",
    result,
    company: company || null,
    targetType,
    targetId,
  });

  res.json({ result, targetType, targetId, logId: log.id });
});

// ====== 2) TRUSTLESS VERIFY: ĐỌC TRỰC TIẾP TỪ BLOCKCHAIN ======
// GET /api/verify/onchain/:txHash
r.get("/onchain/:txHash", async (req, res) => {
  try {
    const txHash = req.params.txHash;
    if (
      typeof txHash !== "string" ||
      !/^0x[0-9a-fA-F]{64}$/.test(txHash)
    ) {
      return res.status(400).json({ valid: false, reason: "INVALID_TX_HASH" });
    }

    // Lấy provider từ contract runner (ethers v6)
    const provider = contract.runner?.provider;
    if (!provider) {
      return res
        .status(500)
        .json({ valid: false, reason: "NO_PROVIDER_CONFIGURED" });
    }

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return res.json({ valid: false, reason: "TRANSACTION_NOT_FOUND" });
    }

    // Tìm log thuộc về EduChain contract
    const contractAddress = String(contract.target).toLowerCase();
    let parsedEvent = null;

    for (const log of receipt.logs) {
      if (String(log.address).toLowerCase() !== contractAddress) continue;
      try {
        const ev = contract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (
          ev.name === "CertificateIssued" ||
          ev.name === "RecordAdded"
        ) {
          parsedEvent = ev;
          break;
        }
      } catch {
        // log này không parse được -> bỏ qua
      }
    }

    if (!parsedEvent) {
      return res.json({
        valid: false,
        reason: "NO_EDUCHAIN_EVENT",
      });
    }

    const id = parsedEvent.args.id.toString();
    let payload = null;

    if (parsedEvent.name === "CertificateIssued") {
      const certOnChain = await contract.certificates(id);
      // struct: (studentWallet, studentCode, certType, metadata, issuedAt)
      payload = {
        type: "certificate",
        id,
        studentWallet: certOnChain.studentWallet,
        studentCode: certOnChain.studentCode,
        certType: certOnChain.certType,
        metadata: certOnChain.metadata,
        issuedAt: Number(certOnChain.issuedAt),
      };
    } else if (parsedEvent.name === "RecordAdded") {
      const recOnChain = await contract.records(id);
      // struct: (studentWallet, studentCode, subject, grade, semester, createdAt)
      payload = {
        type: "record",
        id,
        studentWallet: recOnChain.studentWallet,
        studentCode: recOnChain.studentCode,
        subject: recOnChain.subject,
        grade: Number(recOnChain.grade),
        semester: recOnChain.semester,
        createdAt: Number(recOnChain.createdAt),
      };
    }

    if (!payload) {
      return res.json({
        valid: false,
        reason: "UNKNOWN_EVENT_TYPE",
      });
    }

    res.json({
      valid: true,
      chain: {
        txHash,
        blockNumber: receipt.blockNumber,
        ...payload,
      },
    });
  } catch (e) {
    console.error("On-chain verify error:", e);
    res.status(500).json({
      valid: false,
      reason: "INTERNAL_ERROR",
      message: e.message,
    });
  }
});

export default r;
