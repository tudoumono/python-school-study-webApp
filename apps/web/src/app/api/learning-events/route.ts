import { NextRequest, NextResponse } from "next/server";
import type { sheets_v4 } from "googleapis";
import type { CategoryId } from "@/types/problem";
import { isSheetsMockMode } from "@/lib/google-sheets/config";

export type LearningEventRequest = {
  userId: string;
  problemId: string;
  categoryId: CategoryId;
  isCorrect: boolean;
  points: number;
  usedHint: boolean;
  timeSpentSec: number;
  attemptNo: number;
  incorrectPattern?: string;
};

export type LearningEventResponse = {
  ok: boolean;
  source: "mock" | "sheets";
  error?: string;
};

const ATTEMPT_LOG_SHEET_NAME =
  process.env["GOOGLE_ATTEMPT_LOG_SHEET_NAME"] || "attempt_logs";

const ATTEMPT_LOG_HEADERS: string[] = [
  "loggedAt",
  "userId",
  "problemId",
  "categoryId",
  "isCorrect",
  "points",
  "usedHint",
  "timeSpentSec",
  "attemptNo",
  "incorrectPattern",
] as const;

let isAttemptSheetInitialized = false;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function parseLearningEvent(body: unknown): LearningEventRequest | null {
  if (!body || typeof body !== "object") return null;
  const input = body as Record<string, unknown>;

  if (!isNonEmptyString(input.userId)) return null;
  if (!isNonEmptyString(input.problemId)) return null;
  if (!isNonEmptyString(input.categoryId)) return null;
  if (typeof input.isCorrect !== "boolean") return null;
  if (typeof input.points !== "number" || !Number.isFinite(input.points)) return null;
  if (typeof input.usedHint !== "boolean") return null;
  if (typeof input.timeSpentSec !== "number" || !Number.isFinite(input.timeSpentSec)) {
    return null;
  }
  if (
    typeof input.attemptNo !== "number" ||
    !Number.isInteger(input.attemptNo) ||
    input.attemptNo <= 0
  ) {
    return null;
  }

  const incorrectPattern =
    typeof input.incorrectPattern === "string" && input.incorrectPattern.trim() !== ""
      ? sanitizeString(input.incorrectPattern, 500)
      : undefined;

  return {
    userId: sanitizeString(input.userId, 128),
    problemId: sanitizeString(input.problemId, 128),
    categoryId: sanitizeString(input.categoryId, 128) as CategoryId,
    isCorrect: input.isCorrect,
    points: Math.max(0, Math.round(input.points)),
    usedHint: input.usedHint,
    timeSpentSec: Math.max(0, Math.round(input.timeSpentSec)),
    attemptNo: input.attemptNo,
    incorrectPattern,
  };
}

async function ensureAttemptLogSheet(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
): Promise<void> {
  if (isAttemptSheetInitialized) return;

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheetTitles = new Set(
    (meta.data.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => typeof title === "string")
  );

  if (!existingSheetTitles.has(ATTEMPT_LOG_SHEET_NAME)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: ATTEMPT_LOG_SHEET_NAME } } }],
      },
    });
  }

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${ATTEMPT_LOG_SHEET_NAME}!1:1`,
  });
  const headerRow = headerResponse.data.values?.[0] ?? [];
  const hasAnyHeaderValue = headerRow.some((cell) => String(cell).trim() !== "");

  if (!hasAnyHeaderValue) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${ATTEMPT_LOG_SHEET_NAME}!A1:J1`,
      valueInputOption: "RAW",
      requestBody: { values: [ATTEMPT_LOG_HEADERS] },
    });
  }

  isAttemptSheetInitialized = true;
}

async function appendLearningEvent(event: LearningEventRequest): Promise<void> {
  const { getSheetsClient, getSpreadsheetId } = await import("@/lib/google-sheets/client");
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  await ensureAttemptLogSheet(sheets, spreadsheetId);

  const row: Array<string | number> = [
    new Date().toISOString(),
    event.userId,
    event.problemId,
    event.categoryId,
    event.isCorrect ? 1 : 0,
    event.points,
    event.usedHint ? 1 : 0,
    event.timeSpentSec,
    event.attemptNo,
    event.incorrectPattern ?? "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${ATTEMPT_LOG_SHEET_NAME}!A:J`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

export async function POST(request: NextRequest) {
  const isMockMode = isSheetsMockMode();

  try {
    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return NextResponse.json<LearningEventResponse>(
        { ok: false, source: isMockMode ? "mock" : "sheets", error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const event = parseLearningEvent(jsonBody);
    if (!event) {
      return NextResponse.json<LearningEventResponse>(
        {
          ok: false,
          source: isMockMode ? "mock" : "sheets",
          error: "Invalid learning event payload",
        },
        { status: 400 }
      );
    }

    if (isMockMode) {
      return NextResponse.json<LearningEventResponse>({ ok: true, source: "mock" });
    }

    await appendLearningEvent(event);

    return NextResponse.json<LearningEventResponse>({ ok: true, source: "sheets" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to append learning event:", message);

    return NextResponse.json<LearningEventResponse>(
      { ok: false, source: isMockMode ? "mock" : "sheets", error: message },
      { status: 500 }
    );
  }
}
