import React, { useEffect, useState } from "react";
import { Award, Shield, QrCode } from "lucide-react";
import api from "../lib/api.js";

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const studentId = "675a8b9f4d9b58e0c2d13f33";

  const mockCerts = [
  {
    type: "Bằng Kỹ sư CNTT",
    date: "2024-06-15",
    nftCode: "#NFT-001",
    status: "Đã cấp"
  },
  {
    type: "Chứng chỉ Blockchain",
    date: "2024-10-20",
    nftCode: "#NFT-002",
    status: "Đã cấp"
  },
];

useEffect(() => {
  setCerts(mockCerts);
}, []);

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       setLoading(true);
  //       setError("");
  //       const res = await api.get(`/api/certificates/${studentId}`);
  //       setCerts(res.data || []);
  //     } catch (err) {
  //       console.error("Lỗi khi tải certificates:", err);
  //       setError(err.response?.data?.message || "Không tải được dữ liệu");
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, [studentId]);

  return (
    <div>
      <h2 className="page-title">Quản lý Bằng cấp & Chứng chỉ</h2>
      <div className="grid-2">
        <div
          className="card"
          style={{
            color: "#fff",
            background: "linear-gradient(135deg, #4f46e5, #9333ea)",
          }}
        >
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <Award size={48} />
            <span className="badge" style={{ background: "rgba(255,255,255,.2)" }}>
              NFT Certificate
            </span>
          </div>
          <h3>Cấp bằng tốt nghiệp</h3>
          <p>Tạo bằng cấp số hóa và ghi lên blockchain dưới dạng NFT</p>
          <button
            className="btn-primary"
            style={{ marginTop: 8, background: "#fff", color: "#4f46e5" }}
          >
            Tạo bằng mới
          </button>
        </div>
        
        <div
          className="card"
          style={{
            color: "#fff",
            background: "linear-gradient(135deg, #16a34a, #0ea5e9)",
          }}
        >
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <Shield size={48} />
            <span className="badge" style={{ background: "rgba(255,255,255,.2)" }}>
              IPFS Storage
            </span>
          </div>
          <h3>Lưu trữ phân tán</h3>
          <p>Dữ liệu lưu trên IPFS, blockchain chỉ lưu hash</p>
          <button
            className="btn-primary"
            style={{ marginTop: 8, background: "#fff", color: "#059669" }}
          >
            Tải lên IPFS
          </button>
        </div>
      </div>

      {/* Danh sách bằng cấp */}
      <section className="section">
        <h3>Bằng cấp đã cấp</h3>

        {loading && <p className="muted">Đang tải...</p>}
        {error && <p className="error">{error}</p>}

        <div className="grid-2">
          {certs.length > 0 ? (
            certs.map((c, i) => (
              <div className="card" key={i}>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    <div style={{ color: "#64748b" }}>{c.type}</div>
                  </div>
                  <span className="badge green">Đã cấp</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: "6px 0",
                    color: "#64748b",
                  }}
                >
                  <span>{new Date(c.date || c.createdAt).toLocaleDateString("vi-VN")}</span>
                  <code className="mono" style={{ color: "#4f46e5", fontWeight: 700 }}>
                    {c.nft || c._id}
                  </code>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" style={{ background: "#eef2ff", color: "#30336b" }}>
                    <QrCode size={16} /> QR Code
                  </button>
                  <button className="btn-primary">Chi tiết</button>
                </div>
              </div>
            ))
          ) : (
            !loading && <p className="muted">Chưa có bằng cấp nào được cấp.</p>
          )}
        </div>
      </section>
    </div>
  );
}
