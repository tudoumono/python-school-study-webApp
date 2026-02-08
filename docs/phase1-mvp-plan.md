# Python学習アプリ - Phase 1 (MVP) 実装計画

> 作成日: 2026-02-09

## Context

プログラミング初学者（小中学生〜大人）向けに、通勤・通学のスキマ時間でPythonの基礎文法を学べるWebアプリを新規構築する。Duolingo形式のドラッグ&ドロップでコードブロックを並び替え、文法を体で覚える学習体験を提供する。

**Phase 1 スコープ**: MVP（ドラッグ&ドロップUI + 20問 + ローカルストレージ保存）
**UI言語**: 日本語
**D&D形式**: 問題の難易度に応じてトークン単位・行単位を使い分け
**問題データ管理**: Googleスプレッドシートで一元管理 → API経由でランタイム取得（AI生成コスト節約）
**学習データ活用**: ユーザーの回答データを蓄積し、AI問題拡張に活用。同一問題の重複生成を防止

---

## 技術スタック

- **Next.js** (App Router, TypeScript, Tailwind CSS)
- **@dnd-kit** (ドラッグ&ドロップ)
- **zustand** (状態管理 + localStorage永続化)
- **lucide-react** (アイコン)
- **clsx** (条件付きCSS)
- **Googleスプレッドシート** (問題データのマスター管理)
- **Next.js Route Handlers** (スプレッドシートAPI中継 + キャッシュ)

---

## ディレクトリ構造

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # ホーム/ダッシュボード
│   ├── globals.css
│   ├── api/                      # Next.js Route Handlers
│   │   └── problems/
│   │       └── route.ts          # GET: スプレッドシートから問題取得（キャッシュ付き）
│   ├── categories/
│   │   ├── page.tsx              # カテゴリ一覧
│   │   └── [categoryId]/
│   │       ├── page.tsx          # カテゴリ内問題一覧
│   │       └── [problemId]/
│   │           └── page.tsx      # 問題ページ（タップ＋DnD並べ替え）
│   ├── random/                   # ランダム問題集
│   │   ├── page.tsx              # 問題選出画面（苦手傾向ベース）
│   │   └── [index]/
│   │       └── page.tsx          # ランダム問題プレイ＋結果表示
│   └── profile/
│       └── page.tsx              # プロフィール
│
├── components/
│   ├── layout/                   # AppHeader, BottomNav, ProgressBar
│   ├── problem/                  # CodeBlock, SortableCodeBlock, CodeBlockArea, ProblemDisplay
│   ├── feedback/                 # AnswerFeedback, HintDisplay
│   ├── dashboard/                # CategoryCard
│   └── ui/                       # Button, Card, Badge
│
├── data/                         # カテゴリ定義（静的）+ モックデータ
│   ├── categories.ts
│   └── mockProblems.ts
│
├── lib/
│   ├── store/                    # Zustand (problemStore, progressStore)
│   ├── services/                 # problemService, types (インターフェース)
│   │   ├── types.ts              # IProblemService インターフェース
│   │   └── problemService.ts     # API経由で問題取得
│   ├── google-sheets/            # スプレッドシート連携
│   │   ├── client.ts             # Google Sheets API クライアント
│   │   └── parser.ts             # スプレッドシート行 → Problem型 変換
│   └── utils/                    # answerChecker, shuffle, scoring, codeHash, analyticsExporter, randomPicker
│
└── types/                        # problem.ts, progress.ts, common.ts
```

---

## データモデル

### Problem型（問題定義）
```typescript
interface CodeBlock {
  id: string;                    // 例: "var-001-b1"
  content: string;               // 表示テキスト 例: "x = 10" (行単位) or "print(" (トークン単位)
  indentLevel: number;           // インデント (0, 1, 2...)
  type: "keyword" | "string" | "number" | "operator" | "variable" | "function" | "punctuation" | "comment";
}

