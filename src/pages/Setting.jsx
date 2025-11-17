// src/pages/Setting.jsx

import React, { useState } from "react";
import api from "../lib/api.js";
import StudentSecuritySection from "./student_section/StudentSecuritySection.jsx"; 

export default function Setting() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ các trường.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return; 
    }
    
    try {
      setLoading(true);
      await api.post("/api/auth/change-password", {
        oldPassword,
        newPassword,
      });

      setMessage("Đổi mật khẩu thành công.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Cài đặt Tài khoản</h2>
    
      <StudentSecuritySection
        oldPassword={oldPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        setOldPassword={setOldPassword}
        setNewPassword={setNewPassword}
        setConfirmPassword={setConfirmPassword}
        loading={loading}
        error={error}
        message={message}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}