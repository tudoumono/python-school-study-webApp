"use client";

import { useEffect, useState } from "react";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { useProgressStore } from "@/lib/store/progressStore";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import type { Category } from "@/types/problem";
import type { CategoriesResponse } from "@/app/api/categories/route";

export default function CategoriesPage() {
  const { categoryProgress } = useProgressStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((res: CategoriesResponse) => {
        setCategories(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="py-4 space-y-4">
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "カテゴリ" }]} />
      <h1 className="text-xl font-bold text-gray-800">カテゴリ</h1>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              progress={categoryProgress[cat.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
