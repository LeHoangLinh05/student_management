import mongoose from "mongoose";
const certificateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  type:      { type: String, required: true },
  date:      { type: Date, required: true },
  nftCode:   { type: String },
  ipfsCid:   { type: String },
}, { timestamps: true });
export default mongoose.model("Certificate", certificateSchema);
