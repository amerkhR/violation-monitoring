import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { ViolationsPage } from "./pages/ViolationsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InspectorsPage } from "./pages/InspectorsPage";
import { ViolationTypesPage } from "./pages/ViolationTypesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";

export function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
    navigate("/login");
  };

  if (!token) {
    return <LoginPage onLogin={(jwt, userRole) => { localStorage.setItem("token", jwt); localStorage.setItem("role", userRole); setToken(jwt); setRole(userRole); }} />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Monitoring</h2>
        <div className="panel-label">{role === "Admin" ? "Панель администратора" : "Панель инспектора"}</div>
        <nav>
          <Link to="/">Дашборд</Link>
          <Link to="/employees">Сотрудники</Link>
          <Link to="/violations">Нарушения</Link>
          {role === "Admin" && <Link to="/users">Пользователи</Link>}
          {role === "Admin" && <Link to="/inspectors">Инспекторы</Link>}
          {role === "Admin" && <Link to="/violation-types">Типы нарушений</Link>}
          {role === "Admin" && <Link to="/reports">Отчеты</Link>}
        </nav>
        <button onClick={logout}>Выйти</button>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/violations" element={<ViolationsPage />} />
          {role === "Admin" && <Route path="/users" element={<UsersPage />} />}
          {role === "Admin" && <Route path="/inspectors" element={<InspectorsPage />} />}
          {role === "Admin" && <Route path="/violation-types" element={<ViolationTypesPage />} />}
          {role === "Admin" && <Route path="/reports" element={<ReportsPage />} />}
          <Route path="/login" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
