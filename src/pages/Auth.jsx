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
  <div className="auth">
    <div className="auth-left">
      <div className="auth-brand">DeviasKit</div>

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

        {mode === "signin" ? (
          <SignInForm />
        ) : (
          <SignUpForm onSuccess={() => switchMode("signin")} />
        )}

        <div className="note hint">
          {mode === "signin" ? (
            <>
              Use <strong>sofia@devias.io</strong> with password{" "}
              <strong>Secret1</strong>
            </>
          ) : (
            <>Created users are not persisted</>
          )}
        </div>
      </div>

      {/* ✅ verify doanh nghiệp ở ngay dưới form */}
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

      <div className="auth-right">
        <div className="hero">
          <h2>
            Welcome to <span>Devias Kit</span>
          </h2>
          <p className="muted">
            A professional template that comes with ready-to-use MUI components.
          </p>

          <div className="hero-card">
            <div className="hero-pill">Your login code is XJH4</div>
          </div>

          <div className="hero-card small">
            <input className="input" placeholder="john.doe@gmail.com" />
            <div className="otp">
              <span>0</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>
            <button className="btn-green">Log in</button>
          </div>

          <div className="hero-chip">
            <img src="https://i.pravatar.cc/40?img=7" alt="avatar" />
            <div>
              <strong>Vanessa L.</strong>
              <div className="muted">vanes@acme.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Forms ---------- */
function SignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("sofia@devias.io");
  const [password, setPassword] = useState("Secret1");
  const [error, setError] = useState("");
  const [role, setRole] = useState("admin"); 

  // const onSubmit = (e) => {
  //   e.preventDefault();
  //   setError("");

  //   if (!email || !password) {
  //     setError("Vui lòng nhập email và mật khẩu.");
  //     return;
  //   }

  //   const baseName = email.split("@")[0].replace(".", " ");
  //   const user = {
  //     email,
  //     name: baseName,
  //     role, 
  //   };

  //   login(user);

  //   if (role === "student") {
  //     navigate("/student", { replace: true });
  //   } else {
  //     // admin
  //     navigate("/profile", { replace: true });
  //   }
  // };
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    try {
      // 🔑 GỌI BACKEND LOGIN
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      // lưu token để axios interceptor tự gắn Authorization
      localStorage.setItem("token", token);

      // lưu user vào context (giữ nguyên cách cũ)
      login({ ...user, role });

      // điều hướng như cũ
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
