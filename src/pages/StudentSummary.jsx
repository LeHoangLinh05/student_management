// src/pages/StudentSummary.jsx
import React from "react";
import { Users, Check, Award } from "lucide-react";

export default function StudentSummary({ student }) {
  return (
    <section className="student-summary-grid">
      <div className="card">
        <div className="student-summary-item">
          <div className="icon-ghost icon-indigo">
            <Users />
          </div>
          <div>
            <div className="muted">Mã sinh viên</div>
            <div className="stat">{student?.code}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="student-summary-item">
          <div className="icon-ghost student-icon-green">
            <Check />
          </div>
          <div>
            <div className="muted">Trạng thái</div>
            <div className="stat">
              {student?.status === "graduated" ? "Đã tốt nghiệp" : "Đang học"}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="student-summary-item">
          <div className="icon-ghost student-icon-purple">
            <Award />
          </div>
          <div>
            <div className="muted">Chương trình</div>
            <div className="stat">{student?.major || "Đang cập nhật"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
