import { useEffect, useState } from "react";
import { api } from "../api";
import { PencilLucideIcon, TrashLucideIcon } from "../icons/tableActionIcons";

type Violation = {
  id: number;
  employeeId: number;
  employee: string;
  violationTypeId: number;
  violationType: string;
  description: string;
  severity: number;
  dateTimeUtc: string;
  inspectorId: number;
  inspector: string;
  photoPath?: string;
  videoPath?: string;
  penaltyPoints: number;
};

export function ViolationsPage() {
  const [rows, setRows] = useState<Violation[]>([]);
  const [employees, setEmployees] = useState<{ id: number; fullName: string }[]>([]);
  const [types, setTypes] = useState<{ id: number; name: string }[]>([]);
  const [employeeId, setEmployeeId] = useState(0);
  const [violationTypeId, setViolationTypeId] = useState(0);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState(2);
  const [dateTimeUtc, setDateTimeUtc] = useState(new Date().toISOString().slice(0, 16));
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filterEmployeeId, setFilterEmployeeId] = useState<number>(0);
  const [filterTypeId, setFilterTypeId] = useState<number>(0);
  const role = localStorage.getItem("role");

  const load = () => {
    if (role === "Employee") {
      // Для сотрудников получаем только их нарушения
      api.get("/violations/my-violations").then((res) => setRows(res.data));
    } else {
      // Для инспекторов и админов получаем все нарушения с фильтрами
      api.get("/violations", {
        params: {
          employeeId: filterEmployeeId || undefined,
          violationTypeId: filterTypeId || undefined
        }
      }).then((res) => setRows(res.data));
    }
  };

  useEffect(() => {
    if (role !== "Employee") {
      api.get("/employees").then((res) => {
        setEmployees(res.data);
        setFilterEmployeeId((prev) => {
          if (prev === 0) return 0;
          return res.data.some((e: { id: number }) => e.id === prev) ? prev : 0;
        });
      });
      api.get("/violation-types").then((res) => setTypes(res.data));
    }
  }, [role]);

  useEffect(() => { load(); }, [role]);

  useEffect(() => { 
    if (role !== "Employee") {
      load(); 
    }
  }, [filterEmployeeId, filterTypeId]);

  useEffect(() => { 
    if (role === "Employee") {
      load(); 
    }
  }, [role]);

  useEffect(() => {
    setEmployeeId((prev) => (prev !== 0 && !employees.some((e) => e.id === prev) ? 0 : prev));
  }, [employees]);

  const resetForm = () => {
    setEmployeeId(0);
    setViolationTypeId(0);
    setDescription("");
    setSeverity(2);
    setDateTimeUtc(new Date().toISOString().slice(0, 16));
    setPhoto(null);
    setVideo(null);
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const save = async () => {
    if (!employeeId || !violationTypeId) return;
    try {
      const form = new FormData();
      form.append("employeeId", String(employeeId));
      form.append("violationTypeId", String(violationTypeId));
      form.append("severity", String(severity));
      form.append("dateTimeUtc", new Date(dateTimeUtc).toISOString());
      form.append("description", description || "");
      if (photo) form.append("photo", photo);
      if (video) form.append("video", video);

      if (editingId) {
        await api.put(`/violations/${editingId}`, form, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/violations", form, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setEditingId(null);
      setDescription("");
      setPhoto(null);
      setVideo(null);
      await load();
      closeModal();
    } catch (error) {
      console.error("Error creating violation:", error);
      alert("Ошибка при создании нарушения");
    }
  };

  const edit = (row: Violation) => {
    setEditingId(row.id);
    setEmployeeId(row.employeeId);
    setViolationTypeId(row.violationTypeId);
    setDescription(row.description);
    setSeverity(row.severity);
    setDateTimeUtc(new Date(row.dateTimeUtc).toISOString().slice(0, 16));
    setIsModalOpen(true);
  };

  const remove = async (id: number) => {
    await api.delete(`/violations/${id}`);
    await load();
  };

  return (
    <section>
      <h1>Нарушения</h1>
      {role !== "Employee" && (
        <div className="form-row card">
          <select value={filterEmployeeId} onChange={(e) => setFilterEmployeeId(Number(e.target.value))}>
            <option value={0}>Все сотрудники</option>
            {employees.map((x) => <option value={x.id} key={x.id}>{x.fullName}</option>)}
          </select>
          <select value={filterTypeId} onChange={(e) => setFilterTypeId(Number(e.target.value))}>
            <option value={0}>Все типы</option>
            {types.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}
          </select>
        </div>
      )}
      {role === "Inspector" && (
        <div className="form-row card" style={{ gap: '10px' }}>
          <button onClick={openCreateModal}>Создать нарушение</button>
        </div>
      )}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-grid">
              <select value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))} aria-label="Сотрудник">
                <option value={0}>Выберите сотрудника</option>
                {employees.map((x) => <option value={x.id} key={x.id}>{x.fullName}</option>)}
              </select>
              <select value={violationTypeId} onChange={(e) => setViolationTypeId(Number(e.target.value))} aria-label="Тип нарушения">
                <option value={0}>Тип нарушения</option>
                {types.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}
              </select>
              <textarea
                className="modal-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Описание"
                aria-label="Описание"
              />
              <div className="modal-row">
                <label>
                  Серьезность
                  <select value={severity} onChange={(e) => setSeverity(Number(e.target.value))}>
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </label>
                <label>
                  Время фиксации
                  <input type="datetime-local" value={dateTimeUtc} onChange={(e) => setDateTimeUtc(e.target.value)} />
                </label>
              </div>
              <label>
                Фото
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                  {photo && (
                    <div style={{ marginLeft: '10px' }}>
                      <img src={URL.createObjectURL(photo)} alt="Photo" style={{ width: '100px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                    </div>
                  )}
                </div>
              </label>
              <label>
                Видео
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input type="file" accept=".mp4,.mov,.avi,.webm" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
                  {video && <span style={{ fontSize: '1.2rem', color: '#4caf50' }}>✓</span>}
                </div>
              </label>
              <div className="modal-row" style={{ justifyContent: 'flex-end' }}>
                <button onClick={closeModal} type="button">Отмена</button>
                <button onClick={save} type="button">{editingId ? 'Сохранить' : 'Создать'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="card table-sheet">
      <table>
        <thead>
          <tr>
            <th>Сотрудник</th>
            <th>Тип</th>
            <th>Описание</th>
            <th>Серьезность</th>
            <th>Инспектор</th>
            <th>Баллы</th>
            <th>Медиа</th>
            {role === "Inspector" && <th className="table-col-actions">Действия</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && role === "Employee" ? (
            <tr>
              <td colSpan={role === "Employee" ? 7 : 8} style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
                У вас нет выявленных нарушений
              </td>
            </tr>
          ) : (
            rows.map((x) => (
              <tr key={x.id}>
                <td>{x.employee}</td>
                <td>{x.violationType}</td>
                <td>{x.description}</td>
                <td>{x.severity}</td>
                <td>{x.inspector}</td>
                <td>{x.penaltyPoints}</td>
                <td>
                  {x.photoPath && <a href={`http://localhost:5000${x.photoPath}`} target="_blank" rel="noreferrer">Фото</a>}
                  {x.videoPath && <> {x.photoPath ? "|" : ""} <a href={`http://localhost:5000${x.videoPath}`} target="_blank" rel="noreferrer">Видео</a></>}
                </td>
                {role === "Inspector" && (
                  <td>
                    <div className="users-table-actions">
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => edit(x)}
                        aria-label="Редактировать нарушение"
                        title="Редактировать"
                      >
                        <PencilLucideIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-action-btn icon-action-btn--danger"
                        onClick={() => remove(x.id)}
                        aria-label="Удалить нарушение"
                        title="Удалить"
                      >
                        <TrashLucideIcon />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </section>
  );
}
