# EduChain Advanced Features: Zero Knowledge Proof & Multi-Signature

## Tổng quan

Dự án đã được nâng cấp với hai tính năng bảo mật chính:

### 1. **Zero Knowledge Proof (ZKP)**
- Cho phép sinh viên chứng minh dữ liệu (grade, certificate) mà **không tiết lộ nội dung thực tế**
- Sử dụng commitment-based ZKP thông qua hash cryptographic
- Verifier có thể xác minh claim mà không cần biết dữ liệu gốc

### 2. **Multi-Signature (MultiSig)**
- Yêu cầu nhiều chữ ký từ các signatories để thực hiện thao tác quan trọng
- Ngăn chặn một người duy nhất abuse quyền
- Flexible: configurable số signature cần thiết

---

## Smart Contracts

### 1. **MultiSigEduChain.sol**
Thêm tính năng multi-signature vào EduChain.

**Chủ yếu:**
- Signatories management
- Propose và approve transactions
- Support add record & issue certificate

**Key Functions:**
```solidity
// Propose operations
proposeAddRecord(...)      // Propose thêm record
proposeIssueCertificate(...) // Propose phát hành certificate

// Approve operations
approveTransaction(txId)    // Approve transaction
rejectTransaction(txId)     // Reject transaction

// View
getSignatories()            // Lấy danh sách signatories
getTransactionApprovals(txId) // Lấy số approval
hasApproved(txId, signer)   // Check signer đã approve hay chưa
```

### 2. **ZKProofEduChain.sol**
Thêm tính năng Zero Knowledge Proof vào EduChain.

**Chủ yếu:**
- Commitment generation
- ZK proof submission & verification
- Grade & Certificate commitments

**Key Functions:**
```solidity
// Commitment generation
createGradeCommitment(grade, salt)      // Tạo commitment cho grade
createCertCommitment(certHash, salt)    // Tạo commitment cho certificate

// Record & Certificate
addRecordWithZKCommitment(...)           // Thêm record với commitment
issueCertificateWithZKCommitment(...)    // Phát hành certificate với commitment

// ZK Proof
submitGradeZKProof(recordId, proof)      // Submit proof cho grade
verifyGradeZKProof(commitment, grade, salt) // Verify proof

// View
getZKProofStatus(commitment)             // Lấy status ZK proof
getRecordCommitment(recordId)            // Lấy commitment của record
```

### 3. **EduChainAdvanced.sol** (Recommended)
**Kết hợp cả MultiSig + ZKProof trong một contract.**

Cho phép:
- Propose add record/certificate với ZK commitments
- Multi-sig approval trước khi execute
- ZK proof verification sau khi execute

---

## Deployment

### A. Deploy MultiSig Contract
```bash
cd backend/blockchain
npx hardhat run scripts/deploy_multisig.js --network sepolia
```

Contract sẽ tự động cập nhật `.env` với address.

### B. Deploy ZKProof Contract
```bash
npx hardhat run scripts/deploy_zk.js --network sepolia
```

### C. Deploy Advanced Contract (Recommended)
```bash
npx hardhat run scripts/deploy_advanced.js --network sepolia
```

Cấu hình signatories và required approvals trong file `deploy_advanced.js`:
```javascript
const signatories = [owner.address, signer1.address, signer2.address];
const requiredApprovals = 2; // Cần 2/3 signatures
```

---

## Backend Integration

### Services

#### 1. **MultiSigService** (`backend/src/lib/multisig.js`)
```javascript
import MultiSigService from "./lib/multisig.js";

const service = new MultiSigService();

// Propose operations
await service.proposeAddRecord(wallet, code, subject, grade, semester);
await service.proposeIssueCertificate(wallet, code, certType, metadata);

// Approve operations
await service.approveTransaction(txId);
await service.rejectTransaction(txId);

// View
const approvals = await service.getTransactionApprovals(txId);
const signatories = await service.getSignatories();
```

#### 2. **ZKProofService** (`backend/src/lib/zkproof.js`)
```javascript
import ZKProofService from "./lib/zkproof.js";

const service = new ZKProofService();

// Generate commitments
const gradeCommit = service.generateGradeCommitment(85);
// Returns: { commitment, salt, grade }

// Add with commitment
await service.addRecordWithZKCommitment(
  wallet, code, subject, grade, semester, commitment
);

// Submit & verify proof
await service.submitGradeZKProof(recordId, proof);
await service.verifyGradeZKProof(commitment, claimedGrade, salt);

// View
const status = await service.getZKProofStatus(commitment);
const registry = await service.getCommitmentRegistry();
```

---

## API Routes

### MultiSig Routes (`/api/multisig`)

#### Propose Operations
```http
POST /api/multisig/propose-record
Content-Type: application/json

{
  "studentWallet": "0x...",
  "studentCode": "CNTT001",
  "subject": "Database",
  "grade": 85,
  "semester": "2024_1"
}

POST /api/multisig/propose-certificate
Content-Type: application/json

{
  "studentWallet": "0x...",
  "studentCode": "CNTT001",
  "certType": "Bachelor's Degree in IT",
  "metadata": "ipfs://Qm..."
}
```

#### Approve/Reject Operations
```http
POST /api/multisig/approve/:txId
POST /api/multisig/reject/:txId
```

