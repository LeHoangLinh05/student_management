import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../lib/api.js";
import "../styles/auth.css";

export default function Auth() {
  const [sp, setSp] = useSearchParams();
  const modeFromUrl = useMemo(
    () => (sp.get("mode") === "signup" ? "signup" : "signin"),
    [sp]
  );
  const [mode, setMode] = useState(modeFromUrl);
  useEffect(() => setMode(modeFromUrl), [modeFromUrl]);

  const switchMode = (m) => {
    setMode(m);
    setSp({ mode: m }, { replace: true });
  };

  return (
    <div className="auth auth-web3">
      <div className="auth-left">
        <div className="auth-form">
          <div className="auth-head">
            <h1>{mode === "signin" ? "Sign in" : "Sign up"}</h1>
            <p className="muted">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    className="link-like"
                    onClick={() => switchMode("signup")}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    className="link-like"
                    onClick={() => switchMode("signin")}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {mode === "signin" ? <SignInForm /> : <SignUpForm onSuccess={() => switchMode("signin")} />}

        </div>

        <div className="auth-extra">
          <div className="divider">OR</div>

          <div className="enterprise-box">
            <p className="muted" style={{ marginBottom: 8 }}>
              Bạn là doanh nghiệp và muốn xác thực bằng cấp?
            </p>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => (window.location.href = "/verify")}
            >
              🔍 Verify Credentials
            </button>
          </div>
        </div>
      </div>

{/* === Web3-style right panel for Auth.jsx === */}
<div className="auth-right">
  <div className="web3-hero">
    <div className="web3-header">
      <h2>
        EduChain <span className="accent">Network</span>
      </h2>
      <p className="muted">
        Quản lý hồ sơ sinh viên minh bạch — xác thực bằng cấp trên blockchain.
      </p>
    </div>

    <div className="cards-row">
      <div className="card glass">
        <div className="card-title">
          <svg className="icon-chain" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path fill="currentColor" d="M10 13a3 3 0 0 1 0-6h4a3 3 0 0 1 0 6h-4zm-4 0a3 3 0 0 1 0-6h1v2H6a1 1 0 0 0 0 2h1v2H6zM17 7h-1V5h1a1 1 0 0 1 0 2zM7 17h1v2H7a1 1 0 0 1 0-2zm10-2a3 3 0 0 0 0-6h-1v2h1a1 1 0 0 1 0 2h-1v2h1z"/>
          </svg>
          <span>Network</span>
        </div>

        <div className="card-body">
          <div className="stat">
            <div className="stat-value">📡 Mainnet</div>
            <div className="stat-sub muted">Status: <strong>Connected</strong></div>
          </div>

          <div className="stat" style={{ marginTop: 12 }}>
            <div className="stat-value">🏛️ Block</div>
            <div className="stat-sub muted">Latest: <strong>12,345</strong></div>
          </div>
        </div>
      </div>

      <div className="card glass small">
        <div className="card-title">Roles</div>
        <div className="card-body compact">
          <div className="role">
            <div className="dot admin" /> Admin
          </div>
          <div className="role">
            <div className="dot student" /> Student
          </div>
          <div className="role">
            <div className="dot verifier" /> Verifier
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

    </div>
  );
}

/* ---------- small subcomponents ---------- */
function Feature({ title, desc }) {
  return (
    <div className="feature">
      <div className="dot" />
      <div>
        <div className="strong small">{title}</div>
        <div className="muted tiny">{desc}</div>
      </div>
    </div>
  );
}

function ChainIcon() {
  // simple chain-like svg
  return (
    <svg className="chain-icon" viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor">
      <path d="M7.5 12a3.5 3.5 0 0 1 0-5l2-2a3.5 3.5 0 0 1 5 0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5 12a3.5 3.5 0 0 1 0 5l-2 2a3.5 3.5 0 0 1-5 0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 15l6-6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ---------- Forms (unchanged logic) ---------- */
function SignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("sofia@devias.io");
  const [password, setPassword] = useState("Secret1");
  const [error, setError] = useState("");
  const [role, setRole] = useState("admin");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);

      login({ ...user, role });

      if (role === "student") {
        navigate("/student", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Đăng nhập thất bại.");
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <label className="form-group">
        <span>Email address</span>
        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
      </label>

      <label className="form-group">
        <span>Password</span>
        <div className="field">
          <input
            className="input"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="eye-btn"
            type="button"
            aria-label="toggle password"
            onClick={() => setShow((s) => !s)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </label>

      <label className="form-group">
        <span>Đăng nhập với vai trò</span>
        <select
          className="input"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="admin">Admin (Nhà trường)</option>
          <option value="student">Student (Sinh viên)</option>
        </select>
      </label>

      {error && (
        <div className="note hint" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}

      <div className="auth-link" style={{ marginTop: 8 }}>
        <a href="#">Forgot password?</a>
      </div>

      <button className="btn-primary" style={{ marginTop: 10 }} type="submit">
        Sign in
      </button>
    </form>
  );
}

function SignUpForm({ onSuccess }) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [agree,     setAgree]     = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!firstName || !lastName || !email || !password) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }
    if (!agree) {
      setError("Bạn cần đồng ý điều khoản.");
      return;
    }

    try {
      setLoading(true);

      const name = `${firstName} ${lastName}`.trim();

      const res = await api.post("/api/auth/register", {
        email,
        name,
        password,
      });

      setSuccess("Tạo tài khoản thành công! Hãy đăng nhập.");
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("Register error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid-2">
        <label className="form-group">
          <span>First name</span>
          <input
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className="form-group">
          <span>Last name</span>
          <input
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
      </div>

      <label className="form-group">
        <span>Email address</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="form-group">
        <span>Password</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>

      <label className="check">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <span>
          I have read the <a href="#">terms and conditions</a>
        </span>
      </label>

      {error && (
        <div className="note hint" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
      {success && (
        <div className="note" style={{ marginTop: 8 }}>
          {success}
        </div>
      )}

      <button className="btn-primary" disabled={!agree || loading} type="submit">
        {loading ? "Đang tạo tài khoản..." : "Sign up"}
      </button>
    </form>
  );
}
