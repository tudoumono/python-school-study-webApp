import { NextRequest, NextResponse } from "next/server";
import { mockProblems } from "@/data/mockProblems";
import type { Problem } from "@/types/problem";
import { isSheetsMockMode } from "@/lib/google-sheets/config";

export type ProblemsResponse = {
  data: Problem[];
  source: "mock" | "sheets";
  error?: string;
};

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

function filterByCategory(problems: Problem[], category: string | null) {
  if (!category) return problems;
  return problems.filter((p) => p.categoryId === category);
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const isMockMode = isSheetsMockMode();

  try {
    // モックモード: スプレッドシート未設定時
    if (isMockMode) {
      return NextResponse.json<ProblemsResponse>({
        data: filterByCategory(mockProblems, category),
        source: "mock",
      });
    }

    // 本番モード: Google Sheets から取得
    const refresh = request.nextUrl.searchParams.get("refresh") === "true";
    const now = Date.now();
    if (!cache || refresh || now - cache.fetchedAt > CACHE_TTL) {
      const problems = await fetchProblemsFromSheet();
      cache = { problems, fetchedAt: now };
    }

    return NextResponse.json<ProblemsResponse>({
      data: filterByCategory(cache.problems, category),
      source: "sheets",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch problems:", message);

    return NextResponse.json<ProblemsResponse>(
      { data: [], source: isMockMode ? "mock" : "sheets", error: message },
      { status: 500 }
    );
  }
}
