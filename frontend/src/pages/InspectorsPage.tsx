import { useEffect, useState } from "react";
import { api } from "../api";

type Inspector = {
  id: number;
  login: string;
  fullName: string;
  isActive: boolean;
};

export function InspectorsPage() {
  const [rows, setRows] = useState<Inspector[]>([]);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("Inspector123!");
  const [fullName, setFullName] = useState("");

  const load = () => api.get("/inspectors").then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);

  const createInspector = async () => {
    await api.post("/inspectors", { login, password, fullName, isActive: true });
    setLogin("");
    setPassword("Inspector123!");
    setFullName("");
    await load();
  };

  const deleteInspector = async (id: number) => {
    await api.delete(`/inspectors/${id}`);
    await load();
  };

  return (
    <section>
      <h1>Инспекторы</h1>
      <div className="form-row card">
        <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Логин" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" />
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ФИО" />
        <button onClick={createInspector}>Добавить инспектора</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Логин</th>
            <th>ФИО</th>
            <th>Активен</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.login}</td>
              <td>{x.fullName}</td>
              <td>{x.isActive ? "Да" : "Нет"}</td>
              <td><button onClick={() => deleteInspector(x.id)}>Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
