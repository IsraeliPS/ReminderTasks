import { DateTime } from "luxon";

function fromGoogleSerialDate(dateSerial: number, tz: string) {
  const base = DateTime.fromISO("1899-12-30T00:00:00", { zone: "utc" });
  return base.plus({ days: dateSerial }).setZone(tz);
}

function timeToMinutes(time: string | number) {
  if (typeof time === "number") return Math.round(time * 24 * 60);
  const [hh, mm] = time.trim().split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

export function parseDue(
  fecha: string | number,
  hora: string | number,
  tz: string
) {
  // fecha serial
  if (typeof fecha === "number") {
    const dt = fromGoogleSerialDate(fecha, tz);
    const mins = timeToMinutes(hora);
    if (mins == null) return dt; // si no hay hora válida, deja 00:00
    return dt.set({
      hour: Math.floor(mins / 60),
      minute: mins % 60,
      second: 0,
      millisecond: 0,
    });
  }

  // fallback: texto (por si acaso)
  const f = fecha.trim();
  const h = typeof hora === "string" ? hora.trim() : `${hora}`;

  let dt = DateTime.fromFormat(`${f} ${h}`, "yyyy-LL-dd HH:mm", { zone: tz });
  if (dt.isValid) return dt;

  dt = DateTime.fromFormat(`${f} ${h}`, "d/L/yyyy HH:mm", { zone: tz }); // 9/1/2026
  if (dt.isValid) return dt;

  dt = DateTime.fromFormat(`${f} ${h}`, "L/d/yyyy HH:mm", { zone: tz }); // 1/9/2026
  return dt;
}

export function nextDue(due: DateTime, repetir: string) {
  const r = (repetir ?? "").trim().toLowerCase();
  switch (r) {
    case "diario":
      return due.plus({ days: 1 });
    case "semanal":
      return due.plus({ weeks: 1 });
    case "mensual":
      return due.plus({ months: 1 });
    case "anual":
      return due.plus({ years: 1 });
    default:
      return null;
  }
}
