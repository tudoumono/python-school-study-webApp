# PyPuzzle Amplify デプロイ計画

## 現在の状態

- Next.js 16.1.6 アプリ（モック状態で動作確認済み）
- `npm run build` 成功済み
- データ: モックデータ（`src/data/mockProblems.ts`）でフロントエンド完全動作
- Google Sheets連携: API Route実装済み（env未設定時は自動でモックにフォールバック）
- 認証: なし（パブリックアクセス）
- バックエンド: なし（クライアントサイド + API Route のみ）

## ゴール

モック状態のままAWS Amplifyにデプロイし、公開URLでアクセスできるようにする。

---

## Phase 1: Amplify Hosting にデプロイ（モック状態）

### 1-1. 前提準備

- [ ] GitHubリポジトリを作成してpush
- [ ] AWSアカウントでAmplify Consoleにアクセスできること

### 1-2. Amplify Console 設定

1. **Amplify Console** → **New app** → **Host web app**
2. **GitHub** リポジトリを接続
3. **Branch**: `main`
4. **Build settings**: 自動検出（Next.js）

### 1-3. amplify.yml（ビルド設定）

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 1-4. 環境変数

モック状態ではGoogle Sheets連携不要。環境変数の設定なしでデプロイ可能。
API Route (`/api/problems`) はenv未設定時にモックデータを自動返却する。

```typescript
// src/app/api/problems/route.ts の挙動
const isMockMode =
  !process.env.GOOGLE_SHEETS_ID ||
  process.env.GOOGLE_SHEETS_ID === "your_spreadsheet_id_here";
// → env未設定 → mockProblems を返す
```

### 1-5. 確認事項

- [ ] デプロイ成功（ビルドログでエラーなし）
- [ ] 公開URLでホームが表示される
- [ ] カテゴリ一覧 → 問題ページ遷移が動作
- [ ] ブロックのタップ＆DnD並べ替えが動作
- [ ] ランダム問題集が動作
- [ ] AppHeaderのロゴからホームに戻れる
- [ ] モバイルでの表示・操作が正常

### 1-6. 注意点

| 項目 | 対応 |
|------|------|
| Next.js 16対応 | Amplifyは最新Next.jsをSSRサポート。問題なし |
| `.env.local` | gitignore済み。Amplifyには含まれない |
| API Route | Server-side実行。Amplify SSRモードで動作 |
| zustand persist | `localStorage` 使用。クライアントサイドのみ。問題なし |
| Tailwind CSS v4 | ビルド時にCSSに変換。ランタイム依存なし |

---

## Phase 2: Google Sheets連携の有効化（任意）

Phase 1 完了後、実データに切り替える場合:

### 2-1. Google Cloud 設定

1. Google Cloud Console → プロジェクト作成
2. Google Sheets API を有効化
3. サービスアカウントを作成
4. JSONキーをダウンロード
5. 対象スプレッドシートをサービスアカウントのメールアドレスに共有（閲覧者）

### 2-2. Amplify 環境変数の設定

Amplify Console → **Environment variables**:

| 変数名 | 値 |
|--------|-----|
| `GOOGLE_SHEETS_ID` | スプレッドシートID（URLの`/d/`と`/edit`の間の文字列） |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | サービスアカウントのJSON鍵（1行のJSON文字列） |

### 2-3. スプレッドシートのフォーマット

シート名: `problems`、範囲: `A:P`

| 列 | 内容 | 形式 |
|----|------|------|
| A | id | `var-001` |
| B | categoryId | `variables` |
| C | difficulty | `beginner` / `easy` / `medium` / `hard` |
| D | order | 数値 |
| E | title | テキスト |
| F | description | テキスト |
| G | blockMode | `token` / `line` |
| H | correctOrder | JSON配列 |
| I | distractors | JSON配列（空可） |
| J | hints | JSON配列 |
| K | points | 数値 |
| L | explanation | テキスト |
| M | tags | JSON配列 |
| N | source | `manual` / `ai-generated` |
| O | codeHash | テキスト（空可） |
| P | expectedOutput | テキスト（空可） |

---

## Phase 3: 将来の拡張（バックエンド導入時）

Amplify Gen2 + AppSync / DynamoDB への移行。バックログの以下が前提:
- 集団統計ベースの出題
- クラス管理ダッシュボード
- ユーザー認証（Cognito）

この段階で `IProblemService` インターフェースを AppSync 実装に差し替える。

---

## クイックスタート（Phase 1 最短手順）

```bash
# 1. GitHubにpush
git init
git add -A
git commit -m "Initial commit: PyPuzzle v0.1.0"
git remote add origin https://github.com/<your-user>/pypuzzle.git
git push -u origin main

# 2. Amplify Consoleで接続
# AWS Console → Amplify → New app → GitHub → main branch → Deploy

# 3. 完了！ モックデータで動作するURLが発行される
```
