/** Даты из API без суффикса Z (частый случай с SQLite) — трактуем как UTC, иначе браузер сдвигает на часовой пояс. */
export function parseApiDateTimeAsUtc(iso: string): Date {
  const s = (iso ?? "").trim();
  if (!s) return new Date(NaN);
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(`${s}Z`);
}

const MSK_TIME_ZONE = "Europe/Moscow";

/** Отображение в МСК (UTC+3, без перехода на летнее время). */
export function formatDateTimeInMoscow(iso: string, withSeconds: boolean): string {
  const d = parseApiDateTimeAsUtc(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: MSK_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
  }).format(d);
}
