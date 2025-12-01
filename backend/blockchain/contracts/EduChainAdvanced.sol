// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EduChainAdvanced is ERC721, Ownable {
    // ====== STRUCTS ======
    struct Record {
        address studentWallet;
        string studentCode;
        string subject;
        uint8 grade;
        string semester;
        uint256 createdAt;
        bytes32 gradeCommitment;
        bool zkVerified;
    }

    struct Certificate {
        address studentWallet;
        string studentCode;
        string certType;
        string metadata;
        uint256 issuedAt;
        bytes32 certCommitment;
        bool zkVerified;
    }

    struct MultiSigTransaction {
        uint256 txId;
        string txType;
        address proposer;
        bytes data;
        uint256 approvalsCount;
        bool executed;
        uint256 createdAt;
        mapping(address => bool) approvals;
    }

    struct ZKProof {
        bytes32 commitment;
        bytes proof;
        address prover;
        bool verified;
        uint256 createdAt;
    }

    // ====== STORAGE ======
    Record[] public records;
    Certificate[] public certificates;
    
    address[] public signatories;
    mapping(address => bool) public isSignatory;
    uint256 public requiredApprovals;
    
    MultiSigTransaction[] public multiSigTransactions;
    mapping(uint256 => MultiSigTransaction) public transactions;
    
    mapping(bytes32 => ZKProof) public zkProofs;
    mapping(address => bool) public verifiers;
    bytes32[] public commitmentRegistry;
    mapping(bytes32 => bool) public commitmentExists;

    // ====== EVENTS ======
    event RecordAdded(
        uint256 indexed id,
        address indexed studentWallet,
        string studentCode,
        string subject,
        uint8 grade,
        string semester,
        bytes32 gradeCommitment
    );

    event CertificateIssued(
        uint256 indexed id,
        address indexed studentWallet,
        string studentCode,
        string certType,
        string metadata,
        bytes32 certCommitment
    );

    event MultiSigTransactionCreated(
        uint256 indexed txId,
        address indexed proposer,
        string txType
    );

    event TransactionApproved(uint256 indexed txId, address indexed approver);
    event TransactionExecuted(uint256 indexed txId, string txType);
    event TransactionRejected(uint256 indexed txId);

    event ZKProofVerified(
        bytes32 indexed commitment,
        address indexed verifier,
        bool isValid
    );

    event SignatoryAdded(address indexed signer);
    event SignatoryRemoved(address indexed signer);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    // ====== MODIFIERS ======
    modifier onlySignatory() {
        require(isSignatory[msg.sender], "Not a signatory");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId < multiSigTransactions.length, "Transaction does not exist");
        _;
    }

    // ====== CONSTRUCTOR ======
    constructor(address[] memory _signatories, uint256 _requiredApprovals)
        ERC721("EduChain Advanced", "EDUCERTA")
        Ownable(msg.sender)
    {
        require(_signatories.length > 0, "Need at least one signatory");
        require(
            _requiredApprovals > 0 && _requiredApprovals <= _signatories.length,
            "Invalid required approvals"
        );

        for (uint256 i = 0; i < _signatories.length; i++) {
            require(_signatories[i] != address(0), "Invalid signatory");
            require(!isSignatory[_signatories[i]], "Duplicate signatory");
            signatories.push(_signatories[i]);
            isSignatory[_signatories[i]] = true;
        }

        requiredApprovals = _requiredApprovals;
    }

    // ====== MULTI-SIG MANAGEMENT ======
    function addSignatory(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid address");
        require(!isSignatory[_signer], "Already a signatory");
        signatories.push(_signer);
        isSignatory[_signer] = true;
        emit SignatoryAdded(_signer);
    }

    function removeSignatory(address _signer) external onlyOwner {
        require(isSignatory[_signer], "Not a signatory");
        require(signatories.length > requiredApprovals, "Cannot remove");
        
        isSignatory[_signer] = false;
        for (uint256 i = 0; i < signatories.length; i++) {
            if (signatories[i] == _signer) {
                signatories[i] = signatories[signatories.length - 1];
                signatories.pop();
                break;
            }
        }
        emit SignatoryRemoved(_signer);
    }

    function setRequiredApprovals(uint256 _required) external onlyOwner {
        require(
            _required > 0 && _required <= signatories.length,
            "Invalid required approvals"
        );
        requiredApprovals = _required;
    }

    // ====== ZERO-KNOWLEDGE PROOF MANAGEMENT ======
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    function removeVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    function createGradeCommitment(uint8 grade, bytes32 salt)
        external
        pure
        returns (bytes32)
    {
        require(grade <= 100, "Invalid grade");
        return keccak256(abi.encode(grade, salt));
    }

    function createCertCommitment(bytes32 certHash, bytes32 salt)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(certHash, salt));
    }

    // ====== MULTI-SIG + ZK FUNCTIONS ======

    function proposeAddRecordWithZK(
        address studentWallet,
        string memory studentCode,
        string memory subject,
        uint8 grade,
        string memory semester,
        bytes32 gradeCommitment
    ) external onlySignatory returns (uint256) {
        require(grade <= 100, "grade must be <= 100");
        require(gradeCommitment != bytes32(0), "Invalid commitment");
        require(!commitmentExists[gradeCommitment], "Commitment already used");
        
        bytes memory data = abi.encode(
            studentWallet,
            studentCode,
            subject,
            grade,
            semester,
            gradeCommitment
        );

        return _createMultiSigTransaction("addRecordZK", data);
    }

    function proposeIssueCertificateWithZK(
        address studentWallet,
        string memory studentCode,
        string memory certType,
        string memory metadata,
        bytes32 certCommitment
    ) external onlySignatory returns (uint256) {
        require(studentWallet != address(0), "invalid wallet");
        require(certCommitment != bytes32(0), "Invalid commitment");
        require(!commitmentExists[certCommitment], "Commitment already used");
        
        bytes memory data = abi.encode(
            studentWallet,
            studentCode,
            certType,
            metadata,
            certCommitment
        );

        return _createMultiSigTransaction("issueCertificateZK", data);
    }

    function _createMultiSigTransaction(string memory txType, bytes memory data)
        internal
        returns (uint256)
    {
        uint256 txId = multiSigTransactions.length;
        
        MultiSigTransaction storage newTx = transactions[txId];
        newTx.txId = txId;
        newTx.txType = txType;
        newTx.proposer = msg.sender;
        newTx.data = data;
        newTx.approvalsCount = 1;
        newTx.executed = false;
        newTx.createdAt = block.timestamp;
        newTx.approvals[msg.sender] = true;

        multiSigTransactions.push(newTx);
        
        emit MultiSigTransactionCreated(txId, msg.sender, txType);
        return txId;
    }

    function approveTransaction(uint256 txId) external onlySignatory txExists(txId) {
        MultiSigTransaction storage tx = transactions[txId];
        
        require(!tx.executed, "Transaction already executed");
        require(!tx.approvals[msg.sender], "Already approved");

        tx.approvals[msg.sender] = true;
        tx.approvalsCount++;

        emit TransactionApproved(txId, msg.sender);

        if (tx.approvalsCount >= requiredApprovals) {
            _executeTransaction(txId);
        }
    }

    function _executeTransaction(uint256 txId) internal {
        MultiSigTransaction storage tx = transactions[txId];
        require(!tx.executed, "Transaction already executed");

        tx.executed = true;

        if (keccak256(abi.encodePacked(tx.txType)) == keccak256(abi.encodePacked("addRecordZK"))) {
            (
                address studentWallet,
                string memory studentCode,
                string memory subject,
                uint8 grade,
                string memory semester,
                bytes32 gradeCommitment
            ) = abi.decode(tx.data, (address, string, string, uint8, string, bytes32));

            records.push(
                Record({
                    studentWallet: studentWallet,
                    studentCode: studentCode,
                    subject: subject,
                    grade: grade,
                    semester: semester,
                    createdAt: block.timestamp,
                    gradeCommitment: gradeCommitment,
                    zkVerified: false
                })
            );

            uint256 id = records.length - 1;
            commitmentRegistry.push(gradeCommitment);
            commitmentExists[gradeCommitment] = true;

            emit RecordAdded(
                id,
                studentWallet,
                studentCode,
                subject,
                grade,
                semester,
                gradeCommitment
            );
        } else if (
            keccak256(abi.encodePacked(tx.txType)) == keccak256(abi.encodePacked("issueCertificateZK"))
        ) {
            (
                address studentWallet,
                string memory studentCode,
                string memory certType,
                string memory metadata,
                bytes32 certCommitment
            ) = abi.decode(tx.data, (address, string, string, string, bytes32));

            uint256 tokenId = certificates.length;
            _safeMint(studentWallet, tokenId);

            certificates.push(
                Certificate({
                    studentWallet: studentWallet,
                    studentCode: studentCode,
                    certType: certType,
                    metadata: metadata,
                    issuedAt: block.timestamp,
                    certCommitment: certCommitment,
                    zkVerified: false
                })
            );

            commitmentRegistry.push(certCommitment);
            commitmentExists[certCommitment] = true;

            emit CertificateIssued(
                tokenId,
                studentWallet,
                studentCode,
                certType,
                metadata,
                certCommitment
            );
        }

        emit TransactionExecuted(txId, tx.txType);
    }

    function rejectTransaction(uint256 txId) external onlyOwner txExists(txId) {
        MultiSigTransaction storage tx = transactions[txId];
        require(!tx.executed, "Cannot reject executed transaction");
        
        tx.executed = true;
        emit TransactionRejected(txId);
    }

    // ====== ZK PROOF VERIFICATION ======

    function submitGradeZKProof(
        uint256 recordId,
        bytes memory proof
    ) external returns (bytes32) {
        require(recordId < records.length, "Invalid record");
        Record memory record = records[recordId];
        require(record.studentWallet == msg.sender, "Not record owner");

        bytes32 commitment = record.gradeCommitment;
        
        zkProofs[commitment] = ZKProof({
            commitment: commitment,
            proof: proof,
            prover: msg.sender,
            verified: false,
            createdAt: block.timestamp
        });

        return commitment;
    }

    function verifyGradeZKProof(
        bytes32 commitment,
        uint8 claimedGrade,
        bytes32 salt
    ) external onlyVerifier {
        require(commitmentExists[commitment], "Commitment not found");
        require(zkProofs[commitment].proof.length > 0, "No proof submitted");

        bytes32 recomputedCommitment = keccak256(abi.encode(claimedGrade, salt));
        bool isValid = (recomputedCommitment == commitment);

        zkProofs[commitment].verified = isValid;

        // Update record's zkVerified status
        for (uint256 i = 0; i < records.length; i++) {
            if (records[i].gradeCommitment == commitment) {
                records[i].zkVerified = isValid;
                break;
            }
        }
        
        emit ZKProofVerified(commitment, msg.sender, isValid);
    }

    // ====== VIEW FUNCTIONS ======
    function getSignatories() external view returns (address[] memory) {
        return signatories;
    }

    function getTransactionApprovals(uint256 txId)
        external
        view
        txExists(txId)
        returns (uint256)
    {
        return transactions[txId].approvalsCount;
    }

    function hasApproved(uint256 txId, address signer)
        external
        view
        txExists(txId)
        returns (bool)
    {
        return transactions[txId].approvals[signer];
    }

    function recordsCount() external view returns (uint256) {
        return records.length;
    }

    function certificatesCount() external view returns (uint256) {
        return certificates.length;
    }

    function getCertificate(uint256 tokenId)
        external
        view
        returns (Certificate memory)
    {
        require(tokenId < certificates.length, "invalid tokenId");
        return certificates[tokenId];
    }

    function getRecord(uint256 recordId)
        external
        view
        returns (Record memory)
    {
        require(recordId < records.length, "invalid recordId");
        return records[recordId];
    }

    function getCommitmentRegistry() external view returns (bytes32[] memory) {
        return commitmentRegistry;
    }

    function getZKProofStatus(bytes32 commitment)
        external
        view
        returns (
            bool exists,
            bool verified,
            address prover,
            uint256 createdAt
        )
    {
        ZKProof memory zkProof = zkProofs[commitment];
        exists = zkProof.commitment != bytes32(0);
        verified = zkProof.verified;
        prover = zkProof.prover;
        createdAt = zkProof.createdAt;
    }
}
