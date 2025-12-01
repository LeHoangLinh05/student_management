import mongoose from "mongoose";
const recordSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  subject:   { type: String, required: true },
  grade:     { type: Number, required: true, min: 0, max: 10 },
  semester:  { type: String, required: true },
  txHash:    { type: String, unique: true, index: true }, // mock hash
}, { timestamps: true });
export default mongoose.model("Record", recordSchema);
