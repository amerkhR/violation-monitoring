import { useEffect, useState } from "react";
import { api, API_ORIGIN } from "../api";

type Profile = {
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

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get<Profile>("/users/me");
        setProfile(response.data);
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data || "Не удалось загрузить профиль.");
      }
    };

    loadProfile();
  }, []);

  if (error) {
    return <div className="card">{error}</div>;
  }

  if (!profile) {
    return <div className="card">Загрузка...</div>;
  }

  const avatarUrl = profile.photoPath ? `${API_ORIGIN}${profile.photoPath}` : undefined;

  return (
    <div className="profile-card">
      <div className="card profile-header">
        <div className="profile-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Аватар пользователя" />
          ) : (
            <div className="avatar-fallback">{profile.login[0]?.toUpperCase() ?? "?"}</div>
          )}
        </div>
        <div className="profile-meta">
          <h1>{profile.fullName}</h1>
          <strong>@{profile.login}</strong>
          <span>{profile.role === "Admin" ? "Администратор" : profile.role}</span>
        </div>
      </div>
      <div className="card profile-details">
        <div className="profile-field">
          <span>Статус</span>
          <strong>{profile.isActive ? "Активен" : "Неактивен"}</strong>
        </div>
        <div className="profile-field">
          <span>Должность</span>
          <strong>{profile.position || "—"}</strong>
        </div>
        <div className="profile-field">
          <span>Отдел</span>
          <strong>{profile.department || "—"}</strong>
        </div>
        <div className="profile-field">
          <span>Дата приёма</span>
          <strong>{profile.hireDate ? profile.hireDate.split("T")[0] : "—"}</strong>
        </div>
      </div>
    </div>
  );
}
