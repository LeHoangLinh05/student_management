import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  code:     { type: String, unique: true, required: true },
  email:    { type: String, unique: true, required: true },
  dob:      { type: Date, required: true },
  wallet:   { type: String },

  status: {
    type: String,
    enum: ["studying", "graduated"],
    default: "studying",
  },
  graduatedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("Student", studentSchema);
