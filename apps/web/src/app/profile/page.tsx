"use client";

import { useProgressStore } from "@/lib/store/progressStore";
import { getLevelProgress, getPointsToNextLevel } from "@/lib/utils/scoring";
import { downloadAnalytics } from "@/lib/utils/analyticsExporter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { Trophy, Flame, Target, Download } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export default function ProfilePage() {
  const progress = useProgressStore();
  const levelProgress = getLevelProgress(progress.totalPoints);
  const pointsToNext = getPointsToNextLevel(progress.totalPoints);

  const handleExport = () => {
    downloadAnalytics(progress);
  };

  return (
    <div className="py-4 space-y-6">
      <Breadcrumb items={[{ label: "ホーム", href: "/" }, { label: "プロフィール" }]} />
      <h1 className="text-xl font-bold text-gray-800">プロフィール</h1>

      {/* レベル */}
      <Card>
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-primary-600">
            Lv.{progress.level}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            次のレベルまで {pointsToNext}pt
          </p>
        </div>
        <ProgressBar
          current={Math.round(levelProgress * 100)}
          total={100}
          showLabel={false}
        />
      </Card>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center" padding="sm">
          <Trophy className="mx-auto text-accent-500 mb-1" size={20} />
          <div className="text-lg font-bold">{progress.totalPoints}</div>
          <div className="text-xs text-gray-500">総ポイント</div>
        </Card>
        <Card className="text-center" padding="sm">
          <Flame className="mx-auto text-orange-500 mb-1" size={20} />
          <div className="text-lg font-bold">
            {progress.streak.longestStreak}
          </div>
          <div className="text-xs text-gray-500">最長連続</div>
        </Card>
        <Card className="text-center" padding="sm">
          <Target className="mx-auto text-primary-500 mb-1" size={20} />
          <div className="text-lg font-bold">{progress.totalSolved}</div>
          <div className="text-xs text-gray-500">問クリア</div>
        </Card>
      </div>

      {/* 学習データエクスポート */}
      <Card>
        <h2 className="font-semibold text-gray-800 mb-2">学習データ</h2>
        <p className="text-sm text-gray-500 mb-3">
          学習データをJSON形式でエクスポートできます。AI問題生成の改善に活用されます。
        </p>
        <Button
          variant="outline"
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2"
        >
          <Download size={16} />
          学習データをエクスポート
        </Button>
      </Card>

      {/* 進捗リセット */}
      <Card>
        <h2 className="font-semibold text-gray-800 mb-2">データ管理</h2>
        <Button
          variant="secondary"
          onClick={() => {
            if (confirm("本当に進捗をリセットしますか？この操作は取り消せません。")) {
              progress.resetProgress();
            }
          }}
          className="w-full"
          size="sm"
        >
          進捗をリセット
        </Button>
      </Card>
    </div>
  );
}
