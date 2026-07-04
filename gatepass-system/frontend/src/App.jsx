import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EmployeeSignIn from "./pages/EmployeeSignIn";
import VisitorSignIn from "./pages/VisitorSignIn";
import Login from "./pages/Login";
import SecurityDashboard from "./pages/SecurityDashboard";
import EmployeeDirectory from "./pages/security/EmployeeDirectory";
import VisitorsHistory from "./pages/security/VisitorsHistory";
import ActivityLog from "./pages/security/ActivityLog";
import SecuritySettings from "./pages/security/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminOfficers from "./pages/admin/AdminOfficers";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminReports from "./pages/admin/AdminReports";
import AdminQrCodes from "./pages/admin/AdminQrCodes";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/employee-signin" element={<EmployeeSignIn />} />
      <Route path="/visitor-signin" element={<VisitorSignIn />} />
      <Route path="/login" element={<Login />} />

      <Route path="/security" element={<ProtectedRoute roles={["security", "admin"]}><SecurityDashboard /></ProtectedRoute>} />
      <Route path="/security/employees" element={<ProtectedRoute roles={["security", "admin"]}><EmployeeDirectory /></ProtectedRoute>} />
      <Route path="/security/visitors" element={<ProtectedRoute roles={["security", "admin"]}><VisitorsHistory /></ProtectedRoute>} />
      <Route path="/security/activity" element={<ProtectedRoute roles={["security", "admin"]}><ActivityLog /></ProtectedRoute>} />
      <Route path="/security/settings" element={<ProtectedRoute roles={["security", "admin"]}><SecuritySettings /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/employees" element={<ProtectedRoute roles={["admin"]}><AdminEmployees /></ProtectedRoute>} />
      <Route path="/admin/officers" element={<ProtectedRoute roles={["admin"]}><AdminOfficers /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute roles={["admin"]}><AdminLogs /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={["admin"]}><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/qrcodes" element={<ProtectedRoute roles={["admin"]}><AdminQrCodes /></ProtectedRoute>} />
    </Routes>
  );
}
