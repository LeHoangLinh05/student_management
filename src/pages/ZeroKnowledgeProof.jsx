import React, { useState } from 'react';
import "../styles/student.css";      
import "../styles/zkp.css";

import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

const ZeroKnowledgeProof = () => {
  const [zkpForm, setZkpForm] = useState({
    proofType: 'age',
    ageThreshold: 18,
    customAttribute: '',
  });

  const [zkpResults, setZkpResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setZkpForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateProof = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:4000/api/zkp/generate-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofType: zkpForm.proofType,
          ageThreshold: parseInt(zkpForm.ageThreshold),
          customAttribute: zkpForm.customAttribute,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi tạo proof');

      setZkpResults({
        proof: data.proof,
        publicInputs: data.publicInputs,
        verified: data.verified,
        timestamp: new Date().toLocaleString('vi-VN'),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyProof = async () => {
    if (!zkpResults) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:4000/api/zkp/verify-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: zkpResults.proof,
          publicInputs: zkpResults.publicInputs,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi xác thực proof');

      setZkpResults(prev => ({
        ...prev,
        verified: data.verified,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />

    <div className="container">
    <div className="zkp-container">
      <div className="zkp-header">
        <h1>🔐 Zero Knowledge Proof</h1>
        <p>Chứng minh thông tin mà không tiết lộ dữ liệu nhạy cảm</p>
      </div>

      <div className="zkp-content">
        <div className="zkp-form-section">
          <h2>Tạo Proof</h2>
          
          <div className="form-group">
            <label>Loại Proof</label>
            <select 
              name="proofType" 
              value={zkpForm.proofType}
              onChange={handleFormChange}
            >
              <option value="age">Chứng minh tuổi ≥ 18</option>
              <option value="graduation">Chứng minh tốt nghiệp</option>
              <option value="gpa">Chứng minh GPA cao</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
          </div>

          {zkpForm.proofType === 'age' && (
            <div className="form-group">
              <label>Ngưỡng tuổi</label>
              <input 
                type="number" 
                name="ageThreshold"
                value={zkpForm.ageThreshold}
                onChange={handleFormChange}
                min="1"
                max="100"
              />
            </div>
          )}

          {zkpForm.proofType === 'custom' && (
            <div className="form-group">
              <label>Thuộc tính tùy chỉnh</label>
              <input 
                type="text" 
                name="customAttribute"
                value={zkpForm.customAttribute}
                onChange={handleFormChange}
                placeholder="Nhập thuộc tính cần chứng minh"
              />
            </div>
          )}

          <button 
            className="btn btn-primary" 
            onClick={generateProof}
            disabled={loading}
          >
            {loading ? 'Đang tạo...' : 'Tạo Proof'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {zkpResults && (
          <div className="zkp-results-section">
            <h2>Kết quả Proof</h2>
            
            <div className="result-item">
              <label>Trạng thái xác thực:</label>
              <div className={`status-badge ${zkpResults.verified ? 'verified' : 'unverified'}`}>
                {zkpResults.verified ? '✓ Đã xác thực' : '✗ Chưa xác thực'}
              </div>
            </div>

            <div className="result-item">
              <label>Proof:</label>
              <div className="proof-value">{zkpResults.proof.substring(0, 50)}...</div>
            </div>

            <div className="result-item">
              <label>Public Inputs:</label>
              <pre>{JSON.stringify(zkpResults.publicInputs, null, 2)}</pre>
            </div>

            <div className="result-item">
              <label>Thời gian:</label>
              <span>{zkpResults.timestamp}</span>
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={verifyProof}
              disabled={loading}
            >
              {loading ? 'Đang xác thực...' : 'Xác thực Proof'}
            </button>
          </div>
        )}
      </div>
      </div>
      </div>
      </main>
    </div>
  );
};

export default ZeroKnowledgeProof;
