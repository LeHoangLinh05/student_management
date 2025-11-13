import React, { useEffect, useRef, useState } from "react";
import { Bell, Settings, User2, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate("/auth?mode=signin");
  };

  const initials = (user?.name || "Sofia Rivers")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* tùy chọn */}
      </div>

      <div className="topbar-right" ref={menuRef}>
        <button className="icon-round" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <button
          className="avatar-btn"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          <span className="status-dot" />
          {/* ảnh thật nếu có: <img src={user?.avatarUrl} alt="avatar"/> */}
          <span className="avatar-fallback">{initials}</span>
        </button>

        {open && (
          <div className="dropdown">
            <div className="dropdown-header">
              <div className="name">{user?.name || "Sofia Rivers"}</div>
              <div className="email">{user?.email || "sofia.rivers@devias.io"}</div>
            </div>

            <button className="dropdown-item" onClick={() => navigate("/settings")}>
              <Settings size={16} />
              <span>Settings</span>
            </button>

            <button className="dropdown-item" onClick={() => navigate("/profile")}>
              <User2 size={16} />
              <span>Profile</span>
            </button>

            <div className="dropdown-divider" />

            <button className="dropdown-item danger" onClick={handleSignOut}>
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
