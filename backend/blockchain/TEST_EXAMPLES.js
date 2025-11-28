// Test examples for MultiSig and ZKProof features

// ============================================
// MULTI-SIG TEST EXAMPLES
// ============================================

// test/MultiSigEduChain.test.js
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultiSigEduChain", function () {
  let multiSigEduChain;
  let owner, signer1, signer2, signer3;

  beforeEach(async function () {
    [owner, signer1, signer2, signer3] = await ethers.getSigners();

    const signatories = [owner.address, signer1.address, signer2.address];
    const requiredApprovals = 2;

    const MultiSigEduChain = await ethers.getContractFactory("MultiSigEduChain");
    multiSigEduChain = await MultiSigEduChain.deploy(signatories, requiredApprovals);
    await multiSigEduChain.waitForDeployment();
  });

  describe("Signatory Management", function () {
    it("Should initialize with correct signatories", async function () {
      const signatories = await multiSigEduChain.getSignatories();
      expect(signatories.length).to.equal(3);
    });

    it("Should add new signatory", async function () {
      await multiSigEduChain.addSignatory(signer3.address);
      const signatories = await multiSigEduChain.getSignatories();
      expect(signatories.length).to.equal(4);
    });

    it("Should fail to add duplicate signatory", async function () {
      await expect(
        multiSigEduChain.addSignatory(owner.address)
      ).to.be.revertedWith("Already a signatory");
    });
  });

  describe("Record Proposal & Approval", function () {
    it("Should propose add record", async function () {
      const tx = await multiSigEduChain
        .connect(owner)
        .proposeAddRecord(
          signer3.address,
          "CNTT001",
          "Database",
          85,
          "2024_1"
        );
      
      await tx.wait();
      const approvals = await multiSigEduChain.getTransactionApprovals(0);
      expect(approvals.approvals).to.equal("1");
    });

    it("Should approve transaction", async function () {
      await multiSigEduChain
        .connect(owner)
        .proposeAddRecord(
          signer3.address,
          "CNTT001",
          "Database",
          85,
          "2024_1"
        );

      await multiSigEduChain.connect(signer1).approveTransaction(0);
      
      const approvals = await multiSigEduChain.getTransactionApprovals(0);
      expect(approvals.approvals).to.equal("2");
    });

    it("Should auto-execute after reaching required approvals", async function () {
      await multiSigEduChain
        .connect(owner)
        .proposeAddRecord(
          signer3.address,
          "CNTT001",
          "Database",
          85,
          "2024_1"
        );

      await multiSigEduChain.connect(signer1).approveTransaction(0);
      
      const recordsCount = await multiSigEduChain.recordsCount();
      expect(recordsCount).to.equal(1);
    });

    it("Should fail if non-signatory tries to propose", async function () {
      await expect(
        multiSigEduChain
          .connect(signer3)
          .proposeAddRecord(
            signer3.address,
            "CNTT001",
            "Database",
            85,
            "2024_1"
          )
      ).to.be.revertedWith("Not a signatory");
    });
  });

  describe("Certificate Proposal & Approval", function () {
    it("Should propose issue certificate", async function () {
      const tx = await multiSigEduChain
        .connect(owner)
        .proposeIssueCertificate(
          signer3.address,
          "CNTT001",
          "Bachelor's Degree in IT",
          "ipfs://QmXxxx"
        );
      
      await tx.wait();
      const approvals = await multiSigEduChain.getTransactionApprovals(0);
      expect(approvals.approvals).to.equal("1");
    });

    it("Should auto-execute certificate after approvals", async function () {
      await multiSigEduChain
        .connect(owner)
        .proposeIssueCertificate(
          signer3.address,
          "CNTT001",
          "Bachelor's Degree in IT",
          "ipfs://QmXxxx"
        );

      await multiSigEduChain.connect(signer1).approveTransaction(0);
      
      const certificatesCount = await multiSigEduChain.certificatesCount();
      expect(certificatesCount).to.equal(1);
    });
  });

  describe("Check Approvals", function () {
    it("Should check if signer approved", async function () {
      await multiSigEduChain
        .connect(owner)
        .proposeAddRecord(
          signer3.address,
          "CNTT001",
          "Database",
          85,
          "2024_1"
        );

      expect(await multiSigEduChain.hasApproved(0, owner.address)).to.be.true;
      expect(await multiSigEduChain.hasApproved(0, signer1.address)).to.be.false;
    });
  });
});

// ============================================
// ZERO-KNOWLEDGE PROOF TEST EXAMPLES
// ============================================

