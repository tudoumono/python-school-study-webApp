# add-problem

PyPuzzle の Google スプレッドシートに問題を追加するスキル。

## 使い方

ユーザーの引数を解析して問題データを生成し、スプレッドシートに追加可能な形式で出力する。

引数パターン:
- `add-problem <自然言語で問題の説明>` — 説明から問題データを生成
- `add-problem validate` — スプレッドシートの既存データを検証

---

## スプレッドシート仕様

### シート名
`problems`

### カラム（A〜P列）

| 列 | ヘッダー | 型 | 必須 | 説明 |
|----|---------|-----|------|------|
| A | id | string | YES | 一意ID。命名規則: `{カテゴリ接頭辞}-{3桁連番}` |
| B | categoryId | string | YES | カテゴリID（下記参照） |
| C | difficulty | string | YES | `beginner` / `easy` / `medium` / `hard` |
| D | order | number | YES | カテゴリ内の表示順（1始まり） |
| E | title | string | YES | 問題タイトル（日本語、短く） |
| F | description | string | YES | 問題の説明文（日本語） |
| G | blockMode | string | YES | `token`（トークン単位）/ `line`（行単位） |
| H | correctOrder | JSON | YES | 正解ブロック配列（CodeBlock[]） |
| I | distractors | JSON | no | ダミーブロック配列（CodeBlock[]）。空なら `[]` |
| J | hints | JSON | YES | ヒント文字列配列。例: `["ヒント1","ヒント2"]` |
| K | points | number | YES | 獲得ポイント |
| L | explanation | string | no | 解説文（日本語） |
| M | tags | JSON | no | タグ配列。例: `["variable","string"]` |
| N | source | string | no | `manual` or `ai-generated`（デフォルト: `manual`） |
| O | codeHash | string | no | コードの SHA-256 ハッシュ（重複防止用） |
| P | expectedOutput | string | no | 期待される実行結果 |

### ID 命名規則

| categoryId | 接頭辞 | 例 |
|---|---|---|
| variables | `var` | `var-001`, `var-002` |
| print-statements | `prt` | `prt-001`, `prt-002` |
| conditionals | `cnd` | `cnd-001`, `cnd-002` |
| loops | `lop` | `lop-001`, `lop-002` |
| functions | `fnc` | `fnc-001`, `fnc-002` |

連番は既存の最大値 + 1 で採番する。

### カテゴリ一覧（`categories` シートで管理）

カテゴリはスプレッドシートの `categories` シートで管理される。新しいカテゴリはシートに行を追加するだけで利用可能。

| 列 | ヘッダー | 説明 |
|----|---------|------|
| A | id | カテゴリID（英数字+ハイフン） |
| B | title | 表示名（日本語） |
| C | description | 説明文 |
| D | icon | lucide-react のアイコン名（例: Box, MessageSquare, GitBranch） |
| E | color | Tailwind の背景色クラス（例: bg-blue-500） |
| F | order | 表示順（1始まり、アンロック順も兼ねる） |

デフォルトカテゴリ:

| categoryId | 日本語名 | order |
|---|---|---|
| variables | 変数とデータ型 | 1 |
| print-statements | print文 | 2 |
| conditionals | 条件分岐 | 3 |
| loops | ループ | 4 |
| functions | 関数 | 5 |

### 難易度とポイントの目安

| difficulty | ポイント目安 | 対象 |
|---|---|---|
| beginner | 10 | 完全初学者向け。1行のコード |
| easy | 15 | 基礎。2〜3行のコード |
| medium | 20 | 応用。制御構造を含む |
| hard | 20〜25 | 発展。複合的な概念 |

### blockMode の選び方

- **token**: `print`, `(`, `"Hello"`, `)` のようにトークン（単語・記号）単位で並べ替え。beginner〜easy 向け
- **line**: `x = 10`, `print(x)` のように行単位で並べ替え。複数行のコードに適する

### CodeBlock の構造

```json
{
  "id": "var-001-b1",
  "content": "x",
  "indentLevel": 0,
  "type": "variable"
}
```

| フィールド | 説明 |
|---|---|
| id | `{問題ID}-b{番号}` (正解) / `{問題ID}-d{番号}` (ダミー) |
| content | ブロックに表示するコード文字列 |
| indentLevel | インデントレベル（0=なし, 1=1段, 2=2段） |
| type | `keyword` / `string` / `number` / `operator` / `variable` / `function` / `punctuation` / `comment` |

### type の使い分け

| type | 用途 | 例 |
|---|---|---|
| keyword | Python予約語、制御文 | `if x > 10:`, `for i in range(5):`, `def`, `return`, `else:` |
| variable | 変数の代入・参照 | `x = 10`, `name = "Alice"`, `total = 0` |
| function | 関数呼び出し | `print(...)`, `greet()`, `len(...)` |
| string | 文字列リテラル | `"Hello"`, `'World'` |
| number | 数値リテラル | `10`, `3.14` |
| operator | 演算子 | `=`, `+`, `-`, `*`, `>=` |
| punctuation | 括弧・カンマ等 | `(`, `)`, `,`, `:` |
| comment | コメント | `# これはコメント` |

---

## 問題生成のルール

1. **correctOrder の順序が正解**。配列の順番がそのまま正しいコードの順番になる
2. **distractors は間違い選択肢**。学習者が間違えやすいものを入れる（例: `for i in range(4):` vs `range(5):`）
3. **hints は段階的に**。1つ目は軽いヒント、2つ目以降はより具体的に
4. **indentLevel が重要**。if/for/while/def の中のコードは `indentLevel: 1`、ネストは `2`
5. **token モードの場合**、各トークンを独立したブロックにする（`print`, `(`, `"Hello"`, `)` は4つのブロック）
6. **line モードの場合**、1行を1ブロックにする（`print("Hello")` は1つのブロック）
7. **expectedOutput** は print 系の問題では必ず設定する
8. **日本語の説明文**を使う。対象は中高生のPython初学者

---

## 出力フォーマット

問題を生成したら、以下の2つを出力する:

### 1. スプレッドシート行データ（タブ区切り）

コピー&ペーストでスプレッドシートに貼れる形式。JSON列は文字列としてそのまま記載。

### 2. TypeScript オブジェクト（確認用）

`mockProblems` 形式の Problem オブジェクトとして出力し、データが正しいか目視確認できるようにする。

---

## バリデーション（validate）

既存のスプレッドシートデータに対して以下をチェック:

- IDの重複がないか
- categoryId が有効値か
- difficulty が有効値か
- correctOrder の JSON が正しくパースできるか
- CodeBlock の id が問題IDと整合しているか
- indentLevel が意味的に正しいか（if/for/while/def の後のブロックは 1 以上か）
- order がカテゴリ内で連番になっているか
