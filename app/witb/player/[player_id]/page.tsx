"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type WitbItem = {
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
  const playerItems = docs.filter(
    (item) => getPlayerId(item) === player_id
  );

  // as_of_ym ごとにグループ化
  const byAsOfYm = new Map<string, Map<string, WitbItem[]>>();
  for (const item of playerItems) {
    const ym = String(item?.as_of_ym ?? "").trim() || "_";
    const cat = String(item?.category ?? "").trim() || "other";
    if (!byAsOfYm.has(ym)) byAsOfYm.set(ym, new Map());
    const catMap = byAsOfYm.get(ym)!;
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat)!.push(item);
  }

  // wedges は spec.loft_label 昇順
  for (const catMap of byAsOfYm.values()) {
    for (const [cat, items] of catMap) {
      if (cat === "wedges") {
        items.sort((a, b) => {
          const la = a?.spec && typeof a.spec === "object" && a.spec.loft_label != null ? Number(a.spec.loft_label) : 0;
          const lb = b?.spec && typeof b.spec === "object" && b.spec.loft_label != null ? Number(b.spec.loft_label) : 0;
          return la - lb;
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

  const playerName =
    playerItems.length > 0 ? getPlayerName(playerItems[0]) : player_id;

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
                  <div style={styles.grid}>
                    {items.map((item, i) => {
                      const club = item?.club && typeof item.club === "object" ? item.club : null;
                      const brand = club ? String(club?.brand ?? "").trim() : "";
                      const model = club ? String(club?.model ?? "").trim() : "";
                      const brandModel = [brand, model].filter(Boolean).join(" ") || "-";

                      const spec = item?.spec && typeof item.spec === "object" ? item.spec : null;
                      const specRaw = spec != null ? String(spec?.raw ?? "").trim() : "";
                      const specDisplay = specRaw || "-";

                      const shaft = item?.shaft && typeof item.shaft === "object" ? item.shaft : null;
                      const shaftText = shaft != null
                        ? String(shaft?.display ?? shaft?.raw ?? "").trim()
                        : "";
                      const shaftDisplay = shaftText || "-";

                      const source = item?.source && typeof item.source === "object" ? item.source : null;
                      const sourceUrl = source != null ? String(source?.url ?? "").trim() : "";
                      const sourceName = source != null ? String(source?.name ?? "").trim() : "出典";

                      return (
                        <div key={String(item?.id) || `club-${i}`} style={styles.card}>
                          <div style={styles.cardBrand}>{brandModel}</div>
                          <div style={styles.cardSpec}>{specDisplay}</div>
                          <div style={styles.cardShaft}>{shaftDisplay}</div>
                          {sourceUrl ? (
                            <a
                              href={sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={styles.cardLink}
                            >
                              {sourceName} →
                            </a>
                          ) : (
                            <span style={styles.cardSourceFallback}>-</span>
                          )}
                        </div>
                      );
                    })}
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
  section: {
    marginBottom: 32,
  },
  asOfYmTitle: {
    fontSize: 20,
    fontWeight: 900,
    marginBottom: 12,
  },
  categoryBlock: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
  },
  card: {
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 12,
    padding: 14,
    background: "#fff",
  },
  cardBrand: {
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 6,
    opacity: 0.95,
  },
  cardSpec: {
    fontSize: 13,
    opacity: 0.85,
    marginBottom: 4,
  },
  cardShaft: {
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 6,
  },
  cardLink: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0369a1",
    textDecoration: "none",
  },
  cardSourceFallback: {
    fontSize: 13,
    opacity: 0.6,
  },
  empty: {
    fontSize: 14,
    opacity: 0.7,
  },
};
