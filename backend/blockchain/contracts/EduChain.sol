// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EduChain is ERC721, Ownable {
    struct Record {
        address studentWallet; // hoặc 0x0 nếu chưa có ví
        string studentCode;    // mã SV, để map sang Mongo
        string subject;
        uint8 grade;
        string semester;
        uint256 createdAt;
    }

    struct Certificate {
        address studentWallet;
        string studentCode;
        string certType;   // loại bằng/chứng chỉ
        string metadata;   // ví dụ: IPFS CID
        uint256 issuedAt;
    }

    // ====== STORAGE ======
    Record[] public records;
    Certificate[] public certificates;

    // id của Record/Certificate == index trong mảng
    // với Certificate, id này cũng là tokenId của NFT

    event RecordAdded(
        uint256 indexed id,
        address indexed studentWallet,
        string studentCode,
        string subject,
        uint8 grade,
        string semester
    );

    event CertificateIssued(
        uint256 indexed id,              // cũng là tokenId
        address indexed studentWallet,
        string studentCode,
        string certType,
        string metadata
    );

    constructor()
        ERC721("EduChain Certificate", "EDUCERT")
        Ownable(msg.sender) // chủ contract là account deploy
    {}

    // ========== RECORD (điểm số, như cũ) ==========
    function addRecord(
        address studentWallet,
        string memory studentCode,
        string memory subject,
        uint8 grade,
        string memory semester
    ) external onlyOwner returns (uint256) {
        require(grade <= 100, "grade must be <= 100");

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
        return id;
    }

    // ========== CERTIFICATE ==========

    /// @notice Cấp bằng/chứng chỉ dưới dạng NFT
    /// @param studentWallet ví sinh viên (sẽ là owner của NFT)
    /// @param studentCode   mã SV (dùng để map với DB off-chain)
    /// @param certType      loại bằng, ví dụ "Bằng tốt nghiệp CNTT"
    /// @param metadata      IPFS CID hoặc JSON metadata
    /// @return tokenId      id của NFT vừa mint (cũng là id certificate)
    function issueCertificate(
        address studentWallet,
        string memory studentCode,
        string memory certType,
        string memory metadata
    ) external onlyOwner returns (uint256 tokenId) {
        require(studentWallet != address(0), "invalid wallet");

        // tokenId = chỉ số tiếp theo trong mảng certificates
        tokenId = certificates.length;

        // mint NFT cho ví sinh viên
        _safeMint(studentWallet, tokenId);

        // lưu metadata off-chain mapping
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

    // ======= VIEW HELPERS =======

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
