import React from "react";
import { Users, Check, Award, Upload } from "lucide-react";
import api from "../lib/api.js";

export default function Profile() {
  const [students, setStudents] = React.useState([]);
  const [fullName, setFullName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [dob, setDob] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");


  React.useEffect(() => {
    api
      .get("/api/students")
      .then((res) => setStudents(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleCreateStudent = async () => {
    setError("");
    setMessage("");

    if (!fullName || !code || !email || !dob) {
      setError("Vui lòng nhập đầy đủ Họ tên, Mã SV, Email, Ngày sinh.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/students", {
        fullName,
        code,
        email,
        dob, 
      });

      setMessage(
        "Đã tạo hồ sơ sinh viên. Sinh viên đăng nhập bằng Email + Mã sinh viên làm mật khẩu."
      );

      setFullName("");
      setCode("");
      setEmail("");
      setDob("");

      const res = await api.get("/api/students");
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Tạo hồ sơ sinh viên thất bại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Hồ sơ Sinh viên</h2>

      <div className="grid-3">
        <div className="card stat">
          <div className="icon-ghost icon-indigo">
            <Users />
          </div>
          <div>
            <div className="value">{students.length}</div>
            <div className="label">Tổng sinh viên</div>
          </div>
        </div>

        <div className="card stat">
          <div className="icon-ghost icon-green">
            <Check />
          </div>
          <div>
            <div className="value">856</div>
            <div className="label">Đã xác thực</div>
          </div>
        </div>

        <div className="card stat">
          <div className="icon-ghost icon-purple">
            <Award />
          </div>
          <div>
            <div className="value">423</div>
            <div className="label">Bằng cấp đã cấp</div>
          </div>
        </div>
      </div>

      <section className="section">
        <h3>Đăng ký sinh viên mới</h3>

        <div className="grid-2">
          <div className="form-group">
            <label>Họ và tên *</label>
            <input
              className="input"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Mã sinh viên * (đồng thời là mật khẩu)</label>
            <input
              className="input"
              placeholder="SV2024001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              className="input"
              type="email"
              placeholder="student@university.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Ngày sinh *</label>
            <input
              className="date"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <div className="dropzone">
              <Upload />
              <div className="hint">Tải lên hồ sơ sinh viên (tuỳ chọn)</div>
              <div className="sub">PDF, DOC, DOCX (Max 5MB)</div>
            </div>
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          onClick={handleCreateStudent}
          disabled={loading}
        >
          <Upload />
          {loading ? "Đang tạo..." : "Tạo hồ sơ & Cấp tài khoản"}
        </button>

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

        <div className="note" style={{ marginTop: 8 }}>
          <strong>Lưu ý:</strong> Sinh viên đăng nhập bằng <b>Email</b> và{" "}
          <b>Mã sinh viên (mật khẩu mặc định)</b>. 
        </div>
      </section>
    </div>
  );
}
