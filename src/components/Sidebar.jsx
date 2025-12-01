import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Shield,
  Users,
  FileText,
  Award,
  Cog,
  Lock,
  GitBranch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/sidebar.css";

const linkCls = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  const isStudent = user?.role === "student";

  const profilePath = isStudent ? "/student/profile" : "/profile";
  const recordsPath = isStudent ? "/student/records" : "/records";
  const certsPath   = isStudent ? "/student/certificates" : "/certificates";
  const settingPath = isStudent ? "/student/setting" : "/setting";

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand">
        <Shield className="brand-icon" size={28} />
        {!collapsed && (
          <div className="brand-text">
            <div className="brand-title">EduChain</div>
            <div className="brand-subtitle">Blockchain Education</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="nav">
        <NavLink to={profilePath} className={linkCls}>
          <Users size={20} />
          <span className="link-text">Hồ sơ sinh viên</span>
        </NavLink>

        <NavLink to={recordsPath} className={linkCls}>
          <FileText size={20} />
          <span className="link-text">Học bạ &amp; Điểm</span>
        </NavLink>

        <NavLink to={certsPath} className={linkCls}>
          <Award size={20} />
          <span className="link-text">Bằng cấp &amp; Chứng chỉ</span>
        </NavLink>

        <NavLink to={settingPath} className={linkCls}>
          <Cog size={20} />
          <span className="link-text">Cài đặt</span>
        </NavLink>

        <div className="nav-divider">Bảo mật nâng cao</div>

        <NavLink to="/zkp" className={linkCls}>
          <Lock size={20} />
          <span className="link-text">Zero Knowledge Proof</span>
        </NavLink>

        <NavLink to="/multisig" className={linkCls}>
          <GitBranch size={20} />
          <span className="link-text">Multi-Signature</span>
        </NavLink>
      </nav>

      {/* Toggle ở DƯỚI CÙNG */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-label="Thu gọn sidebar"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </aside>
  );
}
