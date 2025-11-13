import React from "react";
import { NavLink } from "react-router-dom";
import { Shield, Users, FileText, Award } from "lucide-react";

const linkCls = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <Shield size={28} />
        <div>
          <h1>EduChain</h1>
          <p>Blockchain Education</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav">
        <NavLink to="/profile" className={linkCls}>
          <Users size={20} />
          <span>Hồ sơ sinh viên</span>
        </NavLink>

        <NavLink to="/records" className={linkCls}>
          <FileText size={20} />
          <span>Học bạ & Điểm</span>
        </NavLink>

        <NavLink to="/certificates" className={linkCls}>
          <Award size={20} />
          <span>Bằng cấp & Chứng chỉ</span>
        </NavLink>

        {/* <NavLink to="/verify" className={linkCls}>
          <Shield size={20} />
          <span>Xác thực</span>
        </NavLink> */}
      </nav>

      {/* Footer */}
      {/* <div className="sidebar-footer">
        <div className="avatar">AD</div>
        <div className="user-meta">
          <strong>Admin User</strong>
          <span>Trường ĐH ABC</span>
        </div>
      </div> */}
    </aside>
  );
}
