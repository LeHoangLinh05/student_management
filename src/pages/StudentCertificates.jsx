import React, { useEffect, useState } from "react";
import { Award, Link as LinkIcon } from "lucide-react";
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

  const copyVerifyLink = (hashOrCid) => {
    if (!hashOrCid) return;
    const url = `${window.location.origin}/verify?hash=${encodeURIComponent(
      hashOrCid
    )}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
      setInfoMsg("Đã copy link verify vào clipboard.");
    } else {
      window.prompt("Copy link verify:", url);
    }
  };

  const displayName = user?.name || student?.fullName || "Sinh viên";
  const displayEmail = user?.email || student?.email || "";

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
                  Xem các bằng cấp và chứng chỉ được cấp cho bạn.
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

  // NORMAL
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
                Các bằng cấp/chứng chỉ đã được ghi nhận như NFT (demo).
              </p>
            </div>

            <div className="student-user">
              <div className="student-user-name">{displayName}</div>
              <div className="student-user-email">{displayEmail}</div>
            </div>
          </header>

          <section className="panel">
            <h3 className="panel-title">Bằng cấp & Chứng chỉ (NFT demo)</h3>

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

                    {c.ipfsCid && (
                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <code className="chip mono">
                          {shortHash(c.ipfsCid)}
                        </code>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => copyVerifyLink(c.ipfsCid)}
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
      </main>
    </div>
  );
}
