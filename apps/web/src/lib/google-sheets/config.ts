const PLACEHOLDER_SHEET_ID = "your_spreadsheet_id_here";

export function resolveSpreadsheetIdFromEnv(): string | null {
  const id = process.env["GOOGLE_SHEETS_ID"]?.trim();
  if (!id || id === PLACEHOLDER_SHEET_ID) return null;
  return id;
}

export function isSheetsMockMode(): boolean {
  return resolveSpreadsheetIdFromEnv() === null;
}
