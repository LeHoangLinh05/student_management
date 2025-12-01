import React, { useEffect, useState } from "react";
import { FileText, Link as LinkIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import "../styles/student.css";

import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function StudentRecords() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
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

        // tìm student theo email
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

        const rRes = await api.get(`/api/records/${s._id}`);
        setRecords(rRes.data || []);
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

  const copyVerifyLink = (hash) => {
    if (!hash) return;
    const url = `${window.location.origin}/verify?hash=${encodeURIComponent(
      hash
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
                <h1 className="student-title">Học bạ & Điểm số</h1>
                <p className="student-subtitle">
                  Xem chi tiết các môn học và điểm số.
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
              <h1 className="student-title">Học bạ & Điểm số</h1>
              <p className="student-subtitle">
                Xem chi tiết các môn học và điểm số.
              </p>
            </div>

            <div className="student-user">
              <div className="student-user-name">{displayName}</div>
              <div className="student-user-email">{displayEmail}</div>
            </div>
          </header>

          <section className="panel">
            <h3 className="panel-title">Điểm của tôi</h3>
            {records.length === 0 ? (
              <p>Chưa có điểm nào được ghi nhận.</p>
            ) : (
              <div className="list">
                {records.map((r) => (
                  <div className="item item-hover" key={r._id}>
                    <div className="item-left">
                      <div className="icon-ghost icon-indigo">
                        <FileText />
                      </div>
                      <div>
                        <div className="item-title">{r.subject}</div>
                        <div className="item-sub">
                          {r.semester} •{" "}
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString("vi-VN")
                            : ""}
                        </div>
                        {r.txHash && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginTop: 4,
                            }}
                          >
                            <code className="chip mono">
                              {shortHash(r.txHash)}
                            </code>
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => copyVerifyLink(r.txHash)}
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
                    </div>
                    <div className="item-right">
                      <div className="score">
                        {typeof r.grade === "number"
                          ? r.grade.toFixed(1)
                          : r.grade}
                      </div>
                    </div>
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
