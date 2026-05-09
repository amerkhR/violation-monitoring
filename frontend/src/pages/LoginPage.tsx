import { FormEvent, useState } from "react";
import { api } from "../api";

type Props = {
  onLogin: (token: string, role: string, login: string) => void;
};

export function LoginPage({ onLogin }: Props) {
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", { login, password });
      onLogin(data.token, data.role, login);
    } catch (error: any) {
      setError(error?.response?.data?.detail ?? "Ошибка авторизации");
    }
  };

  return (
    <div className="login">
      <form onSubmit={submit} className="card">
        <h1>Вход</h1>
        <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Логин" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Пароль"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Войти</button>
      </form>
    </div>
  );
}
