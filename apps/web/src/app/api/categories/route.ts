import { NextResponse } from "next/server";
import { categories as mockCategories } from "@/data/categories";
import type { Category } from "@/types/problem";

export type CategoriesResponse = {
  data: Category[];
  source: "mock" | "sheets";
  error?: string;
};

const isMockMode =
  !process.env.GOOGLE_SHEETS_ID ||
  process.env.GOOGLE_SHEETS_ID === "your_spreadsheet_id_here";

let cache: { categories: Category[]; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchCategoriesFromSheet(): Promise<Category[]> {
  const { getSheetsClient, getSpreadsheetId } = await import(
    "@/lib/google-sheets/client"
  );
  const { parseCategoryRows } = await import("@/lib/google-sheets/parser");

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "categories!A:F",
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) return [];

  return parseCategoryRows(rows as string[][]);
}

export async function GET() {
  try {
    if (isMockMode) {
      return NextResponse.json<CategoriesResponse>({
        data: mockCategories,
        source: "mock",
      });
    }

    const now = Date.now();
    if (!cache || now - cache.fetchedAt > CACHE_TTL) {
      const categories = await fetchCategoriesFromSheet();
      cache = { categories, fetchedAt: now };
    }

    return NextResponse.json<CategoriesResponse>({
      data: cache.categories,
      source: "sheets",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch categories:", message);

    return NextResponse.json<CategoriesResponse>(
      { data: [], source: isMockMode ? "mock" : "sheets", error: message },
      { status: 500 }
    );
  }
}