interface Problem {
  id: string;                    // 例: "var-001"
  categoryId: CategoryId;
  difficulty: "beginner" | "easy" | "medium" | "hard";
  order: number;
  title: string;                 // 日本語タイトル
  description: string;           // 日本語の説明文
  expectedOutput?: string;
  explanation?: string;          // 正解後の解説（日本語）
  blockMode: "token" | "line";   // ★ トークン単位 or 行単位
  correctOrder: CodeBlock[];     // 正解順
  distractors?: CodeBlock[];     // ダミーブロック
  hints: string[];               // ヒント（日本語）
  points: number;
  tags: string[];
  metadata?: { source: "manual" | "ai-generated"; };
}
```

**blockMode の使い分け**:
- `"token"`: beginner/easy問題。`x`, `=`, `10` のように細かいトークンに分割
- `"line"`: medium/hard問題。`x = 10`, `if x > 5:` のように行単位で並び替え

### ProblemAttempt型（回答記録 — AI活用の基盤データ）
```typescript
interface ProblemAttempt {
  problemId: string;
  status: "not-started" | "attempted" | "completed";
  attempts: number;                    // 試行回数
  usedHint: boolean;                   // ヒント使用有無
  bestScore: number;
  firstAttemptAt: string;              // 初回挑戦日時
  completedAt?: string;               // 完了日時
  // ★ AI問題拡張に活用するデータ
  incorrectPatterns: string[];         // 間違えたブロック配置パターン（例: ["b3,b1,b2"]）
  avgTimePerAttempt: number;           // 1試行あたり平均秒数
  hintViewCount: number;              // ヒント閲覧回数
  gaveUp: boolean;                     // 途中で諦めたか
}
```

### UserProgress型（進捗）
```typescript
interface UserProgress {
  version: number;
  totalPoints: number;
  level: number;
  problemAttempts: Record<string, ProblemAttempt>;
  categoryProgress: Record<CategoryId, CategoryProgress>;
  streak: { currentStreak: number; longestStreak: number; lastActivityDate: string; };
  totalSolved: number;
  updatedAt: string;
  // ★ 集計アナリティクス（AI問題生成のコンテキストに使用）
  analytics: {
    categoryAccuracy: Record<CategoryId, number>;   // カテゴリ別正解率 (0-1)
    difficultyAccuracy: Record<Difficulty, number>; // 難易度別正解率
    weakTags: string[];                              // 苦手タグ（正解率低いtags上位）
    avgAttemptsPerProblem: number;                   // 問題あたり平均試行回数
    totalStudyTimeSeconds: number;                   // 累計学習時間
    lastSessionProblems: string[];                   // 直近セッションで解いた問題ID
  };
}
```

zustandの`persist`ミドルウェアでlocalStorageに自動保存。`version`フィールドでPhase 3のDynamoDB移行時にスキーママイグレーション対応。
analyticsは`recordAttempt()`内で自動再計算。

---

## 問題カテゴリ（各4問 × 5カテゴリ = 20問）

| カテゴリ | ID | blockMode | 問題例 |
|---|---|---|---|
| 変数とデータ型 | `variables` | token | `x = 10`, `name = "Alice"` |
| print文 | `print-statements` | token→line | `print("Hello")`, `print(x + y)` |
| 条件分岐 | `conditionals` | line | `if/elif/else` の行を正しく並べる |
| ループ | `loops` | line | `for i in range(5):` + body |
| 関数 | `functions` | line | `def greet(name):` + body + 呼び出し |

---

## コア実装の詳細

### 1. タップ＋DnD並べ替え（`CodeBlockArea.tsx` + `SortableCodeBlock.tsx`）
- **タップ**: ブロックをタップしてプール↔回答エリア間を移動
- **DnD並べ替え**: 回答エリア内で長押し（200ms）→ドラッグで並び替え
- `@dnd-kit/core`: `DndContext`, `PointerSensor`, `TouchSensor`, `closestCenter`
- `@dnd-kit/sortable`: `SortableContext`, `useSortable`, `arrayMove`
- **blockModeによるレイアウト分岐**:
  - `token` → `flex-wrap` + `horizontalListSortingStrategy`（横並び）
  - `line` → `flex-col` + `verticalListSortingStrategy`（縦並び）
- **モバイル最適化**: PointerSensor/TouchSensorに`delay: 200ms, tolerance: 5`でタップ vs ドラッグ判定
- ダークテーマエディタ風背景(`bg-gray-900`)にカラフルなブロックを配置
- ブロックの`type`ごとに色分け（keyword=紫, string=緑, number=黄, variable=青 等）

### 2. 正解判定（`answerChecker.ts`）
- ユーザーの並び順と`correctOrder`のID配列を比較
- ダミーブロック混入チェック
- 不正解位置のインデックス配列を返却（UIでハイライト）
- ポイント計算: 試行回数に応じた減点（1回目100%, 2回目75%, 3回目50%, 4回目以降25%）、ヒント使用で×0.5

### 3. 状態管理（zustand）
- **problemStore**: 現在の問題、ブロック配置、提出結果、ヒント表示状態
- **progressStore**: `persist`ミドルウェアでlocalStorage永続化。全進捗・ポイント・レベル管理

### 4. Googleスプレッドシート連携（問題データ管理）

**データフロー**:
```
[AI / 手動] → Googleスプレッドシート → Next.js API Route → フロントエンド
                  (マスターデータ)      (キャッシュ付き中継)    (問題表示)
