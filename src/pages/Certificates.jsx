import React, { useEffect, useState } from "react";
import { Award, Shield, QrCode, Hash } from "lucide-react";
import api from "../lib/api.js";
import "../styles/Certificates.css";

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [graduating, setGraduating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [visibleQrCertId, setVisibleQrCertId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/students");
        setStudents(res.data || []);
      } catch (err) {
        console.error("Lỗi khi tải students:", err);
      }
    })();
  }, []);
  
  const toggleQrCodeVisibility = (certId) => {
    setVisibleQrCertId(prevId => (prevId === certId ? null : certId));
  };

  const handleSearchStudent = async () => {
    setError("");
    setMessage("");
    setCerts([]);
    setSelectedStudent(null);
    setVisibleQrCertId(null);

    const code = searchCode.trim();
    if (!code) {
      setError("Vui lòng nhập mã sinh viên để tìm.");
      return;
    }

    const found = students.find((s) => s.code === code);
    if (!found) {
      setError(`Không tìm thấy sinh viên với mã: ${code}`);
      return;
    }

    setSelectedStudent(found);
    await fetchCertificates(found._id);
  };

  const fetchCertificates = async (studentId) => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/api/certificates/${studentId}`);
      setCerts(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải certificates:", err);
      setError(err.response?.data?.message || "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCertificate = async () => {
    setError("");
    setMessage("");
    if (!selectedStudent) {
      setError("Vui lòng tìm và chọn sinh viên trước khi cấp bằng.");
      return;
    }
    if (!type || !date) {
      setError("Vui lòng nhập Loại bằng và Ngày cấp.");
      return;
    }
    try {
      setCreating(true);
      await api.post("/api/certificates", {
        studentId: selectedStudent._id,
        type,
        date,
      });
      setMessage(`Đã cấp bằng cho ${selectedStudent.fullName} (${selectedStudent.code}).`);
      setType("");
      setDate("");
      await fetchCertificates(selectedStudent._id);
    } catch (err) {
      console.error("Lỗi khi tạo certificate:", err);
      setError(err.response?.data?.message || "Không thể tạo bằng cấp. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
  };

  const handleGraduate = async () => {
    setError("");
    setMessage("");
    if (!selectedStudent) {
      setError("Vui lòng tìm và chọn sinh viên trước.");
      return;
    }
    try {
      setGraduating(true);
      await api.post("/api/certificates/graduate", {
        studentId: selectedStudent._id,
        date: date || undefined,
      });
      setMessage(`Đã xác nhận tốt nghiệp & cấp Bằng tốt nghiệp cho ${selectedStudent.fullName} (${selectedStudent.code}).`);
      await fetchCertificates(selectedStudent._id);
    } catch (err) {
      console.error("Lỗi khi xác nhận tốt nghiệp:", err);
      setError(err.response?.data?.message || "Không thể xác nhận tốt nghiệp. Vui lòng thử lại.");
    } finally {
      setGraduating(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Quản lý Bằng cấp & Chứng chỉ</h2>
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Cấp bằng & chứng chỉ</h3>
          <p className="muted">
            Tìm sinh viên bằng mã SV, sau đó cấp bằng / chứng chỉ hoặc xác nhận tốt nghiệp.
          </p>
        </div>
        <div className="form-group cert-search-group">
          <label>Tìm sinh viên theo Mã SV</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Nhập mã SV, ví dụ: 23021607"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
            <button className="btn-primary" type="button" onClick={handleSearchStudent}>
              Tìm
            </button>
          </div>
        </div>
        {selectedStudent && (
          <div className="card cert-student-card">
            <div className="avatar-lg">
              {selectedStudent.fullName?.split(" ").slice(-2).map((s) => s[0]).join("").toUpperCase() || "SV"}
            </div>
            <div className="cert-student-info">
              <div className="cert-student-name">{selectedStudent.fullName}</div>
              <div className="muted">Mã SV: {selectedStudent.code}</div>
              <div className="cert-student-wallet">
                <Hash size={14} color="#9ca3af" />
                <code className="chip mono">{selectedStudent.wallet || "Chưa được gán ví blockchain"}</code>
              </div>
            </div>
          </div>
        )}
        <div className="grid-2">
          <div>
            <div className="form-group">
              <label>Loại bằng / chứng chỉ</label>
              <input
                className="input"
                placeholder="Bằng Kỹ sư CNTT, Chứng chỉ AI..."
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={!selectedStudent}
              />
            </div>
            <div className="form-group">
              <label>Ngày cấp</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!selectedStudent}
              />
            </div>
            <div className="cert-actions-wrapper">
              <button
                className="btn-primary"
                type="button"
                onClick={handleCreateCertificate}
                disabled={creating || !selectedStudent}
              >
                {creating ? "Đang tạo..." : "Tạo bằng / chứng chỉ"}
              </button>
              <button
                className="btn-primary btn-graduate"
                type="button"
                onClick={handleGraduate}
                disabled={graduating || !selectedStudent}
              >
                {graduating ? "Đang xác nhận..." : "Xác nhận tốt nghiệp & cấp Bằng tốt nghiệp"}
              </button>
            </div>
          </div>
          <div className="card cert-ipfs-card">
            <div className="cert-ipfs-header">
              <Shield size={20} />
              <span className="cert-ipfs-title">Lưu trữ phân tán (IPFS)</span>
            </div>
            <p className="muted cert-ipfs-desc"></p>
            <button className="btn-primary btn-ipfs-disabled" disabled>
              Tải lên IPFS (coming soon)
            </button>
          </div>
        </div>
        {error && <p className="error cert-feedback-msg">{error}</p>}
        {message && <p className="note cert-feedback-msg">{message}</p>}
      </section>
      <section className="panel">
        <h3 className="panel-title">Bằng cấp đã cấp</h3>
        {selectedStudent && (
          <p className="muted cert-list-student-info">
            Sinh viên: <strong>{selectedStudent.fullName} ({selectedStudent.code})</strong>
          </p>
        )}
        {loading && <p className="muted">Đang tải...</p>}
        <div className="grid-2">
          {selectedStudent ? (
            certs.length > 0 ? (
              certs.map((c) => (
                <div className="card" key={c._id}>
                  <div className="cert-item-header">
                    <div>
                      <div className="cert-item-details">{c.type}</div>
                      <div className="cert-item-date">
                        Ngày cấp: {c.date ? new Date(c.date).toLocaleDateString("vi-VN") : new Date(c.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <span className="badge green">Đã cấp</span>
                  </div>
                  <div className="cert-item-nft-row">
                    <span>Mã NFT nội bộ</span>
                    <code className="mono cert-item-nft-code">{c.nftCode || c._id}</code>
                  </div>
                  <div className="cert-item-actions">
                    <button className="btn-primary btn-qr" onClick={() => toggleQrCodeVisibility(c._id)}>
                      <QrCode size={16} /> QR Code
                    </button>
                    <button className="btn-primary">Chi tiết</button>
                  </div>
                  {visibleQrCertId === c._id && (
                    <div className="cert-qr-details">
                      {c.txHash && (
                        <div className="cert-hash-row">
                          <Hash size={14} />
                          <code className="chip mono">{c.txHash}</code>
                        </div>
                      )}
                      {(c.txHash || c.ipfsCid) && (
                        <div className="cert-qr-row">
                          <img
                            className="cert-qr-img"
                            alt="QR verify"
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`${window.location.origin}/verify?hash=${encodeURIComponent(c.txHash || c.ipfsCid)}`)}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              !loading && <p className="muted">Chưa có bằng cấp nào được cấp cho sinh viên này.</p>
            )
          ) : (
            <p className="muted">Vui lòng tìm sinh viên theo mã SV để xem danh sách bằng đã cấp.</p>
          )}
        </div>
      </section>
    </div>
  );
}