#### Get Status
```http
GET /api/multisig/approvals/:txId
GET /api/multisig/check-approval/:txId/:signer
GET /api/multisig/signatories
GET /api/multisig/stats
```

### ZKProof Routes (`/api/zkproof`)

#### Generate Commitments (Client-side)
```http
POST /api/zkproof/generate-grade-commitment
Content-Type: application/json

{
  "grade": 85
}
Response: { commitment, salt, grade }

POST /api/zkproof/generate-cert-commitment
Content-Type: application/json

{
  "certData": { "type": "...", "date": "..." }
}
Response: { commitment, salt, certHash }
```

#### Add/Issue with Commitment
```http
POST /api/zkproof/add-record-with-commitment
Content-Type: application/json

{
  "studentWallet": "0x...",
  "studentCode": "CNTT001",
  "subject": "Database",
  "grade": 85,
  "semester": "2024_1",
  "gradeCommitment": "0x..."
}

POST /api/zkproof/issue-certificate-with-commitment
Content-Type: application/json

{
  "studentWallet": "0x...",
  "studentCode": "CNTT001",
  "certType": "Bachelor's Degree",
  "metadata": "ipfs://Qm...",
  "certCommitment": "0x..."
}
```

#### Submit & Verify Proofs
```http
POST /api/zkproof/submit-grade-proof
Content-Type: application/json

{
  "recordId": 0,
  "proof": "0x..." // Encoded proof
}

POST /api/zkproof/verify-grade-proof
Content-Type: application/json

{
  "commitment": "0x...",
  "claimedGrade": 85,
  "salt": "0x..."
}
```

#### Get Status
```http
GET /api/zkproof/status/:commitment
GET /api/zkproof/record-commitment/:recordId
GET /api/zkproof/certificate-commitment/:certId
GET /api/zkproof/registry
```

---

## Workflow Example

### Multi-Signature Workflow
```
1. Admin A proposes add record
   → Creates transaction with ID
   
2. Admin B approves transaction
   
3. Admin C approves transaction (required 3/3 or 2/3?)
   → Transaction auto-executes after reaching required approvals
   
4. Record added to blockchain
```

### Zero Knowledge Proof Workflow
```
1. Administrator adds record with commitment
   → Grade: 85, Salt: random
   → Commitment: hash(85, salt) = 0x123abc...
   → Commitment stored on-chain, grade NOT stored
   
2. Student wants to prove grade = 85
   → Submits ZK proof (encoded)
   
3. Verifier challenges student
   → "If you have grade 85, prove it with salt"
   
4. Student reveals: grade=85, salt=random
   → Verifier recomputes: hash(85, salt)
   → Match commitment? → Verified ✓
   
5. Grade still never stored on-chain!
```

### Combined Workflow (Recommended)
```
1. Admin A proposes add record WITH commitment
   → Transaction created
   
2. Admin B & C approve transaction
   → Record added with gradeCommitment but not grade value
   
3. Student submits ZK proof
   
4. Verifier confirms proof against on-chain commitment
   → Grade verified without storing grade
```

---

## Security Features

### MultiSig Benefits
✅ Prevents single point of failure  
✅ Requires consensus for critical operations  
✅ Configurable approval threshold  
✅ Audit trail (who approved what, when)  

### ZKProof Benefits
✅ Privacy-preserving verification  
✅ Grade/Certificate never stored on-chain  
✅ Selective disclosure - student chooses what to prove  
✅ Cryptographically secure - unforgeable proofs  

---

## Environment Variables

```env
# RPC & Keys
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0x...

# Contract Addresses (auto-filled after deployment)
EDUCHAIN_CONTRACT=0x...
MULTISIG_EDUCHAIN_CONTRACT=0x...
ZK_EDUCHAIN_CONTRACT=0x...
EDUCHAIN_ADVANCED_CONTRACT=0x...
```

---

## Testing & Verification

### Test MultiSig
```bash
# Test with Hardhat
npx hardhat test test/MultiSigEduChain.test.js

# Test with API
curl -X POST http://localhost:5000/api/multisig/propose-record \
  -H "Content-Type: application/json" \
  -d '{...}' \
  -H "Authorization: Bearer TOKEN"
```

### Test ZKProof
```bash
# Generate commitment
curl -X POST http://localhost:5000/api/zkproof/generate-grade-commitment \
  -H "Content-Type: application/json" \
  -d '{"grade": 85}'

# Verify proof
curl -X POST http://localhost:5000/api/zkproof/verify-grade-proof \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Production Considerations

### For Production Use:
1. **Real ZKP Libraries**: Integrate circom + snarkjs for authentic ZK proofs
2. **Verifier Smart Contract**: Deploy Solidity verifier for on-chain proof verification
3. **Gas Optimization**: Reduce storage with zkProofs - only store commitments
4. **Multi-Chain Support**: Deploy on multiple networks (mainnet, testnet)
5. **Audit**: Get contracts audited by security firm
6. **Rate Limiting**: Implement on API routes
7. **Monitoring**: Set up alerts for suspicious transaction patterns

---

## Resources

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ZK Proofs Primer](https://blog.ethereum.org/2016/12/05/zksnarks-in-a-nutshell/)
- [Multi-Sig Patterns](https://ethereum.org/en/developers/docs/accounts-and-addresses/#multisig)

