import React, { useState } from "react";
import { Hash, QrCode, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import "../styles/verify.css"; 

export default function Verify() {
  const navigate = useNavigate();

  const [hash, setHash] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyResult, setVerifyResult] = useState(null); 

  const [items, setItems] = useState([
    {
      name: "Nguyễn Văn A",
      cert: "Bằng Kỹ sư CNTT",
      result: "valid",
      time: "2 phút trước",
      company: "FPT Software",
    },
    {
      name: "Trần Thị B",
      cert: "Bằng Cử nhân Kinh tế",
      result: "valid",
      time: "15 phút trước",
      company: "Vietcombank",
    },
    {
      name: "Unknown",
      cert: "Invalid Hash",
      result: "invalid",
      time: "1 giờ trước",
      company: "Company XYZ",
    },
  ]);

  const onVerify = async () => {
    if (!hash) {
      setError("Vui lòng nhập mã hash");
      return;
    }
    try {
      setLoading(true);
      setError("");
      setVerifyResult(null);

      const res = await api.post("/api/verify/hash", {
        hash,
        company: company || undefined,
      });

      const result = res.data?.result === "valid" ? "valid" : "invalid";
      setVerifyResult(result);

      const now = new Date();
      const newItem = {
        name: result === "valid" ? "Unknown" : "Unknown",
        cert: result === "valid" ? "Hash hợp lệ" : "Invalid Hash",
        result,
        time: now.toLocaleTimeString("vi-VN"),
        company: company || "N/A",
      };

      setItems((prev) => [newItem, ...prev].slice(0, 10));
    } catch (err) {
      console.error("Verify error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Xác minh thất bại");
    } finally {
      setLoading(false);
    }
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

        {/* Title */}
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
              <h3>Xác minh bằng Hash</h3>
              <p>
                Nhập mã hash được in trên bằng hoặc bên trong mã QR để kiểm tra
                tính xác thực.
              </p>
            </div>

            <label className="verify-form-group">
              <span>Mã Hash</span>
              <input
                className="input"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f8f3c"
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
              onClick={onVerify}
              disabled={loading}
            >
              {loading ? "Đang xác minh..." : "Xác minh"}
            </button>
          </div>

          {/* QR card */}
          <div className="verify-card">
            <div className="verify-card-header">
              <div className="verify-icon-circle verify-icon-circle--qr">
                <QrCode size={32} />
              </div>
              <h3>Quét QR Code</h3>
              <p>Quét mã QR trên bằng cấp để xác thực nhanh.</p>
            </div>

            <div className="verify-dropzone">
              <QrCode size={72} />
              <div className="verify-dropzone-text">
                Nhấn để bật camera và quét QR
              </div>
            </div>
          </div>
        </div>

        {/* History */}
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
