import React, { useEffect, useState } from "react";
import { Award, Link as LinkIcon, QrCode } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import "../styles/student.css";

import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function StudentCertificates() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [shareError, setShareError] = useState("");


const shareVerifyLink = async (hashOrCid) => {
  try {
    setShareError("");
    setInfoMsg("");

    if (!hashOrCid) {
      setShareError("Chứng chỉ này không có hash/CID để chia sẻ.");
      return;
    }

    const res = await api.post("/api/verify/share", {
      credentialHash: hashOrCid,
      ttlHours: 48,
    });

    const token = res.data?.token;
    if (!token) {
      setShareError("Không tạo được link chia sẻ.");
      return;
    }

    const url = `${window.location.origin}/verify?share=${encodeURIComponent(
      token
    )}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      setInfoMsg("Đã tạo và copy link chia sẻ riêng tư vào clipboard.");
    } else {
      window.prompt("Copy link chia sẻ:", url);
    }
  } catch (err) {
    console.error("shareVerifyLink error:", err.response?.data || err.message);
    setShareError(
      err.response?.data?.message ||
        "Không tạo được link chia sẻ. Thử lại sau."
    );
  }
};

  // Modal NFT
  const [selectedCert, setSelectedCert] = useState(null);
  // Hiện QR cho chứng chỉ nào
  const [visibleQrCertId, setVisibleQrCertId] = useState(null);

  const shortHash = (h) =>
    typeof h === "string" && h.length > 14
      ? h.slice(0, 8) + "..." + h.slice(-4)
      : h;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.email) {
          setError("Không tìm thấy thông tin tài khoản.");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        const sRes = await api.get("/api/students");
        const allStudents = sRes.data || [];
        const s = allStudents.find((st) => st.email === user.email);

        if (!s) {
          setError(
            "Không tìm thấy hồ sơ sinh viên cho tài khoản này. Vui lòng liên hệ quản trị viên."
          );
          setLoading(false);
          return;
        }

        setStudent(s);

        const cRes = await api.get(`/api/certificates/${s._id}`);
        setCerts(cRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Không tải được dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      navigate("/auth?mode=signin", { replace: true });
      return;
    }

    fetchData();
  }, [user, user?.email, navigate]);

  const copyHash = (hash) => {
    if (!hash) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hash);
      setInfoMsg("Đã copy transaction hash vào clipboard.");
    } else {
      window.prompt("Copy transaction hash:", hash);
    }
  };

  const displayName = user?.name || student?.fullName || "Sinh viên";
  const displayEmail = user?.email || student?.email || "";

  const getNftImageUrl = (cert) =>
    cert?.ipfsCid ? `https://gateway.pinata.cloud/ipfs/${cert.ipfsCid}` : null;

  const toggleQr = (id) =>
    setVisibleQrCertId((prev) => (prev === id ? null : id));

  const closeModal = () => setSelectedCert(null);

  // LOADING
  if (loading) {
    return (
      <div className="app">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div className="container">
            <p>Đang tải dữ liệu...</p>
          </div>
        </main>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="app">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div className="container">
            <header className="student-header">
              <div>
                <h1 className="student-title">Bằng cấp & Chứng chỉ</h1>
                <p className="student-subtitle">
                  Xem các bằng cấp và chứng chỉ được cấp.
                </p>
              </div>
            </header>
            <div className="panel">
              <p style={{ color: "red" }}>{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="container">
          <header className="student-header">
            <div>
              <h1 className="student-title">Bằng cấp & Chứng chỉ</h1>
              <p className="student-subtitle">
                Các bằng cấp/chứng chỉ đã được ghi nhận như NFT.
              </p>
            </div>

            <div className="student-user">
              <div className="student-user-name">{displayName}</div>
              <div className="student-user-email">{displayEmail}</div>
            </div>
          </header>

          <section className="panel">
            <h3 className="panel-title">Bằng cấp & Chứng chỉ</h3>

            {certs.length === 0 ? (
              <p>Chưa có chứng chỉ nào được cấp.</p>
            ) : (
              <div className="student-certs-grid">
                {certs.map((c) => (
                  <div className="card" key={c._id}>
                    <div className="student-cert-header">
                      <div>
                        <div className="student-cert-title">
                          <Award size={16} style={{ marginRight: 6 }} />
                          {c.type}
                        </div>
                        <div className="student-cert-date">
                          Ngày cấp:{" "}
                          {c.date
                            ? new Date(c.date).toLocaleDateString("vi-VN")
                            : ""}
                        </div>
                      </div>
                      <span className="badge green">Đã cấp</span>
                    </div>

                    <div className="student-cert-footer">
                      <span>Mã NFT nội bộ</span>
                      <code className="mono student-cert-nft">
                        {c.nftCode || "#NFT-***"}
                      </code>
                    </div>

                    {c.txHash && (
                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <code className="chip mono">
                          {shortHash(c.txHash)}
                        </code>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => shareVerifyLink(c.txHash || c.ipfsCid)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                          }}
                        >
                          <LinkIcon size={14} />
                          <span>Copy link verify</span>
                        </button>
                      </div>
                    )}

                    {/* Hàng nút QR + chi tiết NFT */}
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => toggleQr(c._id)}
                        disabled={!c.txHash}
                      >
                        <QrCode size={16} style={{ marginRight: 6 }} />
                        QR Code
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => setSelectedCert(c)}
                        disabled={!getNftImageUrl(c)}
                      >
                        Xem bằng cấp
                      </button>
                    </div>

                    {/* QR code cho chứng chỉ (encode txHash) */}
                    {visibleQrCertId === c._id && c.txHash && (
                      <div
                        className="cert-qr-details"
                        style={{ marginTop: 10, textAlign: "center" }}
                      >
                        <img
                          className="cert-qr-img"
                          alt="QR verify"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                            c.txHash
                          )}`}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {infoMsg && (
            <div className="note" style={{ marginTop: 8 }}>
              {infoMsg}
            </div>
          )}
        </div>

        {/* Modal hiển thị NFT */}
        {selectedCert && (
          <div
            className="modal-backdrop"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
            }}
            onClick={closeModal}
          >
            <div
              className="modal-content"
              style={{
                background: "#fff",
                borderRadius: 12,
                maxWidth: 700,
                width: "90%",
                maxHeight: "90vh",
                padding: 20,
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ marginBottom: 8 }}>
                {selectedCert.type} – NFT Preview
              </h3>
              <p className="muted" style={{ marginBottom: 12 }}>
                CID:{" "}
                {selectedCert.ipfsCid ? (
                  <code className="chip mono">{selectedCert.ipfsCid}</code>
                ) : (
                  "Chưa có IPFS CID"
                )}
              </p>

              {getNftImageUrl(selectedCert) ? (
                <>
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      overflow: "hidden",
                      marginBottom: 12,
                    }}
                  >
                    <iframe
                      src={getNftImageUrl(selectedCert)}
                      title="NFT Preview"
                      style={{
                        width: "100%",
                        height: "480px",
                        border: "none",
                      }}
                    />
                  </div>
                  <a
                    href={getNftImageUrl(selectedCert)}
                    target="_blank"
                    rel="noreferrer"
                    className="link-btn"
                    style={{ marginRight: 8 }}
                  >
                    Mở trên tab mới
                  </a>
                </>
              ) : (
                <p>Không tìm thấy file NFT cho chứng chỉ này.</p>
              )}

              <div style={{ marginTop: 16, textAlign: "right" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={closeModal}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
