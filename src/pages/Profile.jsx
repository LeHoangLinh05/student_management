import React from "react";
import { Users, Check, Award, Upload } from "lucide-react";
import api from "../lib/api.js";

export default function Profile() {
    const [students, setStudents] = React.useState([]);

    React.useEffect(() => {
        api.get("/api/students")
        .then(res => setStudents(res.data))
        .catch(console.error);
    }, []);

  return (
    <div>
      <h2 className="page-title">Hồ sơ Sinh viên</h2>

      <div className="grid-3">
        <div className="card stat">
          <div className="icon-ghost icon-indigo">
            <Users />
          </div>
          <div>
            <div className="value">1,234</div>
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
            <input className="input" placeholder="Nguyễn Văn A" />
          </div>

          <div className="form-group">
            <label>Mã sinh viên *</label>
            <input className="input" placeholder="SV2024001" />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              className="input"
              type="email"
              placeholder="student@university.edu.vn"
            />
          </div>

          <div className="form-group">
            <label>Ngày sinh *</label>
            <input className="date" type="date" />
          </div>

          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <div className="dropzone">
              <Upload />
              <div className="hint">Tải lên hồ sơ sinh viên</div>
              <div className="sub">PDF, DOC, DOCX (Max 5MB)</div>
            </div>
          </div>
        </div>

        <button className="btn-primary" style={{ marginTop: 16 }}>
          <Upload />
          Tạo hồ sơ & Cấp địa chỉ Blockchain
        </button>

        <div className="note">
          <strong>Lưu ý:</strong> Sau khi tạo hồ sơ, sinh viên sẽ được cấp một
          địa chỉ ví blockchain duy nhất.
        </div>
      </section>
    </div>
  );
}
