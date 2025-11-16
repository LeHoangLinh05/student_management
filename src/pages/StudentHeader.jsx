
import React from "react";

export default function StudentHeader({
  title,
  subtitle,
  displayName,
  displayEmail,
  onLogout,
}) {
  return (
    <header className="student-header">
      <div>
        <h1 className="student-title">{title}</h1>
        <p className="student-subtitle">{subtitle}</p>
      </div>

      <div className="student-user">
        <div className="student-user-name">{displayName}</div>
        <div className="student-user-email">{displayEmail}</div>
        <button className="student-logout-btn" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
