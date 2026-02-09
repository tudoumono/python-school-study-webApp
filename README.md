# PyPuzzle - Python学習アプリ

Duolingo形式のドラッグ＆ドロップでPythonの基礎文法を学べるWebアプリです。
通勤・通学のスキマ時間にスマホで手軽にPythonを身につけられます。

## 特徴

- **タップ＆DnDでコード並べ替え** — コードブロックをタップで選択、長押しドラッグで並び替え
- **2つの問題モード** — トークン単位（`x`, `=`, `10`）と行単位（`if x > 5:`）で難易度を調整
- **5カテゴリ × 4問 = 20問** — 変数、print文、条件分岐、ループ、関数をカバー
- **ニガテ問題集** — 過去の回答傾向から苦手な問題を自動ピックアップ
- **進捗の自動保存** — ブラウザのlocalStorageに学習データを永続化
- **学習ログの共有** — 解答ログをGoogleスプレッドシートに追記し、講師が集計を確認可能
- **モバイルファースト** — スマホでの操作に最適化したUI

## スクリーンショット

<!-- TODO: デプロイ後にスクリーンショットを追加 -->

## 技術スタック

| カテゴリ | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router, TypeScript) |
| スタイリング | Tailwind CSS v4 |
| D&D | @dnd-kit (core + sortable + utilities) |
| 状態管理 | zustand (localStorage永続化) |
| アイコン | lucide-react |
| 問題データ | Google Sheets API（モックデータでも動作可） |

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

環境変数の設定なしでモックデータにより動作します。

### Google Sheets連携（任意）

実データに切り替える場合は `.env.local` を作成:

```bash
cp .env.example .env.local
# GOOGLE_SHEETS_ID / GOOGLE_SERVICE_ACCOUNT_KEY を設定
# （任意）GOOGLE_ATTEMPT_LOG_SHEET_NAME を設定
```

シートの初期化:

```bash
node scripts/setup-sheet.mjs
```

詳細は [docs/LEARNING_DATA_SHEETS.md](docs/LEARNING_DATA_SHEETS.md) と [docs/DEPLOY_PLAN.md](docs/DEPLOY_PLAN.md) を参照してください。

## ディレクトリ構成

```
src/
├── app/                 # ページ（ホーム、カテゴリ、問題、ランダム、プロフィール）
├── components/          # UIコンポーネント（layout, problem, feedback, dashboard, ui）
├── data/                # カテゴリ定義 + モックデータ
├── lib/
│   ├── store/           # zustand ストア（問題状態、進捗管理）
│   ├── services/        # データアクセス抽象化
│   ├── google-sheets/   # Google Sheets API連携
│   └── utils/           # 正解判定、スコア計算、ランダム選出 等
└── types/               # TypeScript型定義
```

## デプロイ

AWS Amplify Hostingへのデプロイを想定しています。
モック状態のまま環境変数なしでデプロイ可能です。

詳細は [docs/DEPLOY_PLAN.md](docs/DEPLOY_PLAN.md) を参照してください。

## ドキュメント

- [Phase 1 MVP 実装計画](docs/phase1-mvp-plan.md)
- [デプロイ計画](docs/DEPLOY_PLAN.md)
- [学習データのGoogle Sheets運用](docs/LEARNING_DATA_SHEETS.md)
- [バックログ](BACKLOG.md)

## ライセンス

Private
