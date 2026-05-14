import { useCallback, useEffect, useState } from "react";
import { api, API_ORIGIN } from "../api";
import { formatDateTimeInMoscow } from "../dateTimeUtc";
import { TrashLucideIcon } from "../icons/tableActionIcons";

type ReportPeriod = "Daily" | "Monthly" | "Quarterly" | "Yearly";

type ReportRow = {
  id: number;
  createdAt: string;
  type: string;
  periodLabel: string;
  paramsJson: string;
  pdfPath: string | null;
  authorFullName: string;
  createdBy: number;
};

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: "Daily", label: "Дневной" },
  { value: "Monthly", label: "Месячный" },
  { value: "Quarterly", label: "Квартальный" },
  { value: "Yearly", label: "Годовой" }
];

/**
 * В API время отчёта в UTC; без суффикса Z (частый случай с SQLite) браузер иначе
 * воспринимает строку как локальную и сдвигает на 3 ч.
 */
function formatReportDateTimeUtcPlus3(iso: string): string {
  return formatDateTimeInMoscow(iso, false);
}

export function ReportsPage() {
  const role = localStorage.getItem("role");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [period, setPeriod] = useState<ReportPeriod>("Monthly");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api.get<ReportRow[]>("/reports").then((res) => setRows(res.data));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeModal = () => setIsModalOpen(false);

  const createReport = async () => {
    setSubmitting(true);
    try {
      await api.post("/reports", { period });
      await load();
      closeModal();
    } catch (e) {
      console.error(e);
      alert("Не удалось сформировать отчёт");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить отчёт? Файл будет удалён безвозвратно.")) return;
    try {
      await api.delete(`/reports/${id}`);
      await load();
    } catch (e) {
      console.error(e);
      alert("Не удалось удалить отчёт");
    }
  };

  const isInspector = role === "Inspector";

  return (
    <section>
      <div className="users-page-toolbar">
        <h1 className="users-page-title">
          <span className="users-page-title-line1">Отчеты</span>
          <span className="users-page-title-line2">по нарушениям</span>
        </h1>
        {isInspector && (
          <button type="button" className="users-create-btn" onClick={() => setIsModalOpen(true)}>
            Создать отчёт
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card card users-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <h2 className="users-modal-title">Новый отчёт</h2>
              <button type="button" className="users-modal-close" onClick={closeModal} aria-label="Закрыть">
                ✕
              </button>
            </div>
            <div className="reports-modal-body">
              <label className="reports-period-label" htmlFor="report-period-select">
                Период
              </label>
              <select
                id="report-period-select"
                className="violations-modal-select"
                value={period}
                onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
                aria-label="Период отчёта"
              >
                {periodOptions.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="users-modal-footer">
              <button type="button" onClick={closeModal}>
                Отмена
              </button>
              <button type="button" className="users-modal-submit-btn" disabled={submitting} onClick={createReport}>
                {submitting ? "Формирование…" : "Сформировать PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card table-sheet">
        <table>
          <thead>
            <tr>
              <th>Создан</th>
              <th>Автор</th>
              <th className="table-col-center">Отчёт</th>
              <th className="table-col-actions"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "20px", fontStyle: "italic" }}>
                  Отчётов пока нет
                </td>
              </tr>
            ) : (
              rows.map((x) => (
                <tr key={x.id}>
                  <td>{formatReportDateTimeUtcPlus3(x.createdAt)}</td>
                  <td>{x.authorFullName}</td>
                  <td className="table-col-center">
                    {x.pdfPath ? (
                      <a href={`${API_ORIGIN}${x.pdfPath}`} target="_blank" rel="noreferrer" className="reports-pdf-link">
                        Открыть PDF
                      </a>
                    ) : (
                      <span className="reports-pdf-missing">—</span>
                    )}
                  </td>
                  <td>
                    <div className="users-table-actions">
                      <button
                        type="button"
                        className="icon-action-btn icon-action-btn--danger"
                        onClick={() => remove(x.id)}
                        aria-label="Удалить отчёт"
                        title="Удалить"
                      >
                        <TrashLucideIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