```

**スプレッドシート構造**:

**シート1: problems（問題マスター）**
| id | categoryId | difficulty | order | title | description | blockMode | correctOrder (JSON) | distractors (JSON) | hints (JSON) | points | explanation | tags (JSON) | source | codeHash | createdAt |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| var-001 | variables | beginner | 1 | 変数を作ろう | 変数xに10を... | token | [...] | [...] | ["ヒント1"] | 10 | 解説文 | ["variable","assignment"] | manual | a1b2c3 | 2026-02-09 |

- **codeHash**: `correctOrder`の`content`を結合したハッシュ値。★ AI生成時に既存問題との重複チェックに使用
- **tags**: 問題の概念タグ。ユーザーの苦手分野特定とAI問題生成の方向付けに使用
- **source**: `manual` | `ai-generated` で生成元を区別

**シート2: analytics_export（アナリティクス集約 — Phase 2でAPI書き込み予定）**
| exportDate | totalUsers | categoryId | avgAccuracy | avgAttempts | weakTags (JSON) | hardestProblemIds (JSON) |
|---|---|---|---|---|---|---|
| 2026-03-01 | 50 | variables | 0.85 | 1.5 | ["reassignment"] | ["var-004"] |

※ Phase 1ではlocalStorageのアナリティクスをコンソール/手動エクスポート。Phase 2でAPI経由の自動書き込みに発展。

**方式: Google Sheets API（サービスアカウント）**
- Google Cloud でサービスアカウントを作成し、スプレッドシートに共有
- `googleapis` パッケージでサーバーサイドから読み取り
- Next.js Route Handler (`/api/problems`) でキャッシュ付きで中継
- 環境変数: `GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`

**キャッシュ戦略**:
- Next.js Route Handler内でインメモリキャッシュ（TTL: 5分）
- スプレッドシートAPIの呼び出し回数を最小化
- 開発時は長めのTTL、問題更新時は手動リロードエンドポイント提供

**`src/lib/google-sheets/client.ts`**: Google Sheets APIクライアント初期化
**`src/lib/google-sheets/parser.ts`**: スプレッドシートの行データ → `Problem`型への変換・バリデーション

**`src/app/api/problems/route.ts`**:
```typescript
// GET /api/problems            → 全問題取得
// GET /api/problems?category=variables → カテゴリ指定
```

### 5. サービス抽象化（Phase 2/3準備）
- `IProblemService`インターフェースで問題データアクセスを抽象化
- Phase 1: `SheetsProblemService`（API Route経由でスプレッドシートから取得）
- Phase 3: `AppSyncProblemService`に差し替え可能

### 6. 学習データ収集 & AI問題拡張戦略

**Phase 1で収集するデータ（localStorage）**:
- 問題ごと: 試行回数、正解/不正解、所要時間、ヒント使用回数、間違えたブロック配列パターン、途中離脱
- 集計: カテゴリ別正解率、難易度別正解率、苦手タグ一覧、平均試行回数、累計学習時間

**アナリティクスのエクスポート機能**（`src/lib/utils/analyticsExporter.ts`）:
- プロフィール画面に「学習データをエクスポート」ボタン
- localStorageのanalyticsデータをJSON形式でダウンロード
- Phase 2でAPI経由の自動送信に切り替え

**AI問題生成への活用（Phase 2で実装、Phase 1はデータ蓄積）**:
```
エクスポートされた学習データ → AIプロンプトのコンテキストに挿入:
- 「正解率が低いタグ: [loops, indentation] → これらの強化問題を生成」
- 「平均試行回数が多い難易度: medium → medium問題のバリエーション追加」
- 「最も間違えるパターン: インデントの順序ミス → インデント重視の問題を生成」
```

**重複防止（`codeHash`方式）**:
- `Problem.correctOrder`の各ブロック`content`を結合 → SHA-256ハッシュ → `codeHash`としてスプレッドシートに保存
- AI生成時: 新問題の`codeHash`を既存全問題のハッシュと照合、一致があればスキップ
- `src/lib/utils/codeHash.ts`: ハッシュ生成ユーティリティ
- tags + difficulty の完全一致も追加チェック（同じ概念・同じ難易度の類似問題を制限）

---

## モバイルファースト設計

- タッチターゲット最小44x44px、コードブロック最小48px高
- `touch-action: none`でドラッグエリアのスクロール干渉防止
- `user-select: none`でテキスト選択防止
- BottomNav: モバイルのみ表示（ホーム / カテゴリ / ランダム / プロフィール）
- `max-w-lg mx-auto`でモバイル幅にコンテンツ集中、`md:`でタブレット対応

---

## 実装順序

### Step 1: プロジェクト初期化 ✅
- `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- 依存パッケージインストール: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `zustand`, `lucide-react`, `clsx`, `googleapis`
- Tailwind CSS v4（`@theme inline {}` でCSS変数ベースのカスタムテーマ）
- ディレクトリ構造作成
- `.env.local` にGoogle Sheets設定（`GOOGLE_SHEETS_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY`）

