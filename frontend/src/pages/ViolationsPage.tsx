import { useEffect, useState } from "react";
import { api, API_ORIGIN } from "../api";
import { CameraLucideIcon, PencilLucideIcon, TrashLucideIcon, VideoLucideIcon } from "../icons/tableActionIcons";
import { parseApiDateTimeAsUtc } from "../dateTimeUtc";

function toDatetimeLocalValue(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Violation = {
  id: number;
  employeeId: number;
  employee: string;
  violationTypeId: number;
  violationType: string;
  description: string;
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
  const [dateTimeUtc, setDateTimeUtc] = useState(() => toDatetimeLocalValue(new Date()));
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filterEmployeeId, setFilterEmployeeId] = useState<number>(0);
  const [filterTypeId, setFilterTypeId] = useState<number>(0);
  const role = localStorage.getItem("role");

  const load = () => {
    if (role === "Employee") {
      api.get("/violations/my-violations").then((res) => setRows(res.data));
    } else {
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

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const resetForm = () => {
    setEmployeeId(0);
    setViolationTypeId(0);
    setDescription("");
    setDateTimeUtc(toDatetimeLocalValue(new Date()));
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
    setDateTimeUtc(toDatetimeLocalValue(parseApiDateTimeAsUtc(row.dateTimeUtc)));
    setIsModalOpen(true);
  };

  const remove = async (id: number) => {
    await api.delete(`/violations/${id}`);
    await load();
  };

  const mediaColSpan = role === "Inspector" ? 7 : 6;

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
        <div className="form-row card" style={{ gap: "10px" }}>
          <button type="button" onClick={openCreateModal}>
            Добавить нарушение
          </button>
        </div>
      )}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card card violations-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <h2 className="users-modal-title">{editingId ? "Редактировать нарушение" : "Добавить нарушение"}</h2>
              <button type="button" className="users-modal-close" onClick={closeModal} aria-label="Закрыть">
                ✕
              </button>
            </div>
            <div className="violations-modal-body">
              <select
                className="violations-modal-select"
                value={employeeId}
                onChange={(e) => setEmployeeId(Number(e.target.value))}
                aria-label="Сотрудник"
              >
                <option value={0}>Выберите сотрудника</option>
                {employees.map((x) => <option value={x.id} key={x.id}>{x.fullName}</option>)}
              </select>
              <select
                className="violations-modal-select"
                value={violationTypeId}
                onChange={(e) => setViolationTypeId(Number(e.target.value))}
                aria-label="Тип нарушения"
              >
                <option value={0}>Тип нарушения</option>
                {types.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}
              </select>
              <textarea
                className="modal-textarea-full violations-modal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Описание"
                aria-label="Описание"
              />
              <label className="violations-modal-datetime">
                <span>Время фиксации</span>
                <input type="datetime-local" value={dateTimeUtc} onChange={(e) => setDateTimeUtc(e.target.value)} />
              </label>
              <label className="violations-modal-file-label">
                Фото
                <div className="violations-modal-file-row">
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                  {photoPreviewUrl && (
                    <img className="violations-modal-photo-thumb" src={photoPreviewUrl} alt="Предпросмотр фото" />
                  )}
                </div>
              </label>
              <label className="violations-modal-file-label">
                Видео
                <div className="violations-modal-file-row">
                  <input type="file" accept=".mp4,.mov,.avi,.webm" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
                  {video && <span className="violations-modal-video-check" aria-hidden>✓</span>}
                </div>
              </label>
            </div>
            <div className="users-modal-footer">
              <button type="button" onClick={closeModal}>
                Отмена
              </button>
              <button type="button" className="users-modal-submit-btn" onClick={save}>
                {editingId ? "Сохранить" : "Добавить"}
              </button>
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
              <th className="table-col-center">Инспектор</th>
              <th className="table-col-center">Баллы</th>
              <th className="table-col-center">Медиа</th>
              {role === "Inspector" && <th className="table-col-actions">Действия</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && role === "Employee" ? (
              <tr>
                <td colSpan={mediaColSpan} style={{ textAlign: "center", padding: "20px", fontStyle: "italic" }}>
                  У вас нет выявленных нарушений
                </td>
              </tr>
            ) : (
              rows.map((x) => (
                <tr key={x.id}>
                  <td>{x.employee}</td>
                  <td>{x.violationType}</td>
                  <td>{x.description}</td>
                  <td className="table-col-center">{x.inspector}</td>
                  <td className="table-col-center">{x.penaltyPoints}</td>
                  <td className="table-col-center">
                    <div className="violations-table-media">
                      {x.photoPath && (
                        <a
                          href={`${API_ORIGIN}${x.photoPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="violations-media-link"
                          title="Фото"
                          aria-label="Открыть фото"
                        >
                          <CameraLucideIcon size={20} />
                        </a>
                      )}
                      {x.videoPath && (
                        <a
                          href={`${API_ORIGIN}${x.videoPath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="violations-media-link"
                          title="Видео"
                          aria-label="Открыть видео"
                        >
                          <VideoLucideIcon size={20} />
                        </a>
                      )}
                    </div>
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
