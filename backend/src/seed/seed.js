import "dotenv/config.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db.js";
import User from "../src/models/User.js";
import Student from "../src/models/Student.js";
import Record from "../src/models/Record.js";

await connectDB();

async function main() {
  const pass = await bcrypt.hash("Secret1", 10);
  await User.updateOne(
    { email: "sofia@devias.io" },
    { $setOnInsert: { email: "sofia@devias.io", name: "Sofia Rivers", password: pass } },
    { upsert: true }
  );

  const stu = await Student.findOneAndUpdate(
    { email: "student@university.edu.vn" },
    {
      $setOnInsert: {
        fullName: "Nguyễn Văn A",
        code: "SV2024001",
        email: "student@university.edu.vn",
        dob: new Date("2003-01-20"),
        wallet: "0x742d...8f3c",
      },
    },
    { new: true, upsert: true }
  );

  await Record.create({
    studentId: stu._id, subject: "Lập trình Web", grade: 9.5, semester: "HK1 2024-2025", txHash: "0xA3f12bc789"
  }).catch(()=>{});
  await Record.create({
    studentId: stu._id, subject: "Cơ sở dữ liệu", grade: 8.8, semester: "HK1 2024-2025", txHash: "0x7B2457d4F1"
  }).catch(()=>{});

  console.log("Seed done");
  await mongoose.disconnect();
}

main();
