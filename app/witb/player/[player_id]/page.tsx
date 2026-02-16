"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type PlayerStatRow = {
  stat_key?: string;
  stat_label_en?: string;
  stat_label_ja?: string;
  value?: string;
  unit?: string;
  rank?: string;
  source_name?: string;
  source_url?: string;
  notes?: string;
};

type PlayerStatsByYear = Record<string, PlayerStatRow[]>;
type PlayerStatsData = Record<string, PlayerStatsByYear>;

type WITBDoc = {
  id?: string;
  player?: { id?: string; name?: string };
  category?: string;
  as_of_ym?: string;
  slot?: string;
  club?: { brand?: string; model?: string };
  spec?: { raw?: string; loft_label?: number };
  shaft?: { raw?: string; display?: string };
  source?: { name?: string; url?: string };
  [key: string]: unknown;
};

function getPlayerId(item: WITBDoc): string {
  const p = item?.player;
  if (!p || typeof p !== "object") return "";
  return String(p?.id ?? "").trim();
}

function getPlayerName(item: WITBDoc): string {
  const p = item?.player;
  if (!p || typeof p !== "object") return "";
  return String(p?.name ?? "").trim();
}

const CATEGORY_ORDER = [
  "drivers",
  "fairway_woods",
  "utility",
  "irons",
  "wedges",
  "grips",
];

