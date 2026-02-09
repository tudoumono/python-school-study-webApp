import { NextRequest, NextResponse } from "next/server";
import { mockProblems } from "@/data/mockProblems";
import type { Problem } from "@/types/problem";

const isMockMode =
  !process.env.GOOGLE_SHEETS_ID ||
  process.env.GOOGLE_SHEETS_ID === "your_spreadsheet_id_here";

let cache: { problems: Problem[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchProblemsFromSheet(): Promise<Problem[]> {
  // 動的import で Sheets未設定時のモジュール読み込みエラーを回避
  const { getSheetsClient, getSpreadsheetId } = await import(
    "@/lib/google-sheets/client"
  );
  const { parseRows } = await import("@/lib/google-sheets/parser");

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "problems!A:P",
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];

  return parseRows(rows as string[][]);
}

export async function GET(request: NextRequest) {
  try {
    // モックモード: スプレッドシート未設定時
    if (isMockMode) {
      const { searchParams } = request.nextUrl;
      const category = searchParams.get("category");
      let results = mockProblems;
      if (category) {
        results = results.filter((p) => p.categoryId === category);
      }
      return NextResponse.json(results);
    }

    // 本番モード: Google Sheets から取得
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";
    const now = Date.now();
    if (!cache || refresh || now - cache.fetchedAt > CACHE_TTL) {
      const problems = await fetchProblemsFromSheet();
      cache = { problems, fetchedAt: now };
    }

    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");

    let results = cache.problems;
    if (category) {
      results = results.filter((p) => p.categoryId === category);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to fetch problems:", error);

    // エラー時はモックデータにフォールバック
    const category = request.nextUrl.searchParams.get("category");
    let results = cache?.problems ?? mockProblems;
    if (category) {
      results = results.filter((p) => p.categoryId === category);
    }
    return NextResponse.json(results);
  }
}
