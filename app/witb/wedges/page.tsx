"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

type WedgeSetRow = {
  setKey: string;
  date: string;
  playerId: string;
  playerName: string;
  head: string;
  lofts: string;
  shaft: string;
  sourceName: string;
  sourceUrl: string;
  searchText: string;
  loftsList: number[];
  brands: string[];
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

function getShaftDisplay(d: WITBDoc): string {
  const s = d?.shaft;
  if (!s || typeof s !== "object") return "";
  return safeStr(s?.display) || safeStr(s?.raw) || "";
}

function getLoftFromSlot(d: WITBDoc): number | null {
  const slot = safeStr(d?.slot);
  if (!slot) return null;
  const n = parseFloat(slot);
  return Number.isNaN(n) ? null : n;
}

function getLoftFromSpec(d: WITBDoc): number | null {
  const s = d?.spec;
  if (s && typeof s === "object" && s.loft_label != null) return Number(s.loft_label);
  const raw = s && typeof s === "object" ? safeStr(s?.raw) : "";
  if (!raw) return null;
  const m = raw.match(/^(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isNaN(n) ? null : n;
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

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr.filter((x): x is string => x.length > 0))).sort();
}

function formatShaftSummary(clubs: WITBDoc[]): string {
  const byShaft = new Map<string, number[]>();
  for (const d of clubs) {
    const shaft = getShaftDisplay(d) || "-";
    const loft = getLoftFromSlot(d) ?? getLoftFromSpec(d);
    if (loft != null) {
      const list = byShaft.get(shaft) ?? [];
      list.push(loft);
      byShaft.set(shaft, list);
    }
  }
  if (byShaft.size === 0) return "-";
  const allSame = byShaft.size === 1 && clubs.every((d) => getShaftDisplay(d) === getShaftDisplay(clubs[0]));
  if (byShaft.size === 1) {
    const shaft = Array.from(byShaft.keys())[0] ?? "";
    return shaft || "-";
  }
  const parts: string[] = [];
  for (const [shaft, lofts] of Array.from(byShaft.entries())) {
    const sorted = [...new Set(lofts)].sort((a, b) => a - b);
    const s = sorted.length === 1 ? String(sorted[0]) : `${sorted[0]}-${sorted[sorted.length - 1]}`;
    parts.push(shaft ? `${shaft}(${s})` : `(${s})`);
  }
  return parts.join(", ") || "-";
}

function buildSetRows(wedges: WITBDoc[]): WedgeSetRow[] {
  const bySet = new Map<string, WITBDoc[]>();
  for (const d of wedges) {
    const pid = getPlayerId(d);
    const ym = safeStr(d?.as_of_ym);
    const key = `${pid}|${ym}`;
    const list = bySet.get(key) ?? [];
    list.push(d);
    bySet.set(key, list);
  }

  const rows: WedgeSetRow[] = [];
  for (const [setKey, clubs] of Array.from(bySet.entries())) {
    const first = clubs[0];
    if (!first) continue;
    const pid = getPlayerId(first);
    const pname = getPlayerName(first);
    const date = safeStr(first?.as_of_ym) || "-";
    const sourceName = getSourceName(first);
    const sourceUrl = getSourceUrl(first);

    const headSet = new Set<string>();
    const loftNums: number[] = [];
    const brandSet = new Set<string>();
    for (const d of clubs) {
      const b = getBrand(d);
      const m = getModel(d);
      const hm = [b, m].filter(Boolean).join(" ");
      if (hm) headSet.add(hm);
      if (b) brandSet.add(b);
      const loft = getLoftFromSlot(d) ?? getLoftFromSpec(d);
      if (loft != null) loftNums.push(loft);
    }
    const head = Array.from(headSet).sort().join(" / ") || "-";
    const loftsSorted = [...new Set(loftNums)].sort((a, b) => a - b);
    const lofts = loftsSorted.join(" / ") || "-";
    const shaft = formatShaftSummary(clubs);
    const searchText = [pname, head, lofts, shaft, sourceName].filter(Boolean).join(" ");
    rows.push({
      setKey,
      date,
      playerId: pid,
      playerName: pname,
      head,
      lofts,
      shaft,
      sourceName,
      sourceUrl,
      searchText,
      loftsList: loftsSorted,
      brands: Array.from(brandSet),
    });
  }
  return rows;
}

export default function WitbWedgesPage() {
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
  const [filterLoft, setFilterLoft] = useState("");

  type SortKeyType = "date" | "player" | "head" | "shaft";
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

  const wedges = useMemo(() => {
    const docs = data ?? [];
    return docs.filter((d: WITBDoc) => safeStr(d?.category) === "wedges");
  }, [data]);

  const setRows = useMemo(() => buildSetRows(wedges), [wedges]);

  const players = useMemo(() => uniq(setRows.map((r: WedgeSetRow) => r.playerName)), [setRows]);
  const brands = useMemo(() => uniq(setRows.flatMap((r: WedgeSetRow) => r.brands)), [setRows]);
  const lofts = useMemo(() => {
    const nums = new Set<number>();
    setRows.forEach((r: WedgeSetRow) => r.loftsList.forEach((n: number) => nums.add(n)));
    return Array.from(nums).sort((a, b) => a - b).map(String);
  }, [setRows]);

  const filtered = useMemo(() => {
    let list = [...setRows];
    if (q.trim()) {
      const lower = q.trim().toLowerCase();
      list = list.filter((r: WedgeSetRow) =>
        r.searchText.toLowerCase().includes(lower)
      );
    }
    if (filterPlayer) list = list.filter((r: WedgeSetRow) => r.playerName === filterPlayer);
    if (filterBrand) list = list.filter((r: WedgeSetRow) => r.brands.includes(filterBrand));
    if (filterLoft) {
      const loftNum = parseFloat(filterLoft);
      list = list.filter((r: WedgeSetRow) => r.loftsList.includes(loftNum));
    }

    list.sort((a: WedgeSetRow, b: WedgeSetRow) => {
      let cmp: number;
      switch (sortKey) {
        case "player":
          cmp = a.playerName.localeCompare(b.playerName);
          break;
        case "head":
          cmp = a.head.localeCompare(b.head);
          break;
        case "shaft":
          cmp = a.shaft.localeCompare(b.shaft);
          break;
        default:
          cmp = a.date.localeCompare(b.date);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return list;
  }, [setRows, q, filterPlayer, filterBrand, filterLoft, sortKey, sortDir]);

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
    setFilterLoft("");
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
      <h1 style={styles.title}>WITB Wedges</h1>
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
        <select value={filterLoft} onChange={(e) => setFilterLoft(e.target.value)} style={styles.select}>
          <option value="">Loft</option>
          {lofts.map((l: string) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <button type="button" onClick={reset} style={styles.resetBtn}>リセット</button>
      </div>

      <p style={styles.count}>Wedges: {filtered.length} sets</p>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {ThSort("date", "Date")}
              {ThSort("player", "Player")}
              {ThSort("head", "Head")}
              <th style={styles.th}>Lofts</th>
              {ThSort("shaft", "Shaft")}
              <th style={styles.th}>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: WedgeSetRow, i: number) => (
              <tr key={r.setKey}>
                <td style={styles.td}>{r.date}</td>
                <td style={styles.td}>
                  {r.playerId ? (
                    <Link href={`/witb/player/${encodeURIComponent(r.playerId)}`} style={styles.cellLink}>
                      {r.playerName || "-"}
                    </Link>
                  ) : (
                    r.playerName || "-"
                  )}
                </td>
                <td style={styles.td}>{r.head}</td>
                <td style={styles.td}>{r.lofts}</td>
                <td style={styles.td}>{r.shaft}</td>
                <td style={styles.td}>
                  {r.sourceUrl ? (
                    <a href={r.sourceUrl} target="_blank" rel="noreferrer" style={styles.cellLink}>
                      {r.sourceName || "出典"}
                    </a>
                  ) : (
                    r.sourceName || "-"
                  )}
                </td>
              </tr>
            ))}
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
