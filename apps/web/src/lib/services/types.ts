import type { Problem, CategoryId, Category } from "@/types/problem";

export interface IProblemService {
  getCategories(): Promise<Category[]>;
  getProblemsByCategory(categoryId: CategoryId): Promise<Problem[]>;
  getProblemById(problemId: string): Promise<Problem | null>;
  getAllProblems(): Promise<Problem[]>;
}
