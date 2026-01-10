import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function list(name: string): string[] {
  const v = required(name);
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  botToken: required("BOT_TOKEN"),
  sheetId: required("SHEET_ID"),
  sheetTab: process.env.SHEET_TAB ?? "Recordatorio",
  defaultTz: process.env.DEFAULT_TZ ?? "America/Mexico_City",
  pollCron: process.env.POLL_CRON ?? "* * * * *",
  googleCredsPath: required("GOOGLE_APPLICATION_CREDENTIALS") ?? "",
  chatIds: list("CHAT_IDS"),
  googleCredsB64: required("GOOGLE_SERVICE_ACCOUNT_B64"),
};
