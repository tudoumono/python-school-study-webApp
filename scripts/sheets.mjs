import { existsSync, readFileSync } from "fs";
import { google } from "googleapis";

// .env.local があればロード（なければ process.env をそのまま使用）
const envPath = "apps/web/.env.local";
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx);
    if (!process.env[key]) {
      process.env[key] = line.slice(idx + 1);
    }
  }
}

if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEETS_ID) {
  console.error("Error: GOOGLE_SERVICE_ACCOUNT_KEY と GOOGLE_SHEETS_ID が必要です。");
  console.error("apps/web/.env.local に設定するか、環境変数で渡してください。");
  process.exit(1);
}

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
export const sheets = google.sheets({ version: "v4", auth });
export const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

const cmd = process.argv[2];

if (cmd === "list-sheets") {
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  for (const s of res.data.sheets) {
    console.log(`- "${s.properties.title}" (${s.properties.sheetId})`);
  }
} else if (cmd === "read") {
  const range = process.argv[3] || "Sheet1!A1:P1";
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  for (const row of res.data.values || []) {
    console.log(JSON.stringify(row));
  }
} else {
  console.log("Usage: node scripts/sheets.mjs <list-sheets|read> [range]");
}
