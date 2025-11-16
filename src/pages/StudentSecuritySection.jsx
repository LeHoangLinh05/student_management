// src/components/student/StudentSecuritySection.jsx
import React from "react";

export default function StudentSecuritySection({
  oldPassword,
  newPassword,
  confirmPassword,
  setOldPassword,
  setNewPassword,
  setConfirmPassword,
  loading,
  error,
  message,
  onSubmit,
}) {
  return (
    <section className="panel">
      <h3 className="panel-title">Bảo mật tài khoản</h3>
      <p className="muted" style={{ marginBottom: 12 }}>
        Đổi mật khẩu tài khoản đăng nhập của bạn.
      </p>

      <form onSubmit={onSubmit} className="grid-2">
        <label className="form-group">
          <span>Mật khẩu hiện tại</span>
          <input
            type="password"
            className="input"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
        </label>

        <label className="form-group">
          <span>Mật khẩu mới</span>
          <input
            type="password"
            className="input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>

        <label className="form-group">
          <span>Xác nhận mật khẩu mới</span>
          <input
            type="password"
            className="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        <div className="form-group" style={{ alignSelf: "flex-end" }}>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
          </button>
        </div>
      </form>

      {error && (
        <div className="note" style={{ marginTop: 8, color: "red" }}>
          {error}
        </div>
      )}
      {message && (
        <div className="note" style={{ marginTop: 8 }}>
          {message}
        </div>
      )}
    </section>
  );
}
