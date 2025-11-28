// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiSigEduChain is ERC721, Ownable {
    // ====== STRUCTS ======
    struct Record {
        address studentWallet;
        string studentCode;
        string subject;
        uint8 grade;
        string semester;
        uint256 createdAt;
    }

    struct Certificate {
        address studentWallet;
        string studentCode;
        string certType;
        string metadata;
        uint256 issuedAt;
    }

    struct MultiSigTransaction {
        uint256 txId;
        string txType; // "addRecord" hoặc "issueCertificate"
        address proposer;
        bytes data; // abi-encoded data
        uint256 approvalsCount;
        bool executed;
        uint256 createdAt;
        mapping(address => bool) approvals;
    }

    // ====== STORAGE ======
    Record[] public records;
    Certificate[] public certificates;
    
    address[] public signatories;
    mapping(address => bool) public isSignatory;
    uint256 public requiredApprovals;
    
    MultiSigTransaction[] public multiSigTransactions;
    mapping(uint256 => MultiSigTransaction) public transactions;

    // ====== EVENTS ======
    event RecordAdded(
        uint256 indexed id,
        address indexed studentWallet,
        string studentCode,
        string subject,
        uint8 grade,
        string semester
    );

    event CertificateIssued(
        uint256 indexed id,
        address indexed studentWallet,
        string studentCode,
        string certType,
        string metadata
    );

    event MultiSigTransactionCreated(
        uint256 indexed txId,
        address indexed proposer,
        string txType
    );

    event TransactionApproved(
        uint256 indexed txId,
        address indexed approver
    );

    event TransactionExecuted(
        uint256 indexed txId,
        string txType
    );

    event TransactionRejected(
        uint256 indexed txId
    );

    event SignatoryAdded(address indexed signer);
    event SignatoryRemoved(address indexed signer);
    event RequiredApprovalsChanged(uint256 newRequired);

    // ====== MODIFIERS ======
    modifier onlySignatory() {
        require(isSignatory[msg.sender], "Not a signatory");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId < multiSigTransactions.length, "Transaction does not exist");
        _;
    }

    // ====== CONSTRUCTOR ======
    constructor(address[] memory _signatories, uint256 _requiredApprovals)
        ERC721("EduChain Certificate", "EDUCERT")
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

    // ====== SIGNATORY MANAGEMENT ======
    function addSignatory(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid address");
        require(!isSignatory[_signer], "Already a signatory");
        signatories.push(_signer);
        isSignatory[_signer] = true;
        emit SignatoryAdded(_signer);
    }

    function removeSignatory(address _signer) external onlyOwner {
        require(isSignatory[_signer], "Not a signatory");
        require(signatories.length > requiredApprovals, "Cannot remove, would break consensus");
        
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
        emit RequiredApprovalsChanged(_required);
    }

    // ====== MULTI-SIG TRANSACTION MANAGEMENT ======
    
    function proposeAddRecord(
        address studentWallet,
        string memory studentCode,
        string memory subject,
        uint8 grade,
        string memory semester
    ) external onlySignatory returns (uint256) {
        require(grade <= 100, "grade must be <= 100");
        
        bytes memory data = abi.encode(
            studentWallet,
            studentCode,
            subject,
            grade,
            semester
        );

        return _createMultiSigTransaction("addRecord", data);
    }

    function proposeIssueCertificate(
        address studentWallet,
        string memory studentCode,
        string memory certType,
        string memory metadata
    ) external onlySignatory returns (uint256) {
        require(studentWallet != address(0), "invalid wallet");
        
        bytes memory data = abi.encode(
            studentWallet,
            studentCode,
            certType,
            metadata
        );

        return _createMultiSigTransaction("issueCertificate", data);
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

        if (keccak256(abi.encodePacked(tx.txType)) == keccak256(abi.encodePacked("addRecord"))) {
            (
                address studentWallet,
                string memory studentCode,
                string memory subject,
                uint8 grade,
                string memory semester
            ) = abi.decode(tx.data, (address, string, string, uint8, string));

            records.push(
                Record({
                    studentWallet: studentWallet,
                    studentCode: studentCode,
                    subject: subject,
                    grade: grade,
                    semester: semester,
                    createdAt: block.timestamp
                })
            );

            uint256 id = records.length - 1;
            emit RecordAdded(id, studentWallet, studentCode, subject, grade, semester);
        } else if (
            keccak256(abi.encodePacked(tx.txType)) == keccak256(abi.encodePacked("issueCertificate"))
        ) {
            (
                address studentWallet,
                string memory studentCode,
                string memory certType,
                string memory metadata
            ) = abi.decode(tx.data, (address, string, string, string));

            uint256 tokenId = certificates.length;
            _safeMint(studentWallet, tokenId);

            certificates.push(
                Certificate({
                    studentWallet: studentWallet,
                    studentCode: studentCode,
                    certType: certType,
                    metadata: metadata,
                    issuedAt: block.timestamp
                })
            );

            emit CertificateIssued(tokenId, studentWallet, studentCode, certType, metadata);
        }

        emit TransactionExecuted(txId, tx.txType);
    }

    function rejectTransaction(uint256 txId) external onlyOwner txExists(txId) {
        MultiSigTransaction storage tx = transactions[txId];
        require(!tx.executed, "Cannot reject executed transaction");
        
        tx.executed = true;
        emit TransactionRejected(txId);
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
}
