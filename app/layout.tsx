import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golf Joho - ゴルフクラブ在庫探索",
  description: "Nike Vapor Fly Pro 3 Iron などの在庫検索ハブ",
};

const NAV_ITEMS = [
  { href: "/", label: "ホーム" },
  { href: "/bags", label: "マイバッグ" },
  { href: "/my-clubs", label: "クラブ庫" },
  { href: "/clubs", label: "名器図鑑" },
  { href: "/#更新ダイジェスト", label: "在庫・相場" },
  { href: "/vapor-fly-pro-3i", label: "中古チェック" },
  { href: "/about", label: "このサイトについて" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <div className="min-h-screen">
          <header className="site-header">
            <nav className="site-nav">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className="site-nav-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <div className="page-container">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