// test/ZKProofEduChain.test.js
describe("ZKProofEduChain", function () {
  let zkProofEduChain;
  let owner, signer1, verifier;

  beforeEach(async function () {
    [owner, signer1, verifier] = await ethers.getSigners();

    const ZKProofEduChain = await ethers.getContractFactory("ZKProofEduChain");
    zkProofEduChain = await ZKProofEduChain.deploy();
    await zkProofEduChain.waitForDeployment();

    await zkProofEduChain.addVerifier(verifier.address);
  });

  describe("Commitment Generation", function () {
    it("Should create grade commitment", async function () {
      const grade = 85;
      const salt = ethers.id("randomSalt");
      
      const commitment = await zkProofEduChain.createGradeCommitment(grade, salt);
      expect(commitment).to.not.be.empty;
    });

    it("Should create certificate commitment", async function () {
      const certHash = ethers.id("certificate_data");
      const salt = ethers.id("randomSalt");
      
      const commitment = await zkProofEduChain.createCertCommitment(certHash, salt);
      expect(commitment).to.not.be.empty;
    });

    it("Should fail for invalid grade", async function () {
      const grade = 150;
      const salt = ethers.id("randomSalt");
      
      await expect(
        zkProofEduChain.createGradeCommitment(grade, salt)
      ).to.be.revertedWith("Invalid grade");
    });
  });

  describe("Record with ZK Commitment", function () {
    it("Should add record with commitment", async function () {
      const grade = 85;
      const salt = ethers.id("randomSalt");
      const commitment = await zkProofEduChain.createGradeCommitment(grade, salt);

      const tx = await zkProofEduChain.addRecordWithZKCommitment(
        signer1.address,
        "CNTT001",
        "Database",
        85,
        "2024_1",
        commitment
      );
      
      await tx.wait();
      const recordsCount = await zkProofEduChain.recordsCount();
      expect(recordsCount).to.equal(1);
    });

    it("Should prevent reusing same commitment", async function () {
      const grade = 85;
      const salt = ethers.id("randomSalt");
      const commitment = await zkProofEduChain.createGradeCommitment(grade, salt);

      await zkProofEduChain.addRecordWithZKCommitment(
        signer1.address,
        "CNTT001",
        "Database",
        85,
        "2024_1",
        commitment
      );

      await expect(
        zkProofEduChain.addRecordWithZKCommitment(
          signer1.address,
          "CNTT002",
          "Math",
          90,
          "2024_1",
          commitment
        )
      ).to.be.revertedWith("Commitment already used");
    });
  });

  describe("ZK Proof Verification", function () {
    it("Should submit and verify grade ZK proof", async function () {
      const grade = 85;
      const salt = ethers.id("randomSalt");
      const commitment = await zkProofEduChain.createGradeCommitment(grade, salt);

      await zkProofEduChain.addRecordWithZKCommitment(
        signer1.address,
        "CNTT001",
        "Database",
        85,
        "2024_1",
        commitment
      );

      // Student submits proof
      const proof = "0xproofdata";
      await zkProofEduChain.connect(signer1).submitGradeZKProof(0, proof);

      // Verifier verifies
      await zkProofEduChain
        .connect(verifier)
        .verifyGradeZKProof(commitment, grade, salt);

      const status = await zkProofEduChain.getZKProofStatus(commitment);
      expect(status.verified).to.be.true;
    });

    it("Should fail verification with wrong grade", async function () {
      const grade = 85;
      const wrongGrade = 80;
      const salt = ethers.id("randomSalt");
      const commitment = await zkProofEduChain.createGradeCommitment(grade, salt);

      await zkProofEduChain.addRecordWithZKCommitment(
        signer1.address,
        "CNTT001",
        "Database",
        85,
        "2024_1",
        commitment
      );

      const proof = "0xproofdata";
      await zkProofEduChain.connect(signer1).submitGradeZKProof(0, proof);

      await zkProofEduChain
        .connect(verifier)
        .verifyGradeZKProof(commitment, wrongGrade, salt);

      const status = await zkProofEduChain.getZKProofStatus(commitment);
      expect(status.verified).to.be.false;
    });
  });

  describe("Certificate with ZK Commitment", function () {
    it("Should issue certificate with commitment", async function () {
      const certData = ethers.id("certificate_info");
      const salt = ethers.id("randomSalt");
      const commitment = await zkProofEduChain.createCertCommitment(certData, salt);

      const tx = await zkProofEduChain.issueCertificateWithZKCommitment(
        signer1.address,
        "CNTT001",
        "Bachelor's Degree in IT",
        "ipfs://QmXxxx",
        commitment
      );
      
      await tx.wait();
      const certificatesCount = await zkProofEduChain.certificatesCount();
      expect(certificatesCount).to.equal(1);
    });

    it("Should submit and verify certificate ZK proof", async function () {
      const certData = ethers.id("certificate_info");
      const salt = ethers.id("randomSalt");
      const commitment = await zkProofEduChain.createCertCommitment(certData, salt);

      await zkProofEduChain.issueCertificateWithZKCommitment(
        signer1.address,
        "CNTT001",
        "Bachelor's Degree in IT",
        "ipfs://QmXxxx",
        commitment
      );

      const proof = "0xcertproofdata";
      await zkProofEduChain.connect(signer1).submitCertificateZKProof(0, proof);

      const status = await zkProofEduChain.getZKProofStatus(commitment);
      expect(status.prover).to.equal(signer1.address);
    });
  });

  describe("Commitment Registry", function () {
    it("Should track all commitments", async function () {
      const grade = 85;
      const salt = ethers.id("randomSalt");
      const commitment = await zkProofEduChain.createGradeCommitment(grade, salt);

      await zkProofEduChain.addRecordWithZKCommitment(
        signer1.address,
        "CNTT001",
        "Database",
        85,
        "2024_1",
        commitment
      );

      const registry = await zkProofEduChain.getCommitmentRegistry();
      expect(registry.length).to.equal(1);
      expect(registry[0]).to.equal(commitment);
    });
  });

  describe("Verifier Management", function () {
    it("Should add verifier", async function () {
      const newVerifier = signer1.address;
      await zkProofEduChain.addVerifier(newVerifier);
      // Verification happens through access control in contract
    });

    it("Should prevent non-verifier from verifying", async function () {
      const grade = 85;
      const salt = ethers.id("randomSalt");
      const commitment = await zkProofEduChain.createGradeCommitment(grade, salt);

      await zkProofEduChain.addRecordWithZKCommitment(
        signer1.address,
        "CNTT001",
        "Database",
        85,
        "2024_1",
        commitment
      );

      await expect(
        zkProofEduChain
          .connect(signer1)
          .verifyGradeZKProof(commitment, grade, salt)
      ).to.be.revertedWith("Not authorized to verify");
    });
  });
});

