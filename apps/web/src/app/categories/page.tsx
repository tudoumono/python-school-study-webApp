"use client";

import { categories } from "@/data/categories";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { useProgressStore } from "@/lib/store/progressStore";

export default function CategoriesPage() {
  const { categoryProgress } = useProgressStore();

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">カテゴリ</h1>
      <div className="space-y-3">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            progress={categoryProgress[cat.id]}
          />
        ))}
      </div>
    </div>
  );
}
