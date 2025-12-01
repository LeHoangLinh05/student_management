import { Router } from "express";
import Record from "../models/Record.js";
import VerifyLog from "../models/VerifyLog.js";
import Certificate from "../models/Certificate.js";
import ShareToken from "../models/ShareToken.js";
import { authGuard } from "../lib/auth.js";
import crypto from "crypto";

const r = Router();

// 🔹 Tạo link chia sẻ riêng tư (chỉ user đã đăng nhập – sinh viên)
r.post("/share", authGuard, async (req, res) => {
  try {
    console.log("POST /api/verify/share body =", req.body);

    const { credentialHash, ttlHours } = req.body || {};
    if (!credentialHash || typeof credentialHash !== "string") {
      return res.status(400).json({ message: "Missing credentialHash" });
    }

    const hours =
      typeof ttlHours === "number" && ttlHours > 0 ? ttlHours : 48;

    const token = crypto.randomBytes(24).toString("hex");

    await ShareToken.create({
      token,
      credentialHash,
      expiresAt: new Date(Date.now() + hours * 3600 * 1000),
      limit: 5,
      used: 0,
    });

    res.json({ token });
  } catch (e) {
    console.error("Error in /share:", e);
    res
      .status(400)
      .json({ message: e.message || "Cannot create share link" });
  }
});

// 🔹 Doanh nghiệp dùng token để lấy hash thực
r.get("/shared/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const share = await ShareToken.findOne({ token });

    if (!share) {
      return res.status(404).json({ message: "Link chia sẻ không hợp lệ" });
    }

    if (new Date() > share.expiresAt) {
      return res.status(400).json({ message: "Link đã hết hạn" });
    }

    if (share.limit && share.used >= share.limit) {
      return res
        .status(400)
        .json({ message: "Link đã vượt quá số lần sử dụng" });
    }

    share.used += 1;
    await share.save();

    res.json({ credentialHash: share.credentialHash });
  } catch (e) {
    console.error("Error in /shared:", e);
    res
      .status(400)
      .json({ message: e.message || "Cannot use shared link" });
  }
});

// 🔹 Verify hash (và trả luôn info certificate để show NFT)
r.post("/hash", async (req, res) => {
  const { hash, company } = req.body || {};
  const isHex = typeof hash === "string" && /^0x[a-fA-F0-9]{6,}$/.test(hash);

  let result = "invalid";
  let targetType = null;
  let targetId = null;
  let certificate = null;

  try {
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
        certificate = {
          id: cert._id,
          type: cert.type,
          date: cert.date,
          ipfsCid: cert.ipfsCid || null,
          txHash: cert.txHash || null,
        };
      }
    } else if (typeof hash === "string" && hash.length > 10) {
      // non-hex -> thử coi như IPFS CID
      const cert = await Certificate.findOne({ ipfsCid: hash });
      if (cert) {
        result = "valid";
        targetType = "certificate";
        targetId = cert._id;
        certificate = {
          id: cert._id,
          type: cert.type,
          date: cert.date,
          ipfsCid: cert.ipfsCid || null,
          txHash: cert.txHash || null,
        };
      }
    }

    const log = await VerifyLog.create({
      input: hash || "",
      result,
      company: company || null,
      targetType,
      targetId,
    });

    res.json({ result, targetType, targetId, logId: log.id, certificate });
  } catch (e) {
    console.error("Error in /hash:", e);
    res.status(400).json({ message: e.message || "Verify failed" });
  }
});

export default r;
