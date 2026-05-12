import { useEffect, useState } from "react";
import { api } from "../api";
import { EyeClosedLucideIcon, EyeLucideIcon, PencilLucideIcon, TrashLucideIcon } from "../icons/tableActionIcons";

type UserRow = {
  id: number;
  login: string;
  fullName: string;
  role: string;
  isActive: boolean;
  tabNumber?: string | null;
  department: string | null;
  position: string | null;
  hireDate: string | null;
  photoPath: string | null;
  violationCount: number;
  penaltyPoints: number;
};

type Department = {
  id: number;
  name: string;
};

const departmentNames = [
  "Производственный цех",
  "Склад",
  "Отдел технического контроля",
  "Ремонтно-механический отдел",
  "Отдел главного энергетика",
  "Бухгалтерия",
  "Отдел кадров",
  "Служба охраны труда",
  "Транспортный отдел",
  "Охрана"
];

const defaultDepartments = departmentNames.map((name, index) => ({ id: index + 1, name }));

const initialState = {
  id: 0,
  login: "",
  lastName: "",
  firstName: "",
  middleName: "",
  role: "Employee",
  isActive: true,
  departmentId: 0,
  position: "",
  hireDate: new Date().toISOString().slice(0, 10),
  password: "User123!",
  confirmPassword: ""
};

