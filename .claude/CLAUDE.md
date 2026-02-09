# PyPuzzle プロジェクト（/init）

## 概要
Python 初学者向けの学習 Web アプリ。Duolingo 風のドラッグ＆ドロップ操作で、Python 基本文法を反復学習する。

## 現在の構成（モノレポ）
- ルート: npm workspaces（`apps/*`, `packages/*`）
- `apps/web`: Next.js 16 + TypeScript のフロントエンド
- `amplify`: Amplify Gen 2 バックエンド定義（Auth/Data）
- `docs`: 計画・仕様ドキュメント
- `scripts`: Google Sheets 連携補助スクリプト

## 主要機能（実装済み）
- カテゴリ学習（`/categories`）
- 問題回答（`/categories/[categoryId]/[problemId]`）
- 苦手傾向ベースのランダム出題（`/random`）
- 問題一覧と再取得（`/problems`）
- プロフィール表示（`/profile`）

## データ取得フロー
- `apps/web/src/app/api/problems/route.ts`:
  - `GOOGLE_SHEETS_ID` 未設定時は `mockProblems` を返却
  - 設定時は Google Sheets を取得（5分キャッシュ + `refresh=true` 再取得）
- `apps/web/src/lib/services/problemService.ts`:
  - クライアント側でも 5分キャッシュ
  - API エラー時は直近キャッシュをフォールバック返却

## バックエンド（Amplify Gen 2）
- `amplify/auth/resource.ts`: メールログイン有効化
- `amplify/data/resource.ts`: `Problem`, `ProblemAttempt`, `UserProgress` スキーマ定義
- `apps/web/src/components/ConfigureAmplify.tsx`:
  - `amplify_outputs.json` が空でない場合のみ `Amplify.configure()`

## 開発コマンド
- 依存インストール: `npm install`（ルート）
- 開発: `npm run dev --workspace apps/web`
- Lint: `npm run lint --workspace apps/web`
- Build: `npm run build --workspace apps/web`

## 開発ルール
- 日本語でコミュニケーション
- 既存構造を優先して編集し、不要な新規ファイル追加は避ける
- hooks やブラウザ API を使うコンポーネントでは `"use client"` を明示
- Tailwind CSS v4 の記法を使用（v3 用 config 前提の書き方は避ける）