export default function WitbPlayerPage() {
  const params = useParams();
  const player_id = typeof params?.player_id === "string" ? params.player_id : "";

  const [data, setData] = useState<WITBDoc[] | null>(null);
  const [playerStatsData, setPlayerStatsData] = useState<PlayerStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/witb_index.json").then((res) => res.json()),
      fetch("/player_stats.json")
        .then((res) => (res.ok ? res.json() : {}))
        .catch(() => ({}))
        .then((json) => (typeof json === "object" && json !== null ? json : {})),
    ])
      .then(([witbJson, statsJson]) => {
        setData(Array.isArray(witbJson) ? witbJson : []);
        setPlayerStatsData(statsJson as PlayerStatsData);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message ?? "Failed to load");
        setData([]);
        setPlayerStatsData({});
      })
      .finally(() => setLoading(false));
  }, []);

  const docs = data ?? [];
  const playerItems = docs.filter(
    (item) => getPlayerId(item) === player_id
  );

  // as_of_ym ごとにグループ化
  const byAsOfYm = new Map<string, Map<string, WITBDoc[]>>();
  for (const item of playerItems) {
    const ym = String(item?.as_of_ym ?? "").trim() || "_";
    const cat = String(item?.category ?? "").trim() || "other";
    if (!byAsOfYm.has(ym)) byAsOfYm.set(ym, new Map());
    const catMap = byAsOfYm.get(ym)!;
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat)!.push(item);
  }

  // wedges: ロフト順、irons/fairway_woods/utility: slot順
  for (const catMap of Array.from(byAsOfYm.values())) {
    for (const [cat, items] of Array.from(catMap.entries())) {
      if (cat === "wedges") {
        items.sort((a: WITBDoc, b: WITBDoc) => {
          const la = a?.spec && typeof a.spec === "object" && a.spec.loft_label != null ? Number(a.spec.loft_label) : 0;
          const lb = b?.spec && typeof b.spec === "object" && b.spec.loft_label != null ? Number(b.spec.loft_label) : 0;
          return la - lb;
        });
      } else if (["irons", "fairway_woods", "utility"].includes(cat)) {
        items.sort((a: WITBDoc, b: WITBDoc) => {
          const sa = String(a?.slot ?? "").trim();
          const sb = String(b?.slot ?? "").trim();
          const na = parseFloat(sa);
          const nb = parseFloat(sb);
          if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
          return sa.localeCompare(sb);
        });
      }
    }
  }

  const asOfYmList = Array.from(byAsOfYm.keys())
    .filter((k) => k !== "_")
    .sort((a, b) => (b < a ? -1 : b > a ? 1 : 0));

  const categoryOrder = (a: string, b: string) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return a.localeCompare(b);
  };

  const categoryLabel = (cat: string) =>
    cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  function getHead(d: WITBDoc): string {
    const c = d?.club && typeof d.club === "object" ? d.club : null;
    if (!c) return "-";
    const b = String(c?.brand ?? "").trim();
    const m = String(c?.model ?? "").trim();
    return [b, m].filter(Boolean).join(" ") || "-";
  }
  function getSpec(d: WITBDoc): string {
    const s = d?.spec && typeof d.spec === "object" ? d.spec : null;
    if (!s) return "-";
    const r = String(s?.raw ?? "").trim();
    return r || "-";
  }
  function getShaft(d: WITBDoc): string {
    const s = d?.shaft && typeof d.shaft === "object" ? d.shaft : null;
    if (!s) return "-";
    return String(s?.display ?? s?.raw ?? "").trim() || "-";
  }
  function getSourceUrl(d: WITBDoc): string {
    const s = d?.source && typeof d.source === "object" ? d.source : null;
    if (!s) return "";
    return String(s?.url ?? "").trim();
  }
  function getSourceName(d: WITBDoc): string {
    const s = d?.source && typeof d.source === "object" ? d.source : null;
    if (!s) return "";
    return String(s?.name ?? "").trim() || "出典";
  }

  const playerName =
    playerItems.length > 0 ? getPlayerName(playerItems[0]) : player_id;

  // 2025 stats があれば取得（無ければ準備中表示）
  const stats: PlayerStatRow[] = (() => {
    const byYear = playerStatsData ?? {};
    const year2025 = byYear["2025"];
    if (!year2025 || typeof year2025 !== "object") return [];
    const rows = year2025[player_id];
    return Array.isArray(rows) ? rows : [];
  })();

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
      <p style={styles.nav}>
        <Link href="/witb/players" style={styles.link}>
          選手一覧
        </Link>
        {" / "}
        <Link href="/witb/search" style={styles.link}>
          横断検索
        </Link>
      </p>
      <h1 style={styles.title}>{playerName || player_id}</h1>
      <p style={styles.sub}>player_id: {player_id}</p>

      {/* Stats セクション */}
      <section style={styles.statsSection}>
        <h2 style={styles.statsTitle}>
          {stats.length > 0 ? "Stats (2025)" : "Stats（準備中）"}
        </h2>
        <p style={styles.statsDesc}>
          今後、信頼できる公式ソース（PGA等）から平均飛距離/Accuracy/Sand Save等を追加予定
        </p>
        {stats.length > 0 ? (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>項目</th>
                  <th style={styles.th}>値</th>
                  <th style={styles.th}>順位</th>
                  <th style={styles.th}>出典</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => {
                  const label = String(s?.stat_label_ja ?? s?.stat_label_en ?? "").trim() || "-";
                  const val = String(s?.value ?? "").trim();
                  const u = String(s?.unit ?? "").trim();
                  const valueWithUnit = u ? `${val} ${u}` : val || "-";
                  const rank = String(s?.rank ?? "").trim() || "-";
                  const sourceUrl = String(s?.source_url ?? "").trim();
                  const sourceName = String(s?.source_name ?? "").trim() || "出典";
                  return (
                    <tr key={s?.stat_key ?? i}>
                      <td style={styles.td}>{label}</td>
                      <td style={styles.td}>{valueWithUnit}</td>
                      <td style={styles.td}>{rank}</td>
                      <td style={styles.td}>
                        {sourceUrl ? (
                          <a href={sourceUrl} target="_blank" rel="noreferrer" style={styles.cellLink}>
                            {sourceName || "出典"} →
                          </a>
                        ) : (
                          sourceName || "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.statsPlaceholder}>データ準備中</p>
        )}
      </section>

      {asOfYmList.map((ym) => {
        const catMap = byAsOfYm.get(ym) ?? new Map();
        const categories = Array.from(catMap.keys()).sort(categoryOrder);
        const clubCount = Array.from(catMap.values()).reduce((s, arr) => s + arr.length, 0);
        return (
          <section key={ym} style={styles.section}>
            <h2 style={styles.asOfYmTitle}>{ym}（{clubCount}）</h2>
            {categories.map((cat) => {
              const items = catMap.get(cat) ?? [];
              return (
                <div key={`${ym}-${cat}`} style={styles.categoryBlock}>
                  <h3 style={styles.categoryTitle}>{categoryLabel(cat)}</h3>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Slot</th>
                          <th style={styles.th}>Head</th>
                          <th style={styles.th}>Spec</th>
                          <th style={styles.th}>Shaft</th>
                          <th style={styles.th}>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: WITBDoc, i: number) => {
                          const slot = String(item?.slot ?? "").trim() || "-";
                          const head = getHead(item);
                          const spec = getSpec(item);
                          const shaft = getShaft(item);
                          const sourceUrl = getSourceUrl(item);
                          const sourceName = getSourceName(item);

                          return (
                            <tr key={String(item?.id) || `club-${i}`}>
                              <td style={styles.td}>{slot}</td>
                              <td style={styles.td}>{head}</td>
                              <td style={styles.td}>{spec}</td>
                              <td style={styles.td}>{shaft}</td>
                              <td style={styles.td}>
                                {sourceUrl ? (
                                  <a href={sourceUrl} target="_blank" rel="noreferrer" style={styles.cellLink}>
                                    {sourceName} →
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {playerItems.length === 0 && (
        <p style={styles.empty}>該当選手のデータがありません</p>
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
  nav: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.9,
  },
  link: {
    color: "#0369a1",
    textDecoration: "none",
    fontWeight: 600,
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
  statsSection: {
    marginBottom: 32,
    padding: 16,
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 8,
    background: "#fafafa",
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 8,
  },
  statsDesc: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 12,
  },
  statsPlaceholder: {
    fontSize: 14,
    opacity: 0.7,
    margin: 0,
  },
  statsLabelCell: {
    padding: "8px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontSize: 14,
    fontWeight: 600,
  },
  section: {
    marginBottom: 32,
  },
  asOfYmTitle: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 12,
  },
  categoryBlock: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 400,
  },
  th: {
    padding: "8px 12px",
    textAlign: "left",
    borderBottom: "2px solid rgba(0,0,0,0.15)",
    background: "#f8f8f8",
    fontSize: 13,
    fontWeight: 700,
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontSize: 14,
  },
  cellLink: {
    color: "#0369a1",
    textDecoration: "none",
    fontWeight: 600,
  },
  empty: {
    fontSize: 14,
    opacity: 0.7,
  },
};
