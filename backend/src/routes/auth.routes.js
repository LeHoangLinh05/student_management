import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken, authGuard } from "../lib/auth.js";
import { z } from "zod";

const r = Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});


// POST /api/auth/register
r.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(400).json({ message: "Email already used" });
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await User.create({ email: data.email, name: data.name, password: hashed });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// POST /api/auth/login
r.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });
    const token = signToken({ id: user.id, email: user.email }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// POST /api/auth/change-password
r.post("/change-password", authGuard, async (req, res) => {
  try {
    const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message || "Đổi mật khẩu thất bại" });
  }
});


export default r;
