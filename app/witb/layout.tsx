"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS: { href: string; label: string }[] = [
  { href: "/witb", label: "WITB Hub" },
  { href: "/witb/players", label: "選手一覧" },
  { href: "/witb/search", label: "横断検索" },
  { href: "/witb/drivers", label: "Drivers" },
  { href: "/witb/fairway-woods", label: "Fairway Woods" },
  { href: "/witb/utility", label: "Utility" },
  { href: "/witb/irons", label: "Irons" },
  { href: "/witb/wedges", label: "Wedges" },
  { href: "/witb/putters", label: "Putters" },
  { href: "/witb/grips", label: "Grips" },
];

function WitbSidebar() {
  const pathname = usePathname();

  return (
    <nav style={sidebarStyles.wrap}>
      <ul style={sidebarStyles.list}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/witb"
              ? pathname === "/witb"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} style={sidebarStyles.item}>
              <Link
                href={item.href}
                style={{
                  ...sidebarStyles.link,
                  ...(isActive ? sidebarStyles.linkActive : {}),
                }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function WitbLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>読み込み中...</div>}>
      <div className="witb-layout" style={layoutStyles.wrap}>
        <style>{`
          @media (max-width: 768px) {
            .witb-layout .witb-sidebar { display: none; }
          }
        `}</style>
        <aside className="witb-sidebar" style={sidebarStyles.aside}>
          <WitbSidebar />
        </aside>
        <div style={layoutStyles.main}>
          {children}
        </div>
      </div>
    </Suspense>
  );
}

const layoutStyles: Record<string, React.CSSProperties> = {
  wrap: {
    display: "flex",
    minHeight: "100vh",
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
};

const sidebarStyles: Record<string, React.CSSProperties> = {
  aside: {
    width: 220,
    flex: "0 0 220px",
    flexShrink: 0,
    borderRight: "1px solid rgba(0,0,0,0.1)",
    background: "#fafafa",
    padding: "24px 0",
  },
  wrap: {
    width: "100%",
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    margin: 0,
  },
  link: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 20px",
    fontSize: 14,
    color: "#333",
    textDecoration: "none",
    borderLeft: "3px solid transparent",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  linkActive: {
    borderLeftColor: "#0369a1",
    backgroundColor: "rgba(3,105,161,0.08)",
  },
};