// ============================================
// API INTEGRATION TEST EXAMPLES
// ============================================

// tests/api.test.js
import chai from "chai";
import chaiHttp from "chai-http";
import app from "../server.js";

const expect = chai.expect;
chai.use(chaiHttp);

describe("API Integration Tests", function () {
  let token;

  before(async function () {
    // Get auth token
    const res = await chai
      .request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@test.com",
        password: "password123",
      });
    token = res.body.token;
  });

  describe("MultiSig API", function () {
    it("POST /api/multisig/propose-record", async function () {
      const res = await chai
        .request(app)
        .post("/api/multisig/propose-record")
        .set("Authorization", `Bearer ${token}`)
        .send({
          studentWallet: "0x1234567890123456789012345678901234567890",
          studentCode: "CNTT001",
          subject: "Database",
          grade: 85,
          semester: "2024_1",
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("txHash");
    });

    it("GET /api/multisig/signatories", async function () {
      const res = await chai.request(app).get("/api/multisig/signatories");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("signatories");
      expect(res.body.signatories).to.be.an("array");
    });

    it("GET /api/multisig/stats", async function () {
      const res = await chai.request(app).get("/api/multisig/stats");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("records");
      expect(res.body).to.have.property("certificates");
    });
  });

  describe("ZKProof API", function () {
    it("POST /api/zkproof/generate-grade-commitment", async function () {
      const res = await chai
        .request(app)
        .post("/api/zkproof/generate-grade-commitment")
        .send({
          grade: 85,
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("commitment");
      expect(res.body).to.have.property("salt");
      expect(res.body.grade).to.equal(85);
    });

    it("POST /api/zkproof/add-record-with-commitment", async function () {
      // First generate commitment
      const commitRes = await chai
        .request(app)
        .post("/api/zkproof/generate-grade-commitment")
        .send({ grade: 85 });

      const { commitment } = commitRes.body;

      // Add record with commitment
      const res = await chai
        .request(app)
        .post("/api/zkproof/add-record-with-commitment")
        .set("Authorization", `Bearer ${token}`)
        .send({
          studentWallet: "0x1234567890123456789012345678901234567890",
          studentCode: "CNTT001",
          subject: "Database",
          grade: 85,
          semester: "2024_1",
          gradeCommitment: commitment,
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("txHash");
    });

    it("GET /api/zkproof/registry", async function () {
      const res = await chai.request(app).get("/api/zkproof/registry");

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property("commitments");
      expect(res.body).to.have.property("count");
    });
  });
});
