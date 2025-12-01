// backend/routes/ipfs.routes.js
import { Router } from "express";
import multer from "multer";
import { uploadBufferToIPFS } from "../lib/ipfs.js";
import { authGuard } from "../lib/auth.js"; // dùng chung authGuard với các route khác :contentReference[oaicite:1]{index=1}

const r = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/ipfs/upload
// form-data: field name = "file"
r.post("/upload", authGuard, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Missing file" });
    }

    const cid = await uploadBufferToIPFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

    res.json({ cid, url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Upload to Pinata failed" });
  }
});

export default r;
