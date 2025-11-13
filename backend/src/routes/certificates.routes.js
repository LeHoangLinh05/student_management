import { Router } from "express";
import Certificate from "../models/Certificate.js";
import { authGuard } from "../lib/auth.js";
import { z } from "zod";

const r = Router();
r.use(authGuard);

const certCreateSchema = z.object({
  studentId: z.string(),
  type: z.string(),
  date: z.string(),  
});

// POST /api/certificates
r.post("/", async (req, res) => {
  try {
    const data = certCreateSchema.parse(req.body);
    const cert = await Certificate.create({
      studentId: data.studentId,
      type: data.type,
      date: new Date(data.date),
      nftCode: "#NFT-" + String(Math.floor(Math.random() * 900) + 100).padStart(3, "0"),
      ipfsCid: null,
    });
    res.json(cert);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// GET /api/certificates/:studentId
r.get("/:studentId", async (req, res) => {
  const items = await Certificate.find({ studentId: req.params.studentId }).sort({ date: -1 });
  res.json(items);
});

export default r;
