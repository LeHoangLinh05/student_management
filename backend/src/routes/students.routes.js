import { Router } from "express";
import Student from "../models/Student.js";
import { authGuard } from "../lib/auth.js";
import { z } from "zod";

const r = Router();
r.use(authGuard);

const studentCreateSchema = z.object({
  fullName: z.string().min(1),
  code: z.string().min(3),
  email: z.string().email(),
  dob: z.string(),          
  wallet: z.string().optional(),
});

// GET /api/students
r.get("/", async (_req, res) => {
  const items = await Student.find().sort({ createdAt: -1 });
  res.json(items);
});

// POST /api/students
r.post("/", async (req, res) => {
  try {
    const data = studentCreateSchema.parse(req.body);
    const created = await Student.create({
      fullName: data.fullName,
      code: data.code,
      email: data.email,
      dob: new Date(data.dob),
      wallet: data.wallet ?? undefined,
    });
    res.json(created);
  } catch (e) {
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
