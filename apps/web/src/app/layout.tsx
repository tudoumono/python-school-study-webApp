import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/layout/ClientLayout";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplify";

export const metadata: Metadata = {
  title: "PyPuzzle - Pythonパズルで学ぼう",
  description:
    "ドラッグ&ドロップでコードブロックを並び替え、Pythonの基礎文法をマスターしよう",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <ConfigureAmplifyClientSide />
        <ClientLayout>{children}</ClientLayout>
        <a
          href="https://github.com/tudoumono"
          target="_blank"
          rel="noreferrer"
          aria-label="tudoumono GitHub"
          className="fixed right-2 bottom-20 md:bottom-2 z-40 text-[10px] tracking-tight text-gray-300 opacity-55 hover:opacity-90 hover:text-gray-500 transition-colors"
        >
          github.com/tudoumono
        </a>
      </body>
    </html>
  );
}
