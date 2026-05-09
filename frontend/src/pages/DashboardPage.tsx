import { useEffect, useState } from "react";
import { PieChart, Pie, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api";

const CustomTooltip = (props: any) => {
  const { active, payload } = props;
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#fff',
        padding: '8px 12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        color: '#000'
      }}>
        <p style={{ margin: 0, color: '#000', fontWeight: 'bold' }}>
          {payload[0].payload.department}
        </p>
        <p style={{ margin: '4px 0 0 0', color: '#000' }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

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
              <Pie 
                data={byType} 
                dataKey="count" 
                nameKey="type" 
                outerRadius={90}
              >
                {byType.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={[
                      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
                      "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#A3E4D7",
                      "#F5A962", "#70C1B3", "#FF6F91", "#4D96FF", "#6C5B7B"
                    ][index % 15]}
                  />
                ))}
              </Pie>
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
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#46a6ff" name="кол-во" />
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
