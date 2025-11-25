import { Router } from "express";
import Certificate from "../models/Certificate.js";
import Student from "../models/Student.js";
import { authGuard } from "../lib/auth.js";
import { z } from "zod";
import { contract as eduChain } from "../lib/educhain.js";
import { nftContract } from "../lib/edunft.js";
import { ethers } from "ethers";

const r = Router();
r.use(authGuard);

const certCreateSchema = z.object({
  studentId: z.string(),
  type: z.string(),
  date: z.string(),
  ipfsCid: z.string().optional().nullable(),      // CID file
  metadataCid: z.string().optional().nullable(),  // CID JSON metadata
});

const graduateSchema = z.object({
  studentId: z.string(),
  date: z.string().optional(),
  ipfsCid: z.string().optional().nullable(),
  metadataCid: z.string().optional().nullable(),
});

async function mintErc721IfNeeded(student, metadataCid) {
  if (!metadataCid) return { nftTokenId: null, nftTxHash: null };

  const tokenURI = `ipfs://${metadataCid}`;

  const tx = await nftContract.mintDegree(student.wallet, tokenURI);
  const receipt = await tx.wait();
  const nftTxHash = receipt.hash;

  let tokenId = null;
  try {
    const contractAddress = String(nftContract.target).toLowerCase();
    for (const log of receipt.logs) {
      if (String(log.address).toLowerCase() !== contractAddress) continue;
      const ev = nftContract.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });
      if (ev.name === "DegreeMinted") {
        tokenId = ev.args.tokenId.toString();
        break;
      }
    }
  } catch (e) {
    console.warn("Parse DegreeMinted event failed:", e.message);
  }

  return { nftTokenId: tokenId, nftTxHash };
}

// POST /api/certificates  (cấp bằng / chứng chỉ)
r.post("/", async (req, res) => {
  try {
    const data = certCreateSchema.parse(req.body);

    const student = await Student.findById(data.studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 1) Ghi certificate vào EduChain (contract cũ)
    const tx = await eduChain.issueCertificate(
      student.wallet || ethers.ZeroAddress,
      student.code,
      data.type,
      data.ipfsCid || ""
    );
    const receipt = await tx.wait();
    const txHash = receipt.hash;

    // 2) Mint NFT ERC-721 thật nếu có metadataCid
    const { nftTokenId, nftTxHash } = await mintErc721IfNeeded(
      student,
      data.metadataCid || null
    );

    // 3) Lưu Mongo
    const cert = await Certificate.create({
      studentId: data.studentId,
      type: data.type,
      date: new Date(data.date),
      txHash,
      nftCode:
        "#NFT-" +
        String(Math.floor(Math.random() * 900) + 100).padStart(3, "0"),
      ipfsCid: data.ipfsCid || null,
      metadataCid: data.metadataCid || null,
      nftContract: nftTokenId ? String(nftContract.target) : null,
      nftTokenId: nftTokenId || null,
      nftTxHash: nftTxHash || null,
    });

    res.json(cert);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

// POST /api/certificates/graduate  (tốt nghiệp + mint NFT)
r.post("/graduate", async (req, res) => {
  try {
    const { studentId, date, ipfsCid, metadataCid } = graduateSchema.parse(
      req.body
    );
    const when = date ? new Date(date) : new Date();

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 1) update trạng thái sinh viên
    student.status = "graduated";
    student.graduatedAt = when;
    await student.save();

    // 2) Ghi Bằng tốt nghiệp lên EduChain
    const tx = await eduChain.issueCertificate(
      student.wallet || ethers.ZeroAddress,
      student.code,
      "Bằng tốt nghiệp",
      ipfsCid || ""
    );
    const receipt = await tx.wait();
    const txHash = receipt.hash;

    // 3) Mint NFT ERC-721 thật
    const { nftTokenId, nftTxHash } = await mintErc721IfNeeded(
      student,
      metadataCid || null
    );

    // 4) Lưu certificate
    const cert = await Certificate.create({
      studentId,
      type: "Bằng tốt nghiệp",
      date: when,
      txHash,
      nftCode:
        "#NFT-" +
        String(Math.floor(Math.random() * 900) + 100).padStart(3, "0"),
      ipfsCid: ipfsCid || null,
      metadataCid: metadataCid || null,
      nftContract: nftTokenId ? String(nftContract.target) : null,
      nftTokenId: nftTokenId || null,
      nftTxHash: nftTxHash || null,
    });

    res.json({ student, cert });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

// GET /api/certificates
r.get("/", async (_req, res) => {
  try {
    const items = await Certificate.find({}).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/certificates/:studentId
r.get("/:studentId", async (req, res) => {
  const items = await Certificate.find({
    studentId: req.params.studentId,
  }).sort({ date: -1 });
  res.json(items);
});

export default r;
