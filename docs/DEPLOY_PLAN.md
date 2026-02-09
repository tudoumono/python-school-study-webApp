# PyPuzzle デプロイ計画（モノレポ + Amplify Gen 2）

## 現在の状態

- Next.js 16.1.6 アプリ（モノレポ構成: `apps/web/`）
- `npm run build` 成功済み
- データ: モックデータ（`apps/web/src/data/mockProblems.ts`）でフロントエンド完全動作
- Google Sheets連携: API Route実装済み（env未設定時は自動でモックにフォールバック）
- 認証: Amplify Gen 2 (Cognito) — メール＋パスワード認証
- バックエンド: Amplify Gen 2 (AppSync + DynamoDB)

## 構成

```
pypuzzle-monorepo/
├── apps/web/                 # Next.js フロントエンド
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── amplify_outputs.json  # 自動生成（.gitignore対象）
├── amplify/                  # Amplify Gen 2 バックエンド
│   ├── backend.ts
│   ├── auth/resource.ts      # Cognito 認証
│   ├── data/resource.ts      # AppSync + DynamoDB スキーマ
│   ├── package.json
│   └── tsconfig.json
├── amplify.yml               # Amplify ビルド設定
├── package.json              # npm workspaces ルート
└── docs/, BACKLOG.md, README.md
```

---

## デプロイ手順

### 1. 前提準備

- [ ] GitHubリポジトリにpush済み
- [ ] AWSアカウントでAmplify Consoleにアクセスできること

### 2. Amplify Console 設定

1. **Amplify Console** → **Create new app** → **GitHub** リポジトリを接続
2. **Branch**: `main`
3. **App settings**: Amplify が `amplify/` ディレクトリを自動検出 → Gen 2 バックエンドが有効化
4. **Build settings**: `amplify.yml` を自動検出（モノレポ `appRoot: apps/web`）

### 3. ビルド設定（amplify.yml）

```yaml
version: 1
applications:
  - appRoot: apps/web
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

### 4. 環境変数

モック状態ではGoogle Sheets連携不要。環境変数の設定なしでデプロイ可能。
API Route (`/api/problems`) はenv未設定時にモックデータを自動返却する。

### 5. 確認事項

- [ ] デプロイ成功（ビルドログでエラーなし）
- [ ] 公開URLでホームが表示される
- [ ] カテゴリ一覧 → 問題ページ遷移が動作
- [ ] ブロックのタップ＆DnD並べ替えが動作
- [ ] ランダム問題集が動作
- [ ] AppHeaderのロゴからホームに戻れる
- [ ] モバイルでの表示・操作が正常

### 6. 注意点

| 項目 | 対応 |
|------|------|
| Next.js 16対応 | Amplifyは最新Next.jsをSSRサポート |
| `.env.local` | gitignore済み。Amplifyには含まれない |
| API Route | Server-side実行。Amplify SSRモードで動作 |
| zustand persist | `localStorage` 使用。クライアントサイドのみ。問題なし |
| Tailwind CSS v4 | ビルド時にCSSに変換。ランタイム依存なし |
| `amplify_outputs.json` | sandbox/デプロイ時に自動生成。`.gitignore` 対象 |

---

## Amplify Gen 2 バックエンドリソース

### 認証（Cognito）

- メール＋パスワード認証
- 設定: `amplify/auth/resource.ts`

### データ（AppSync + DynamoDB）

- `Problem`: 問題データ（認証ユーザーは読み書き可、ゲストは読み取りのみ）
- `ProblemAttempt`: 解答履歴（オーナーのみアクセス可）
- `UserProgress`: ユーザー進捗（オーナーのみアクセス可）
- 設定: `amplify/data/resource.ts`

---

## Google Sheets連携の有効化（任意）

Amplify Console → **Environment variables** で以下を設定:

| 変数名 | 値 |
|--------|-----|
| `GOOGLE_SHEETS_ID` | スプレッドシートID |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | サービスアカウントのJSON鍵（1行のJSON文字列） |

---

## Sandbox 開発

ローカル開発時は Amplify sandbox を使用:

```bash
npx ampx sandbox
```

これにより `amplify_outputs.json` が自動生成され、ローカルのフロントエンドから Amplify バックエンドに接続できる。
