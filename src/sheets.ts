import fs from "fs";
import { google } from "googleapis";
import { config } from "./config";

export type SheetRow = {
  rowNumber: number;
  titulo: string;
  mensaje: string;
  fecha: string;
  hora: string;
  repetir: string;
  estado: string;
  enviado: string;
};

type IndexMap = Record<string, number>;

const creds = JSON.parse(
  fs.readFileSync(config.googleCredsPath, "utf8")
) as object;

const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

function colLetterFromIndex(i: number) {
  return String.fromCharCode("A".charCodeAt(0) + i);
}

export async function getHeaders(): Promise<string[]> {
  const range = `${config.sheetTab}!A1:G1`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheetId,
    range,
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  const row = res.data.values?.[0] ?? [];
  return row.map((x) => (x ?? "").toString().trim());
}

export async function getSheetRows(headers: string[]): Promise<SheetRow[]> {
  const range = `${config.sheetTab}!A:G`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheetId,
    range,
  });

  const values = res.data.values ?? [];
  if (values.length < 2) return [];

  const idx: IndexMap = Object.fromEntries(headers.map((h, i) => [h, i]));
  const rows = values.slice(1);

  const out: SheetRow[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];

    const get = (name: keyof SheetRow | string) => {
      const i = idx[name as string];
      if (i === undefined) return "";
      return (row[i] ?? "").toString();
    };

    out.push({
      rowNumber: r + 2,
      titulo: get("Titulo"),
      mensaje: get("Mensaje"),
      fecha: get("Fecha"),
      hora: get("Hora"),
      repetir: get("Repetir"),
      estado: get("Estado"),
      enviado: get("Enviado"),
    });
  }

  return out;
}

export async function updateCells(
  rowNumber: number,
  headers: string[],
  updates: Record<string, string>
) {
  for (const [header, value] of Object.entries(updates)) {
    const idx = headers.indexOf(header);
    if (idx === -1) throw new Error(`Header not found: ${header}`);
    await updateCell(rowNumber, idx, value);
  }
}

async function updateCell(rowNumber: number, colIndex: number, value: string) {
  const col = colLetterFromIndex(colIndex);
  const range = `${config.sheetTab}!${col}${rowNumber}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.sheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

export async function markAsSent(
  rowNumber: number,
  headers: string[],
  sentAtIso: string
) {
  const estadoIdx = headers.indexOf("Estado");
  const enviadoIdx = headers.indexOf("Enviado");
  if (estadoIdx === -1 || enviadoIdx === -1) {
    throw new Error(`Headers must include "estado" and "enviado_en"`);
  }
  await updateCell(rowNumber, estadoIdx, "enviado");
  await updateCell(rowNumber, enviadoIdx, sentAtIso);
}
