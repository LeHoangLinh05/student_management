import React from "react";
import { Activity } from "lucide-react";

export default function StudentAuditLogSection({ logs }) {
  const hasLogs = logs && logs.length > 0;

  if (!hasLogs) {
    return (
      <section className="panel">
        <h3 className="panel-title">Lịch sử truy vấn & xác thực</h3>
        <p>Chưa có lịch sử nào được ghi nhận.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h3 className="panel-title">Lịch sử truy vấn & xác thực</h3>

      <div className="list">
        {logs.map((log) => {
          const requester =
            log.company ||              
            log.requestedByName ||     
            log.requestedByEmail ||     
            "Đơn vị / người truy vấn không xác định";

          const credentialType =
            log.credentialType === "degree"
              ? "bằng cấp"
              : log.credentialType === "certificate"
              ? "chứng chỉ"
              : "hồ sơ";

          const credentialLabel =
            log.credentialName ||
            log.recordName ||
            log.subject ||
            log.credentialId ||
            "";

          // Thời gian
          const createdAt = log.createdAt
            ? new Date(log.createdAt).toLocaleString("vi-VN")
            : null;

          // Trạng thái
          const status = log.status || log.result || "OK";
          const isOk = status === "OK" || status === "valid";

          return (
            <div key={log._id || log.id} className="item">
              <div className="item-left">
                <Activity size={18} />
              </div>

              <div className="item-middle">
                <div className="item-title">{requester}</div>

                <div className="item-sub">
                  <span>
                    Truy vấn {credentialType}
                    {credentialLabel ? `: ${credentialLabel}` : ""}
                  </span>
                  {createdAt && (
                    <>
                      {" · "}
                      <time>{createdAt}</time>
                    </>
                  )}
                </div>
              </div>

              <div className="item-right">
                <span className={`badge ${isOk ? "green" : "red"}`}>
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
