// src/components/student/StudentRecordsSection.jsx
import React from "react";
import { FileText, Hash, Link as LinkIcon } from "lucide-react";

export default function StudentRecordsSection({ records, onCopyLink }) {
  return (
    <section className="panel">
      <h3 className="panel-title">Điểm của tôi (Blockchain demo)</h3>
      {records.length === 0 ? (
        <p>Chưa có điểm nào được ghi nhận.</p>
      ) : (
        <div className="list">
          {records.map((r) => (
            <div key={r._id} className="item item-hover">
              <div className="item-left">
                <FileText size={18} />
                <div>
                  <div className="item-title">{r.subject}</div>
                  <div className="item-sub">Học kỳ: {r.semester}</div>
                </div>
              </div>
              <div className="item-right">
                <div className="score">
                  {typeof r.grade === "number"
                    ? r.grade.toFixed(1)
                    : r.grade}
                </div>
                {r.txHash && (
                  <>
                    <div className="item-sub" style={{ display: "flex", gap: 6 }}>
                      <Hash size={14} color="#9ca3af" />
                      <code className="chip mono">{r.txHash}</code>
                    </div>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => onCopyLink(r.txHash)}
                      title="Copy link verify"
                    >
                      <LinkIcon size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
