import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import "../styles/student.css";

import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

import StudentHeader from "./StudentHeader.jsx";
import StudentSummary from "./StudentSummary.jsx";
import StudentProfileSection from "./StudentProfileSection.jsx";
import StudentSecuritySection from "./StudentSecuritySection.jsx";
import StudentAuditLogSection from "./StudentAuditLogSection.jsx";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwMessage, setPwMessage] = useState("");

  // ví blockchain (demo)
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMsg, setWalletMsg] = useState("");
  const [walletError, setWalletError] = useState("");

  const shortHash = (h) =>
    typeof h === "string" && h.length > 14
      ? h.slice(0, 8) + "..." + h.slice(-4)
      : h;

  // fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        if (!user?.email) {
          setError("Không tìm thấy thông tin tài khoản.");
          setLoading(false);
          return;
        }

        // 1. tìm student theo email
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

        // 2. lấy audit logs
        const auditRes = await api.get(`/api/students/${s._id}/audit`);
        setAuditLogs(auditRes.data?.logs || []);
      } catch (err) {
        console.error(err);
        setError("Không tải được dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email]);

  const handleLogout = () => {
    logout();
    navigate("/auth?mode=signin", { replace: true });
  };

  // đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError("Vui lòng nhập đầy đủ các trường.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    try {
      setPwLoading(true);
      await api.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
      });

      setPwMessage("Đổi mật khẩu thành công.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setPwError(
        err.response?.data?.message ||
          "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
    } finally {
      setPwLoading(false);
    }
  };

  // ví blockchain demo
  const handleConnectWalletDemo = async () => {
    if (!student?._id) return;
    try {
      setWalletLoading(true);
      setWalletError("");
      setWalletMsg("");

      const res = await api.post(
        `/api/students/${student._id}/connect-wallet`,
        { mode: "generate" }
      );
      const wallet = res.data?.wallet;

      setStudent((prev) => ({ ...prev, wallet }));
      setWalletMsg(
        `Đã gắn ví demo: ${shortHash(wallet)} (sau này sẽ thay bằng ví thật)`
      );
    } catch (err) {
      console.error(err);
      setWalletError(
        err.response?.data?.message || "Không gắn được ví demo. Thử lại sau."
      );
    } finally {
      setWalletLoading(false);
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
            <StudentHeader
              title="EduChain Student Portal"
              subtitle="Xem hồ sơ học tập của bạn trên nền tảng blockchain."
              displayName={displayName}
              displayEmail={displayEmail}
              onLogout={handleLogout}
            />
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
          {/* <StudentHeader
            title="EduChain Student Portal"
            subtitle="Xem hồ sơ học tập và dữ liệu blockchain của bạn."
            displayName={displayName}
            displayEmail={displayEmail}
            onLogout={handleLogout}
          /> */}

          <StudentSummary student={student} />

          <StudentProfileSection
            student={student}
            displayName={displayName}
            displayEmail={displayEmail}
            walletLoading={walletLoading}
            walletError={walletError}
            walletMsg={walletMsg}
            onConnectWallet={handleConnectWalletDemo}
          />

          <StudentSecuritySection
            oldPassword={oldPassword}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            setOldPassword={setOldPassword}
            setNewPassword={setNewPassword}
            setConfirmPassword={setConfirmPassword}
            loading={pwLoading}
            error={pwError}
            message={pwMessage}
            onSubmit={handleChangePassword}
          />

          <StudentAuditLogSection logs={auditLogs} />
        </div>
      </main>
    </div>
  );
}
