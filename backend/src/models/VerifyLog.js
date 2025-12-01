import mongoose from "mongoose";
const verifyLogSchema = new mongoose.Schema({
  input:   { type: String, required: true },
  result:  { type: String, enum: ["valid","invalid"], required: true },
  company: { type: String },
}, { timestamps: true });
export default mongoose.model("VerifyLog", verifyLogSchema);
