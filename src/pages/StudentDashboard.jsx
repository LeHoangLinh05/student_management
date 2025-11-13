import React from "react";
import { Users, Check, Award, FileText, Hash } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import "../styles/student.css";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mock data – thay bằng API backend
  const student = {
    name: "Nguyễn Văn A",
    code: "SV2024001",
    email: "student@university.edu.vn",
    wallet: "0x742d...8f3c",
    dob: "20/01/2003",
    major: "Kỹ sư CNTT",
  };

  const records = [
    { subject: "Lập trình Web", grade: "9.5", semester: "HK1 2024-2025", date: "10/11/2025" },
    { subject: "Cơ sở dữ liệu", grade: "8.8", semester: "HK1 2024-2025", date: "08/11/2025" },
    { subject: "Mạng máy tính", grade: "9.0", semester: "HK1 2024-2025", date: "05/11/2025" },
  ];

  const certs = [
    { type: "Bằng Kỹ sư CNTT", date: "15/06/2024", nft: "#NFT-001", status: "Đã cấp" },
    { type: "Chứng chỉ AI", date: "20/08/2024", nft: "#NFT-003", status: "Đã cấp" },
  ];

  const displayName = user?.name || student.name;
  const displayEmail = user?.email || student.email;

  const handleLogout = () => {
    logout();
    navigate("/auth?mode=signin", { replace: true });
  };

  return (
    <div className="student-root">
      <main className="student-main">
        {/* Header */}
        <header className="student-header">
          <div>
            <h1 className="student-title">EduChain Student Portal</h1>
            <p className="student-subtitle">
              Xem hồ sơ học tập của bạn trên nền tảng blockchain.
            </p>
          </div>

          <div className="student-user">
            <div className="student-user-name">{displayName}</div>
            <div className="student-user-email">{displayEmail}</div>
            <button className="student-logout-btn" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Thông tin tổng quan */}
        <section className="student-summary-grid">
          <div className="card">
            <div className="student-summary-item">
              <div className="icon-ghost icon-indigo">
                <Users />
              </div>
              <div>
                <div className="muted">Mã sinh viên</div>
                <div className="stat">{student.code}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="student-summary-item">
              <div className="icon-ghost student-icon-green">
                <Check />
              </div>
              <div>
                <div className="muted">Trạng thái</div>
                <div className="stat">Đang học</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="student-summary-item">
              <div className="icon-ghost student-icon-purple">
                <Award />
              </div>
              <div>
                <div className="muted">Chương trình</div>
                <div className="stat">{student.major}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Hồ sơ cá nhân */}
        <section className="panel">
          <h3 className="panel-title">Hồ sơ cá nhân</h3>
          <div className="student-profile">
            <div className="avatar-lg">NV</div>
            <div>
              <div className="student-profile-name">{student.name}</div>
              <div className="student-profile-email">{student.email}</div>
              <div className="student-profile-dob">Ngày sinh: {student.dob}</div>

              <div className="student-wallet-row">
                <Hash size={16} color="#9ca3af" />
                <code className="chip mono">{student.wallet}</code>
              </div>
            </div>
          </div>
        </section>

        {/* Điểm */}
        <section className="panel">
          <h3 className="panel-title">Điểm của tôi</h3>
          <div className="list">
            {records.map((r, i) => (
              <div className="item item-hover" key={i}>
                <div className="item-left">
                  <div className="icon-ghost icon-indigo">
                    <FileText />
                  </div>
                  <div>
                    <div className="item-title">{r.subject}</div>
                    <div className="item-sub">
                      {r.semester} • {r.date}
                    </div>
                  </div>
                </div>
                <div className="item-right">
                  <div className="score">{r.grade}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bằng cấp & chứng chỉ */}
        <section className="panel">
          <h3 className="panel-title">Bằng cấp & Chứng chỉ</h3>
          <div className="student-certs-grid">
            {certs.map((c, i) => (
              <div className="card" key={i}>
                <div className="student-cert-header">
                  <div>
                    <div className="student-cert-title">{c.type}</div>
                    <div className="student-cert-date">Ngày cấp: {c.date}</div>
                  </div>
                  <span className="badge green">{c.status}</span>
                </div>
                <div className="student-cert-footer">
                  <span>Mã NFT</span>
                  <code className="mono student-cert-nft">{c.nft}</code>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
