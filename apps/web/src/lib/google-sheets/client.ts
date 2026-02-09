import { google } from "googleapis";
import { resolveSpreadsheetIdFromEnv } from "@/lib/google-sheets/config";

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

export function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const keyJson = process.env["GOOGLE_SERVICE_ACCOUNT_KEY"];
  if (!keyJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(keyJson) as Record<string, unknown>;
  } catch {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is invalid JSON. Please set one-line JSON string."
    );
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

export function getSpreadsheetId(): string {
  const id = resolveSpreadsheetIdFromEnv();
  if (!id) {
    throw new Error("GOOGLE_SHEETS_ID is not set");
  }
  return id;
}
