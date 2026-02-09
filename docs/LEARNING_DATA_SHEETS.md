# 学習データのGoogleスプレッドシート運用

## 概要

このプロジェクトでは、問題データに加えて学習ログもGoogleスプレッドシートに保存できます。

- 問題データ: `problems` / `categories`
- 学習ログ: `attempt_logs`
- 集計: `daily_stats` / `student_stats` / `category_stats`

学習ログはフロントエンドの解答時に `POST /api/learning-events` から追記されます。

## 事前設定

`apps/web/.env.local` に以下を設定します。

```env
GOOGLE_SHEETS_ID=...
GOOGLE_SERVICE_ACCOUNT_KEY={...}
GOOGLE_ATTEMPT_LOG_SHEET_NAME=attempt_logs
```

`GOOGLE_ATTEMPT_LOG_SHEET_NAME` は任意（未設定時は `attempt_logs`）。

## シート初期化

以下を実行すると、問題データ・カテゴリ・学習ログ・集計シートをまとめてセットアップします。

```bash
node scripts/setup-sheet.mjs
```

## `attempt_logs` カラム仕様

| カラム | 内容 | 例 |
|---|---|---|
| `loggedAt` | 記録日時（ISO） | `2026-02-09T10:23:45.000Z` |
| `userId` | 学習者ID（匿名UUID） | `anon-...` |
| `problemId` | 問題ID | `var-001` |
| `categoryId` | カテゴリID | `variables` |
| `isCorrect` | 正解フラグ（1/0） | `1` |
| `points` | 獲得ポイント | `10` |
| `usedHint` | ヒント使用フラグ（1/0） | `0` |
| `timeSpentSec` | 解答時間（秒） | `24` |
| `attemptNo` | その問題の挑戦回数 | `2` |
| `incorrectPattern` | 不正解時の解答パターンID列 | `var-001-b3,var-001-b1,...` |

## 集計シート

初期化スクリプトで以下の `QUERY` が設定されます。

- `daily_stats`: 日別の試行数・正解数・正答率・アクティブ学習者数
- `student_stats`: 学習者別の試行数・正解率・平均解答時間
- `category_stats`: カテゴリ別の試行数・正解率・平均解答時間

## 講師運用の推奨

1. 講師にはスプレッドシート閲覧権限を付与（編集は必要最小限）
2. `student_stats` にフィルタビューを作成して担当生徒ごとに確認
3. `category_stats` を週次で確認して弱点カテゴリを特定
