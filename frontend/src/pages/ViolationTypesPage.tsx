import { useEffect, useState } from "react";
import { api } from "../api";

type ViolationType = {
  id: number;
  name: string;
  defaultPoints: number;
  severityDefault: number;
  isActive: boolean;
};

export function ViolationTypesPage() {
  const [rows, setRows] = useState<ViolationType[]>([]);
  const [name, setName] = useState("");
  const [defaultPoints, setDefaultPoints] = useState(1);
  const [severityDefault, setSeverityDefault] = useState(2);

  const load = () => api.get("/violation-types").then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);

  const createType = async () => {
    await api.post("/violation-types", { name, defaultPoints, severityDefault, isActive: true });
    setName("");
    setDefaultPoints(1);
    setSeverityDefault(2);
    await load();
  };

  const deleteType = async (id: number) => {
    await api.delete(`/violation-types/${id}`);
    await load();
  };

  return (
    <section>
      <h1>Типы нарушений</h1>
      <div className="form-row card">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Название" />
        <input type="number" value={defaultPoints} onChange={(e) => setDefaultPoints(Number(e.target.value))} placeholder="Баллы" />
        <select value={severityDefault} onChange={(e) => setSeverityDefault(Number(e.target.value))}>
          <option value={1}>Low</option>
          <option value={2}>Medium</option>
          <option value={3}>High</option>
        </select>
        <button onClick={createType}>Добавить тип</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Баллы</th>
            <th>Серьезность по умолчанию</th>
            <th>Активен</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.name}</td>
              <td>{x.defaultPoints}</td>
              <td>{x.severityDefault}</td>
              <td>{x.isActive ? "Да" : "Нет"}</td>
              <td><button onClick={() => deleteType(x.id)}>Удалить</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
