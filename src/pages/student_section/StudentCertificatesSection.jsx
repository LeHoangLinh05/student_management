import { Award, Hash, Link as LinkIcon } from "lucide-react";

export default function StudentCertificatesSection({ certs, onCopyLink }) {
  return (
    <section className="panel">
      <h3 className="panel-title">Bằng cấp & Chứng chỉ</h3>

      {certs.length === 0 ? (
        <p>Chưa có bằng cấp / chứng chỉ nào.</p>
      ) : (
        <div className="student-certs-grid">
          {certs.map((c) => {
            const hash = c.txHash || c.ipfsCid;
            const verifyUrl = hash
              ? `${window.location.origin}/verify?hash=${encodeURIComponent(hash)}`
              : "";

            return (
              <div key={c._id} className="card">

                {hash && (
                  <div className="student-cert-footer">
                    <div className="hash-block">
                      <Hash size={14} />
                      <code className="chip mono">{hash}</code>
                      {onCopyLink && (
                        <button
                          className="icon-btn"
                          type="button"
                          onClick={() => onCopyLink(verifyUrl)}
                          title="Copy link verify"
                        >
                          <LinkIcon size={16} />
                        </button>
                      )}
                    </div>

                    <div className="qr-block">
                      <img
                        className="cert-qr-img"
                        alt="QR verify"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                          verifyUrl
                        )}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
