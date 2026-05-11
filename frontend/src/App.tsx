import { Link, Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
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
import {
  BookAlertNavIcon,
  ClipboardListNavIcon,
  ContactNavIcon,
  LayoutDashboardNavIcon,
  LogOutNavIcon,
  PanelToggleIcon,
  ShieldAlertNavIcon,
  UsersNavIcon,
} from "./icons/sidebarIcons";

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

/** Фамилия и имя: из полного ФИО показываем первые два слова (отчество не выводим). */
function surnameAndGivenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]}`;
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

function navBtnClass(isActive: boolean) {
  return `sidebar-nav-btn${isActive ? " sidebar-nav-btn--active" : ""}`;
}

export function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [login, setLogin] = useState(localStorage.getItem("login") ?? "");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "1");
  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
      return next;
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
  const rawFullName = profile?.fullName?.trim() ?? "";
  const displayTopName = rawFullName ? surnameAndGivenName(rawFullName) : displayLogin;
  const avatarInitial = ((rawFullName ? rawFullName.split(/\s+/).filter(Boolean)[0] : displayLogin)[0] ?? "?").toUpperCase();
  const avatarUrl = profile?.photoPath ? `${API_ORIGIN}${profile.photoPath}` : undefined;

  const collapsed = sidebarCollapsed;

  return (
    <div className={`layout ${isDarkMode ? "dark-mode" : "light-mode"}${collapsed ? " layout--sidebar-collapsed" : ""}`}>
      <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
        <div className="sidebar-header">
          {!collapsed && <h2 className="sidebar-title">Monitoring</h2>}
          <button
            type="button"
            className={`sidebar-pin-btn${collapsed ? " sidebar-pin-btn--solo" : ""}`}
            onClick={toggleSidebar}
            title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
          >
            <PanelToggleIcon collapsed={collapsed} />
          </button>
        </div>
        {!collapsed && role === "Admin" && <div className="panel-label">Панель администратора</div>}
        {!collapsed && role === "Inspector" && <div className="panel-label">Панель инспектора</div>}
        <nav className="sidebar-nav" aria-label="Основное меню">
          <NavLink
            to="/"
            end
            className={({ isActive }) => navBtnClass(isActive)}
            title="Дашборд"
            aria-label="Дашборд"
          >
            {!collapsed && <span className="sidebar-nav-text">Дашборд</span>}
            <span className="sidebar-nav-icon-end" aria-hidden>
              <LayoutDashboardNavIcon />
            </span>
          </NavLink>
          {role !== "Admin" && (
            <NavLink
              to="/employees"
              className={({ isActive }) => navBtnClass(isActive)}
              title="Сотрудники"
              aria-label="Сотрудники"
            >
              {!collapsed && <span className="sidebar-nav-text">Сотрудники</span>}
              <span className="sidebar-nav-icon-end" aria-hidden>
                <ContactNavIcon />
              </span>
            </NavLink>
          )}
          <NavLink
            to="/violations"
            className={({ isActive }) => navBtnClass(isActive)}
            title="Нарушения"
            aria-label="Нарушения"
          >
            {!collapsed && <span className="sidebar-nav-text">Нарушения</span>}
            <span className="sidebar-nav-icon-end" aria-hidden>
              <ShieldAlertNavIcon />
            </span>
          </NavLink>
          {role === "Admin" && (
            <NavLink
              to="/users"
              className={({ isActive }) => navBtnClass(isActive)}
              title="Пользователи"
              aria-label="Пользователи"
            >
              {!collapsed && <span className="sidebar-nav-text">Пользователи</span>}
              <span className="sidebar-nav-icon-end" aria-hidden>
                <UsersNavIcon />
              </span>
            </NavLink>
          )}
          {role === "Admin" && (
            <NavLink
              to="/violation-types"
              className={({ isActive }) => navBtnClass(isActive)}
              title="Типы нарушений"
              aria-label="Типы нарушений"
            >
              {!collapsed && <span className="sidebar-nav-text">Типы нарушений</span>}
              <span className="sidebar-nav-icon-end" aria-hidden>
                <BookAlertNavIcon />
              </span>
            </NavLink>
          )}
          {role === "Admin" && (
            <NavLink
              to="/reports"
              className={({ isActive }) => navBtnClass(isActive)}
              title="Отчеты"
              aria-label="Отчеты"
            >
              {!collapsed && <span className="sidebar-nav-text">Отчеты</span>}
              <span className="sidebar-nav-icon-end" aria-hidden>
                <ClipboardListNavIcon />
              </span>
            </NavLink>
          )}
        </nav>
        <button type="button" className="sidebar-nav-btn sidebar-logout-btn" onClick={logout} title="Выйти" aria-label="Выйти">
          {!collapsed && <span className="sidebar-nav-text">Выйти</span>}
          <span className="sidebar-nav-icon-end" aria-hidden>
            <LogOutNavIcon />
          </span>
        </button>
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
              <span className="profile-display-name">{displayTopName}</span>
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
