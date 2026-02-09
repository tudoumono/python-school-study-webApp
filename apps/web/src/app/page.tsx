"use client";

import { useEffect, useState } from "react";
import { categories } from "@/data/categories";
import { CategoryCard } from "@/components/dashboard/CategoryCard";
import { useProgressStore } from "@/lib/store/progressStore";
import { problemService } from "@/lib/services/problemService";
import { Card } from "@/components/ui/Card";
import { Flame, Target, Trophy, Shuffle, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const progress = useProgressStore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    // 問題データからカテゴリの総数を更新
    problemService.getAllProblems().then((problems) => {
      for (const cat of categories) {
        const catProblems = problems.filter((p) => p.categoryId === cat.id);
        const maxPoints = catProblems.reduce((sum, p) => sum + p.points, 0);
        progress.updateCategoryTotals(cat.id, catProblems.length, maxPoints);
      }
    }).catch(() => {
      // API未設定時は静かに失敗
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoaded) {
    return (
      <div className="py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";

  return (
    <div className="py-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{greeting}！</h1>
        <p className="text-sm text-gray-500 mt-1">
          今日もPythonの文法を練習しよう
        </p>
      </div>

      {/* ステータスカード */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center" padding="sm">
          <Trophy className="mx-auto text-accent-500 mb-1" size={20} />
          <div className="text-lg font-bold text-gray-800">
            {progress.totalPoints}
          </div>
          <div className="text-xs text-gray-500">ポイント</div>
        </Card>
        <Card className="text-center" padding="sm">
          <Flame className="mx-auto text-orange-500 mb-1" size={20} />
          <div className="text-lg font-bold text-gray-800">
            {progress.streak.currentStreak}
          </div>
          <div className="text-xs text-gray-500">日連続</div>
        </Card>
        <Card className="text-center" padding="sm">
          <Target className="mx-auto text-primary-500 mb-1" size={20} />
          <div className="text-lg font-bold text-gray-800">
            {progress.totalSolved}
          </div>
          <div className="text-xs text-gray-500">問クリア</div>
        </Card>
      </div>

      {/* アクションカード */}
      <div className="flex flex-col gap-5">
        <Link href="/categories">
          <div className="bg-primary-600 text-white rounded-2xl p-4 flex items-center gap-4 active:bg-primary-700 transition-colors">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Target size={22} />
            </div>
            <div>
              <span className="text-lg font-bold">学習をはじめる</span>
              <p className="text-sm text-primary-100 mt-0.5">
                カテゴリを選んで問題に挑戦しよう
              </p>
            </div>
          </div>
        </Link>


        <Link href="/random">
          <div className="bg-orange-500 text-white rounded-2xl p-4 flex items-center gap-4 active:bg-orange-600 transition-colors">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shuffle size={22} />
            </div>
            <div>
              <span className="text-lg font-bold">ニガテ問題に挑戦</span>
              <p className="text-sm text-orange-100 mt-0.5">
                苦手傾向から5問をピックアップ
              </p>
            </div>
          </div>
        </Link>


        <Link href="/problems">
          <div className="bg-emerald-600 text-white rounded-2xl p-4 flex items-center gap-4 active:bg-emerald-700 transition-colors">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <span className="text-lg font-bold">問題一覧</span>
              <p className="text-sm text-emerald-100 mt-0.5">
                スプレッドシートの問題データを確認
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* カテゴリ一覧 */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          カテゴリ
        </h2>
        <div className="space-y-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              progress={progress.categoryProgress[cat.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
