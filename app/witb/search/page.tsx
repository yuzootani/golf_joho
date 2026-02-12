"use client";

import { useState, useEffect } from "react";

type WitbItem = {
  search_text?: string;
  category?: string;
  player?: string;
  brand?: string;
  model?: string;
  loft_label?: string;
  spec?: { raw?: string };
  shaft?: { display?: string };
  source?: { link?: string };
  [key: string]: unknown;
};

export default function WitbSearchPage() {
  const [data, setData] = useState<WitbItem[]>([]);
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
        setError(err.message || "Failed to load");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const uniq = (arr: (string | undefined)[], key?: string) =>
    [...new Set(arr.filter(Boolean))].sort();

  const categories = uniq(data.map((d) => d.category));
  const players = uniq(data.map((d) => d.player));
  const brands = uniq(data.map((d) => d.brand));
  const models = uniq(data.map((d) => d.model));
  const loftLabels = uniq(data.map((d) => d.loft_label));

  const filtered = data.filter((item) => {
    if (searchText.trim()) {
      const st = (item.search_text ?? "").toLowerCase();
      if (!st.includes(searchText.trim().toLowerCase())) return false;
    }
    if (filterCategory && item.category !== filterCategory) return false;
    if (filterPlayer && item.player !== filterPlayer) return false;
    if (filterBrand && item.brand !== filterBrand) return false;
    if (filterModel && item.model !== filterModel) return false;
    if (filterLoftLabel && item.loft_label !== filterLoftLabel) return false;
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
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={filterPlayer}
          onChange={(e) => setFilterPlayer(e.target.value)}
          style={styles.select}
        >
          <option value="">プロ</option>
          {players.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          style={styles.select}
        >
          <option value="">ブランド</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={filterModel}
          onChange={(e) => setFilterModel(e.target.value)}
          style={styles.select}
        >
          <option value="">モデル</option>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={filterLoftLabel}
          onChange={(e) => setFilterLoftLabel(e.target.value)}
          style={styles.select}
        >
          <option value="">ロフト（wedge用）</option>
          {loftLabels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <p style={styles.resultCount}>
        {filtered.length} 件
      </p>

      <div style={styles.grid}>
        {filtered.map((item, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.cardPlayer}>{item.player ?? "-"}</div>
            <div style={styles.cardBrand}>
              {[item.brand, item.model].filter(Boolean).join(" ")}
            </div>
            {item.spec?.raw && (
              <div style={styles.cardSpec}>{item.spec.raw}</div>
            )}
            {item.shaft?.display && (
              <div style={styles.cardShaft}>{item.shaft.display}</div>
            )}
            {item.source?.link && (
              <a
                href={item.source.link}
                target="_blank"
                rel="noreferrer"
                style={styles.cardLink}
              >
                出典へ →
              </a>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
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
