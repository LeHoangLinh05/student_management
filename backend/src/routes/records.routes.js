import { Router } from "express";
import Record from "../models/Record.js";
import { authGuard } from "../lib/auth.js";
import { z } from "zod";
import { customAlphabet } from "nanoid";

const nano = customAlphabet("abcdef0123456789", 10);
const r = Router();
r.use(authGuard);

const recordCreateSchema = z.object({
  studentId: z.string(),
  subject: z.string(),
  grade: z.number().min(0).max(10),
  semester: z.string(),
});

// POST /api/records
r.post("/", async (req, res) => {
  try {
    const body = { ...req.body, grade: Number(req.body.grade) };
    const data = recordCreateSchema.parse(body);
    const txHash = "0x" + nano() + nano();
    const rec = await Record.create({ ...data, txHash });
    res.json(rec);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// GET /api/records/:studentId
r.get("/:studentId", async (req, res) => {
  const items = await Record.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
  res.json(items);
});

export default r;
