import React, { useEffect, useState } from "react";
import { FileText, Check, Hash, Eye } from "lucide-react";
import api from "../lib/api.js";

export default function Records() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchCode, setSearchCode] = useState("");

  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [semester, setSemester] = useState("HK1 2024-2025");

  // 🔹 load danh sách sinh viên để search theo mã SV
  useEffect(() => {
    (async () => {
      try {
        const sRes = await api.get("/api/students");
        setStudents(sRes.data || []);
      } catch (err) {
        console.error("API error (students):", err.response?.data || err.message);
      }
    })();
  }, []);

  // 🔍 tìm sinh viên theo mã SV
  const handleSearchStudent = async () => {
    setError("");
    setRecords([]);
    setSelectedStudent(null);

    const code = searchCode.trim();
    if (!code) {
      setError("Vui lòng nhập mã sinh viên để tìm.");
      return;
    }

    const s = students.find((st) => st.code === code);
    if (!s) {
      setError(`Không tìm thấy sinh viên với mã: ${code}`);
      return;
    }

    setSelectedStudent(s);
    await loadRecords(s._id);
  };

  // 🔹 load lịch sử điểm của 1 sinh viên
  const loadRecords = async (studentId) => {
    try {
      setLoading(true);
      setError("");
      const rRes = await api.get(`/api/records/${studentId}`);
      setRecords(rRes.data || []);
    } catch (err) {
      console.error("API error (records):", err.response?.data || err.message);
      setError(err.response?.data?.message || "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // ➕ thêm điểm mới cho sinh viên đang chọn
  const onAddRecord = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setError("Vui lòng chọn sinh viên trước khi ghi điểm.");
      return;
    }
    if (!subject || !grade) {
      setError("Vui lòng nhập môn học và điểm.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await api.post("/api/records", {
        studentId: selectedStudent._id,
        subject,
        grade: Number(grade),
        semester,
      });

      await loadRecords(selectedStudent._id);

      setSubject("");
      setGrade("");
      setSemester("HK1 2024-2025");
    } catch (err) {
      console.error("API error (add record):", err.response?.data || err.message);
      setError(err.response?.data?.message || "Ghi điểm thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Cập nhật Học bạ & Điểm</h2>

      <section className="panel">
        <h3 className="panel-title">Thông tin sinh viên</h3>

        {/* Tìm sinh viên theo mã SV */}
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
          {selectedStudent && (
            <div className="note" style={{ marginTop: 8 }}>
              Đang chọn:{" "}
              <strong>
                {selectedStudent.fullName} ({selectedStudent.code})
              </strong>
            </div>
          )}
        </div>

        {selectedStudent ? (
          <>
            {/* Card info SV */}
            <div className="student-head">
              <div className="avatar-lg">
                {selectedStudent.fullName
                  ?.split(" ")
                  .slice(-2)
                  .map((s) => s[0])
                  .join("") || "SV"}
              </div>

              <div className="student-meta">
                <div className="student-name">{selectedStudent.fullName}</div>
                <div className="student-id">Mã SV: {selectedStudent.code}</div>

                <div className="student-row">
                  <Hash size={16} color="#9aa2b1" />
                  <code className="chip mono">
                    {selectedStudent.wallet || "Chưa được gán ví"}
                  </code>
                  <span className="ok">
                    <Check size={14} /> Đã xác thực
                  </span>
                </div>
              </div>
            </div>

            <div className="divider" />

            {/* Form thêm điểm */}
            <h3 className="sub">Thêm điểm mới</h3>
            <form className="form-3" onSubmit={onAddRecord}>
              <label className="form-group">
                <span>Môn học</span>
                <input
                  className="input"
                  placeholder="Lập trình Web"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </label>

              <label className="form-group">
                <span>Điểm số</span>
                <input
                  className="input"
                  type="number"
                  step="0.1"
                  placeholder="9.5"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </label>

              <label className="form-group">
                <span>Học kỳ</span>
                <select
                  className="select"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option>HK1 2024-2025</option>
                  <option>HK2 2024-2025</option>
                </select>
              </label>

              <button
                className="btn-primary"
                style={{ width: 220 }}
                disabled={loading}
              >
                {loading ? "Đang ghi..." : "Ghi lên Blockchain"}
              </button>
            </form>

            {error && (
              <div className="note hint" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}
          </>
        ) : (
          <div className="muted">
            Vui lòng nhập mã sinh viên và bấm <b>Tìm</b> để bắt đầu cập nhật điểm.
          </div>
        )}
      </section>

      {/* History */}
      <section className="panel">
        <h3 className="panel-title">Lịch sử điểm đã ghi</h3>

        {loading && <div className="muted">Đang tải...</div>}
        {!loading && selectedStudent && records.length === 0 && (
          <div className="muted">Chưa có bản ghi điểm cho sinh viên này.</div>
        )}
        {!selectedStudent && (
          <div className="muted">
            Chưa có sinh viên nào được chọn. Hãy tìm theo mã SV phía trên.
          </div>
        )}

        {selectedStudent && (
          <div className="list">
            {records.map((r, i) => (
              <div className="item item-hover" key={r._id || i}>
                <div className="item-left">
                  <div className="icon-ghost icon-indigo">
                    <FileText />
                  </div>
                  <div>
                    <div className="item-title">{r.subject}</div>
                    <div className="item-sub">
                      {r.semester} •{" "}
                      {new Date(r.createdAt || r.date).toLocaleDateString(
                        "vi-VN"
                      )}
                    </div>
                  </div>
                </div>

                <div className="item-right">
                  <div className="score">{r.grade}</div>
                  <code className="chip mono">
                    {r.txHash || r.hash || "—"}
                  </code>
                  <button className="icon-btn" title="Xem chi tiết">
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
