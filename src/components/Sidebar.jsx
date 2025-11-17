import React from "react";
import { NavLink } from "react-router-dom";
import { Shield, Users, FileText, Award, Cog } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx"; 

const linkCls = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

export default function Sidebar() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const profilePath = isStudent ? "/student/profile"      : "/profile";
  const recordsPath = isStudent ? "/student/records"      : "/records";
  const certsPath   = isStudent ? "/student/certificates" : "/certificates";
  const settingPath = isStudent ? "/student/setting"      : "/setting";

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
        <NavLink to={profilePath} className={linkCls}>
          <Users size={20} />
          <span>Hồ sơ sinh viên</span>
        </NavLink>

        <NavLink to={recordsPath} className={linkCls}>
          <FileText size={20} />
          <span>Học bạ & Điểm</span>
        </NavLink>

        <NavLink to={certsPath} className={linkCls}>
          <Award size={20} />
          <span>Bằng cấp & Chứng chỉ</span>
        </NavLink>

        <NavLink to={settingPath} className={linkCls}>
          <Cog size={20} />
          <span>Cài đặt</span>
        </NavLink>
      </nav>
    </aside>
  );
}
