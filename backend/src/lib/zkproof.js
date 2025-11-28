import { ethers } from "ethers";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ZK_CONTRACT_ADDRESS = process.env.ZK_EDUCHAIN_CONTRACT;
const ZK_ABI = require("../educhain-zk.abi.json");

class ZKProofService {
  constructor() {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    this.contract = new ethers.Contract(
      ZK_CONTRACT_ADDRESS,
      ZK_ABI,
      wallet
    );
    this.provider = provider;
    this.wallet = wallet;
  }

  /**
   * Tạo commitment cho grade mà không public grade
   * @param grade - Điểm số (0-100)
   * @returns {Object} - { commitment, salt }
   */
  generateGradeCommitment(grade) {
    if (grade < 0 || grade > 100) {
      throw new Error("Grade must be between 0 and 100");
    }

    // Tạo random salt
    const salt = ethers.id(crypto.randomBytes(32).toString("hex"));
    
    // Tạo commitment: hash(grade + salt)
    const commitment = ethers.solidityPacked(
      ["uint8", "bytes32"],
      [grade, salt]
    );

    return {
      commitment: ethers.keccak256(commitment),
      salt: salt,
      grade: grade,
    };
  }

  /**
   * Tạo commitment cho certificate
   */
  generateCertCommitment(certData) {
    const salt = ethers.id(crypto.randomBytes(32).toString("hex"));
    const certHash = ethers.id(JSON.stringify(certData));
    
    const commitment = ethers.solidityPacked(
      ["bytes32", "bytes32"],
      [certHash, salt]
    );

    return {
      commitment: ethers.keccak256(commitment),
      salt: salt,
      certHash: certHash,
    };
  }

  /**
   * Thêm record với ZK commitment (chỉ owner)
   */
  async addRecordWithZKCommitment(
    studentWallet,
    studentCode,
    subject,
    grade,
    semester,
    gradeCommitment
  ) {
    try {
      const tx = await this.contract.addRecordWithZKCommitment(
        studentWallet,
        studentCode,
        subject,
        grade,
        semester,
        gradeCommitment
      );
      const receipt = await tx.wait();
      console.log("✅ Record with ZK commitment added:", receipt.hash);
      return {
        txHash: receipt.hash,
        recordId: receipt.logs[0]?.index,
        success: true,
      };
    } catch (error) {
      console.error("❌ Error adding record with ZK:", error.message);
      throw error;
    }
  }

  /**
   * Phát hành certificate với ZK commitment (chỉ owner)
   */
  async issueCertificateWithZKCommitment(
    studentWallet,
    studentCode,
    certType,
    metadata,
    certCommitment
  ) {
    try {
      const tx = await this.contract.issueCertificateWithZKCommitment(
        studentWallet,
        studentCode,
        certType,
        metadata,
        certCommitment
      );
      const receipt = await tx.wait();
      console.log("✅ Certificate with ZK commitment issued:", receipt.hash);
      return {
        txHash: receipt.hash,
        success: true,
      };
    } catch (error) {
      console.error("❌ Error issuing certificate with ZK:", error.message);
      throw error;
    }
  }

  /**
   * Sinh viên submit ZK proof cho grade
   */
  async submitGradeZKProof(recordId, proof) {
    try {
      const tx = await this.contract.submitGradeZKProof(recordId, proof);
      const receipt = await tx.wait();
      console.log("✅ Grade ZK proof submitted:", receipt.hash);
      return {
        txHash: receipt.hash,
        success: true,
      };
    } catch (error) {
      console.error("❌ Error submitting grade ZK proof:", error.message);
      throw error;
    }
  }

  /**
   * Verifier xác minh ZK proof cho grade
   * Sinh viên claim grade và salt, verifier check nếu commitment match
   */
  async verifyGradeZKProof(commitment, claimedGrade, salt) {
    try {
      const tx = await this.contract.verifyGradeZKProof(
        commitment,
        claimedGrade,
        salt
      );
      const receipt = await tx.wait();
      console.log("✅ Grade ZK proof verified:", receipt.hash);
      return {
        txHash: receipt.hash,
        success: true,
      };
    } catch (error) {
      console.error("❌ Error verifying grade ZK proof:", error.message);
      throw error;
    }
  }

  /**
   * Sinh viên submit ZK proof cho certificate
   */
  async submitCertificateZKProof(certId, proof) {
    try {
      const tx = await this.contract.submitCertificateZKProof(certId, proof);
      const receipt = await tx.wait();
      console.log("✅ Certificate ZK proof submitted:", receipt.hash);
      return {
        txHash: receipt.hash,
        success: true,
      };
    } catch (error) {
      console.error("❌ Error submitting certificate ZK proof:", error.message);
      throw error;
    }
  }

  /**
   * Add verifier (chỉ owner)
   */
  async addVerifier(verifierAddress) {
    try {
      const tx = await this.contract.addVerifier(verifierAddress);
      const receipt = await tx.wait();
      console.log("✅ Verifier added:", receipt.hash);
      return {
        txHash: receipt.hash,
        success: true,
      };
    } catch (error) {
      console.error("❌ Error adding verifier:", error.message);
      throw error;
    }
  }

  /**
   * Lấy ZK proof status
   */
  async getZKProofStatus(commitment) {
    try {
      const status = await this.contract.getZKProofStatus(commitment);
      return {
        exists: status.exists,
        verified: status.verified,
        prover: status.prover,
        createdAt: status.createdAt.toString(),
      };
    } catch (error) {
      console.error("❌ Error getting ZK proof status:", error.message);
      throw error;
    }
  }

  /**
   * Lấy record commitment
   */
  async getRecordCommitment(recordId) {
    try {
      const commitment = await this.contract.getRecordCommitment(recordId);
      return commitment;
    } catch (error) {
      console.error("❌ Error getting record commitment:", error.message);
      throw error;
    }
  }

  /**
   * Lấy certificate commitment
   */
  async getCertificateCommitment(certId) {
    try {
      const commitment = await this.contract.getCertificateCommitment(certId);
      return commitment;
    } catch (error) {
      console.error("❌ Error getting certificate commitment:", error.message);
      throw error;
    }
  }

  /**
   * Lấy commitment registry (tất cả commitments)
   */
  async getCommitmentRegistry() {
    try {
      const registry = await this.contract.getCommitmentRegistry();
      return registry;
    } catch (error) {
      console.error("❌ Error getting commitment registry:", error.message);
      throw error;
    }
  }
}

export default ZKProofService;
