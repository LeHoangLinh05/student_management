import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Profile from "./pages/Profile.jsx";
import Records from "./pages/Records.jsx";
import Certificates from "./pages/Certificates.jsx";
import Auth from "./pages/Auth.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import StudentRecords from "./pages/StudentRecords.jsx";
import StudentCertificates from "./pages/StudentCertificates.jsx";
import Verify from "./pages/Verify.jsx";
import StudentSetting from "./pages/StudentSetting.jsx";
import Setting from "./pages/Setting.jsx";

function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) navigate("/auth?mode=signin", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="container">
          <Routes>
            <Route path="profile" element={<Profile />} />
            <Route path="records" element={<Records />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="setting" element={<Setting />} />
            <Route path="*" element={<Navigate to="profile" replace />} />
          
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Auth cho admin */}
      <Route path="/auth" element={<Auth />} />

      {/* Student */}
      <Route path="/student" element={<Navigate to="/student/profile" replace />}/>
      <Route path="/student/profile" element={<StudentDashboard />} />
      <Route path="/student/records" element={<StudentRecords />} />
      <Route path="/student/certificates" element={<StudentCertificates />} />
      <Route path="/student/setting" element={<StudentSetting />} />
      
      {/* Verify doanh nghiệp */}
      <Route path="/verify" element={<Verify />} />

      {/* Admin */}
      <Route path="/*" element={<AppLayout />} />
    </Routes>
  );
}
