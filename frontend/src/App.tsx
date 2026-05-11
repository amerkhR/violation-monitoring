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

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sun-icon lucide-sun" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-moon-icon lucide-moon" aria-hidden>
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  );
}

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
  const displayFullName = profile?.fullName?.trim() || displayLogin;
  const avatarInitial = (displayFullName[0] ?? "?").toUpperCase();
  const avatarUrl = profile?.photoPath ? `${API_ORIGIN}${profile.photoPath}` : undefined;

  return (
    <div className={`layout ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      <aside className="sidebar">
        <h2>Monitoring</h2>
        {role === "Admin" && <div className="panel-label">Панель администратора</div>}
        {role === "Inspector" && <div className="panel-label">Панель инспектора</div>}
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
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDarkMode ? "Включить светлый режим" : "Включить темный режим"}
          >
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link className="profile-link" to="/profile">
            <div className="profile-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар пользователя" />
              ) : (
                <div className="avatar-fallback">{avatarInitial}</div>
              )}
            </div>
            <div className="profile-link-text">
              <span className="profile-display-name">{displayFullName}</span>
              {profile?.fullName?.trim() && (
                <span className="profile-login-sub">{displayLogin}</span>
              )}
            </div>
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
