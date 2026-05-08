import { useEffect, useState } from "react";
import { PieChart, Pie, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer } from "recharts";
import { api } from "../api";

export function DashboardPage() {
  const [summary, setSummary] = useState({ totalViolations: 0, totalPenaltyPoints: 0 });
  const [byType, setByType] = useState<{ type: string; count: number }[]>([]);
  const [byDep, setByDep] = useState<{ department: string; count: number }[]>([]);
  const [topEmployees, setTopEmployees] = useState<{ employee: string; violations: number; points: number }[]>([]);

  useEffect(() => {
    api.get("/analytics/summary").then((r) => setSummary(r.data));
    api.get("/analytics/by-violation-types").then((r) => setByType(r.data));
    api.get("/analytics/by-departments").then((r) => setByDep(r.data));
    api.get("/analytics/top-employees").then((r) => setTopEmployees(r.data));
  }, []);

  return (
    <section>
      <h1>Аналитика</h1>
      <div className="stats">
        <div className="card">Всего нарушений: {summary.totalViolations}</div>
        <div className="card">Штрафных баллов: {summary.totalPenaltyPoints}</div>
      </div>
      <div className="charts">
        <div className="card chart">
          <h3>По типам нарушений</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byType} dataKey="count" nameKey="type" outerRadius={90} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart">
          <h3>По отделам</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byDep}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#46a6ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <h3>Сотрудники с максимумом нарушений</h3>
        <table>
          <thead>
            <tr>
              <th>Сотрудник</th>
              <th>Нарушения</th>
              <th>Баллы</th>
            </tr>
          </thead>
          <tbody>
            {topEmployees.map((x) => (
              <tr key={x.employee}>
                <td>{x.employee}</td>
                <td>{x.violations}</td>
                <td>{x.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
