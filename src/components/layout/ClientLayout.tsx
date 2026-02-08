"use client";

import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main className="max-w-lg mx-auto px-4 pt-16 pb-20 md:max-w-2xl">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
