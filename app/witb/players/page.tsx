"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type WitbItem = {
  id?: string;
  player?: { id?: string; name?: string };
  category?: string;
  as_of_ym?: string;
  [key: string]: unknown;
};

function getPlayerId(item: WitbItem): string {
  const p = item?.player;
  if (!p || typeof p !== "object") return "";
  return String(p?.id ?? "").trim();
}

function getPlayerName(item: WitbItem): string {
  const p = item?.player;
  if (!p || typeof p !== "object") return "";
  return String(p?.name ?? "").trim();
}

type PlayerSummary = {
  player_id: string;
  player_name: string;
  clubCount: number;
  latestAsOfYm: string;
};

export default function WitbPlayersPage() {
  const [data, setData] = useState<WitbItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/witb_index.json")
      .then((res) => res.json())
      .then((json) => {
        setData(Array.isArray(json) ? json : []);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const docs = data ?? [];
  const byPlayer = new Map<string, WitbItem[]>();
  for (const item of docs) {
    const pid = getPlayerId(item);
    if (!pid) continue;
    if (!byPlayer.has(pid)) byPlayer.set(pid, []);
    byPlayer.get(pid)!.push(item);
  }

  const summaries: PlayerSummary[] = Array.from(byPlayer.entries()).map(
    ([player_id, items]) => {
      const player_name =
        items.length > 0 ? getPlayerName(items[0]) || player_id : player_id;
      const asOfYms = items
        .map((i) => String(i?.as_of_ym ?? "").trim())
        .filter(Boolean);
      const latestAsOfYm =
        asOfYms.length > 0
          ? asOfYms.sort((a, b) => (b < a ? -1 : b > a ? 1 : 0))[0]
          : "";
      return {
        player_id,
        player_name,
        clubCount: items.length,
        latestAsOfYm,
      };
    }
  );

  summaries.sort((a, b) =>
    (a.player_name || a.player_id).localeCompare(b.player_name || b.player_id)
  );

  if (loading) {
    return (
      <main style={styles.wrap}>
        <p>読み込み中...</p>
      </main>
    );
  }
  if (error) {
    return (
      <main style={styles.wrap}>
        <p style={{ color: "#c00" }}>エラー: {error}</p>
      </main>
    );
  }

  return (
    <main style={styles.wrap}>
      <h1 style={styles.title}>WITB 選手一覧</h1>
      <p style={styles.sub}>
        <Link href="/witb/search" style={styles.link}>
          WITB 横断検索
        </Link>
      </p>

      <div style={styles.grid}>
        {summaries.map((s) => (
          <Link
            key={s.player_id}
            href={`/witb/player/${encodeURIComponent(s.player_id)}`}
            style={styles.card}
          >
            <div style={styles.cardName}>{s.player_name || s.player_id}</div>
            <div style={styles.cardMeta}>
              登録クラブ: {s.clubCount} 本
            </div>
            {s.latestAsOfYm && (
              <div style={styles.cardMeta}>最新: {s.latestAsOfYm}</div>
            )}
          </Link>
        ))}
      </div>

      {summaries.length === 0 && (
        <p style={styles.empty}>選手データがありません</p>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "40px 18px 80px",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    lineHeight: 1.6,
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 24,
  },
  link: {
    color: "#0369a1",
    textDecoration: "none",
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  card: {
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    textDecoration: "none",
    color: "inherit",
    display: "block",
  },
  cardName: {
    fontSize: 18,
    fontWeight: 900,
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  empty: {
    fontSize: 14,
    opacity: 0.7,
  },
};
