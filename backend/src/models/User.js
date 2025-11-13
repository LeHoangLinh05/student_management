import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true }, // bcrypt hash
}, { timestamps: true });
export default mongoose.model("User", userSchema);
