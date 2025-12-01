import React, { useState, useEffect } from 'react';
import "../styles/student.css";
import "../styles/multisig.css";
import { Lock, GitBranch, Plus, X, Send, Check, AlertCircle } from "lucide-react";

import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
const MultiSignature = () => {
  const [signers, setSigners] = useState([]);
  const [requiredSignatures, setRequiredSignatures] = useState(2);
  const [newSigner, setNewSigner] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    description: '',
    txType: 'record', // record, certificate, custom
    details: ''
  });

  useEffect(() => {
    fetchSigners();
    fetchTransactions();
  }, []);

  const fetchSigners = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/multisig/signers');
      const data = await response.json();
      if (response.ok) {
        setSigners(data.signers || []);
        setRequiredSignatures(data.requiredSignatures || 2);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách ký:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/multisig/transactions');
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Lỗi tải giao dịch:', err);
    }
  };

  const addSigner = async () => {
    if (!newSigner.trim()) {
      setError('Vui lòng nhập địa chỉ ký');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:4000/api/multisig/add-signer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerAddress: newSigner }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi thêm ký');

      setNewSigner('');
      setSuccessMsg('Thêm người ký thành công');
      await fetchSigners();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!createFormData.description.trim()) {
      setError('Vui lòng nhập mô tả giao dịch');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:4000/api/multisig/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: createFormData.description,
          data: {
            type: createFormData.txType,
            details: createFormData.details
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi tạo giao dịch');

      setSuccessMsg('✅ Giao dịch được tạo thành công!');
      setCreateFormData({ description: '', txType: 'record', details: '' });
      setShowCreateModal(false);
      await fetchTransactions();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signTransaction = async (txId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:4000/api/multisig/sign-transaction/${txId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi ký giao dịch');

      setSuccessMsg('Ký giao dịch thành công');
      await fetchTransactions();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeTransaction = async (txId) => {
    if (!window.confirm('Xác nhận thực thi giao dịch?')) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:4000/api/multisig/execute-transaction/${txId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi thực thi giao dịch');

      setSuccessMsg('Thực thi giao dịch thành công');
      await fetchTransactions();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'executed': return 'status-executed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ ký',
      'approved': 'Đã phê duyệt',
      'executed': 'Đã thực thi',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'executed': return '✔️';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="main">
        <Topbar />

        <div className="container">
    <div className="multisig-container">
      <div className="multisig-header">
        <h1>🔗 Multi-Signature Management</h1>
        <p>Quản lý giao dịch yêu cầu nhiều chữ ký</p>
      </div>

      <div className="multisig-content">
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="alert alert-success">
            <Check size={20} />
            {successMsg}
          </div>
        )}

        <div className="multisig-grid">
          {/* Signers Section */}
          <div className="multisig-section signers-section">
            <div className="section-header">
              <h2>👥 Người Ký ({signers.length})</h2>
              <p className="section-subtitle">Yêu cầu: {requiredSignatures}/{signers.length}</p>
            </div>

            <div className="signers-list">
              {signers.length > 0 ? (
                signers.map((signer, idx) => (
                  <div key={idx} className="signer-item">
                    <div className="signer-avatar">{idx + 1}</div>
                    <div className="signer-info">
                      <div className="signer-address">{signer.substring(0, 10)}...{signer.substring(signer.length - 8)}</div>
                      <small>Người ký #{idx + 1}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-message">Chưa có người ký</p>
              )}
            </div>

            <div className="add-signer-form">
              <input 
                type="text" 
                value={newSigner}
                onChange={(e) => setNewSigner(e.target.value)}
                placeholder="Nhập địa chỉ ký (0x...)"
                className="input-field"
              />
              <button 
                className="btn btn-primary"
                onClick={addSigner}
                disabled={loading}
              >
                <Plus size={18} /> Thêm Ký
              </button>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="multisig-section transactions-section">
            <div className="section-header">
              <h2>📋 Giao Dịch ({transactions.length})</h2>
              <button 
                className="btn btn-success btn-lg"
                onClick={() => setShowCreateModal(true)}
                disabled={loading || signers.length === 0}
              >
                <Plus size={20} /> Tạo Giao Dịch
              </button>
            </div>

            <div className="transactions-list">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className={`transaction-item ${getStatusColor(tx.status)}`}
                    onClick={() => setSelectedTxId(selectedTxId === tx.id ? null : tx.id)}
                  >
                    <div className="tx-header">
                      <div className="tx-title">
                        <span className="tx-icon">{getStatusIcon(tx.status)}</span>
                        {tx.description}
                      </div>
                      <span className="tx-status">{getStatusText(tx.status)}</span>
                    </div>
                    <div className="tx-info">
                      <small>ID: {tx.id}</small>
                      <small className="tx-sigs">Ký: {tx.signatures?.length || 0}/{requiredSignatures}</small>
                    </div>

                    {selectedTxId === tx.id && (
                      <div className="tx-details">
                        <div className="tx-signatures">
                          <strong>📝 Chữ ký:</strong>
                          {tx.signatures && tx.signatures.length > 0 ? (
                            <ul className="signatures-list">
                              {tx.signatures.map((sig, idx) => (
                                <li key={idx} className="signature-item">
                                  <Check size={16} className="sig-icon" />
                                  <span>{sig.signer.substring(0, 10)}...{sig.signer.substring(sig.signer.length - 8)}</span>
                                  <small>{new Date(sig.signedAt).toLocaleString('vi-VN')}</small>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted">Chưa có chữ ký</p>
                          )}
                        </div>

                        <div className="tx-actions">
                          {tx.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  signTransaction(tx.id);
                                }}
                                disabled={loading}
                              >
                                <Send size={16} /> Ký
                              </button>
                              {(tx.signatures?.length || 0) >= requiredSignatures && (
                                <button 
                                  className="btn btn-sm btn-success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    executeTransaction(tx.id);
                                  }}
                                  disabled={loading}
                                >
                                  <Check size={16} /> Thực thi
                                </button>
                              )}
                            </>
                          )}
                          {tx.status === 'approved' && (
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                executeTransaction(tx.id);
                              }}
                              disabled={loading}
                            >
                              <Check size={16} /> Thực thi
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="empty-message">Chưa có giao dịch</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Transaction Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Tạo Giao Dịch Mới</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label>Loại giao dịch *</label>
                <select 
                  value={createFormData.txType}
                  onChange={(e) => setCreateFormData({...createFormData, txType: e.target.value})}
                  className="form-control"
                >
                  <option value="record">Thêm Bản Ghi Học Tập</option>
                  <option value="certificate">Phát Hành Chứng Chỉ</option>
                  <option value="custom">Giao Dịch Tùy Chỉnh</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mô tả giao dịch *</label>
                <input 
                  type="text"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})}
                  placeholder="Ví dụ: Phê duyệt bản ghi học tập của sinh viên..."
                  className="form-control"
                />
              </div>

              {createFormData.txType === 'record' && (
                <>
                  <div className="form-group">
                    <label>Chi tiết bản ghi</label>
                    <textarea 
                      value={createFormData.details}
                      onChange={(e) => setCreateFormData({...createFormData, details: e.target.value})}
                      placeholder="Nhập thông tin chi tiết về bản ghi (môn học, điểm, học kỳ, v.v.)"
                      className="form-control"
                      rows={4}
                    />
                  </div>
                </>
              )}

              {createFormData.txType === 'certificate' && (
                <>
                  <div className="form-group">
                    <label>Chi tiết chứng chỉ</label>
                    <textarea 
                      value={createFormData.details}
                      onChange={(e) => setCreateFormData({...createFormData, details: e.target.value})}
                      placeholder="Nhập thông tin về chứng chỉ (loại, nội dung, v.v.)"
                      className="form-control"
                      rows={4}
                    />
                  </div>
                </>
              )}

              {createFormData.txType === 'custom' && (
                <>
                  <div className="form-group">
                    <label>Chi tiết giao dịch</label>
                    <textarea 
                      value={createFormData.details}
                      onChange={(e) => setCreateFormData({...createFormData, details: e.target.value})}
                      placeholder="Nhập chi tiết giao dịch tùy chỉnh"
                      className="form-control"
                      rows={4}
                    />
                  </div>
                </>
              )}

              <div className="info-box">
                <p><strong>ℹ️ Thông tin:</strong></p>
                <ul>
                  <li>Giao dịch sẽ cần {requiredSignatures} chữ ký để được phê duyệt</li>
                  <li>Hiện có {signers.length} người ký trong hệ thống</li>
                  <li>Sau khi được phê duyệt, giao dịch có thể được thực thi</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleCreateTransaction}
                disabled={loading || !createFormData.description.trim()}
              >
                {loading ? '⏳ Đang tạo...' : '✓ Tạo Giao Dịch'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
      </main>
    </div>
  );
};

export default MultiSignature;
