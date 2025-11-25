import React, { useState, useEffect, useCallback } from "react";
import { Hash, QrCode, Check, ArrowLeft, CameraOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import api from "../lib/api.js";
import "../styles/verify.css";

const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

export default function Verify() {
  const navigate = useNavigate();

  const [hash, setHash] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [targetType, setTargetType] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // certificate preview (NFT)
  const [certPreview, setCertPreview] = useState(null);

  // ==== helper lấy URL NFT từ CID ====
  const getCertImageUrl = (cert) =>
    cert?.ipfsCid ? `https://gateway.pinata.cloud/ipfs/${cert.ipfsCid}` : null;

  // =============================
  // 1) HÀM VERIFY HASH
  // =============================
  const onVerify = useCallback(
    async (hashToVerify) => {
      const finalHash = hashToVerify || hash;

      if (!finalHash) {
        setError("Vui lòng nhập mã hash hoặc quét QR.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setVerifyResult(null);
        setTargetType(null);
        setCertPreview(null);

        const res = await api.post("/api/verify/hash", {
          hash: finalHash,
          company: company || undefined,
        });

        const data = res.data || {};
        setVerifyResult(data.result);
        setTargetType(data.targetType || null);

        if (data.certificate) {
          setCertPreview(data.certificate);
        }
      } catch (err) {
        console.error("Verify error:", err.response?.data || err.message);
        setError(err.response?.data?.message || "Xác minh thất bại");
      } finally {
        setLoading(false);
      }
    },
    [hash, company]
  );

  // =============================
  // 2) Nhận link share ?share=token
  // =============================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedToken = params.get("share");
    if (!sharedToken) return;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setVerifyResult(null);
        setTargetType(null);
        setCertPreview(null);

        const res = await api.get(`/api/verify/shared/${sharedToken}`);
        const credentialHash = res.data?.credentialHash;

        if (!credentialHash) {
          setError("Link chia sẻ không hợp lệ hoặc đã hết hạn.");
          return;
        }

        setHash(credentialHash);
        await onVerify(credentialHash);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message ||
            "Không sử dụng được link chia sẻ. Có thể link đã hết hạn."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [onVerify]);

  // =============================
  // 3) Quét QR
  // =============================
  useEffect(() => {
    if (!isScanning) return;

    const html5QrCode = new Html5Qrcode("qr-reader");

    const onScanSuccess = (decodedText) => {
      setIsScanning(false);
      setHash(decodedText);
      onVerify(decodedText);
    };

    const onScanFailure = (_error) => {
      // ignore
    };

    html5QrCode
      .start({ facingMode: "environment" }, qrConfig, onScanSuccess, onScanFailure)
      .catch(() => {
        setCameraError("Không thể truy cập camera. Vui lòng cấp quyền.");
        setIsScanning(false);
      });

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [isScanning, onVerify]);

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
          <h2 className="page-title">Xác thực Bằng cấp</h2>
          <p className="verify-intro-text">
            Nhập hash / CID hoặc mở link chia sẻ từ sinh viên để kiểm tra tính
            hợp lệ, đồng thời xem bản NFT của văn bằng lưu trên IPFS.
          </p>
        </div>

        <div className="verify-grid">
          {/* Cột nhập hash */}
          <div className="verify-card">
            <div className="verify-card-header">
              <div className="verify-icon-circle verify-icon-circle--hash">
                <Hash size={32} />
              </div>
              <h3>Xác minh bằng Hash / CID</h3>
              <p>
                Dán mã hash (txHash) hoặc IPFS CID, hoặc mở từ link chia sẻ để
                xác minh.
              </p>
            </div>

            <label className="verify-form-group">
              <span>Mã Hash / IPFS CID</span>
              <input
                className="input"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="0x... hoặc Qm..."
              />
            </label>

            <label className="verify-form-group">
              <span>Tên công ty (tuỳ chọn)</span>
              <input
                className="input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="FPT Software"
              />
            </label>

            {error && (
              <div className="verify-note verify-note--error">{error}</div>
            )}

            {verifyResult && (
              <div
                className={
                  "verify-note " +
                  (verifyResult === "valid"
                    ? "verify-note--success"
                    : "verify-note--error")
                }
                style={{ marginTop: 8 }}
              >
                {verifyResult === "valid"
                  ? "Bằng cấp hợp lệ ✅"
                  : "Bằng cấp không hợp lệ ❌"}
              </div>
            )}

            <button
              className="btn-primary verify-submit"
              onClick={() => onVerify()}
              disabled={loading}
            >
              {loading ? "Đang xác minh..." : "Xác minh"}
            </button>

            {/* Nếu là certificate & có ipfsCid -> hiển thị NFT */}
            {verifyResult === "valid" && targetType === "certificate" && (
              <div className="verify-cert-preview">
                <h4 style={{ marginTop: 16, marginBottom: 8 }}>
                  Thông tin chứng chỉ (NFT)
                </h4>
                <p className="muted" style={{ marginBottom: 4 }}>
                  Loại: {certPreview?.type || "Chứng chỉ"}
                </p>
                {certPreview?.ipfsCid && (
                  <p className="muted" style={{ marginBottom: 8 }}>
                    CID:{" "}
                    <code className="chip mono">{certPreview.ipfsCid}</code>
                  </p>
                )}

                {getCertImageUrl(certPreview) ? (
                  <>
                    <div
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        overflow: "hidden",
                        marginBottom: 8,
                      }}
                    >
                      <iframe
                        src={getCertImageUrl(certPreview)}
                        title="Certificate NFT"
                        style={{
                          width: "100%",
                          height: "360px",
                          border: "none",
                        }}
                      />
                    </div>
                    <a
                      href={getCertImageUrl(certPreview)}
                      target="_blank"
                      rel="noreferrer"
                      className="link-btn"
                    >
                      Mở văn bằng gốc trên tab mới
                    </a>
                  </>
                ) : (
                  <p className="muted">
                    Chứng chỉ này chưa gắn file IPFS, chỉ có metadata trong hệ
                    thống.
                  </p>
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
              <h3>Quét QR Code</h3>
              <p>Quét QR trên văn bằng để tự động xác minh.</p>
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
                  Nhấn để bật camera và quét QR (hash hoặc CID)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
