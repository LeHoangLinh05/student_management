import { Router } from "express";
import Student from "../models/Student.js";
import User from "../models/User.js";   
import Record from "../models/Record.js";
import VerifyLog from "../models/VerifyLog.js";
import { authGuard } from "../lib/auth.js";
import { z } from "zod";
import bcrypt from "bcryptjs";    
import multer from "multer";         
import ShareToken from "../models/ShareToken.js";
import crypto from "crypto";
import Certificate from "../models/Certificate.js";


const r = Router();
r.use(authGuard);

const studentCreateSchema = z.object({
  fullName: z.string().min(1),
  code: z.string().min(3),
  email: z.string().email(),
  dob: z.string(),         
  wallet: z.string().optional(),
});

const studentUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  dob: z.string().optional(),          
  wallet: z.string().optional(),
  status: z.enum(["studying", "graduated"]).optional(),
});

const upload = multer({
  dest: "uploads/", 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// PUT /api/students/:id  (admin chỉnh hồ sơ)
r.put("/:id", async (req, res) => {
  try {
    const data = studentUpdateSchema.parse(req.body);
    const update = { ...data };

    if (data.dob) {
      update.dob = new Date(data.dob);
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});


// GET /api/students
r.get("/", async (_req, res) => {
  const items = await Student.find().sort({ createdAt: -1 });
  res.json(items);
});

// POST /api/students  (tạo sinh viên + upload hồ sơ)
r.post("/", upload.single("file"), async (req, res) => {
  try {
    // multer đã parse text field vào req.body
    const data = studentCreateSchema.parse(req.body);

    // Thông tin file (nếu có upload)
    // req.file = undefined nếu người ta không chọn file
    const fileInfo = req.file
      ? {
          path: req.file.path,           // vd: "uploads/abc123.pdf"
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        }
      : null;

    // kiểm tra email đã có User chưa
    const existsUser = await User.findOne({ email: data.email });
    if (existsUser) {
      return res.status(400).json({ message: "Email này đã có tài khoản." });
    }

    // tạo User: email = email sinh viên, password = mã SV
    const hashed = await bcrypt.hash(data.code, 10);
    const user = await User.create({
      email: data.email,
      name: data.fullName,
      password: hashed,
    });

    // tạo Student
    const student = await Student.create({
      fullName: data.fullName,
      code: data.code,
      email: data.email,
      dob: new Date(data.dob),
      wallet: data.wallet ?? undefined,
      // nếu muốn lưu meta file vào DB:
      file: fileInfo ?? undefined,
    });

    res.json({
      student,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});



r.post("/:id/connect-wallet", async (req, res) => {
  try {
    const { mode, address } = req.body || {};
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let wallet = student.wallet;

    // Nếu truyền địa chỉ ví hợp lệ -> gắn ví đó
    if (
      mode === "custom" &&
      typeof address === "string" &&
      /^0x[a-fA-F0-9]{40}$/.test(address)
    ) {
      wallet = address;
    } else {
      // Ngược lại: sinh ví mock ngẫu nhiên
      const chars = "abcdef0123456789";
      let hex = "";
      for (let i = 0; i < 40; i++) {
        hex += chars[Math.floor(Math.random() * chars.length)];
      }
      wallet = "0x" + hex;
    }

    student.wallet = wallet;
    await student.save();

    res.json({ wallet });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});


r.get("/:id/audit", async (req, res) => {
  try {
    const studentId = req.params.id;

    const records = await Record.find({ studentId }).select("subject txHash createdAt");
    const certs   = await Certificate.find({ studentId }).select("type txHash createdAt");

    const recordMap = {};

    // map điểm
    records.forEach(r => {
      if (r.txHash) {
        recordMap[r.txHash] = {
          credentialType: "record",
          credentialName: r.subject,
        };
      }
    });

    // map bằng cấp
    certs.forEach(c => {
      if (c.txHash) {
        recordMap[c.txHash] = {
          credentialType: "certificate",
          credentialName: c.type,
        };
      }
    });

    // tất cả hash cần nhìn log
    const hashes = Object.keys(recordMap);

    // FIX QUAN TRỌNG: nếu không có hash → trả về rỗng
    if (hashes.length === 0) {
      return res.json({ logs: [] });
    }

    // lấy log verify
    const logs = await VerifyLog.find({ input: { $in: hashes } }).sort({ createdAt: -1 });

    const result = logs.map(l => ({
      id: l._id,
      hash: l.input,
      company: l.company || "Không rõ",
      credentialType: recordMap[l.input]?.credentialType || null,
      credentialName: recordMap[l.input]?.credentialName || null,
      result: l.result,
      createdAt: l.createdAt
    }));

    res.json({ logs: result });

  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});



// GET /api/students/:id
r.get("/:id", async (req, res) => {
  const s = await Student.findById(req.params.id);
  if (!s) return res.status(404).json({ message: "Not found" });
  res.json(s);
});

export default r;
