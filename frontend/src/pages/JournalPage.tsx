import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { formatDateTimeInMoscow } from "../dateTimeUtc";

type AuditLogRow = {
  id: number;
  createdAtUtc: string;
  operationName: string;
  authorDisplay: string;
};

export function JournalPage() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get<AuditLogRow[]>("/audit-logs");
      setRows(res.data);
    } catch {
      setError("Не удалось загрузить журнал");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  return (
    <section>
      <h1>Журнал операций</h1>
      {error && <p className="error">{error}</p>}
      <div className="card table-sheet">
        <table>
          <thead>
            <tr>
              <th>Время</th>
              <th>Операция</th>
              <th>Автор</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !error ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "20px", fontStyle: "italic" }}>
                  Записей пока нет
                </td>
              </tr>
            ) : (
              rows.map((x) => (
                <tr key={x.id}>
                  <td>{formatDateTimeInMoscow(x.createdAtUtc, true)}</td>
                  <td>{x.operationName}</td>
                  <td>{x.authorDisplay}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
