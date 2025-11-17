import { Router } from "express";
import Record from "../models/Record.js";
import VerifyLog from "../models/VerifyLog.js";
import Certificate from "../models/Certificate.js";

const r = Router(); 

// POST /api/verify/hash
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

export default r;
