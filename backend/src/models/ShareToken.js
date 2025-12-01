import mongoose from "mongoose";

const shareSchema = new mongoose.Schema({
  token: { type: String, unique: true },
  credentialHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  limit: { type: Number, default: 5 },
  used: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("ShareToken", shareSchema);
