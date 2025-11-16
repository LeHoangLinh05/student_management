// src/components/student/StudentProfileSection.jsx
import React from "react";
import { Hash } from "lucide-react";

export default function StudentProfileSection({
  student,
  displayName,
  displayEmail,
  walletLoading,
  walletError,
  walletMsg,
  onConnectWallet,
}) {
  const initials = student?.fullName
    ? student.fullName
        .split(" ")
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "SV";

  return (
    <section className="panel">
      <h3 className="panel-title">Hồ sơ cá nhân & Ví blockchain</h3>
      <div className="student-profile">
        <div className="avatar-lg">{initials}</div>
        <div style={{ flex: 1 }}>
          <div className="student-profile-name">
            {student?.fullName || displayName}
          </div>
          <div className="student-profile-email">
            {student?.email || displayEmail}
          </div>
          {student?.dob && (
            <div className="student-profile-dob">
              Ngày sinh:{" "}
              {new Date(student.dob).toLocaleDateString("vi-VN")}
            </div>
          )}

          <div className="student-wallet-row">
            <Hash size={16} color="#9ca3af" />
            <code className="chip mono">
              {student?.wallet || "Chưa được gắn ví blockchain"}
            </code>
            <button
              className="student-logout-btn"
              type="button"
              style={{ marginLeft: 8, padding: "4px 10px", fontSize: 12 }}
              onClick={onConnectWallet}
              disabled={walletLoading}
            >
              {walletLoading
                ? "Đang gắn ví..."
                : student?.wallet
                ? "Tạo ví mới (demo)"
                : "Gắn ví (demo)"}
            </button>
          </div>

          {walletError && (
            <div className="note" style={{ marginTop: 6, color: "red" }}>
              {walletError}
            </div>
          )}
          {walletMsg && (
            <div className="note" style={{ marginTop: 6 }}>
              {walletMsg}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
