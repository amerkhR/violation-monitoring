import { useEffect, useState } from "react";
import { api } from "../api";

type Employee = {
  id: number;
  tabNumber?: string | null;
  fullName: string;
  department: string;
  position: string;
  violationCount: number;
  penaltyPoints: number;
};

export function EmployeesPage() {
  const [rows, setRows] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [departmentId, setDepartmentId] = useState(1);
  const [hireDate, setHireDate] = useState("2024-01-01");
  const [photoByEmployee, setPhotoByEmployee] = useState<Record<number, File | null>>({});

  const load = () => api.get("/employees", { params: { search: search || undefined } }).then((res) => setRows(res.data));
  useEffect(() => { load(); }, []);
  useEffect(() => { load(); }, [search]);
  const role = localStorage.getItem("role");

  const createEmployee = async () => {
    await api.post("/employees", {
      fullName,
      departmentId,
      position,
      hireDate
    });
    setFullName("");
    setPosition("");
    await load();
  };

  const deleteEmployee = async (id: number) => {
    await api.delete(`/employees/${id}`);
    await load();
  };

  const uploadPhoto = async (id: number) => {
    const file = photoByEmployee[id];
    if (!file) return;
    const form = new FormData();
    form.append("photo", file);
    await api.post(`/employees/${id}/photo`, form, { headers: { "Content-Type": "multipart/form-data" } });
    await load();
  };

  return (
    <section>
      <h1>Сотрудники</h1>
      <div className="form-row card">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по ФИО" />
      </div>
      {role === "Admin" && <div className="form-row card">
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ФИО" />
        <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Должность" />
        <input type="number" value={departmentId} onChange={(e) => setDepartmentId(Number(e.target.value))} placeholder="DepartmentId" />
        <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
        <button onClick={createEmployee}>Добавить сотрудника</button>
      </div>}
      <table>
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Табельный номер</th>
            <th>Отдел</th>
            <th>Должность</th>
            {role !== "Employee" && <th>Нарушения</th>}
            {role !== "Employee" && <th>Баллы</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.fullName}</td>
              <td>{x.tabNumber ?? (x as any).TabNumber ?? ""}</td>
              <td>{x.department}</td>
              <td>{x.position}</td>
              {role !== "Employee" && <td>{x.violationCount}</td>}
              {role !== "Employee" && <td>{x.penaltyPoints}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
