import type { Category } from "@/types/problem";

export const categories: Category[] = [
  {
    id: "variables",
    title: "変数とデータ型",
    description: "変数の作り方とデータ型を学ぼう",
    icon: "Box",
    color: "bg-blue-500",
    order: 1,
  },
  {
    id: "print-statements",
    title: "print文",
    description: "print()で画面に表示しよう",
    icon: "MessageSquare",
    color: "bg-green-500",
    order: 2,
  },
  {
    id: "conditionals",
    title: "条件分岐",
    description: "if/elif/elseで条件を分けよう",
    icon: "GitBranch",
    color: "bg-purple-500",
    order: 3,
  },
  {
    id: "loops",
    title: "ループ",
    description: "for/whileで繰り返そう",
    icon: "Repeat",
    color: "bg-orange-500",
    order: 4,
  },
  {
    id: "functions",
    title: "関数",
    description: "defで関数を作ろう",
    icon: "Puzzle",
    color: "bg-pink-500",
    order: 5,
  },
];
