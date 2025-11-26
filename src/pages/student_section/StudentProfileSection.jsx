// src/pages/student_section/StudentProfileSection.jsx
import React, { useState } from "react";
import api from "../../lib/api";

export default function StudentProfileSection({
  student,
  displayName,
  displayEmail,
  walletLoading,
  walletError,
  walletMsg,
  onConnectWallet, // dùng ví demo (đã được truyền từ StudentDashboard)
}) {
  const [mmLoading, setMmLoading] = useState(false);
  const [mmError, setMmError] = useState("");

  const shortAddress = (addr) =>
    typeof addr === "string" && addr.length > 12
      ? addr.slice(0, 6) + "..." + addr.slice(-4)
      : addr;

const handleConnectMetaMask = async () => {
  setMmError("");

  if (!window.ethereum) {
    setMmError("Không tìm thấy MetaMask. Vui lòng cài extension trước.");
    return;
  }

  try {
    setMmLoading(true);

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const addr = accounts?.[0];
    if (!addr) {
      setMmError("Không nhận được địa chỉ ví từ MetaMask.");
      return;
    }

    // Dùng axios với baseURL = VITE_API_URL (http://localhost:4000)
    await api.post(`/api/students/${student._id}/connect-wallet`, {
      mode: "custom",
      address: addr,
    });

    window.location.reload();
  } catch (e) {
    console.error(e);
    setMmError(
      e.response?.data?.message || e.message || "Kết nối MetaMask thất bại."
    );
  } finally {
    setMmLoading(false);
  }
};

  return (
    <section className="panel">
      <h3 className="panel-title">Hồ sơ & Ví blockchain</h3>

      <div className="student-profile-grid">
        <div className="student-profile-left">
        <div>
          <p>Họ tên</p>
          <p className="student-profile-value">
            {student?.fullName || displayName}
          </p>

          <p>Email</p>
          <p className="student-profile-value">
            {student?.email || displayEmail}
          </p>
        </div>
        </div>

        <div className="student-wallet-section">
          <p className="student-wallet-title">Ví blockchain</p>
          <p className="muted">
            Ví dùng để nhận NFT bằng cấp / chứng chỉ trên EduChain.
          </p>

          <div style={{ marginTop: 8, marginBottom: 12 }}>
            {student?.wallet ? (
              <code className="chip mono">
                Địa chỉ ví: {shortAddress(student.wallet)}
              </code>
            ) : (
              <span className="muted">
                Bạn chưa có ví. Hãy kết nối MetaMask hoặc dùng ví demo.
              </span>
            )}
          </div>

          {/* Nút Kết nối MetaMask */}
          <button
            type="button"
            className="btn-primary"
            disabled={walletLoading || mmLoading}
            onClick={handleConnectMetaMask}
            style={{ width: "100%" }}
          >
            {mmLoading || walletLoading
              ? "Đang kết nối MetaMask..."
              : student?.wallet
              ? "Đổi ví MetaMask"
              : "Kết nối MetaMask"}
          </button>

          {/* Nút Dùng ví demo: CHỈ hiển thị khi CHƯA có ví */}
          {!student?.wallet && (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 8 }}
              disabled={walletLoading}
              onClick={onConnectWallet}
            >
              Dùng ví demo
            </button>
          )}

          {/* Thông báo lỗi / message */}
          {(walletError || mmError) && (
            <p className="error" style={{ marginTop: 8 }}>
              {walletError || mmError}
            </p>
          )}
          {walletMsg && !walletError && !mmError && (
            <p className="note" style={{ marginTop: 8 }}>
              {walletMsg}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
