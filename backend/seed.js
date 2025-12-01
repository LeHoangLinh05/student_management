import "dotenv/config.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/student_management";

async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  name: String,
  password: String,
  role: { type: String, enum: ["admin", "user"], default: "admin" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const studentSchema = new mongoose.Schema({
  fullName: String,
  code: { type: String, unique: true },
  email: { type: String, unique: true },
  dob: Date,
  wallet: String,
  phone: String,
  avatar: String,
  status: { type: String, enum: ["active", "inactive", "graduated"], default: "active" },
}, { timestamps: true });

const recordSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  subject: String,
  grade: Number,
  semester: String,
  txHash: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Student = mongoose.model("Student", studentSchema);
const Record = mongoose.model("Record", recordSchema);

await connectDB();

async function main() {
  try {
    // Seed admin user
    const pass1 = await bcrypt.hash("Secret1", 10);
    await User.updateOne(
      { email: "sofia@devias.io" },
      { 
        $setOnInsert: { 
          email: "sofia@devias.io", 
          name: "Sofia Rivers", 
          password: pass1,
          role: "admin"
        } 
      },
      { upsert: true }
    );
    console.log("✓ Admin user sofia@devias.io created");

    // Seed student user
    const pass2 = await bcrypt.hash("23021602", 10);
    const studentUser = await User.updateOne(
      { email: "23021602@vnu.edu.vn" },
      { 
        $setOnInsert: { 
          email: "23021602@vnu.edu.vn", 
          name: "Lê Hoàng Linh", 
          password: pass2,
          role: "user"
        } 
      },
      { upsert: true }
    );
    console.log("✓ Student user 23021602@vnu.edu.vn created");

    // Seed student record
    const student = await Student.findOneAndUpdate(
      { code: "23021602" },
      {
        $setOnInsert: {
          fullName: "Lê Hoàng Linh",
          code: "23021602",
          email: "23021602@vnu.edu.vn",
          dob: new Date("2003-01-20"),
          wallet: "0x742d35Cc6634C0532925a3b844Bc200e0f7ff11c",
        },
      },
      { new: true, upsert: true }
    );
    console.log("✓ Student record created");

    // Seed academic records
    try {
      await Record.create({
        studentId: student._id, 
        subject: "Lập trình Web", 
        grade: 9.5, 
        semester: "HK1 2024-2025", 
        txHash: "0xA3f12bc789"
      });
    } catch (e) {}

    try {
      await Record.create({
        studentId: student._id, 
        subject: "Cơ sở dữ liệu", 
        grade: 8.8, 
        semester: "HK1 2024-2025", 
        txHash: "0x7B2457d4F1"
      });
    } catch (e) {}

    console.log("✓ Academic records created");
    console.log("\n✅ Seed completed successfully!\n");
    console.log("Test credentials:");
    console.log("  Admin: sofia@devias.io / Secret1");
    console.log("  Student: 23021602@vnu.edu.vn / 23021602");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
