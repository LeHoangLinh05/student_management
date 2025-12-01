import React from "react";
import { Users, Check, Award, Upload } from "lucide-react";
import api from "../lib/api.js";
import "../styles/profile.css";
export default function Profile() {
  const [file, setFile] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const [students, setStudents] = React.useState([]);
  const [certificates, setCertificates] = React.useState([]);
  const [fullName, setFullName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const fetchData = async () => {
    try {
      const [studentsRes, certsRes] = await Promise.all([
        api.get("/api/students"),
        api.get("/api/certificates"),
      ]);
      setStudents(studentsRes.data || []);
      setCertificates(certsRes.data || []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu dashboard:", err);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
  const selected = e.target.files?.[0];
  if (!selected) return;

  setError("");
  setMessage("");

  // validate loại file
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(selected.type)) {
    setError("Chỉ cho phép PDF, DOC, DOCX.");
    setFile(null);
    return;
  }

  // validate dung lượng (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (selected.size > maxSize) {
    setError("File vượt quá 5MB.");
    setFile(null);
    return;
  }

  setFile(selected);
};

  const handleCreateStudent = async () => {
  setError("");
  setMessage("");

  if (!fullName || !code || !email || !dob) {
    setError("Vui lòng nhập đầy đủ Họ tên, Mã SV, Email, Ngày sinh.");
    return;
  }

  try {
    setLoading(true);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("code", code);
    formData.append("email", email);
    formData.append("dob", dob);
    if (file) {
      formData.append("file", file); // tên field tuỳ backend bạn quy ước
    }

    await api.post("/api/students", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    setMessage(
      "Đã tạo hồ sơ sinh viên. Sinh viên đăng nhập bằng Email + Mã sinh viên làm mật khẩu."
    );
    setFullName("");
    setCode("");
    setEmail("");
    setDob("");
    setFile(null); // reset file

    await fetchData();
  } catch (err) {
    console.error(err);
    setError(
      err.response?.data?.message || "Tạo hồ sơ sinh viên thất bại."
    );
  } finally {
    setLoading(false);
  }
};


  const verifiedStudentsCount = students.filter(s => s.wallet).length;

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
            <div className="value">{verifiedStudentsCount}</div>
            <div className="label">Đã xác thực</div>
          </div>
        </div>

        <div className="card stat">
          <div className="icon-ghost icon-purple">
            <Award />
          </div>
          <div>
            <div className="value">{certificates.length}</div>
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
  <div
    className="dropzone"
    onClick={() => fileInputRef.current?.click()}
    style={{ cursor: "pointer" }}
  >
    <Upload />
    <div className="hint">Tải lên hồ sơ sinh viên (tuỳ chọn)</div>
    <div className="sub">
      {file ? file.name : "PDF, DOC, DOCX (Max 5MB)"}
    </div>

    <input
      ref={fileInputRef}
      type="file"
      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      style={{ display: "none" }}
      onChange={handleFileChange}
    />
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