import mongoose from "mongoose";
const certificateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  type:      { type: String, required: true },
  date:      { type: Date, required: true },
  nftCode:   { type: String },
  ipfsCid:   { type: String },
  metadataCid: { type: String },
  txHash: { type: String, unique: true, index: true },   
  nftContract: { type: String },                 // địa chỉ EduDegreeNFT
  nftTokenId: { type: String },                  // tokenId ERC-721
  nftTxHash: { type: String },  
}, { timestamps: true });
export default mongoose.model("Certificate", certificateSchema);
