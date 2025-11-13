import React, { useEffect, useState } from "react";
import { FileText, Check, Hash, Eye } from "lucide-react";
import api from "../lib/api.js"; 

export default function Records() {
  const [student, setStudent] = useState(null);     
  const [records, setRecords] = useState([]);        
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [subject, setSubject]   = useState("");
  const [grade, setGrade]       = useState("");
  const [semester, setSemester] = useState("HK1 2024-2025");
  const loadStudentAndRecords = async () => {
    try {
      setError("");
      setLoading(true);

      // Lấy 1 sinh viên mẫu 
      const sRes = await api.get("/api/students");
      const s = sRes.data?.[0];
      if (!s) {
        setStudent(null);
        setRecords([]);
        return;
      }
      setStudent(s);

      // lịch sử điểm
      const rRes = await api.get(`/api/records/${s._id}`);
      setRecords(rRes.data || []);
    } catch (err) {
      console.error("API error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadStudentAndRecords();
    })();
  }, []);

  const onAddRecord = async (e) => {
    e.preventDefault();
    if (!student) return;
    if (!subject || !grade) {
      setError("Vui lòng nhập môn học và điểm.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await api.post("/api/records", {
        studentId: student._id,
        subject,
        grade: Number(grade),
        semester,
      });
      const rRes = await api.get(`/api/records/${student._id}`);
      setRecords(rRes.data || []);
      setSubject("");
      setGrade("");
      setSemester("HK1 2024-2025");
    } catch (err) {
      console.error("API error:", err.response?.data || err.message);
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

        {student ? (
          <>
            <div className="student-head">
              <div className="avatar-lg">
                {student.fullName?.split(" ").slice(-2).map(s=>s[0]).join("") || "SV"}
              </div>

              <div className="student-meta">
                <div className="student-name">{student.fullName}</div>
                <div className="student-id">Mã SV: {student.code}</div>

                <div className="student-row">
                  <Hash size={16} color="#9aa2b1" />
                  <code className="chip mono">{student.wallet || "0x742d...8f3c"}</code>
                  <span className="ok">
                    <Check size={14}/> Đã xác thực
                  </span>
                </div>
              </div>
            </div>

            <div className="divider" />

            <h3 className="sub">Thêm điểm mới</h3>
            <form className="form-3" onSubmit={onAddRecord}>
              <label className="form-group">
                <span>Môn học</span>
                <input
                  className="input"
                  placeholder="Lập trình Web"
                  value={subject}
                  onChange={(e)=>setSubject(e.target.value)}
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
                  onChange={(e)=>setGrade(e.target.value)}
                />
              </label>

              <label className="form-group">
                <span>Học kỳ</span>
                <select
                  className="select"
                  value={semester}
                  onChange={(e)=>setSemester(e.target.value)}
                >
                  <option>HK1 2024-2025</option>
                  <option>HK2 2024-2025</option>
                </select>
              </label>

              <button className="btn-primary" style={{ width: 220 }} disabled={loading}>
                {loading ? "Đang ghi..." : "Ghi lên Blockchain"}
              </button>
            </form>

            {error && <div className="note hint" style={{marginTop:12}}>{error}</div>}
          </>
        ) : (
          <div className="muted">Chưa có dữ liệu sinh viên.</div>
        )}
      </section>

      {/* History */}
      <section className="panel">
        <h3 className="panel-title">Lịch sử điểm đã ghi</h3>

        {loading && <div className="muted">Đang tải...</div>}
        {!loading && records.length === 0 && (
          <div className="muted">Chưa có bản ghi điểm.</div>
        )}

        <div className="list">
          {records.map((r, i) => (
            <div className="item item-hover" key={r._id || i}>
              <div className="item-left">
                <div className="icon-ghost icon-indigo"><FileText/></div>
                <div>
                  <div className="item-title">{r.subject}</div>
                  <div className="item-sub">
                    {r.semester} • {new Date(r.createdAt || r.date).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>

              <div className="item-right">
                <div className="score">{r.grade}</div>
                <code className="chip mono">{r.txHash || r.hash || "—"}</code>
                <button className="icon-btn" title="Xem chi tiết">
                  <Eye size={18}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
