// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ZKProofEduChain is ERC721, Ownable {
    // ====== STRUCTS ======
    struct Record {
        address studentWallet;
        string studentCode;
        string subject;
        uint8 grade;
        string semester;
        uint256 createdAt;
        bytes32 gradeCommitment; // Commitment để ZKP
    }

    struct Certificate {
        address studentWallet;
        string studentCode;
        string certType;
        string metadata;
        uint256 issuedAt;
        bytes32 certCommitment; // Commitment để ZKP
    }

    struct ZKProof {
        bytes32 commitment;
        bytes proof; // Encoded ZK proof
        address prover;
        bool verified;
        uint256 createdAt;
    }

    struct GradeVerification {
        bytes32 gradeHash; // hash(grade + salt)
        bytes proof;
        bool verified;
        uint256 verifiedAt;
    }

    // ====== STORAGE ======
    Record[] public records;
    Certificate[] public certificates;
    
    mapping(bytes32 => ZKProof) public zkProofs;
    mapping(uint256 => GradeVerification) public gradeVerifications; // recordId => verification
    mapping(address => bool) public verifiers; // Authorized verifiers

    bytes32[] public commitmentRegistry; // Tất cả commitments được đăng ký
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

    event ZKProofSubmitted(
        bytes32 indexed commitment,
        address indexed prover
    );

    event ZKProofVerified(
        bytes32 indexed commitment,
        address indexed verifier,
        bool isValid
    );

    event GradeVerificationSubmitted(
        uint256 indexed recordId,
        address indexed student
    );

    event GradeVerified(
        uint256 indexed recordId,
        bool isValid
    );

    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    // ====== MODIFIERS ======
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Not authorized to verify");
        _;
    }

    // ====== CONSTRUCTOR ======
    constructor() ERC721("EduChain ZKP Certificate", "EDUCERTZK") Ownable(msg.sender) {}

    // ====== VERIFIER MANAGEMENT ======
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }

    function removeVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }

    // ====== ZERO-KNOWLEDGE PROOF FUNCTIONS ======

    /// @notice Tạo commitment cho grade bằng hash
    /// @param grade Điểm số
    /// @param salt Random value để tăng bảo mật
    /// @return commitment Commitment hash
    function createGradeCommitment(uint8 grade, bytes32 salt)
        external
        pure
        returns (bytes32)
    {
        require(grade <= 100, "Invalid grade");
        return keccak256(abi.encode(grade, salt));
    }

    /// @notice Tạo commitment cho certificate
    /// @param certHash Hash của certificate data
    /// @param salt Random value
    /// @return commitment Commitment hash
    function createCertCommitment(bytes32 certHash, bytes32 salt)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(certHash, salt));
    }

    /// @notice Thêm record với ZK commitment
    function addRecordWithZKCommitment(
        address studentWallet,
        string memory studentCode,
        string memory subject,
        uint8 grade,
        string memory semester,
        bytes32 gradeCommitment
    ) external onlyOwner returns (uint256) {
        require(grade <= 100, "grade must be <= 100");
        require(gradeCommitment != bytes32(0), "Invalid commitment");
        require(!commitmentExists[gradeCommitment], "Commitment already used");

        records.push(
            Record({
                studentWallet: studentWallet,
                studentCode: studentCode,
                subject: subject,
                grade: grade,
                semester: semester,
                createdAt: block.timestamp,
                gradeCommitment: gradeCommitment
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
        return id;
    }

    /// @notice Phát hành certificate với ZK commitment
    function issueCertificateWithZKCommitment(
        address studentWallet,
        string memory studentCode,
        string memory certType,
        string memory metadata,
        bytes32 certCommitment
    ) external onlyOwner returns (uint256 tokenId) {
        require(studentWallet != address(0), "invalid wallet");
        require(certCommitment != bytes32(0), "Invalid commitment");
        require(!commitmentExists[certCommitment], "Commitment already used");

        tokenId = certificates.length;
        _safeMint(studentWallet, tokenId);

        certificates.push(
            Certificate({
                studentWallet: studentWallet,
                studentCode: studentCode,
                certType: certType,
                metadata: metadata,
                issuedAt: block.timestamp,
                certCommitment: certCommitment
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

    // ====== ZERO-KNOWLEDGE PROOF VERIFICATION ======

    /// @notice Sinh viên gửi ZKP để chứng minh grade mà không public
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

        emit ZKProofSubmitted(commitment, msg.sender);
        return commitment;
    }

    /// @notice Verifier xác minh ZKP
    /// Trong production, sử dụng thư viện như circom/snarkjs
    function verifyGradeZKProof(
        bytes32 commitment,
        uint8 claimedGrade,
        bytes32 salt
    ) external onlyVerifier {
        require(commitmentExists[commitment], "Commitment not found");
        require(zkProofs[commitment].proof.length > 0, "No proof submitted");

        // Tạo lại commitment từ claimed grade và salt
        bytes32 recomputedCommitment = keccak256(abi.encode(claimedGrade, salt));

        // Verify: commitment có khớp không
        bool isValid = (recomputedCommitment == commitment);

        zkProofs[commitment].verified = isValid;
        
        emit ZKProofVerified(commitment, msg.sender, isValid);
    }

    /// @notice Sinh viên gửi proof cho certificate mà không tiết lộ nội dung
    function submitCertificateZKProof(
        uint256 certId,
        bytes memory proof
    ) external returns (bytes32) {
        require(certId < certificates.length, "Invalid certificate");
        Certificate memory cert = certificates[certId];
        require(cert.studentWallet == msg.sender, "Not cert owner");

        bytes32 commitment = cert.certCommitment;
        
        zkProofs[commitment] = ZKProof({
            commitment: commitment,
            proof: proof,
            prover: msg.sender,
            verified: false,
            createdAt: block.timestamp
        });

        emit ZKProofSubmitted(commitment, msg.sender);
        return commitment;
    }

    /// @notice Submit verification cho grade
    function submitGradeVerification(
        uint256 recordId,
        bytes32 gradeHash,
        bytes memory proof
    ) external {
        require(recordId < records.length, "Invalid record");
        Record memory record = records[recordId];
        require(record.studentWallet == msg.sender, "Not record owner");

        gradeVerifications[recordId] = GradeVerification({
            gradeHash: gradeHash,
            proof: proof,
            verified: false,
            verifiedAt: 0
        });

        emit GradeVerificationSubmitted(recordId, msg.sender);
    }

    /// @notice Verifier xác minh grade verification
    function verifyGradeVerification(
        uint256 recordId,
        uint8 actualGrade,
        bytes32 salt
    ) external onlyVerifier {
        require(recordId < records.length, "Invalid record");
        require(gradeVerifications[recordId].proof.length > 0, "No verification submitted");

        bytes32 recomputedHash = keccak256(abi.encodePacked(actualGrade, salt));
        bool isValid = (recomputedHash == gradeVerifications[recordId].gradeHash);

        gradeVerifications[recordId].verified = isValid;
        if (isValid) {
            gradeVerifications[recordId].verifiedAt = block.timestamp;
        }

        emit GradeVerified(recordId, isValid);
    }

    // ====== VIEW FUNCTIONS ======
    function getRecordCommitment(uint256 recordId)
        external
        view
        returns (bytes32)
    {
        require(recordId < records.length, "Invalid record");
        return records[recordId].gradeCommitment;
    }

    function getCertificateCommitment(uint256 certId)
        external
        view
        returns (bytes32)
    {
        require(certId < certificates.length, "Invalid certificate");
        return certificates[certId].certCommitment;
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

    function getGradeVerificationStatus(uint256 recordId)
        external
        view
        returns (
            bool verified,
            uint256 verifiedAt
        )
    {
        require(recordId < records.length, "Invalid record");
        return (
            gradeVerifications[recordId].verified,
            gradeVerifications[recordId].verifiedAt
        );
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

    function getCommitmentRegistry() external view returns (bytes32[] memory) {
        return commitmentRegistry;
    }
}
