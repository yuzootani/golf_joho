"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type WITBDoc = {
  id?: string;
  player?: { id?: string; name?: string };
  category?: string;
  as_of_ym?: string;
  club?: { brand?: string; model?: string };
  spec?: { raw?: string };
  shaft?: { raw?: string; display?: string };
  source?: { name?: string; url?: string };
  notes?: string;
  search_text?: string;
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

function getGripDisplay(d: WITBDoc): string {
  const brand = getBrand(d);
  const model = getModel(d);
  if (brand) return [brand, model].filter(Boolean).join(" ");
  return model || "-";
}

function getNotes(d: WITBDoc): string {
  return safeStr(d?.notes);
}

function getSourceName(d: WITBDoc): string {
  const s = d?.source;
  if (!s || typeof s !== "object") return "";
  return safeStr(s?.name) || "";
}

function getSourceUrl(d: WITBDoc): string {
  const s = d?.source;
  if (!s || typeof s !== "object") return "";
  return safeStr(s?.url) || "";
}

function buildSearchTarget(d: WITBDoc): string {
  const st = safeStr(d?.search_text);
  if (st) return st;
  const parts: string[] = [
    getPlayerName(d),
    getBrand(d),
    getModel(d),
    getNotes(d),
  ];
  return parts.filter(Boolean).join(" ");
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter((x): x is string => x.length > 0))).sort();
}

type SortKeyType = "date" | "player" | "brand" | "model";

export default function WitbGripsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<WITBDoc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) setQ(qParam);
  }, [searchParams]);

  const [filterPlayer, setFilterPlayer] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [sortKey, setSortKey] = useState<SortKeyType>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/witb_index.json")
      .then((res) => res.json())
      .then((json: unknown) => {
        setData(Array.isArray(json) ? json : []);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const grips = useMemo(() => {
    const docs = data ?? [];
    return docs.filter((d: WITBDoc) => safeStr(d?.category) === "grips");
  }, [data]);

  const players = useMemo(() => uniq(grips.map(getPlayerName)), [grips]);
  const brands = useMemo(() => uniq(grips.map(getBrand)), [grips]);

  const filtered = useMemo(() => {
    let list = [...grips];
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      list = list.filter((d: WITBDoc) =>
        buildSearchTarget(d).toLowerCase().includes(lower)
      );
    }
    if (filterPlayer) list = list.filter((d: WITBDoc) => getPlayerName(d) === filterPlayer);
    if (filterBrand) list = list.filter((d: WITBDoc) => getBrand(d) === filterBrand);

    list.sort((a: WITBDoc, b: WITBDoc) => {
      let cmp: number;
      switch (sortKey) {
        case "player":
          cmp = getPlayerName(a).localeCompare(getPlayerName(b));
          break;
        case "brand":
          cmp = getBrand(a).localeCompare(getBrand(b));
          break;
        case "model":
          cmp = getModel(a).localeCompare(getModel(b));
          break;
        default:
          cmp = safeStr(a?.as_of_ym ?? "").localeCompare(safeStr(b?.as_of_ym ?? ""));
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [grips, q, filterPlayer, filterBrand, sortKey, sortDir]);

  const handleSort = (key: SortKeyType) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const ThSort = (key: SortKeyType, label: string) => (
    <th style={styles.th}>
      <button type="button" onClick={() => handleSort(key)} style={styles.thBtn}>
        {label} {sortKey === key ? (sortDir === "desc" ? "↓" : "↑") : ""}
      </button>
    </th>
  );

  const reset = () => {
    setQ("");
    setFilterPlayer("");
    setFilterBrand("");
    setSortKey("date");
    setSortDir("desc");
  };

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
      <h1 style={styles.title}>WITB Grips</h1>
      <p style={styles.sub}>
        <Link href="/witb/players" style={styles.link}>選手一覧</Link>
        {" / "}
        <Link href="/witb/search" style={styles.link}>横断検索</Link>
      </p>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="フリーワード検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={styles.input}
        />
        <select value={filterPlayer} onChange={(e) => setFilterPlayer(e.target.value)} style={styles.select}>
          <option value="">Player</option>
          {players.map((p: string) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} style={styles.select}>
          <option value="">Brand</option>
          {brands.map((b: string) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <button type="button" onClick={reset} style={styles.resetBtn}>リセット</button>
      </div>

      <p style={styles.count}>Grips: {filtered.length} items</p>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {ThSort("date", "Date")}
              {ThSort("player", "Player")}
              {ThSort("brand", "Grip")}
              <th style={styles.th}>Notes</th>
              <th style={styles.th}>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d: WITBDoc, i: number) => {
              const pid = getPlayerId(d);
              const pname = getPlayerName(d);
              const gripDisplay = getGripDisplay(d);
              const notes = getNotes(d);
              const sourceName = getSourceName(d);
              const sourceUrl = getSourceUrl(d);

              return (
                <tr key={String(d?.id) ?? `row-${i}`}>
                  <td style={styles.td}>{safeStr(d?.as_of_ym) || "-"}</td>
                  <td style={styles.td}>
                    {pid ? (
                      <Link href={`/witb/player/${encodeURIComponent(pid)}`} style={styles.cellLink}>
                        {pname || "-"}
                      </Link>
                    ) : (
                      pname || "-"
                    )}
                  </td>
                  <td style={styles.td}>{gripDisplay}</td>
                  <td style={styles.td}>{notes || ""}</td>
                  <td style={styles.td}>
                    {sourceUrl ? (
                      <a href={sourceUrl} target="_blank" rel="noreferrer" style={styles.cellLink}>
                        {sourceName || "出典"}
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

      {filtered.length === 0 && (
        <p style={styles.empty}>該当するデータがありません</p>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 1100,
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
    marginBottom: 20,
  },
  link: {
    color: "#0369a1",
    textDecoration: "none",
    fontWeight: 600,
  },
  filters: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  input: {
    padding: "8px 12px",
    fontSize: 14,
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 8,
    minWidth: 180,
  },
  select: {
    padding: "8px 12px",
    fontSize: 14,
    border: "1px solid rgba(0,0,0,0.2)",
    borderRadius: 8,
  },
  resetBtn: {
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
    border: "1px solid rgba(0,0,0,0.3)",
    borderRadius: 8,
    background: "#f5f5f5",
  },
  count: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 12,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 600,
  },
  th: {
    padding: "10px 12px",
    textAlign: "left",
    borderBottom: "2px solid rgba(0,0,0,0.2)",
    background: "#f8f8f8",
    fontSize: 14,
    fontWeight: 700,
  },
  thBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    fontSize: "inherit",
    fontWeight: "inherit",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
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
