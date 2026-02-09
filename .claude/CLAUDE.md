# PyPuzzle プロジェクト

## 概要
Python学習Webアプリ（Duolingo形式のドラッグ＆ドロップ）

## 技術スタック
- Next.js 16 + TypeScript（モノレポ: `apps/web/`）
- Amplify Gen 2（Auth: Cognito、Data: AppSync + DynamoDB）
- Tailwind CSS v4（`@theme inline {}` でCSS変数ベースのカスタムテーマ、`tailwind.config.ts` 不要）
- @dnd-kit（core + sortable + utilities）
- zustand（`persist` + `createJSONStorage(() => localStorage)` でSSR安全に永続化）
- 問題データ: Googleスプレッドシート → API Route経由で取得

## ディレクトリ構成
- `apps/web/src/types/` - 型定義（problem, progress, common）
- `apps/web/src/lib/store/` - zustandストア（problemStore, progressStore）
- `apps/web/src/lib/services/` - データアクセス抽象化（IProblemService）
- `apps/web/src/lib/google-sheets/` - Sheets API連携（client, parser）
- `apps/web/src/lib/utils/` - answerChecker, shuffle, scoring, codeHash, analyticsExporter, randomPicker
- `apps/web/src/components/` - layout, problem, feedback, dashboard, ui
- `apps/web/src/data/categories.ts` - 静的カテゴリ定義
- `amplify/` - Amplify Gen 2 バックエンド（auth, data）
- `BACKLOG.md` - 将来のアイディア・バックログ

## 設計方針
- `blockMode: "token" | "line"` で問題の粒度を制御
- `codeHash` でAI生成問題の重複防止（SHA-256）
- `ProblemAttempt` にincorrectPatterns, avgTimePerAttempt等のAI活用データを蓄積
- サービス抽象化: Phase 3でAppSync差し替え可能

## コーディング規約
- 日本語でコミュニケーション
- コンポーネントは `"use client"` 明示
- 新ファイルよりも既存ファイルの編集を優先
- Tailwind CSS v4の書き方に従う（v3のconfig形式は使わない）

## 注意事項
- Next.js 16で`create-next-app`する際、ディレクトリ名に大文字があるとnpm naming restrictionエラー。`/tmp`で作成してコピーで回避
