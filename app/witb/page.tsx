"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type WITBDoc = {
  id?: string;
  player?: { id?: string; name?: string };
  category?: string;
  as_of_ym?: string;
  club?: { brand?: string; model?: string };
  spec?: { raw?: string };
  shaft?: { raw?: string; display?: string };
  [key: string]: unknown;
};

function safeStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  return String(v).trim();
}

function getPlayerId(d: WITBDoc): string {
  const p = d?.player;
  if (!p || typeof p !== "object") return "";
  return safeStr(p?.id);
}

function getPlayerName(d: WITBDoc): string {
  const p = d?.player;
  if (!p || typeof p !== "object") return "";
  return safeStr(p?.name) || safeStr(p?.id) || "";
}

function getBrand(d: WITBDoc): string {
  const c = d?.club;
  if (!c || typeof c !== "object") return "";
  return safeStr(c?.brand);
}

function getModel(d: WITBDoc): string {
  const c = d?.club;
  if (!c || typeof c !== "object") return "";
  return safeStr(c?.model);
}

function getShaftShort(d: WITBDoc): string {
  const s = d?.shaft;
  if (!s || typeof s !== "object") return "-";
  return safeStr(s?.display) || safeStr(s?.raw) || "-";
}

function getCategory(d: WITBDoc): string {
  return safeStr(d?.category) || "-";
}

