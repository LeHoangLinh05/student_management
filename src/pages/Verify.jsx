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

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  
  const [items, setItems] = useState([
    /* mock data */
  ]);


  const onVerify = useCallback(async (hashToVerify) => {
    const finalHash = hashToVerify || hash;

    if (!finalHash) {
      setError("Vui lòng nhập mã hash hoặc quét QR.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setVerifyResult(null);

      const res = await api.post("/api/verify/hash", {
        hash: finalHash,
        company: company || undefined,
      });

      const result = res.data?.result === "valid" ? "valid" : "invalid";
      setVerifyResult(result);
    } catch (err) {
      console.error("Verify error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Xác minh thất bại");
    } finally {
      setLoading(false);
    }
  }, [hash, company]);

  useEffect(() => {
    if (!isScanning) return;
    
    const html5QrCode = new Html5Qrcode("qr-reader");
    const onScanSuccess = (decodedText) => {
      setIsScanning(false);     
      setHash(decodedText);    
      onVerify(decodedText);   
    };

    const onScanFailure = (error) => { /* Bỏ qua */ };

    html5QrCode.start({ facingMode: "environment" }, qrConfig, onScanSuccess, onScanFailure)
      .catch(err => {
        setCameraError("Không thể truy cập camera. Vui lòng cấp quyền.");
        setIsScanning(false);
      });

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Lỗi khi dừng máy quét QR.", err));
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
            Nhập mã hash hoặc quét QR trên văn bằng để kiểm tra tính hợp lệ trên
            blockchain EduChain.
          </p>
        </div>

        <div className="verify-grid">
          <div className="verify-card">
            <div className="verify-card-header">
              <div className="verify-icon-circle verify-icon-circle--hash">
                <Hash size={32} />
              </div>
              <h3>Xác minh bằng Hash (thủ công)</h3>
              <p>
                Sử dụng khi không thể quét QR. Nhập mã hash để kiểm tra.
              </p>
            </div>
            <label className="verify-form-group">
              <span>Mã Hash</span>
              <input
                className="input"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="Hash sẽ tự điền sau khi quét QR"
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
             {error && <div className="verify-note verify-note--error">{error}</div>}
             {verifyResult && (
              <div
                className={
                  "verify-note " +
                  (verifyResult === "valid"
                    ? "verify-note--success"
                    : "verify-note--error")
                }
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
          </div>

          <div className="verify-card">
            <div className="verify-card-header">
              <div className="verify-icon-circle verify-icon-circle--qr">
                <QrCode size={32} />
              </div>
              <h3>Quét QR Code</h3>
              <p>Quét mã QR trên bằng cấp để xác thực nhanh.</p>
            </div>
            
            {cameraError && <div className="verify-note verify-note--error">{cameraError}</div>}
            
            {isScanning ? (
              <div style={{marginTop: 12}}>
                <div id="qr-reader" style={{ borderRadius: 12, overflow: 'hidden' }}/>
                <button 
                  className="btn-primary" 
                  style={{width: '100%', marginTop: 10, background: '#64748b'}}
                  onClick={handleStopScan}
                >
                  <CameraOff size={16} style={{marginRight: 6}}/>
                  Hủy quét
                </button>
              </div>
            ) : (
              <div className="verify-dropzone" onClick={handleStartScan}>
                <QrCode size={72} />
                <div className="verify-dropzone-text">
                  Nhấn để quét QR và tự động xác minh
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="verify-history">
           <h3>Kết quả xác minh gần đây</h3>
           <div className="verify-history-list">
             {items.map((v, i) => (
              <div className="verify-history-item" key={i}>
                <div className="verify-history-left">
                  <div
                    className={
                      "verify-badge " +
                      (v.result === "valid"
                        ? "verify-badge--success"
                        : "verify-badge--error")
                    }
                  >
                    {v.result === "valid" ? <Check size={16} /> : "✕"}
                    <span>
                      {v.result === "valid" ? "Hợp lệ" : "Không hợp lệ"}
                    </span>
                  </div>

                  <div className="verify-history-info">
                    <div className="verify-history-name">{v.name}</div>
                    <div className="verify-history-cert">{v.cert}</div>
                    <div className="verify-history-company">
                      Xác minh bởi: {v.company}
                    </div>
                  </div>
                </div>

                <div className="verify-history-time">{v.time}</div>
              </div>
            ))}
           </div>
        </section>
      </div>
    </div>
  );
}