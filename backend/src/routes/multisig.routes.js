import express from "express";
import multiSigService from "../lib/multisig.js";
import { authGuard } from "../lib/auth.js";

const router = express.Router();

/**
 * POST /api/multisig/propose-record
 * Propose thêm record (cần authorization)
 */
router.post("/propose-record", authGuard, async (req, res) => {
  try {
    const { studentWallet, studentCode, subject, grade, semester } = req.body;

    if (!studentWallet || !studentCode || !subject || grade === undefined || !semester) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await multiSigService.proposeAddRecord(
      studentWallet,
      studentCode,
      subject,
      grade,
      semester
    );

    res.json({
      message: "Record proposal created",
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
 * POST /api/multisig/propose-certificate
 * Propose phát hành certificate (cần authorization)
 */
router.post("/propose-certificate", authGuard, async (req, res) => {
  try {
    const { studentWallet, studentCode, certType, metadata } = req.body;

    if (!studentWallet || !studentCode || !certType || !metadata) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const result = await multiSigService.proposeIssueCertificate(
      studentWallet,
      studentCode,
      certType,
      metadata
    );

    res.json({
      message: "Certificate proposal created",
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
 * POST /api/multisig/approve/:txId
 * Approve một transaction (chỉ signatories)
 */
router.post("/approve/:txId", authGuard, async (req, res) => {
  try {
    const { txId } = req.params;

    const result = await multiSigService.approveTransaction(txId);

    res.json({
      message: "Transaction approved",
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
 * POST /api/multisig/reject/:txId
 * Reject một transaction (chỉ owner)
 */
router.post("/reject/:txId", authGuard, async (req, res) => {
  try {
    const { txId } = req.params;

    const result = await multiSigService.rejectTransaction(txId);

    res.json({
      message: "Transaction rejected",
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
 * GET /api/multisig/approvals/:txId
 * Lấy số approval của transaction
 */
router.get("/approvals/:txId", async (req, res) => {
  try {
    const { txId } = req.params;

    const approvals = await multiSigService.getTransactionApprovals(txId);

    res.json(approvals);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/multisig/check-approval/:txId/:signer
 * Check xem signer đã approve hay chưa
 */
router.get("/check-approval/:txId/:signer", async (req, res) => {
  try {
    const { txId, signer } = req.params;

    const approved = await multiSigService.hasApproved(txId, signer);

    res.json({
      approved,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/multisig/signatories
 * Lấy danh sách signatories
 */
router.get("/signatories", async (req, res) => {
  try {
    const signatories = await multiSigService.getSignatories();

    res.json({
      signatories,
      count: signatories.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/multisig/stats
 * Lấy thống kê
 */
router.get("/stats", async (req, res) => {
  try {
    const recordsCount = await multiSigService.getRecordsCount();
    const certificatesCount = await multiSigService.getCertificatesCount();

    res.json({
      records: recordsCount,
      certificates: certificatesCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/multisig/signers
 * Lấy danh sách người ký
 */
router.get("/signers", async (req, res) => {
  try {
    const signers = multiSigService.getSigners();
    const requiredSignatures = multiSigService.requiredSignatures;

    res.json({
      signers,
      requiredSignatures,
      count: signers.length
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách ký:', error);
    res.status(500).json({ error: error.message || 'Lỗi lấy danh sách ký' });
  }
});

/**
 * POST /api/multisig/add-signer
 * Thêm người ký mới
 */
router.post("/add-signer", async (req, res) => {
  try {
    const { signerAddress } = req.body;

    if (!signerAddress) {
      return res.status(400).json({ error: 'signerAddress là bắt buộc' });
    }

    const result = multiSigService.addSigner(signerAddress);

    res.json({
      success: result,
      message: result ? 'Thêm người ký thành công' : 'Người ký đã tồn tại',
      signers: multiSigService.getSigners()
    });
  } catch (error) {
    console.error('Lỗi thêm người ký:', error);
    res.status(500).json({ error: error.message || 'Lỗi thêm người ký' });
  }
});

/**
 * POST /api/multisig/create-transaction
 * Tạo giao dịch mới cần ký
 */
router.post("/create-transaction", async (req, res) => {
  try {
    const { description, data } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'description là bắt buộc' });
    }

    const txId = multiSigService.createTransaction({
      description,
      data: data || {}
    });

    res.json({
      txId,
      message: 'Giao dịch được tạo, chờ ký',
      transaction: multiSigService.getTransaction(txId)
    });
  } catch (error) {
    console.error('Lỗi tạo giao dịch:', error);
    res.status(500).json({ error: error.message || 'Lỗi tạo giao dịch' });
  }
});

/**
 * GET /api/multisig/transactions
 * Lấy danh sách giao dịch
 */
router.get("/transactions", async (req, res) => {
  try {
    const transactions = multiSigService.getAllTransactions();

    res.json({
      transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Lỗi lấy giao dịch:', error);
    res.status(500).json({ error: error.message || 'Lỗi lấy giao dịch' });
  }
});

/**
 * GET /api/multisig/transactions/:txId
 * Lấy chi tiết giao dịch
 */
router.get("/transactions/:txId", async (req, res) => {
  try {
    const { txId } = req.params;
    const transaction = multiSigService.getTransaction(txId);

    if (!transaction) {
      return res.status(404).json({ error: 'Giao dịch không tìm thấy' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Lỗi lấy chi tiết giao dịch:', error);
    res.status(500).json({ error: error.message || 'Lỗi lấy chi tiết giao dịch' });
  }
});

/**
 * POST /api/multisig/sign-transaction/:txId
 * Ký một giao dịch
 */
router.post("/sign-transaction/:txId", async (req, res) => {
  try {
    const { txId } = req.params;
    const { signer } = req.body;

    const transaction = multiSigService.getTransaction(txId);
    if (!transaction) {
      return res.status(404).json({ error: 'Giao dịch không tìm thấy' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Giao dịch không ở trạng thái chờ ký' });
    }

    const signerAddress = signer || multiSigService.getSigners()[0];
    
    const result = multiSigService.signTransaction(txId, signerAddress);

    if (!result) {
      return res.status(400).json({ error: 'Giao dịch đã được ký bởi người này' });
    }

    const updatedTx = multiSigService.getTransaction(txId);
    
    res.json({
      success: true,
      message: 'Ký giao dịch thành công',
      transaction: updatedTx,
      signaturesNeeded: multiSigService.requiredSignatures - updatedTx.signatures.length
    });
  } catch (error) {
    console.error('Lỗi ký giao dịch:', error);
    res.status(500).json({ error: error.message || 'Lỗi ký giao dịch' });
  }
});

/**
 * POST /api/multisig/execute-transaction/:txId
 * Thực thi giao dịch khi đã có đủ chữ ký
 */
router.post("/execute-transaction/:txId", async (req, res) => {
  try {
    const { txId } = req.params;
    const transaction = multiSigService.getTransaction(txId);

    if (!transaction) {
      return res.status(404).json({ error: 'Giao dịch không tìm thấy' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ 
        error: `Giao dịch không ở trạng thái chờ (trạng thái hiện tại: ${transaction.status})` 
      });
    }

    if (transaction.signatures.length < multiSigService.requiredSignatures) {
      return res.status(400).json({
        error: `Cần ${multiSigService.requiredSignatures - transaction.signatures.length} chữ ký nữa`,
        currentSignatures: transaction.signatures.length,
        requiredSignatures: multiSigService.requiredSignatures
      });
    }

    const result = multiSigService.executeTransaction(txId);

    if (!result) {
      return res.status(400).json({ error: 'Lỗi thực thi giao dịch' });
    }

    const updatedTx = multiSigService.getTransaction(txId);

    res.json({
      success: true,
      message: 'Thực thi giao dịch thành công',
      transaction: updatedTx,
      executedAt: updatedTx.executedAt
    });
  } catch (error) {
    console.error('Lỗi thực thi giao dịch:', error);
    res.status(500).json({ error: error.message || 'Lỗi thực thi giao dịch' });
  }
});

/**
 * POST /api/multisig/cancel-transaction/:txId
 * Hủy một giao dịch
 */
router.post("/cancel-transaction/:txId", async (req, res) => {
  try {
    const { txId } = req.params;
    const transaction = multiSigService.getTransaction(txId);

    if (!transaction) {
      return res.status(404).json({ error: 'Giao dịch không tìm thấy' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ error: 'Chỉ có thể hủy giao dịch chờ ký' });
    }

    const result = multiSigService.cancelTransaction(txId);

    if (!result) {
      return res.status(400).json({ error: 'Lỗi hủy giao dịch' });
    }

    const updatedTx = multiSigService.getTransaction(txId);

    res.json({
      success: true,
      message: 'Hủy giao dịch thành công',
      transaction: updatedTx
    });
  } catch (error) {
    console.error('Lỗi hủy giao dịch:', error);
    res.status(500).json({ error: error.message || 'Lỗi hủy giao dịch' });
  }
});

export default router;
