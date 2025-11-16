import React, { useEffect, useState } from "react";
import { Award, Shield, QrCode, Hash } from "lucide-react";
import api from "../lib/api.js";

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

  // Lấy danh sách sinh viên để search theo mã SV
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

  // Tìm sinh viên theo mã SV
  const handleSearchStudent = async () => {
    setError("");
    setMessage("");
    setCerts([]);
    setSelectedStudent(null);

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

  // Lấy bằng cấp của 1 sinh viên
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

  // Cấp bằng / chứng chỉ thường
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

      setMessage(
        `Đã cấp bằng cho ${selectedStudent.fullName} (${selectedStudent.code}).`
      );
      setType("");
      setDate("");

      await fetchCertificates(selectedStudent._id);
    } catch (err) {
      console.error("Lỗi khi tạo certificate:", err);
      setError(
        err.response?.data?.message ||
          "Không thể tạo bằng cấp. Vui lòng thử lại."
      );
    } finally {
      setCreating(false);
    }
  };

  // Xác nhận tốt nghiệp & cấp Bằng tốt nghiệp
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
        date: date || undefined, // dùng ngày đang chọn nếu có
      });

      setMessage(
        `Đã xác nhận tốt nghiệp & cấp Bằng tốt nghiệp cho ${selectedStudent.fullName} (${selectedStudent.code}).`
      );

      await fetchCertificates(selectedStudent._id);
    } catch (err) {
      console.error("Lỗi khi xác nhận tốt nghiệp:", err);
      setError(
        err.response?.data?.message ||
          "Không thể xác nhận tốt nghiệp. Vui lòng thử lại."
      );
    } finally {
      setGraduating(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Quản lý Bằng cấp & Chứng chỉ</h2>

      {/* PANEL TRÊN: tìm SV + cấp bằng */}
      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Cấp bằng & chứng chỉ</h3>
          <p className="muted">
            Tìm sinh viên bằng mã SV, sau đó cấp bằng / chứng chỉ hoặc xác nhận tốt nghiệp.
          </p>
        </div>

        {/* Hàng tìm kiếm */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Tìm sinh viên theo Mã SV</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Nhập mã SV, ví dụ: 23021607"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
            <button
              className="btn-primary"
              type="button"
              onClick={handleSearchStudent}
            >
              Tìm
            </button>
          </div>
        </div>

        {/* Thông tin sinh viên đang chọn */}
        {selectedStudent && (
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div className="avatar-lg">
              {selectedStudent.fullName
                ?.split(" ")
                .slice(-2)
                .map((s) => s[0])
                .join("")
                .toUpperCase() || "SV"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {selectedStudent.fullName}
              </div>
              <div className="muted">Mã SV: {selectedStudent.code}</div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}
              >
                <Hash size={14} color="#9ca3af" />
                <code className="chip mono">
                  {selectedStudent.wallet || "Chưa được gán ví blockchain"}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Form chính: bên trái là cấp bằng, bên phải là IPFS / giải thích */}
        <div className="grid-2">
          {/* Cột trái: form cấp bằng */}
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

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-primary"
                type="button"
                onClick={handleCreateCertificate}
                disabled={creating || !selectedStudent}
              >
                {creating ? "Đang tạo..." : "Tạo bằng / chứng chỉ"}
              </button>

              <button
                className="btn-primary"
                type="button"
                onClick={handleGraduate}
                disabled={graduating || !selectedStudent}
                style={{ backgroundColor: "#22c55e" }}
              >
                {graduating
                  ? "Đang xác nhận..."
                  : "Xác nhận tốt nghiệp & cấp Bằng tốt nghiệp"}
              </button>
            </div>
          </div>

          {/* Cột phải: giải thích / IPFS */}
          <div className="card" style={{ background: "#0f172a", color: "#e5e7eb" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <Shield size={20} />
              <span style={{ fontWeight: 600 }}>Lưu trữ phân tán (IPFS)</span>
            </div>
            <p className="muted" style={{ color: "#cbd5f5", marginBottom: 8 }}>
              Hiện tại đang ở chế độ demo, chưa gắn IPFS thật. Sau này bạn có thể
              upload file bằng cấp lên IPFS và lưu hash vào trường{" "}
              <code>ipfsCid</code>.
            </p>
            <button
              className="btn-primary"
              style={{
                width: "100%",
                opacity: 0.6,
                cursor: "not-allowed",
              }}
              disabled
            >
              Tải lên IPFS (coming soon)
            </button>
          </div>
        </div>

        {error && (
          <p className="error" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
        {message && (
          <p className="note" style={{ marginTop: 8 }}>
            {message}
          </p>
        )}
      </section>

      {/* PANEL DƯỚI: danh sách bằng đã cấp */}
      <section className="panel">
        <h3 className="panel-title">Bằng cấp đã cấp</h3>

        {selectedStudent && (
          <p className="muted" style={{ marginBottom: 8 }}>
            Sinh viên:{" "}
            <strong>
              {selectedStudent.fullName} ({selectedStudent.code})
            </strong>
          </p>
        )}

        {loading && <p className="muted">Đang tải...</p>}

        <div className="grid-2">
          {selectedStudent ? (
            certs.length > 0 ? (
              certs.map((c) => (
                <div className="card" key={c._id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>
                        {c.type}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>
                        Ngày cấp:{" "}
                        {c.date
                          ? new Date(c.date).toLocaleDateString("vi-VN")
                          : new Date(c.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                    <span className="badge green">Đã cấp</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      margin: "6px 0",
                      color: "#64748b",
                      fontSize: 13,
                    }}
                  >
                    <span>Mã NFT nội bộ</span>
                    <code
                      className="mono"
                      style={{ color: "#4f46e5", fontWeight: 700 }}
                    >
                      {c.nftCode || c._id}
                    </code>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button
                      className="btn-primary"
                      style={{ background: "#eef2ff", color: "#30336b" }}
                    >
                      <QrCode size={16} /> QR Code
                    </button>
                    <button className="btn-primary">Chi tiết</button>
                  </div>
                  <div className="cert-meta">
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
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                                `${window.location.origin}/verify?hash=${encodeURIComponent(
                                c.txHash || c.ipfsCid
                              )}`
                          )}`}
                        />
                      </div>
                    )}
                  </div>

                </div>
              ))
            ) : (
              !loading && (
                <p className="muted">
                  Chưa có bằng cấp nào được cấp cho sinh viên này.
                </p>
              )
            )
          ) : (
            <p className="muted">
              Vui lòng tìm sinh viên theo mã SV để xem danh sách bằng đã cấp.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
