import { existsSync, readFileSync } from "fs";
import { google } from "googleapis";

// .env.local があればロード（なければ process.env をそのまま使用）
const envPath = "apps/web/.env.local";
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    if (line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx);
    if (!process.env[key]) {
      process.env[key] = line.slice(idx + 1);
    }
  }
}

if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEETS_ID) {
  console.error("Error: GOOGLE_SERVICE_ACCOUNT_KEY と GOOGLE_SHEETS_ID が必要です。");
  console.error("apps/web/.env.local に設定するか、環境変数で渡してください。");
  process.exit(1);
}

const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
const auth = new google.auth.GoogleAuth({
  credentials: creds,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

// 1. シート名を "problems" にリネーム
console.log("1. シート名をリネーム...");
const meta = await sheets.spreadsheets.get({ spreadsheetId });
const sheet = meta.data.sheets[0];
const sheetId = sheet.properties.sheetId;

await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: {
    requests: [
      {
        updateSheetProperties: {
          properties: { sheetId, title: "problems" },
          fields: "title",
        },
      },
    ],
  },
});
console.log(`   "${sheet.properties.title}" → "problems" ✓`);

// 2. ヘッダー + モックデータを書き込み
console.log("2. データ書き込み...");

const header = [
  "id", "categoryId", "difficulty", "order", "title", "description",
  "blockMode", "correctOrder", "distractors", "hints", "points",
  "explanation", "tags", "source", "codeHash", "expectedOutput",
];

