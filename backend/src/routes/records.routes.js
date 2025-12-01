import { Router } from "express";
import Record from "../models/Record.js";
import { authGuard } from "../lib/auth.js";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { contract as eduChain } from "../lib/educhain.js";
import Student from "../models/Student.js";
import { ethers } from "ethers";

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

    const student = await Student.findById(data.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // gọi smart contract
    const tx = await eduChain.addRecord(
      student.wallet || ethers.ZeroAddress,  // nếu đã có ví, dùng ví thật
      student.code,
      data.subject,
      data.grade,
      data.semester
    );
    const receipt = await tx.wait();
    const txHash = receipt.hash;

    const rec = await Record.create({ ...data, txHash });
    res.json(rec);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});


// GET /api/records/:studentId
r.get("/:studentId", async (req, res) => {
  const items = await Record.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
  res.json(items);
});

export default r;
