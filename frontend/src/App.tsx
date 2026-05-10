import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { ViolationsPage } from "./pages/ViolationsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ViolationTypesPage } from "./pages/ViolationTypesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { api, API_ORIGIN } from "./api";

type UserProfile = {
  id: number;
  login: string;
  fullName: string;
  role: string;
  isActive: boolean;
  department: string | null;
  position: string | null;
  hireDate: string | null;
  photoPath: string | null;
};

export function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [login, setLogin] = useState(localStorage.getItem("login") ?? "");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("login");
    setToken(null);
    setRole(null);
    setLogin("");
    navigate("/login");
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get<UserProfile>("/users/me");
        setProfile(response.data);
        if (!login) {
          setLogin(response.data.login);
          localStorage.setItem("login", response.data.login);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    if (token) {
      loadProfile();
    }
  }, [token, login]);

  if (!token) {
    return <LoginPage onLogin={(jwt, userRole, userLogin) => { localStorage.setItem("token", jwt); localStorage.setItem("role", userRole); localStorage.setItem("login", userLogin); setToken(jwt); setRole(userRole); setLogin(userLogin); }} />;
  }

  const displayLogin = profile?.login ?? login ?? "Пользователь";
  const avatarUrl = profile?.photoPath ? `${API_ORIGIN}${profile.photoPath}` : undefined;

  return (
    <div className={`layout ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <aside className="sidebar">
        <h2>Monitoring</h2>
        <div className="panel-label">{role === "Admin" ? "Панель администратора" : "Панель инспектора"}</div>
        <nav>
          <Link to="/">Дашборд</Link>
          {role !== "Admin" && <Link to="/employees">Сотрудники</Link>}
          <Link to="/violations">Нарушения</Link>
          {role === "Admin" && <Link to="/users">Пользователи</Link>}
          {role === "Admin" && <Link to="/violation-types">Типы нарушений</Link>}
          {role === "Admin" && <Link to="/reports">Отчеты</Link>}
        </nav>
        <button onClick={logout}>Выйти</button>
      </aside>
      <main className="content">
        <div className="topbar">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            title={isDarkMode ? "Включить светлый режим" : "Включить темный режим"}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <Link className="profile-link" to="/profile">
            <div className="profile-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар пользователя" />
              ) : (
                <div className="avatar-fallback">{displayLogin[0]?.toUpperCase() ?? "?"}</div>
              )}
            </div>
            <div className="profile-nickname">{displayLogin}</div>
          </Link>
        </div>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/violations" element={<ViolationsPage />} />
          {role === "Admin" && <Route path="/users" element={<UsersPage />} />}
          {role === "Admin" && <Route path="/violation-types" element={<ViolationTypesPage />} />}
          {role === "Admin" && <Route path="/reports" element={<ReportsPage />} />}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