const problems = [
  {
    id: "var-001", categoryId: "variables", difficulty: "beginner", order: 1,
    title: "変数を作ろう", description: "変数 x に 10 を代入するコードを作ってください。",
    blockMode: "token",
    correctOrder: [
      { id: "var-001-b1", content: "x", indentLevel: 0, type: "variable" },
      { id: "var-001-b2", content: "=", indentLevel: 0, type: "operator" },
      { id: "var-001-b3", content: "10", indentLevel: 0, type: "number" },
    ],
    distractors: [{ id: "var-001-d1", content: "let", indentLevel: 0, type: "keyword" }],
    hints: ["Pythonでは let や var は不要です。変数名 = 値 の形で書きます。"],
    points: 10, tags: ["variable", "assignment"],
    explanation: "Pythonでは 変数名 = 値 で変数を作ります。let や var などのキーワードは不要です。",
    source: "manual",
  },
  {
    id: "var-002", categoryId: "variables", difficulty: "beginner", order: 2,
    title: "文字列の変数", description: '変数 name に文字列 "Alice" を代入してください。',
    blockMode: "token",
    correctOrder: [
      { id: "var-002-b1", content: "name", indentLevel: 0, type: "variable" },
      { id: "var-002-b2", content: "=", indentLevel: 0, type: "operator" },
      { id: "var-002-b3", content: '"Alice"', indentLevel: 0, type: "string" },
    ],
    distractors: [{ id: "var-002-d1", content: "String", indentLevel: 0, type: "keyword" }],
    hints: ["文字列はダブルクォートまたはシングルクォートで囲みます。"],
    points: 10, tags: ["variable", "string"],
    explanation: 'Pythonの文字列は " " または \' \' で囲みます。型宣言は不要です。',
    source: "manual",
  },
  {
    id: "var-003", categoryId: "variables", difficulty: "easy", order: 3,
    title: "2つの変数", description: '変数 age に 25、変数 name に "Bob" を代入してください。',
    blockMode: "line",
    correctOrder: [
      { id: "var-003-b1", content: "age = 25", indentLevel: 0, type: "variable" },
      { id: "var-003-b2", content: 'name = "Bob"', indentLevel: 0, type: "variable" },
    ],
    distractors: [{ id: "var-003-d1", content: "25 = age", indentLevel: 0, type: "variable" }],
    hints: ["代入は 変数名 = 値 の順番です。値 = 変数名 ではありません。"],
    points: 15, tags: ["variable", "multiple"],
    explanation: "Pythonでは上から順に実行されます。各行に1つの代入文を書きます。",
    source: "manual",
  },
  {
    id: "var-004", categoryId: "variables", difficulty: "easy", order: 4,
    title: "変数の上書き", description: "変数 count に 1 を代入した後、2 に変更してください。",
    blockMode: "line",
    correctOrder: [
      { id: "var-004-b1", content: "count = 1", indentLevel: 0, type: "variable" },
      { id: "var-004-b2", content: "count = 2", indentLevel: 0, type: "variable" },
    ],
    distractors: [{ id: "var-004-d1", content: "count = 3", indentLevel: 0, type: "variable" }],
    hints: ["同じ変数名に新しい値を代入すると、値が上書きされます。"],
    points: 15, tags: ["variable", "reassignment"],
    explanation: "Pythonの変数は何度でも上書きできます。最後に代入された値が残ります。",
    source: "manual",
  },
  {
    id: "prt-001", categoryId: "print-statements", difficulty: "beginner", order: 1,
    title: "Hello World", description: '画面に "Hello, World!" と表示してください。',
    blockMode: "token",
    correctOrder: [
      { id: "prt-001-b1", content: "print", indentLevel: 0, type: "function" },
      { id: "prt-001-b2", content: "(", indentLevel: 0, type: "punctuation" },
      { id: "prt-001-b3", content: '"Hello, World!"', indentLevel: 0, type: "string" },
      { id: "prt-001-b4", content: ")", indentLevel: 0, type: "punctuation" },
    ],
    distractors: [],
    hints: ["print() 関数の中に表示したい文字列を入れます。"],
    points: 10, tags: ["print", "string"],
    explanation: "print() はPythonで最も基本的な出力関数です。",
    source: "manual", expectedOutput: "Hello, World!",
  },
  {
    id: "prt-002", categoryId: "print-statements", difficulty: "beginner", order: 2,
    title: "数値を表示", description: "数値 42 を画面に表示してください。",
    blockMode: "token",
    correctOrder: [
      { id: "prt-002-b1", content: "print", indentLevel: 0, type: "function" },
      { id: "prt-002-b2", content: "(", indentLevel: 0, type: "punctuation" },
      { id: "prt-002-b3", content: "42", indentLevel: 0, type: "number" },
      { id: "prt-002-b4", content: ")", indentLevel: 0, type: "punctuation" },
    ],
    distractors: [],
    hints: ["数値はクォートで囲む必要はありません。"],
    points: 10, tags: ["print", "number"],
    explanation: "print() は文字列だけでなく数値もそのまま表示できます。",
    source: "manual", expectedOutput: "42",
  },
  {
    id: "prt-003", categoryId: "print-statements", difficulty: "easy", order: 3,
    title: "変数を表示", description: '変数 msg に "Python最高!" を代入し、それを表示してください。',
    blockMode: "line",
    correctOrder: [
      { id: "prt-003-b1", content: 'msg = "Python最高!"', indentLevel: 0, type: "variable" },
      { id: "prt-003-b2", content: "print(msg)", indentLevel: 0, type: "function" },
    ],
    distractors: [{ id: "prt-003-d1", content: 'print("msg")', indentLevel: 0, type: "function" }],
    hints: ["変数を表示する時はクォートを付けません。クォートを付けると文字列 'msg' が表示されます。"],
    points: 15, tags: ["print", "variable"],
    explanation: 'print(msg) は変数の中身を表示します。print("msg") は文字列 msg を表示します。',
    source: "manual", expectedOutput: "Python最高!",
  },
  {
    id: "prt-004", categoryId: "print-statements", difficulty: "easy", order: 4,
    title: "計算結果を表示", description: "3 + 5 の計算結果を表示してください。",
    blockMode: "token",
    correctOrder: [
      { id: "prt-004-b1", content: "print", indentLevel: 0, type: "function" },
      { id: "prt-004-b2", content: "(", indentLevel: 0, type: "punctuation" },
      { id: "prt-004-b3", content: "3", indentLevel: 0, type: "number" },
      { id: "prt-004-b4", content: "+", indentLevel: 0, type: "operator" },
      { id: "prt-004-b5", content: "5", indentLevel: 0, type: "number" },
      { id: "prt-004-b6", content: ")", indentLevel: 0, type: "punctuation" },
    ],
    distractors: [],
    hints: ["print() の中で直接計算ができます。"],
    points: 15, tags: ["print", "arithmetic"],
    explanation: "print() の中に式を書くと、計算結果が表示されます。",
    source: "manual", expectedOutput: "8",
  },
  {
    id: "cnd-001", categoryId: "conditionals", difficulty: "easy", order: 1,
    title: "if文の基本", description: '変数 x が 10 より大きい場合に "大きい" と表示するコードを並べてください。',
    blockMode: "line",
    correctOrder: [
      { id: "cnd-001-b1", content: "x = 15", indentLevel: 0, type: "variable" },
      { id: "cnd-001-b2", content: "if x > 10:", indentLevel: 0, type: "keyword" },
      { id: "cnd-001-b3", content: 'print("大きい")', indentLevel: 1, type: "function" },
    ],
    distractors: [],
    hints: ["if文の条件の後にはコロン : が必要です。", "if文の中身はインデント（字下げ）します。"],
    points: 15, tags: ["if", "comparison"],
    explanation: "if文は条件が True の時だけ中のコードを実行します。インデントが重要です。",
    source: "manual",
  },
  {
    id: "cnd-002", categoryId: "conditionals", difficulty: "medium", order: 2,
    title: "if-else", description: 'x が 0 以上なら "正" 、そうでなければ "負" と表示してください。',
    blockMode: "line",
    correctOrder: [
      { id: "cnd-002-b1", content: "x = -3", indentLevel: 0, type: "variable" },
      { id: "cnd-002-b2", content: "if x >= 0:", indentLevel: 0, type: "keyword" },
      { id: "cnd-002-b3", content: 'print("正")', indentLevel: 1, type: "function" },
      { id: "cnd-002-b4", content: "else:", indentLevel: 0, type: "keyword" },
      { id: "cnd-002-b5", content: 'print("負")', indentLevel: 1, type: "function" },
    ],
    distractors: [],
    hints: ["else は if の条件が False の時に実行されます。", "else にも : が必要です。"],
    points: 20, tags: ["if", "else"],
    explanation: "if-else は2択の分岐です。条件が True なら if の中、False なら else の中が実行されます。",
    source: "manual",
  },
  {
    id: "cnd-003", categoryId: "conditionals", difficulty: "medium", order: 3,
    title: "if-elif-else", description: "点数に応じて A, B, C のランクを表示してください。80以上はA、60以上はB、それ以外はC。",
    blockMode: "line",
    correctOrder: [
      { id: "cnd-003-b1", content: "score = 75", indentLevel: 0, type: "variable" },
      { id: "cnd-003-b2", content: "if score >= 80:", indentLevel: 0, type: "keyword" },
      { id: "cnd-003-b3", content: 'print("A")', indentLevel: 1, type: "function" },
      { id: "cnd-003-b4", content: "elif score >= 60:", indentLevel: 0, type: "keyword" },
      { id: "cnd-003-b5", content: 'print("B")', indentLevel: 1, type: "function" },
      { id: "cnd-003-b6", content: "else:", indentLevel: 0, type: "keyword" },
      { id: "cnd-003-b7", content: 'print("C")', indentLevel: 1, type: "function" },
    ],
    distractors: [],
    hints: ["elif は else if の略です。上から順に条件がチェックされます。"],
    points: 20, tags: ["if", "elif", "else"],
    explanation: "if → elif → else の順にチェックされ、最初に True になった箇所だけ実行されます。",
    source: "manual",
  },
  {
    id: "cnd-004", categoryId: "conditionals", difficulty: "hard", order: 4,
    title: "and 条件", description: 'age が 13 以上 かつ 18 未満の場合に "中高生" と表示してください。',
    blockMode: "line",
    correctOrder: [
      { id: "cnd-004-b1", content: "age = 15", indentLevel: 0, type: "variable" },
      { id: "cnd-004-b2", content: "if age >= 13 and age < 18:", indentLevel: 0, type: "keyword" },
      { id: "cnd-004-b3", content: 'print("中高生")', indentLevel: 1, type: "function" },
    ],
    distractors: [{ id: "cnd-004-d1", content: "if age >= 13 or age < 18:", indentLevel: 0, type: "keyword" }],
    hints: ["2つの条件を同時に満たす場合は and を使います。or ではありません。"],
    points: 20, tags: ["if", "and", "comparison"],
    explanation: "and は両方の条件が True の時だけ True になります。or はどちらか一方でも True なら True です。",
    source: "manual",
  },
  {
    id: "lop-001", categoryId: "loops", difficulty: "easy", order: 1,
    title: "for文の基本", description: "0から4までの数を表示してください。",
    blockMode: "line",
    correctOrder: [
      { id: "lop-001-b1", content: "for i in range(5):", indentLevel: 0, type: "keyword" },
      { id: "lop-001-b2", content: "print(i)", indentLevel: 1, type: "function" },
    ],
    distractors: [{ id: "lop-001-d1", content: "for i in range(4):", indentLevel: 0, type: "keyword" }],
    hints: ["range(5) は 0, 1, 2, 3, 4 を生成します（5は含まれません）。"],
    points: 15, tags: ["for", "range"],
    explanation: "range(n) は 0 から n-1 までの数を生成します。for文でそれを1つずつ取り出します。",
    source: "manual", expectedOutput: "0\n1\n2\n3\n4",
  },
  {
    id: "lop-002", categoryId: "loops", difficulty: "medium", order: 2,
    title: "リストのループ", description: '果物リスト ["りんご", "バナナ", "みかん"] の各要素を表示してください。',
    blockMode: "line",
    correctOrder: [
      { id: "lop-002-b1", content: 'fruits = ["りんご", "バナナ", "みかん"]', indentLevel: 0, type: "variable" },
      { id: "lop-002-b2", content: "for fruit in fruits:", indentLevel: 0, type: "keyword" },
      { id: "lop-002-b3", content: "print(fruit)", indentLevel: 1, type: "function" },
    ],
    distractors: [],
    hints: ["for 変数 in リスト: の形で、リストの要素を1つずつ取り出せます。"],
    points: 20, tags: ["for", "list"],
    explanation: "for-in でリストやタプルなどの要素を順番に処理できます。",
    source: "manual",
  },
  {
    id: "lop-003", categoryId: "loops", difficulty: "medium", order: 3,
    title: "while文", description: "変数 n を 3 から始めて 0 より大きい間カウントダウンして表示してください。",
    blockMode: "line",
    correctOrder: [
      { id: "lop-003-b1", content: "n = 3", indentLevel: 0, type: "variable" },
      { id: "lop-003-b2", content: "while n > 0:", indentLevel: 0, type: "keyword" },
      { id: "lop-003-b3", content: "print(n)", indentLevel: 1, type: "function" },
      { id: "lop-003-b4", content: "n = n - 1", indentLevel: 1, type: "variable" },
    ],
    distractors: [],
    hints: ["while文は条件が True の間繰り返します。", "ループ内で n を減らさないと無限ループになります。"],
    points: 20, tags: ["while", "countdown"],
    explanation: "while文は条件が True の間繰り返します。変数を更新しないと無限ループになるので注意。",
    source: "manual", expectedOutput: "3\n2\n1",
  },
  {
    id: "lop-004", categoryId: "loops", difficulty: "hard", order: 4,
    title: "合計を計算", description: "1から5までの合計を計算して表示してください。",
    blockMode: "line",
    correctOrder: [
      { id: "lop-004-b1", content: "total = 0", indentLevel: 0, type: "variable" },
      { id: "lop-004-b2", content: "for i in range(1, 6):", indentLevel: 0, type: "keyword" },
      { id: "lop-004-b3", content: "total = total + i", indentLevel: 1, type: "variable" },
      { id: "lop-004-b4", content: "print(total)", indentLevel: 0, type: "function" },
    ],
    distractors: [{ id: "lop-004-d1", content: "for i in range(5):", indentLevel: 0, type: "keyword" }],
    hints: ["range(1, 6) は 1, 2, 3, 4, 5 を生成します。", "print はループの外に置きます。"],
    points: 20, tags: ["for", "accumulator"],
    explanation: "range(1, 6) は 1 から 5 まで。合計用の変数を 0 で初期化し、ループで加算していくパターンです。",
    source: "manual", expectedOutput: "15",
  },
  {
    id: "fnc-001", categoryId: "functions", difficulty: "easy", order: 1,
    title: "関数を作ろう", description: '"こんにちは" と表示する関数 greet を作って呼び出してください。',
    blockMode: "line",
    correctOrder: [
      { id: "fnc-001-b1", content: "def greet():", indentLevel: 0, type: "keyword" },
      { id: "fnc-001-b2", content: 'print("こんにちは")', indentLevel: 1, type: "function" },
      { id: "fnc-001-b3", content: "greet()", indentLevel: 0, type: "function" },
    ],
    distractors: [],
    hints: ["def キーワードで関数を定義します。", "関数は定義した後に呼び出します。"],
    points: 15, tags: ["function", "def"],
    explanation: "def 関数名(): で関数を定義し、関数名() で呼び出します。定義が先、呼び出しが後です。",
    source: "manual",
  },
  {
    id: "fnc-002", categoryId: "functions", difficulty: "medium", order: 2,
    title: "引数のある関数", description: '名前を受け取って挨拶する関数 hello を作り、"太郎" で呼び出してください。',
    blockMode: "line",
    correctOrder: [
      { id: "fnc-002-b1", content: "def hello(name):", indentLevel: 0, type: "keyword" },
      { id: "fnc-002-b2", content: 'print("こんにちは、" + name + "さん！")', indentLevel: 1, type: "function" },
      { id: "fnc-002-b3", content: 'hello("太郎")', indentLevel: 0, type: "function" },
    ],
    distractors: [],
    hints: ["関数の引数は () の中に書きます。"],
    points: 20, tags: ["function", "parameter"],
    explanation: "def hello(name): の name が引数です。呼び出す時に値を渡します。",
    source: "manual", expectedOutput: "こんにちは、太郎さん！",
  },
  {
    id: "fnc-003", categoryId: "functions", difficulty: "medium", order: 3,
    title: "return文", description: "2つの数の合計を返す関数 add を作り、結果を表示してください。",
    blockMode: "line",
    correctOrder: [
      { id: "fnc-003-b1", content: "def add(a, b):", indentLevel: 0, type: "keyword" },
      { id: "fnc-003-b2", content: "return a + b", indentLevel: 1, type: "keyword" },
      { id: "fnc-003-b3", content: "result = add(3, 5)", indentLevel: 0, type: "variable" },
      { id: "fnc-003-b4", content: "print(result)", indentLevel: 0, type: "function" },
    ],
    distractors: [],
    hints: ["return で関数から値を返せます。", "返された値は変数に代入できます。"],
    points: 20, tags: ["function", "return"],
    explanation: "return は関数の結果を呼び出し元に返します。print とは違い、画面には表示されません。",
    source: "manual", expectedOutput: "8",
  },
  {
    id: "fnc-004", categoryId: "functions", difficulty: "hard", order: 4,
    title: "関数を組み合わせる", description: "2乗を計算する関数 square と、それを使って表示する関数を作ってください。",
    blockMode: "line",
    correctOrder: [
      { id: "fnc-004-b1", content: "def square(n):", indentLevel: 0, type: "keyword" },
      { id: "fnc-004-b2", content: "return n * n", indentLevel: 1, type: "keyword" },
      { id: "fnc-004-b3", content: "result = square(5)", indentLevel: 0, type: "variable" },
      { id: "fnc-004-b4", content: "print(result)", indentLevel: 0, type: "function" },
    ],
    distractors: [{ id: "fnc-004-d1", content: "return n + n", indentLevel: 1, type: "keyword" }],
    hints: ["2乗は n * n です。n + n は2倍になってしまいます。"],
    points: 20, tags: ["function", "return", "math"],
    explanation: "n * n は n の2乗です。n + n は n の2倍なので別の結果になります。",
    source: "manual", expectedOutput: "25",
  },
];

