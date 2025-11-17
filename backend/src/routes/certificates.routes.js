import { Router } from "express";
import Certificate from "../models/Certificate.js";
import Student from "../models/Student.js";   
import { authGuard } from "../lib/auth.js";
import { z } from "zod";
import { customAlphabet } from "nanoid";

//test
const nano = customAlphabet("abcdef0123456789", 64);
const r = Router();
r.use(authGuard);

const certCreateSchema = z.object({
  studentId: z.string(),
  type: z.string(),
  date: z.string(),  
});
const graduateSchema = z.object({
  studentId: z.string(),
  date: z.string().optional(), 
});

// POST /api/certificates
r.post("/", async (req, res) => {
  try {
    const data = certCreateSchema.parse(req.body);
    const txHash = "0x" + nano();
    const cert = await Certificate.create({
      studentId: data.studentId,
      type: data.type,
      date: new Date(data.date),
      txHash,
      nftCode: "#NFT-" + String(Math.floor(Math.random() * 900) + 100).padStart(3, "0"),
      ipfsCid: null,
    });
    res.json(cert);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

r.post("/graduate", async (req, res) => {
  try {
    const { studentId, date } = graduateSchema.parse(req.body);
    const when = date ? new Date(date) : new Date();

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 1️⃣ cập nhật trạng thái sinh viên
    student.status = "graduated";
    student.graduatedAt = when;
    await student.save();

    // 2️⃣ cấp bằng tốt nghiệp
    const cert = await Certificate.create({
      studentId,
      type: "Bằng tốt nghiệp",
      date: when,
      nftCode:
        "#NFT-" +
        String(Math.floor(Math.random() * 900) + 100).padStart(3, "0"),
      ipfsCid: null,
    });

    res.json({ student, cert });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

// GET /api/certificates/:studentId
r.get("/:studentId", async (req, res) => {
  const items = await Certificate.find({ studentId: req.params.studentId }).sort({ date: -1 });
  res.json(items);
});

export default r;
