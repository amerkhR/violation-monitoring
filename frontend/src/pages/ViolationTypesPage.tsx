import { useEffect, useState } from "react";
import { api } from "../api";
import { CheckLucideIcon, PencilLucideIcon, TrashLucideIcon } from "../icons/tableActionIcons";

type ViolationType = {
  id: number;
  name: string;
  defaultPoints: number;
  severityDefault: number | string;
  isActive: boolean;
};

const SEVERITY_OPTIONS = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
] as const;

function severityToNumber(v: unknown): 1 | 2 | 3 {
  if (v === 1 || v === 2 || v === 3) return v;
  if (typeof v === "string") {
    const key = v.trim();
    const map: Record<string, 1 | 2 | 3> = {
      Low: 1,
      Medium: 2,
      High: 3,
      low: 1,
      medium: 2,
      high: 3,
    };
    return map[key] ?? 2;
  }
  return 2;
}

function severityLabel(v: unknown): string {
  const n = severityToNumber(v);
  return SEVERITY_OPTIONS.find((o) => o.value === n)?.label ?? String(n);
}

export function ViolationTypesPage() {
  const [rows, setRows] = useState<ViolationType[]>([]);
  const [name, setName] = useState("");
  const [defaultPoints, setDefaultPoints] = useState(1);
  const [severityDefault, setSeverityDefault] = useState(2);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDefaultPoints, setEditDefaultPoints] = useState(1);
  const [editSeverity, setEditSeverity] = useState<1 | 2 | 3>(2);

  const load = () => api.get("/violation-types").then((res) => setRows(res.data));
  useEffect(() => {
    load();
  }, []);

  const createType = async () => {
    await api.post("/violation-types", { name, defaultPoints, severityDefault, isActive: true });
    setName("");
    setDefaultPoints(1);
    setSeverityDefault(2);
    await load();
  };

  const deleteType = async (id: number) => {
    await api.delete(`/violation-types/${id}`);
    if (editingId === id) setEditingId(null);
    await load();
  };

  const startEdit = (x: ViolationType) => {
    setEditingId(x.id);
    setEditName(x.name);
    setEditDefaultPoints(Math.max(1, x.defaultPoints));
    setEditSeverity(severityToNumber(x.severityDefault));
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    const row = rows.find((r) => r.id === editingId);
    if (!row) return;
    const nameTrim = editName.trim();
    if (!nameTrim) {
      alert("Укажите название типа нарушения");
      return;
    }
    const pts = Math.max(1, Math.floor(Number(editDefaultPoints)) || 1);
    try {
      await api.put(`/violation-types/${editingId}`, {
        name: nameTrim,
        defaultPoints: pts,
        severityDefault: editSeverity,
        isActive: row.isActive,
      });
      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Не удалось сохранить изменения");
    }
  };

  const bumpPoints = (delta: number) => {
    setEditDefaultPoints((p) => Math.max(1, Math.floor(p + delta)));
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
            <th>Серьезность</th>
            <th className="table-col-actions">Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => {
            const isEditing = editingId === x.id;
            const otherRowEditing = editingId !== null && editingId !== x.id;
            return (
              <tr key={x.id}>
                <td>
                  {isEditing ? (
                    <input
                      className="violation-type-inline-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      aria-label="Название типа"
                    />
                  ) : (
                    x.name
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <div className="violation-type-points-stepper">
                      <button type="button" className="violation-type-stepper-btn" onClick={() => bumpPoints(-1)} aria-label="Уменьшить баллы">
                        −
                      </button>
                      <input
                        type="number"
                        className="violation-type-points-input"
                        min={1}
                        value={editDefaultPoints}
                        onChange={(e) => setEditDefaultPoints(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
                        aria-label="Баллы"
                      />
                      <button type="button" className="violation-type-stepper-btn" onClick={() => bumpPoints(1)} aria-label="Увеличить баллы">
                        +
                      </button>
                    </div>
                  ) : (
                    x.defaultPoints
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      className="violation-type-inline-select"
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(Number(e.target.value) as 1 | 2 | 3)}
                      aria-label="Серьезность"
                    >
                      {SEVERITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    severityLabel(x.severityDefault)
                  )}
                </td>
                <td>
                  <div className="users-table-actions">
                    {isEditing ? (
                      <button type="button" className="icon-action-btn" onClick={saveEdit} aria-label="Сохранить тип нарушения" title="Сохранить">
                        <CheckLucideIcon />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => startEdit(x)}
                        disabled={otherRowEditing}
                        aria-label="Редактировать тип нарушения"
                        title="Редактировать"
                      >
                        <PencilLucideIcon />
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-action-btn icon-action-btn--danger"
                      onClick={() => deleteType(x.id)}
                      disabled={otherRowEditing}
                      aria-label="Удалить тип нарушения"
                      title="Удалить"
                    >
                      <TrashLucideIcon />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
