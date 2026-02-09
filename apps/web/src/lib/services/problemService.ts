import type { IProblemService } from "./types";
import type { Problem, CategoryId, Category } from "@/types/problem";
import { categories } from "@/data/categories";

class SheetsProblemService implements IProblemService {
  private cache: { problems: Problem[]; fetchedAt: number } | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分

  async getCategories(): Promise<Category[]> {
    const problems = await this.getAllProblems();
    return categories.map((cat) => ({
      ...cat,
    }));
  }

  async getProblemsByCategory(categoryId: CategoryId): Promise<Problem[]> {
    const problems = await this.getAllProblems();
    return problems
      .filter((p) => p.categoryId === categoryId)
      .sort((a, b) => a.order - b.order);
  }

  async getProblemById(problemId: string): Promise<Problem | null> {
    const problems = await this.getAllProblems();
    return problems.find((p) => p.id === problemId) ?? null;
  }

  async getAllProblems(): Promise<Problem[]> {
    if (this.cache && Date.now() - this.cache.fetchedAt < this.CACHE_TTL) {
      return this.cache.problems;
    }

    try {
      const res = await fetch("/api/problems");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `API error: ${res.status}`);
      }
      const { data: problems } = await res.json();
      this.cache = { problems, fetchedAt: Date.now() };
      return problems;
    } catch (error) {
      // キャッシュがあれば古くても返す
      if (this.cache) return this.cache.problems;
      throw error;
    }
  }
}

export const problemService: IProblemService = new SheetsProblemService();
