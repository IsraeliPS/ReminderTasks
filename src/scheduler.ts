import { DateTime } from "luxon";
import { config } from "./config";
import { sendTelegram } from "./telegram";
import { getHeaders, getSheetRows, markAsSent, updateCells } from "./sheets";

import { parseDue, nextDue } from "./utils/time";

export async function runOnce() {
  const headers = await getHeaders();

  const required = [
    "Titulo",
    "Mensaje",
    "Fecha",
    "Hora",
    "Repetir",
    "Estado",
    "Enviado",
  ];

  for (const h of required) {
    if (!headers.includes(h)) {
      throw new Error(
        `Sheet missing header "${h}". Headers found: ${headers.join(", ")}`
      );
    }
  }

  const rows = await getSheetRows(headers);
  const nowUtc = DateTime.utc();

  for (const r of rows) {
    const estado = (r.estado ?? "").trim().toLowerCase() || "pendiente";
    if (estado !== "pendiente") continue;

    if (!r.fecha?.trim() || !r.hora?.trim()) continue;

    const tz = config.defaultTz;
    const due = parseDue(r.fecha, r.hora, tz);
    if (!due.isValid) continue;

    const now = DateTime.utc().setZone(tz);

    if (due <= now) {
      const titulo = r.titulo?.trim() || "Recordatorio";
      const msg = r.mensaje?.trim() || titulo;

      await sendTelegram(`⏰ ${titulo}\n${msg}`);

      const sentIso = DateTime.utc().toISO() ?? "";
      const next = nextDue(due, r.repetir);

      if (!next) {
        await updateCells(r.rowNumber, headers, {
          Estado: "enviado",
          Enviado: sentIso,
        });
      } else {
        await updateCells(r.rowNumber, headers, {
          Fecha: next.toFormat("yyyy-LL-dd"),
          Hora: next.toFormat("HH:mm"),
          Estado: "pendiente",
          Enviado: sentIso,
        });
      }
    }
  }
}
