"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, List, Shuffle, User } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/", icon: Home, label: "ホーム" },
  { href: "/categories", icon: LayoutGrid, label: "カテゴリ" },
  { href: "/problems", icon: List, label: "問題一覧" },
  { href: "/random", icon: Shuffle, label: "ランダム" },
  { href: "/profile", icon: User, label: "プロフィール" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 w-full h-full",
                "transition-colors",
                isActive ? "text-primary-600" : "text-gray-400"
              )}
            >
              <item.icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
