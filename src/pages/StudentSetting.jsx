import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import "../styles/student.css";

import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import StudentSecuritySection from "./student_section/StudentSecuritySection.jsx"; 

export default function StudentSetting() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwMessage, setPwMessage] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        if (!user?.email) {
          navigate("/auth?mode=signin", { replace: true });
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
      } catch (err) {
        console.error(err);
        setError("Không tải được dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/auth?mode=signin", { replace: true });
  };

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

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
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
        err.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
    } finally {
      setPwLoading(false);
    }
  };

  const displayName = user?.name || student?.fullName || "Sinh viên";
  const displayEmail = user?.email || student?.email || "";

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

  if (error) {
    return (
      <div className="app">
        <Sidebar />
        <main className="main">
          <Topbar />
          <div className="container">
            <header className="student-header">
              <div>
                <h1 className="student-title">Bảo mật tài khoản</h1>
                <p className="student-subtitle">
                  Quản lý mật khẩu và các cài đặt bảo mật.
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
              <h1 className="student-title">Bảo mật tài khoản</h1>
              <p className="student-subtitle">
                Thay đổi mật khẩu và quản lý bảo mật cho tài khoản của bạn.
              </p>
            </div>

            <div className="student-user">
              <div className="student-user-name">{displayName}</div>
              <div className="student-user-email">{displayEmail}</div>
            </div>
          </header>

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
        </div>
      </main>
    </div>
  );
}