function toRow(p) {
  return [
    p.id,
    p.categoryId,
    p.difficulty,
    String(p.order),
    p.title,
    p.description,
    p.blockMode,
    JSON.stringify(p.correctOrder),
    JSON.stringify(p.distractors || []),
    JSON.stringify(p.hints),
    String(p.points),
    p.explanation || "",
    JSON.stringify(p.tags),
    p.source || "manual",
    "",
    p.expectedOutput || "",
  ];
}

const values = [header, ...problems.map(toRow)];

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: "problems!A1",
  valueInputOption: "RAW",
  requestBody: { values },
});

console.log(`   ${problems.length} 問を書き込みました ✓`);

// 3. categories シートを作成
console.log("3. categories シートを作成...");

// 既存シート確認
const metaAfter = await sheets.spreadsheets.get({ spreadsheetId });
const existingSheets = new Set(
  metaAfter.data.sheets
    .map((s) => s.properties.title)
    .filter((title) => typeof title === "string")
);

async function ensureSheet(title) {
  if (existingSheets.has(title)) {
    console.log(`   ${title} シートは既に存在 ✓`);
    return;
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }],
    },
  });
  existingSheets.add(title);
  console.log(`   ${title} シートを追加 ✓`);
}

await ensureSheet("categories");

// 4. カテゴリデータ書き込み
console.log("4. カテゴリデータ書き込み...");

