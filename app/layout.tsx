import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golf Joho - ゴルフクラブ在庫探索",
  description: "Nike Vapor Fly Pro 3 Iron などの在庫検索ハブ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
