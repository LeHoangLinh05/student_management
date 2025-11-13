import { Router } from "express";
import Record from "../models/Record.js";
import VerifyLog from "../models/VerifyLog.js";

const r = Router(); 

// POST /api/verify/hash
r.post("/hash", async (req, res) => {
  const { hash, company } = req.body || {};
  const isHex = typeof hash === "string" && /^0x[a-fA-F0-9]{6,}$/.test(hash);

  let result = "invalid";
  if (isHex) {
    const rec = await Record.findOne({ txHash: hash });
    result = rec ? "valid" : "invalid";
  }
  const log = await VerifyLog.create({ input: hash || "", result, company: company || null });
  res.json({ result, logId: log.id });
});

export default r;