const catHeader = ["id", "title", "description", "icon", "color", "order"];
const categoriesData = [
  { id: "variables", title: "変数とデータ型", description: "変数の作り方とデータ型を学ぼう", icon: "Box", color: "bg-blue-500", order: 1 },
  { id: "print-statements", title: "print文", description: "print()で画面に表示しよう", icon: "MessageSquare", color: "bg-green-500", order: 2 },
  { id: "conditionals", title: "条件分岐", description: "if/elif/elseで条件を分けよう", icon: "GitBranch", color: "bg-purple-500", order: 3 },
  { id: "loops", title: "ループ", description: "for/whileで繰り返そう", icon: "Repeat", color: "bg-orange-500", order: 4 },
  { id: "functions", title: "関数", description: "defで関数を作ろう", icon: "Puzzle", color: "bg-pink-500", order: 5 },
];

const catValues = [catHeader, ...categoriesData.map((c) => [c.id, c.title, c.description, c.icon, c.color, String(c.order)])];

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: "categories!A1",
  valueInputOption: "RAW",
  requestBody: { values: catValues },
});

console.log(`   ${categoriesData.length} カテゴリを書き込みました ✓`);

// 5. 学習ログシート作成
console.log("5. attempt_logs シートを作成...");
await ensureSheet("attempt_logs");

