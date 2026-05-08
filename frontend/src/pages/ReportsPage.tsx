import { useEffect, useState } from "react";
import { api } from "../api";

type Report = {
  id: number;
  type: string;
  paramsJson: string;
  createdAt: string;
  createdBy: number;
};

export function ReportsPage() {
  const [rows, setRows] = useState<Report[]>([]);
  const [type, setType] = useState("summary");
  const [paramsJson, setParamsJson] = useState("{\"from\":\"2026-01-01\",\"to\":\"2026-12-31\"}");

  const load = () => api.get("/reports").then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);

  const createReport = async () => {
    await api.post("/reports", { type, paramsJson });
    await load();
  };

  return (
    <section>
      <h1>Отчеты</h1>
      <div className="form-row card">
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Тип отчета" />
        <input value={paramsJson} onChange={(e) => setParamsJson(e.target.value)} placeholder="JSON параметры" />
        <button onClick={createReport}>Создать отчет</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Тип</th>
            <th>Параметры</th>
            <th>Создан</th>
            <th>Автор</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.id}</td>
              <td>{x.type}</td>
              <td>{x.paramsJson}</td>
              <td>{new Date(x.createdAt).toLocaleString()}</td>
              <td>{x.createdBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
