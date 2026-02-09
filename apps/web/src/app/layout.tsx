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
      </body>
    </html>
  );
}