### Step 2: Googleスプレッドシート準備 & API連携 ✅
- スプレッドシート作成（カラム設計: id, categoryId, difficulty, order, title, description, blockMode, correctOrder, distractors, hints, points, explanation, tags, source, codeHash, createdAt）
- 初期20問をモックデータ (`src/data/mockProblems.ts`) として実装
- `src/lib/google-sheets/client.ts`: Sheets APIクライアント
- `src/lib/google-sheets/parser.ts`: 行データ → Problem型パーサー
- `src/app/api/problems/route.ts`: Route Handler（env未設定時はモックにフォールバック）

### Step 3: 型定義 & サービス層 ✅
- `src/types/problem.ts`, `progress.ts`, `common.ts`
- `src/data/categories.ts`（カテゴリ定義は静的）
- `src/lib/services/types.ts`, `problemService.ts`（API経由取得）

### Step 4: ユーティリティ & ストア ✅
- `src/lib/utils/answerChecker.ts`, `shuffle.ts`, `scoring.ts`, `codeHash.ts`, `analyticsExporter.ts`, `randomPicker.ts`
- `src/lib/store/problemStore.ts`（reorderBlocks含む）, `progressStore.ts`

### Step 5: UIコンポーネント（レイアウト） ✅
- `AppHeader`（ロゴ→ホームリンク付き）, `BottomNav`（4項目: ホーム/カテゴリ/ランダム/プロフィール）, `ProgressBar`
- `Button`, `Card`, `Badge` 等の共通UIコンポーネント

### Step 6: UIコンポーネント（問題） ✅
- `CodeBlock`, `SortableCodeBlock`, `CodeBlockArea`
- `ProblemDisplay`, `AnswerFeedback`, `HintDisplay`
- ※ `SubmitButton`は独立コンポーネントではなく各ページ内に統合