const attemptLogHeader = [
  "loggedAt",
  "userId",
  "problemId",
  "categoryId",
  "isCorrect",
  "points",
  "usedHint",
  "timeSpentSec",
  "attemptNo",
  "incorrectPattern",
];

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: "attempt_logs!A1:J1",
  valueInputOption: "RAW",
  requestBody: { values: [attemptLogHeader] },
});
console.log("   attempt_logs ヘッダーを設定 ✓");

// 6. 集計シート作成
console.log("6. 集計シートを作成...");
await ensureSheet("daily_stats");
await ensureSheet("student_stats");
await ensureSheet("category_stats");

const dailyFormula = `=QUERY(attempt_logs!A:J,"select date(A), count(A), sum(E), avg(E), count(unique(B)) where A is not null group by date(A) label date(A) 'date', count(A) 'attempts', sum(E) 'correct', avg(E) 'accuracy', count(unique(B)) 'activeUsers'",1)`;
const studentFormula = `=QUERY(attempt_logs!A:J,"select B, count(A), sum(E), avg(E), avg(H), avg(I) where B is not null group by B label B 'userId', count(A) 'attempts', sum(E) 'correct', avg(E) 'accuracy', avg(H) 'avgTimeSec', avg(I) 'avgAttemptNo'",1)`;
const categoryFormula = `=QUERY(attempt_logs!A:J,"select D, count(A), sum(E), avg(E), avg(H) where D is not null group by D label D 'categoryId', count(A) 'attempts', sum(E) 'correct', avg(E) 'accuracy', avg(H) 'avgTimeSec'",1)`;

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: "daily_stats!A1:E2",
  valueInputOption: "USER_ENTERED",
  requestBody: {
    values: [
      ["date", "attempts", "correct", "accuracy", "activeUsers"],
      [dailyFormula, "", "", "", ""],
    ],
  },
});

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: "student_stats!A1:F2",
  valueInputOption: "USER_ENTERED",
  requestBody: {
    values: [
      ["userId", "attempts", "correct", "accuracy", "avgTimeSec", "avgAttemptNo"],
      [studentFormula, "", "", "", "", ""],
    ],
  },
});

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: "category_stats!A1:E2",
  valueInputOption: "USER_ENTERED",
  requestBody: {
    values: [
      ["categoryId", "attempts", "correct", "accuracy", "avgTimeSec"],
      [categoryFormula, "", "", "", ""],
    ],
  },
});

console.log("   集計シートにQUERY式を設定 ✓");
console.log("完了！");
