// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EduChain {
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
        string certType;
        string metadata;   // vd: ipfsCid hoặc JSON string
        uint256 issuedAt;
    }

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

    Record[] public records;
    Certificate[] public certificates;

    function addRecord(
        address studentWallet,
        string memory studentCode,
        string memory subject,
        uint8 grade,
        string memory semester
    ) external returns (uint256) {
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

    function issueCertificate(
        address studentWallet,
        string memory studentCode,
        string memory certType,
        string memory metadata
    ) external returns (uint256) {
        certificates.push(
            Certificate({
                studentWallet: studentWallet,
                studentCode: studentCode,
                certType: certType,
                metadata: metadata,
                issuedAt: block.timestamp
            })
        );
        uint256 id = certificates.length - 1;
        emit CertificateIssued(id, studentWallet, studentCode, certType, metadata);
        return id;
    }
}
