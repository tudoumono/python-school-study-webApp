# Repository Guidelines

## プロジェクト構成とモジュール配置
アプリ本体は `src/` 配下にあります。
- `src/app/`: Next.js App Router のページと API ルート（例: `src/app/api/problems/route.ts`）
- `src/components/`: UI/機能コンポーネント（`layout`、`problem`、`feedback`、`dashboard`、`ui`）
- `src/lib/`: 共通ロジック（`store`、`services`、`google-sheets`、`utils`）
- `src/data/`: カテゴリ定義とモック問題データ
- `src/types/`: TypeScript の型定義

静的ファイルは `public/`（フォントは `public/fonts/`）、設計資料は `docs/` に配置します。

## ビルド・テスト・開発コマンド
- `npm install`: 依存関係をインストール
- `npm run dev`: 開発サーバー起動（`http://localhost:3000`）
- `npm run lint`: ESLint 実行（Next.js core-web-vitals + TypeScript ルール）
- `npm run build`: 本番ビルド作成
- `npm run start`: ビルド済みアプリを起動

Google Sheets 連携を使う場合のみ `cp .env.example .env.local` を実行し、`GOOGLE_SHEETS_ID` と `GOOGLE_SERVICE_ACCOUNT_KEY` を設定してください。

## コーディング規約と命名
- TypeScript は `strict: true` を前提に実装する
- インデントは 2 スペース、文字列はダブルクォート、文末はセミコロンで統一
- コンポーネントファイルは `PascalCase`（例: `CategoryCard.tsx`）
- ユーティリティ・サービス・ストアは `camelCase`（例: `problemService.ts`）
- App Router のフォルダは小文字、動的セグメントは `[param]` 形式
- import は深い相対パスより `@/*` エイリアスを優先

## テスト方針
現状 `npm test` は未定義です。PR 前に最低限以下を実施してください。
1. `npm run lint` を通す
2. `/`、`/categories`、問題回答画面、`/random` の主要導線を手動確認する

`src/lib/utils` やデータ変換処理など、ロジックが増える変更では `*.test.ts` / `*.test.tsx` のユニットテスト追加を推奨します。

## コミット・PRルール
- コミットは 1 変更 1 目的で小さく保つ
- 件名は `<type>: <summary>` 形式を推奨（`feat`、`fix`、`docs`、`refactor`、`chore`）

PR には以下を含めてください。
1. 変更内容と目的
2. 確認手順（実行コマンドと手動確認項目）
3. UI 変更時のスクリーンショットまたは GIF
4. 関連 Issue / バックログ項目へのリンク

## セキュリティと設定
- `.env.local` の秘密情報はコミットしない
- 環境変数が未設定の場合はモックデータで動かし、必要時のみ Google Sheets 認証情報を有効化する
