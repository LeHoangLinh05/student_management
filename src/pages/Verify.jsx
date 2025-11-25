import React, { useState, useEffect } from "react";
import { Hash, QrCode, ArrowLeft, CameraOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import api from "../lib/api.js";
import "../styles/verify.css";

const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

const shorten = (s, left = 6, right = 4) =>
  typeof s === "string" && s.length > left + right
    ? s.slice(0, left) + "..." + s.slice(-right)
    : s;

const getOnchainNftUrl = (onchainResult) => {
  const chain = onchainResult?.chain;
  if (!onchainResult?.valid || !chain) return null;
  if (chain.type !== "certificate") return null;
  if (!chain.metadata) return null;
  return `https://gateway.pinata.cloud/ipfs/${chain.metadata}`;
};

export default function Verify() {
  const navigate = useNavigate();

  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [onchainResult, setOnchainResult] = useState(null);

  const handleVerifyOnchain = async (overrideHash) => {
    const value = (overrideHash || hash || "").trim();

    if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
      setError(
        "Vui lòng nhập transaction hash hợp lệ (bắt đầu bằng 0x, dài 66 ký tự)."
      );
      return;
    }

    try {
      setError("");
      setOnchainResult(null);
      setLoading(true);

      const res = await api.get(`/api/verify/onchain/${value}`);
      setOnchainResult(res.data);
    } catch (err) {
      console.error("On-chain verify error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Xác minh trên blockchain thất bại."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isScanning) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    const onScanSuccess = (decodedText) => {
      // decodedText LÀ txHash vì QR encode đúng txHash
      setIsScanning(false);
      setHash(decodedText);
      handleVerifyOnchain(decodedText);
    };
    const onScanFailure = () => {};

    html5QrCode
      .start({ facingMode: "environment" }, qrConfig, onScanSuccess, onScanFailure)
      .catch((err) => {
        console.error(err);
        setCameraError("Không thể truy cập camera. Vui lòng cấp quyền.");
        setIsScanning(false);
      });

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  const handleStartScan = () => {
    setCameraError("");
    setIsScanning(true);
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  return (
    <div className="verify-page">
      <div className="verify-wrapper">
        <header className="verify-header">
          <button
            type="button"
            className="verify-back"
            onClick={() => navigate("/auth?mode=signin")}
          >
            <ArrowLeft size={18} />
            <span>Quay lại trang đăng nhập</span>
          </button>

          <div className="verify-brand">
            <div className="verify-brand-title">EduChain Verify</div>
            <div className="verify-brand-sub">
              Dành cho doanh nghiệp / nhà tuyển dụng
            </div>
          </div>
        </header>

        <div className="verify-intro">
          <h2 className="page-title">Xác thực Bằng cấp (On-chain)</h2>
          <p className="verify-intro-text">
            Dán transaction hash hoặc quét QR chứa txHash để kiểm tra chứng chỉ
            trực tiếp trên blockchain EduChain (Sepolia).
          </p>
        </div>

        <div className="verify-grid">
          {/* Cột nhập hash + kết quả */}
          <div className="verify-card">
            <div className="verify-card-header">
              <div className="verify-icon-circle verify-icon-circle--hash">
                <Hash size={32} />
              </div>
              <h3>Xác minh bằng transaction hash</h3>
              <p>
                Dán txHash của giao dịch cấp bằng (hoặc quét QR) để kiểm tra
                on-chainchain.
              </p>
            </div>

            <label className="verify-form-group">
              <span>Transaction hash (txHash)</span>
              <input
                className="input"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="0x..."
              />
            </label>

            {error && (
              <div className="verify-note verify-note--error">{error}</div>
            )}

            <button
              className="btn-primary verify-submit"
              onClick={() => handleVerifyOnchain()}
              disabled={loading}
            >
              {loading ? "Đang xác minh..." : "Xác minh trên blockchain"}
            </button>

            {/* Kết quả on-chain */}
            {onchainResult && (
              <div className="verify-onchain-result" style={{ marginTop: 12 }}>
                {onchainResult.valid ? (
                  <>
                    <div className="verify-note verify-note--success">
                      Giao dịch hợp lệ trên blockchain ✅
                    </div>

                    {onchainResult.chain && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 12,
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: 6,
                            fontWeight: 600,
                          }}
                        >
                          {onchainResult.chain.type === "certificate"
                            ? "Chứng chỉ on-chain"
                            : "Bản ghi điểm on-chain"}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#4b5563",
                            marginBottom: 4,
                          }}
                        >
                          Tx:{" "}
                          <code className="mono">
                            {shorten(onchainResult.chain.txHash)}
                          </code>
                        </div>
                        {onchainResult.chain.studentCode && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#4b5563",
                              marginBottom: 4,
                            }}
                          >
                            Mã SV:{" "}
                            <strong>{onchainResult.chain.studentCode}</strong>
                          </div>
                        )}
                        {onchainResult.chain.certType && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#4b5563",
                              marginBottom: 4,
                            }}
                          >
                            Loại chứng chỉ:{" "}
                            <strong>{onchainResult.chain.certType}</strong>
                          </div>
                        )}
                        {onchainResult.chain.subject && (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#4b5563",
                              marginBottom: 4,
                            }}
                          >
                            Môn học:{" "}
                            <strong>{onchainResult.chain.subject}</strong>
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: 13,
                            color: "#4b5563",
                            marginBottom: 4,
                          }}
                        >
                          Ví sinh viên:{" "}
                          <code className="mono">
                            {shorten(onchainResult.chain.studentWallet)}
                          </code>
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#4b5563",
                          }}
                        >
                          Block:{" "}
                          <strong>{onchainResult.chain.blockNumber}</strong>{" "}
                          – Thời gian:{" "}
                          {onchainResult.chain.issuedAt &&
                            new Date(
                              onchainResult.chain.issuedAt * 1000
                            ).toLocaleString("vi-VN")}
                        </div>
                      </div>
                    )}

                    {/* Nếu là certificate + metadata (CID) -> hiện NFT */}
                    {getOnchainNftUrl(onchainResult) && (
                      <div style={{ marginTop: 12 }}>
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 10,
                            overflow: "hidden",
                          }}
                        >
                          <iframe
                            src={getOnchainNftUrl(onchainResult)}
                            title="On-chain NFT"
                            style={{
                              width: "100%",
                              height: "360px",
                              border: "none",
                            }}
                          />
                        </div>
                        <a
                          href={getOnchainNftUrl(onchainResult)}
                          target="_blank"
                          rel="noreferrer"
                          className="link-btn"
                          style={{ marginTop: 6 }}
                        >
                          Mở văn bằng gốc trên IPFS
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="verify-note verify-note--error">
                    Không tìm thấy dữ liệu hợp lệ trên blockchain (
                    {onchainResult.reason})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cột quét QR */}
          <div className="verify-card">
            <div className="verify-card-header">
              <div className="verify-icon-circle verify-icon-circle--qr">
                <QrCode size={32} />
              </div>
              <h3>Quét QR Code (txHash)</h3>
              <p>
                Quét để tự động xác minh on-chain.
              </p>
            </div>

            {cameraError && (
              <div className="verify-note verify-note--error">
                {cameraError}
              </div>
            )}

            {isScanning ? (
              <div style={{ marginTop: 12 }}>
                <div
                  id="qr-reader"
                  style={{ borderRadius: 12, overflow: "hidden" }}
                />
                <button
                  className="btn-primary"
                  style={{
                    width: "100%",
                    marginTop: 10,
                    background: "#64748b",
                  }}
                  onClick={handleStopScan}
                >
                  <CameraOff size={16} style={{ marginRight: 6 }} />
                  Hủy quét
                </button>
              </div>
            ) : (
              <div className="verify-dropzone" onClick={handleStartScan}>
                <QrCode size={72} />
                <div className="verify-dropzone-text">
                  Nhấn để bật camera và quét txHash từ QR
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
