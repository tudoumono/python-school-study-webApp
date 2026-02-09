# Repository Guidelines

## プロジェクト構成とモジュール配置
このリポジトリはモノレポ構成です。
- `apps/web/`: フロントエンド本体（Next.js 16, App Router, TypeScript）
- `apps/web/src/app/`: ページと API ルート（例: `apps/web/src/app/api/problems/route.ts`）
- `apps/web/src/components/`: UI/機能コンポーネント（`layout`、`problem`、`feedback` など）
- `apps/web/src/lib/`: 共通ロジック（`store`、`services`、`google-sheets`、`utils`）
- `amplify/`: Amplify Gen 2 バックエンド定義（Auth/Data）
- `docs/`: 計画・設計ドキュメント、`scripts/`: シート連携補助スクリプト

静的アセットは `apps/web/public/` に配置します。

## アーキテクチャ概要
- フロントエンドは `apps/web` の Next.js App Router で提供し、状態管理は zustand を使用します。
- バックエンドは Amplify Gen 2（`amplify/`）で定義し、フロントからは API ルート経由または Amplify 経由でデータを扱います。

## ビルド・テスト・開発コマンド
- 依存インストール（ルート）: `npm install`
- 開発サーバー: `npm run dev --workspace apps/web`
- Lint: `npm run lint --workspace apps/web`
- 本番ビルド: `npm run build --workspace apps/web`
- 本番起動: `npm run start --workspace apps/web`

別方法として `cd apps/web && npm run dev` でも実行できます。Google Sheets 連携時のみ `apps/web/.env.local` に `GOOGLE_SHEETS_ID` / `GOOGLE_SERVICE_ACCOUNT_KEY` を設定してください。

## コーディング規約と命名
- TypeScript は `strict: true` 前提で実装
- インデント 2 スペース、ダブルクォート、セミコロンを既存コードに合わせて維持
- コンポーネントは `PascalCase`、ユーティリティ/ストアは `camelCase`
- App Router は小文字ディレクトリ、動的ルートは `[param]`
- `apps/web/tsconfig.json` の `@/*` エイリアスを優先して import

## テスト方針
現状 `npm test` は未定義です。PR 前に最低限以下を実施してください。
1. `npm run lint --workspace apps/web`
2. `/`、`/categories`、`/problems`、`/random` の主要導線を手動確認

ロジック追加時は `apps/web/src` 配下で `*.test.ts` / `*.test.tsx` のユニットテストを同階層または近接配置で追加してください。

## コミット・PRルール
- コミットは 1 変更 1 目的で小さく保つ
- 件名は `<type>: <summary>` 形式を推奨（`feat`、`fix`、`docs`、`refactor`、`chore`）
- 実績のある形式: `feat: モノレポ構成 + Amplify Gen 2 バックエンド追加`

PR には以下を含めてください。
1. 変更内容と目的
2. 確認手順（実行コマンド + 手動確認項目）
3. UI 変更時のスクリーンショットまたは GIF
4. 関連 Issue / `BACKLOG.md` 項目へのリンク

## セキュリティと設定
- `apps/web/.env.local` を含む秘密情報はコミットしない
- `.env*` は原則 Git 管理外。共有が必要な項目は `.env.example` にキー名のみ追加
- CI では `amplify_outputs.json` のプレースホルダーが生成されるため、機密値を埋め込まない