export default function WitbHubPage() {
  const router = useRouter();
  const [data, setData] = useState<WITBDoc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    fetch("/witb_index.json")
      .then((res) => res.json())
      .then((json: unknown) => {
        setData(Array.isArray(json) ? json : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const docs = data ?? [];

  const recent = useMemo(() => {
    return [...docs]
      .sort((a: WITBDoc, b: WITBDoc) => {
        const ya = safeStr(a?.as_of_ym);
        const yb = safeStr(b?.as_of_ym);
        return yb.localeCompare(ya);
      })
      .slice(0, 10);
  }, [docs]);

  const drivers = useMemo(() => docs.filter((d: WITBDoc) => safeStr(d?.category) === "drivers"), [docs]);

  const headCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of drivers) {
      const head = [getBrand(d), getModel(d)].filter(Boolean).join(" ");
      if (head) m.set(head, (m.get(head) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [drivers]);

  const shaftCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of drivers) {
      const shaft = getShaftShort(d);
      if (shaft && shaft !== "-") m.set(shaft, (m.get(shaft) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [drivers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    if (q) router.push(`/witb/search?q=${encodeURIComponent(q)}`);
    else router.push("/witb/search");
  };

  if (loading) {
    return (
      <main style={styles.wrap}>
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main style={styles.wrap}>
      {/* A. ヒーロー */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>WITB Hub</h1>
        <p style={styles.heroDesc}>
          プロゴルファーのクラブセッティング（WITB）を検索・比較できます。
        </p>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            placeholder="プレイヤー、ブランド、シャフトで検索..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchBtn}>検索</button>
        </form>
        <Link href="/witb/search" style={styles.searchLink}>横断検索へ →</Link>
      </section>

      {/* B. 探す（ナビカード） */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>探す</h2>
        <div style={styles.navGrid}>
          <Link href="/witb/players" style={styles.navCard}>
            <span style={styles.navCardTitle}>選手一覧</span>
            <span style={styles.navCardDesc}>登録選手から探す</span>
          </Link>
          <Link href="/witb/search" style={styles.navCard}>
            <span style={styles.navCardTitle}>横断検索</span>
            <span style={styles.navCardDesc}>フリーワード・絞り込み</span>
          </Link>
          <Link href="/witb/drivers" style={styles.navCard}>
            <span style={styles.navCardTitle}>Drivers</span>
            <span style={styles.navCardDesc}>ドライバー一覧</span>
          </Link>
          <Link href="/witb/wedges" style={styles.navCard}>
            <span style={styles.navCardTitle}>Wedges</span>
            <span style={styles.navCardDesc}>ウェッジ一覧</span>
          </Link>
          <Link href="/witb/search?category=irons" style={styles.navCard}>
            <span style={styles.navCardTitle}>Irons</span>
            <span style={styles.navCardDesc}>アイアンで絞り込み</span>
          </Link>
          <Link href="/witb/search?category=fairway_woods" style={styles.navCard}>
            <span style={styles.navCardTitle}>Fairway Woods</span>
            <span style={styles.navCardDesc}>FWで絞り込み</span>
          </Link>
          <Link href="/witb/search?category=utility" style={styles.navCard}>
            <span style={styles.navCardTitle}>Utility</span>
            <span style={styles.navCardDesc}>ユーティリティで絞り込み</span>
          </Link>
          <Link href="/witb/search?category=putters" style={styles.navCard}>
            <span style={styles.navCardTitle}>Putters</span>
            <span style={styles.navCardDesc}>パターで絞り込み</span>
          </Link>
          <Link href="/witb/grips" style={styles.navCard}>
            <span style={styles.navCardTitle}>Grips</span>
            <span style={styles.navCardDesc}>グリップ一覧</span>
          </Link>
        </div>
      </section>

      {/* C. 人気ランキング */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>人気ランキング（Drivers）</h2>
        <div style={styles.rankGrid}>
          <div style={styles.rankBox}>
            <h3 style={styles.rankSubTitle}>TOP5 Head</h3>
            <ul style={styles.rankList}>
              {headCounts.map(([head, cnt], i) => (
                <li key={head} style={styles.rankItem}>
                  <Link
                    href={`/witb/drivers?q=${encodeURIComponent(head)}`}
                    style={styles.rankLink}
                  >
                    {i + 1}. {head} ({cnt})
                  </Link>
                </li>
              ))}
            </ul>
            {headCounts.length === 0 && <p style={styles.rankEmpty}>データなし</p>}
          </div>
          <div style={styles.rankBox}>
            <h3 style={styles.rankSubTitle}>TOP5 Shaft</h3>
            <ul style={styles.rankList}>
              {shaftCounts.map(([shaft, cnt], i) => (
                <li key={`${shaft}-${i}`} style={styles.rankItem}>
                  <Link
                    href={`/witb/drivers?q=${encodeURIComponent(shaft)}`}
                    style={styles.rankLink}
                  >
                    {i + 1}. {shaft} ({cnt})
                  </Link>
                </li>
              ))}
            </ul>
            {shaftCounts.length === 0 && <p style={styles.rankEmpty}>データなし</p>}
          </div>
        </div>
      </section>

      {/* D. 最近追加・更新 */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>最近追加・更新</h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Head</th>
                <th style={styles.th}>Shaft</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d: WITBDoc, i: number) => {
                const pid = getPlayerId(d);
                const head = [getBrand(d), getModel(d)].filter(Boolean).join(" ") || "-";
                return (
                  <tr key={String(d?.id) || `recent-${i}`}>
                    <td style={styles.td}>{safeStr(d?.as_of_ym) || "-"}</td>
                    <td style={styles.td}>
                      {pid ? (
                        <Link href={`/witb/player/${encodeURIComponent(pid)}`} style={styles.cellLink}>
                          {getPlayerName(d) || "-"}
                        </Link>
                      ) : (
                        getPlayerName(d) || "-"
                      )}
                    </td>
                    <td style={styles.td}>{getCategory(d)}</td>
                    <td style={styles.td}>{head}</td>
                    <td style={styles.td}>{getShaftShort(d)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={styles.more}>
          <Link href="/witb/search" style={styles.moreLink}>もっと見る →</Link>
        </p>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "32px 18px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    lineHeight: 1.6,
  },
  hero: {
    marginBottom: 40,
    paddingBottom: 32,
    borderBottom: "1px solid rgba(0,0,0,0.1)",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 900,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 20,
  },
  searchForm: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    maxWidth: 400,
    padding: "12px 16px",
    fontSize: 16,
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 8,
  },
  searchBtn: {
    padding: "12px 20px",
    fontSize: 16,
    cursor: "pointer",
    border: "1px solid rgba(0,0,0,0.3)",
    borderRadius: 8,
    background: "#0369a1",
    color: "#fff",
    fontWeight: 600,
  },
  searchLink: {
    color: "#0369a1",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 800,
    marginBottom: 16,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 8,
    marginBottom: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 500,
  },
  th: {
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "2px solid rgba(0,0,0,0.15)",
    background: "#f8f8f8",
    fontSize: 13,
    fontWeight: 700,
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontSize: 14,
  },
  cellLink: {
    color: "#0369a1",
    textDecoration: "none",
    fontWeight: 600,
  },
  more: {
    margin: 0,
  },
  moreLink: {
    color: "#0369a1",
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 14,
  },
  navGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
  },
  navCard: {
    display: "block",
    padding: 16,
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 12,
    background: "#fff",
    textDecoration: "none",
    color: "inherit",
  },
  navCardTitle: {
    display: "block",
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 4,
  },
  navCardDesc: {
    display: "block",
    fontSize: 13,
    opacity: 0.75,
  },
  rankGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 24,
  },
  rankBox: {
    padding: 16,
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 12,
    background: "#fafafa",
  },
  rankSubTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 12,
  },
  rankList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  rankItem: {
    padding: "6px 0",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontSize: 14,
  },
  rankLink: {
    color: "#0369a1",
    textDecoration: "none",
    fontWeight: 500,
  },
  rankEmpty: {
    margin: 0,
    fontSize: 14,
    opacity: 0.7,
  },
};