### Step 7: ページ実装 ✅
- ホーム (`/`): ダッシュボード + ニガテ問題カード
- カテゴリ一覧 (`/categories`)
- 問題一覧 (`/categories/[categoryId]`)
- 問題ページ (`/categories/[categoryId]/[problemId]`)
- ランダム問題選出 (`/random`)
- ランダム問題プレイ＋結果表示 (`/random/[index]`)
- プロフィール (`/profile`)
- ※ `/results` 専用ページは設けず、`/random/[index]` 内で結果をインライン表示

### Step 8: 状態統合 & ダッシュボード ✅
- ストアとページの接続
- カテゴリアンロック（前カテゴリ50%達成で次が解放）
- 進捗表示、レベル表示

### Step 9: ポリッシュ & テスト ✅
- アニメーション（正解/不正解フィードバック）
- ローディング状態、エラーハンドリング
- 全20問の動作確認
- モバイルレスポンシブの最終チェック

---

## 検証方法

1. `npm run dev` でローカル起動
2. `/api/problems` エンドポイントにアクセスし、問題データが正しくJSON返却されることを確認（env未設定時はモックデータ）
3. ホーム画面 → カテゴリ選択 → 問題選択 → タップ＋DnD操作 → 正解/不正解フィードバック確認
4. ブラウザ更新後も進捗がlocalStorageから復元されることを確認
5. Chrome DevToolsのモバイルモード（iPhone SE, iPhone 14）でタッチ操作・レスポンシブ確認
6. 全5カテゴリ × 4問 = 20問が正しく解答できることを確認
7. カテゴリアンロック（前カテゴリ50%達成で次が解放）の動作確認
8. token mode問題: ブロックが横並び、DnDで並び替え可能
9. line mode問題: ブロックが縦並び（コードらしい表示）、DnDで並び替え可能
10. タップ: 200ms未満→ブロック移動、200ms以上ホールド→ドラッグ開始
11. AppHeaderのPyPuzzleロゴタップ → ホームに遷移
12. ホーム「ニガテ問題に挑戦」→ ランダム問題集が開始・結果表示
13. BottomNavの「ランダム」ボタン → ランダム問題選出ページに遷移
14. `npx next build` でビルド成功

---

## 主要ファイル一覧

| ファイル | 役割 |
|---|---|
| `src/types/problem.ts` | Problem, CodeBlock, Category 型定義 |
| `src/lib/google-sheets/client.ts` | Google Sheets APIクライアント |
| `src/lib/google-sheets/parser.ts` | スプレッドシート行 → Problem型変換 |
| `src/app/api/problems/route.ts` | 問題データAPI（キャッシュ付き中継） |
| `src/lib/services/problemService.ts` | データアクセス抽象化（API呼び出し） |
| `src/components/problem/CodeBlockArea.tsx` | タップ＋DnDコア（DndContext + SortableContext + blockModeレイアウト） |
| `src/components/problem/SortableCodeBlock.tsx` | DnD対応ブロック（useSortable + CodeBlockラッパー） |
| `src/lib/store/problemStore.ts` | 問題状態管理（ブロック配置、reorderBlocks等） |
| `src/lib/store/progressStore.ts` | 進捗管理（zustand + localStorage） |
| `src/lib/utils/answerChecker.ts` | 正解判定ロジック |
| `src/lib/utils/codeHash.ts` | 問題の重複検出用ハッシュ生成 |
| `src/lib/utils/analyticsExporter.ts` | 学習データJSONエクスポート |
| `src/lib/utils/randomPicker.ts` | 苦手傾向ベースの重み付き問題選出 |
| `src/app/categories/[categoryId]/[problemId]/page.tsx` | 問題ページ（メイン体験） |
| `src/app/random/page.tsx` | ランダム問題選出画面 |
| `src/app/random/[index]/page.tsx` | ランダム問題プレイ＋結果表示 |
