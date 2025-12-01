import express from "express";
import ZKProofService from "../lib/zkproof.js";
import { verifyToken } from "../lib/auth.js";

const router = express.Router();
const zkProofService = new ZKProofService();

/**
 * POST /api/zkproof/generate-grade-commitment
 * Tạo commitment cho grade (client side)
 */
router.post("/generate-grade-commitment", (req, res) => {
  try {
    const { grade } = req.body;

    if (grade === undefined) {
      return res.status(400).json({
        error: "Grade is required",
      });
    }

    const commitment = zkProofService.generateGradeCommitment(grade);

    res.json({
      message: "Grade commitment generated",
      ...commitment,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/zkproof/generate-cert-commitment
 * Tạo commitment cho certificate
 */
router.post("/generate-cert-commitment", (req, res) => {
  try {
    const { certData } = req.body;

    if (!certData) {
      return res.status(400).json({
        error: "Certificate data is required",
      });
    }

    const commitment = zkProofService.generateCertCommitment(certData);

    res.json({
      message: "Certificate commitment generated",
      ...commitment,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/zkproof/add-record-with-commitment
 * Thêm record với ZK commitment (chỉ admin)
 */
router.post("/add-record-with-commitment", verifyToken, async (req, res) => {
  try {
    const { studentWallet, studentCode, subject, grade, semester, gradeCommitment } = req.body;

    if (!studentWallet || !studentCode || !subject || grade === undefined || !semester || !gradeCommitment) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await zkProofService.addRecordWithZKCommitment(
      studentWallet,
      studentCode,
      subject,
      grade,
      semester,
      gradeCommitment
    );

    res.json({
      message: "Record with ZK commitment added",
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/zkproof/issue-certificate-with-commitment
 * Phát hành certificate với ZK commitment (chỉ admin)
 */
router.post("/issue-certificate-with-commitment", verifyToken, async (req, res) => {
  try {
    const { studentWallet, studentCode, certType, metadata, certCommitment } = req.body;

    if (!studentWallet || !studentCode || !certType || !metadata || !certCommitment) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await zkProofService.issueCertificateWithZKCommitment(
      studentWallet,
      studentCode,
      certType,
      metadata,
      certCommitment
    );

    res.json({
      message: "Certificate with ZK commitment issued",
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/zkproof/submit-grade-proof
 * Sinh viên submit ZK proof cho grade
 */
router.post("/submit-grade-proof", verifyToken, async (req, res) => {
  try {
    const { recordId, proof } = req.body;

    if (recordId === undefined || !proof) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await zkProofService.submitGradeZKProof(recordId, proof);

    res.json({
      message: "Grade ZK proof submitted",
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/zkproof/verify-grade-proof
 * Verifier xác minh grade ZK proof
 */
router.post("/verify-grade-proof", verifyToken, async (req, res) => {
  try {
    const { commitment, claimedGrade, salt } = req.body;

    if (!commitment || claimedGrade === undefined || !salt) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await zkProofService.verifyGradeZKProof(commitment, claimedGrade, salt);

    res.json({
      message: "Grade ZK proof verified",
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * POST /api/zkproof/submit-certificate-proof
 * Sinh viên submit ZK proof cho certificate
 */
router.post("/submit-certificate-proof", verifyToken, async (req, res) => {
  try {
    const { certId, proof } = req.body;

    if (certId === undefined || !proof) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await zkProofService.submitCertificateZKProof(certId, proof);

    res.json({
      message: "Certificate ZK proof submitted",
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/zkproof/status/:commitment
 * Lấy status của ZK proof
 */
router.get("/status/:commitment", async (req, res) => {
  try {
    const { commitment } = req.params;

    const status = await zkProofService.getZKProofStatus(commitment);

    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/zkproof/record-commitment/:recordId
 * Lấy commitment của record
 */
router.get("/record-commitment/:recordId", async (req, res) => {
  try {
    const { recordId } = req.params;

    const commitment = await zkProofService.getRecordCommitment(recordId);

    res.json({
      commitment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/zkproof/certificate-commitment/:certId
 * Lấy commitment của certificate
 */
router.get("/certificate-commitment/:certId", async (req, res) => {
  try {
    const { certId } = req.params;

    const commitment = await zkProofService.getCertificateCommitment(certId);

    res.json({
      commitment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/zkproof/registry
 * Lấy toàn bộ commitment registry
 */
router.get("/registry", async (req, res) => {
  try {
    const registry = await zkProofService.getCommitmentRegistry();

    res.json({
      commitments: registry,
      count: registry.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;
