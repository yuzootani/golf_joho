"use client";

import { useState, useEffect } from "react";

type WitbItem = {
  id?: string;
  search_text?: string;
  category?: string;
  player?: { id?: string; name?: string } | string;
  club?: { brand?: string; model?: string };
  brand?: string;
  model?: string;
  loft_label?: string | number;
  spec?: { raw?: string; loft_label?: string | number };
  shaft?: { display?: string };
  source?: { link?: string; url?: string };
  [key: string]: unknown;
};

function safeString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function getPlayerName(item: WitbItem): string {
  const p = item?.player;
  if (!p) return "";
  if (typeof p === "string") return p;
  return safeString(p?.name) || safeString(p?.id) || "";
}

function getBrand(item: WitbItem): string {
  const c = item?.club;
  if (c && typeof c === "object") return safeString(c?.brand);
  return safeString(item?.brand);
}

function getModel(item: WitbItem): string {
  const c = item?.club;
  if (c && typeof c === "object") return safeString(c?.model);
  return safeString(item?.model);
}

function getLoftLabel(item: WitbItem): string {
  const s = item?.spec;
  if (s && typeof s === "object" && s.loft_label != null) {
    return String(s.loft_label);
  }
  if (item?.loft_label != null) return String(item.loft_label);
  return "";
}

function getSourceLink(item: WitbItem): string {
  const s = item?.source;
  if (!s || typeof s !== "object") return "";
  return safeString(s?.url) || safeString(s?.link) || "";
}

function getSpecRaw(item: WitbItem): string {
  const s = item?.spec;
  if (!s || typeof s !== "object") return "";
  return safeString(s?.raw);
}

function getShaftDisplay(item: WitbItem): string {
  const s = item?.shaft;
  if (!s || typeof s !== "object") return "";
  return safeString(s?.display);
}

export default function WitbSearchPage() {
  const [data, setData] = useState<WitbItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPlayer, setFilterPlayer] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterLoftLabel, setFilterLoftLabel] = useState("");

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

  const uniq = (arr: string[]): string[] =>
    [...new Set(arr.filter((x): x is string => typeof x === "string" && x.length > 0))].sort();

  const categories = uniq(
    docs.map((d) => safeString(d?.category)).filter(Boolean)
  );
  const players = uniq(
    docs.map((d) => getPlayerName(d)).filter(Boolean)
  );
  const brands = uniq(
    docs.map((d) => getBrand(d)).filter(Boolean)
  );
  const models = uniq(
    docs.map((d) => getModel(d)).filter(Boolean)
  );
  const loftLabels = uniq(
    docs.map((d) => getLoftLabel(d)).filter(Boolean)
  );

  const filtered: WitbItem[] = docs.filter((item) => {
    if (!item || typeof item !== "object") return false;
    const q = searchText.trim();
    if (q) {
      const st = safeString(item?.search_text).toLowerCase();
      if (!st.includes(q.toLowerCase())) return false;
    }
    if (filterCategory && safeString(item?.category) !== filterCategory) return false;
    if (filterPlayer && getPlayerName(item) !== filterPlayer) return false;
    if (filterBrand && getBrand(item) !== filterBrand) return false;
    if (filterModel && getModel(item) !== filterModel) return false;
    if (filterLoftLabel && getLoftLabel(item) !== filterLoftLabel) return false;
    return true;
  });

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
      <h1 style={styles.title}>WITB 横断検索</h1>
      <p style={styles.sub}>witb_index.json から検索・絞り込み</p>

      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="フリーワード検索"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.filters}>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={styles.select}
        >
          <option value="">カテゴリ</option>
          {Array.isArray(categories) &&
            categories.map((c) =>
              c ? (
                <option key={c} value={c}>
                  {c}
                </option>
              ) : null
            )}
        </select>
        <select
          value={filterPlayer}
          onChange={(e) => setFilterPlayer(e.target.value)}
          style={styles.select}
        >
          <option value="">プロ</option>
          {Array.isArray(players) &&
            players.map((p) =>
              p ? (
                <option key={p} value={p}>
                  {p}
                </option>
              ) : null
            )}
        </select>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          style={styles.select}
        >
          <option value="">ブランド</option>
          {Array.isArray(brands) &&
            brands.map((b) =>
              b ? (
                <option key={b} value={b}>
                  {b}
                </option>
              ) : null
            )}
        </select>
        <select
          value={filterModel}
          onChange={(e) => setFilterModel(e.target.value)}
          style={styles.select}
        >
          <option value="">モデル</option>
          {Array.isArray(models) &&
            models.map((m) =>
              m ? (
                <option key={m} value={m}>
                  {m}
                </option>
              ) : null
            )}
        </select>
        <select
          value={filterLoftLabel}
          onChange={(e) => setFilterLoftLabel(e.target.value)}
          style={styles.select}
        >
          <option value="">ロフト（wedge用）</option>
          {Array.isArray(loftLabels) &&
            loftLabels.map((l) =>
              l ? (
                <option key={l} value={l}>
                  {l}
                </option>
              ) : null
            )}
        </select>
      </div>

      <p style={styles.resultCount}>
        {Array.isArray(filtered) ? filtered.length : 0} 件
      </p>

      <div style={styles.grid}>
        {Array.isArray(filtered) &&
          filtered.map((item, i) => {
            if (!item) return null;
            const playerName = getPlayerName(item);
            const brand = getBrand(item);
            const model = getModel(item);
            const specRaw = getSpecRaw(item);
            const shaftDisplay = getShaftDisplay(item);
            const sourceLink = getSourceLink(item);

            return (
              <div key={safeString(item?.id) || `item-${i}`} style={styles.card}>
                <div style={styles.cardPlayer}>{playerName || "-"}</div>
                <div style={styles.cardBrand}>
                  {[brand, model].filter(Boolean).join(" ")}
                </div>
                {specRaw && (
                  <div style={styles.cardSpec}>{specRaw}</div>
                )}
                {shaftDisplay && (
                  <div style={styles.cardShaft}>{shaftDisplay}</div>
                )}
                {sourceLink && (
                  <a
                    href={sourceLink}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.cardLink}
                  >
                    出典へ →
                  </a>
                )}
              </div>
            );
          })}
      </div>

      {(!Array.isArray(filtered) || filtered.length === 0) && (
        <p style={styles.empty}>該当する結果がありません</p>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "40px 18px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
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
  searchRow: {
    marginBottom: 16,
  },
  input: {
    width: "100%",
    maxWidth: 400,
    padding: "10px 14px",
    fontSize: 16,
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 8,
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  select: {
    padding: "8px 12px",
    fontSize: 14,
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 8,
  },
  resultCount: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  card: {
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
  },
  cardPlayer: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 6,
  },
  cardBrand: {
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 6,
    opacity: 0.9,
  },
  cardSpec: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 4,
  },
  cardShaft: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  cardLink: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0369a1",
    textDecoration: "none",
  },
  empty: {
    fontSize: 14,
    opacity: 0.7,
  },
};