export function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>(defaultDepartments);
  const [form, setForm] = useState({ ...initialState });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const departmentOptions = Array.from(
    new Map([...defaultDepartments, ...departments].map((item) => [item.name, item])).values()
  );

  const load = () => api.get("/users").then((res) => setRows(res.data));
  const loadDepartments = async () => {
    try {
      const res = await api.get("/departments");
      const loadedDepartments: Department[] = res.data;
      setDepartments(loadedDepartments.length ? loadedDepartments : defaultDepartments);
    } catch {
      setDepartments(defaultDepartments);
    }
  };

  useEffect(() => {
    load();
    loadDepartments();
  }, []);

  const resetForm = () => {
    setForm({ ...initialState });
    setPhoto(null);
    setIsEditing(false);
    setShowPassword(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const uploadPhoto = async (userId: number) => {
    if (!photo) return;
    const formData = new FormData();
    formData.append("photo", photo);
    await api.post(`/users/${userId}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  };

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

  const fullName = [form.lastName, form.firstName, form.middleName].filter(Boolean).join(" ");

  const save = async () => {
    const departmentId = form.role === "Inspector" ? departmentOptions[0]?.id ?? form.departmentId : form.departmentId;
    const position = form.role === "Inspector" ? form.position || "Инспектор" : form.position;

    if (!form.login || !form.lastName || !form.firstName || !form.hireDate || (form.role !== "Inspector" && (!departmentId || !position))) {
      alert("Заполните обязательные поля.");
      return;
    }

    if (!isEditing && !form.password) {
      alert("Укажите пароль пользователя.");
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      alert("Пароли не совпадают.");
      return;
    }

    try {
      console.log("Saving user:", {
        login: form.login,
        fullName,
        role: form.role,
        departmentId,
        position,
        hireDate: form.hireDate,
        isActive: form.isActive,
        password: form.password ? "***" : null
      });

      if (isEditing) {
        await api.put(`/users/${form.id}`, {
          login: form.login,
          fullName,
          role: form.role,
          isActive: form.isActive,
          departmentId,
          position,
          hireDate: form.hireDate
        });

        if (photo) {
          await uploadPhoto(form.id);
        }

        if (form.password) {
          await api.put(`/users/${form.id}/password`, {
            currentPassword: "",
            newPassword: form.password
          });
        }
      } else {
        const response = await api.post("/users", {
          login: form.login,
          password: form.password,
          fullName,
          role: form.role,
          isActive: form.isActive,
          departmentId,
          position,
          hireDate: form.hireDate
        });
        const userId = response.data.id;
        if (photo) {
          await uploadPhoto(userId);
        }
      }

      await load();
      closeModal();
    } catch (error: any) {
      console.error("Error saving user:", error.response?.data || error.message);
      alert("Ошибка при сохранении пользователя: " + (error.response?.data || error.message));
    }
  };

  const edit = (row: UserRow) => {
    const parts = row.fullName.split(" ");
    const [lastName, firstName, ...rest] = parts;
    setForm({
      id: row.id,
      login: row.login,
      lastName: lastName ?? "",
      firstName: firstName ?? "",
      middleName: rest.join(" "),
      role: row.role,
      isActive: row.isActive,
      departmentId: departmentOptions.find((d) => d.name === row.department)?.id ?? 0,
      position: row.position ?? "",
      hireDate: row.hireDate ? row.hireDate.split("T")[0] : new Date().toISOString().slice(0, 10),
      password: "",
      confirmPassword: ""
    });
    setPhoto(null);
    setIsEditing(true);
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить пользователя?")) return;
    await api.delete(`/users/${id}`);
    await load();
    closeModal();
  };

  return (
    <section>
      <div className="users-page-toolbar">
        <h1 className="users-page-title">
          <span className="users-page-title-line1">Администрирование</span>
          <span className="users-page-title-line2">пользователей</span>
        </h1>
        <button type="button" className="users-create-btn" onClick={openCreateModal}>
          Создать пользователя
        </button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card card users-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <h2 className="users-modal-title">{isEditing ? "Редактирование пользователя" : "Новый пользователь"}</h2>
              <button type="button" className="users-modal-close" onClick={closeModal} aria-label="Закрыть">
                ✕
              </button>
            </div>
            <div className="modal-grid">
              <div className="modal-row">
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="Employee">Сотрудник</option>
                  <option value="Inspector">Инспектор</option>
                </select>
              </div>
              <div className="modal-row">
                <input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="Логин" />
              </div>
              <div className="modal-row">
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Фамилия" />
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Имя" />
                <input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} placeholder="Отчество" />
              </div>
              {form.role !== "Inspector" && (
                <div className="modal-row">
                  <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: Number(e.target.value) })}>
                    <option value={0}>Выберите отдел</option>
                    {departmentOptions.map((x) => (
                      <option value={x.id} key={x.id}>{x.name}</option>
                    ))}
                  </select>
                  <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Должность" />
                </div>
              )}
              <div className="modal-row">
                <label style={{ width: "100%" }}>
                  Фото сотрудника
                  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {photoPreview && (
                <div className="modal-row photo-preview">
                  <img src={photoPreview} alt="Фото сотрудника" />
                </div>
              )}
              <div className="modal-row">
                <label className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={isEditing ? "Новый пароль" : "Пароль"}
                  />
                  <button
                    type="button"
                    className="password-field-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPassword ? <EyeClosedLucideIcon size={16} /> : <EyeLucideIcon size={16} />}
                  </button>
                </label>
                <label className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Повторите пароль"
                  />
                  <button
                    type="button"
                    className="password-field-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  >
                    {showPassword ? <EyeClosedLucideIcon size={16} /> : <EyeLucideIcon size={16} />}
                  </button>
                </label>
              </div>
              <div className="modal-row">
                <label style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                  <span>Дата приёма</span>
                  <input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
                </label>
              </div>
            </div>
            <div className="users-modal-footer">
              <button type="button" onClick={closeModal}>
                Отмена
              </button>
              <button type="button" className="users-modal-submit-btn" onClick={save}>
                {isEditing ? "Сохранить" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card table-sheet">
      <table>
        <thead>
          <tr>
            <th>Логин</th>
            <th>ФИО</th>
            <th className="table-col-center">Табельный номер</th>
            <th>Роль</th>
            <th>Отдел</th>
            <th className="table-col-center">Должность</th>
            <th className="table-col-center">Дата приёма</th>
            <th className="table-col-center">Нарушения</th>
            <th className="table-col-center">Штрафные баллы</th>
            <th className="table-col-actions">Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.id}>
              <td>{x.login}</td>
              <td>{x.fullName}</td>
              <td className="table-col-center">{x.tabNumber ?? (x as any).TabNumber ?? ""}</td>
              <td>{x.role}</td>
              <td>{x.department}</td>
              <td className="table-col-center">{x.position}</td>
              <td className="table-col-center">{x.hireDate ? x.hireDate.split("T")[0] : ""}</td>
              <td className="table-col-center">{x.violationCount}</td>
              <td className="table-col-center">{x.penaltyPoints}</td>
              <td>
                <div className="users-table-actions">
                  <button
                    type="button"
                    className="icon-action-btn"
                    onClick={() => edit(x)}
                    aria-label="Редактировать пользователя"
                    title="Редактировать"
                  >
                    <PencilLucideIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-action-btn icon-action-btn--danger"
                    onClick={() => remove(x.id)}
                    aria-label="Удалить пользователя"
                    title="Удалить"
                  >
                    <TrashLucideIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
