import express from 'express';
import zkpService from '../lib/zkp.js';

const router = express.Router();

/**
 * POST /api/zkp/generate-proof
 * Tạo zero knowledge proof
 */
router.post('/generate-proof', async (req, res) => {
  try {
    const { proofType, ageThreshold, customAttribute } = req.body;

    if (!proofType) {
      return res.status(400).json({ message: 'proofType là bắt buộc' });
    }

    const proofData = await zkpService.generateProof(proofType, {
      ageThreshold: ageThreshold || 18,
      customAttribute
    });

    res.json({
      proof: proofData.proof,
      publicInputs: proofData.publicInputs,
      verified: proofData.verified,
      message: 'Proof được tạo thành công'
    });
  } catch (error) {
    console.error('Lỗi tạo proof:', error);
    res.status(500).json({ message: error.message || 'Lỗi tạo proof' });
  }
});

/**
 * POST /api/zkp/verify-proof
 * Xác thực zero knowledge proof
 */
router.post('/verify-proof', async (req, res) => {
  try {
    const { proof, publicInputs } = req.body;

    if (!proof || !publicInputs) {
      return res.status(400).json({ message: 'proof và publicInputs là bắt buộc' });
    }

    const result = await zkpService.verifyProof(proof, publicInputs);

    res.json(result);
  } catch (error) {
    console.error('Lỗi xác thực proof:', error);
    res.status(500).json({ message: error.message || 'Lỗi xác thực proof' });
  }
});

/**
 * POST /api/zkp/validate-age
 * Xác thực tuổi không tiết lộ dob
 */
router.post('/validate-age', async (req, res) => {
  try {
    const { dob, minimumAge } = req.body;

    if (!dob || !minimumAge) {
      return res.status(400).json({ message: 'dob và minimumAge là bắt buộc' });
    }

    const result = await zkpService.validateAge(dob, minimumAge);

    res.json(result);
  } catch (error) {
    console.error('Lỗi xác thực tuổi:', error);
    res.status(500).json({ message: error.message || 'Lỗi xác thực tuổi' });
  }
});

/**
 * POST /api/zkp/validate-gpa
 * Xác thực GPA cao mà không tiết lộ điểm chính xác
 */
router.post('/validate-gpa', async (req, res) => {
  try {
    const { gpa, minimumGpa } = req.body;

    if (gpa === undefined || minimumGpa === undefined) {
      return res.status(400).json({ message: 'gpa và minimumGpa là bắt buộc' });
    }

    const result = await zkpService.validateGPA(gpa, minimumGpa);

    res.json(result);
  } catch (error) {
    console.error('Lỗi xác thực GPA:', error);
    res.status(500).json({ message: error.message || 'Lỗi xác thực GPA' });
  }
});

export default router;
