"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type GearEntry = {
  gear_type?: string;
  brand?: string;
  model?: string;
  display_name?: string;
  official_url?: string;
  spec_url?: string;
  release_year?: string;
  notes?: string;
  applicable_to?: string;
};

type StockSummaryItem = {
  gear_id: string;
  updated_at?: string;
  jp_count?: number;
  global_count?: number;
  price_min_jpy?: number;
  price_max_jpy?: number;
  sources?: string[];
};

const TYPE_LABEL: Record<string, string> = {
  driver: "Driver",
  fairway_wood: "Fairway Wood",
  utility: "Utility",
  iron: "Iron",
  wedge: "Wedge",
  putter: "Putter",
  shaft: "Shaft",
  grip: "Grip",
};

function formatUpdatedAt(iso?: string): string {
  if (!iso || !iso.trim()) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function ClubsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<GearEntry[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, StockSummaryItem>>({});
  const [loading, setLoading] = useState(true);

  const typeParam = searchParams.get("type");

  useEffect(() => {
    Promise.all([
      fetch("/gear_master.json").then((res) => (res.ok ? res.json() : [])),
      fetch("/stock_summary.json").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([gearJson, stockJson]) => {
        setData(Array.isArray(gearJson) ? gearJson : []);
        const list = Array.isArray(stockJson) ? (stockJson as StockSummaryItem[]) : [];
        const map: Record<string, StockSummaryItem> = {};
        list.forEach((s) => {
          if (s.gear_id) map[s.gear_id] = s;
        });
        setStockMap(map);
      })
      .catch(() => {
        setData([]);
        setStockMap({});
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = typeParam
    ? data.filter((e) => String(e?.gear_type ?? "").toLowerCase() === typeParam.toLowerCase())
    : data;

  return (
    <main>
      <h1 className="page-title">名器図鑑一覧</h1>
      {typeParam && (
        <p style={{ marginTop: -8, marginBottom: 16 }}>
          カテゴリ: {TYPE_LABEL[typeParam] ?? typeParam}
          {" "}
          <Link href="/clubs" style={{ fontSize: 14 }}>全件表示</Link>
        </p>
      )}

      {loading && <p>読み込み中...</p>}
      {!loading && filtered.length === 0 && <p>該当する名器がありません。</p>}
      {!loading && filtered.length > 0 && (
        <div className="club-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((e, i) => {
            const gearId = (e.display_name ?? "").trim() || `gear-${i}`;
            const label = [e.brand, e.model].filter(Boolean).join(" ") || gearId;
            const typeLabel = e.gear_type ? (TYPE_LABEL[e.gear_type] ?? e.gear_type) : "";
            const stock = stockMap[gearId];
            const href = `/${encodeURIComponent(gearId)}`;

            return (
              <Link
                key={gearId}
                href={href}
                style={{
                  display: "block",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: 16,
                  background: "var(--color-surface)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>
                {typeLabel && (
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>
                    {typeLabel}
                  </div>
                )}
                <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  在庫サマリー: 国内 {stock?.jp_count ?? "—"} / 海外 {stock?.global_count ?? "—"}
                  {stock?.price_min_jpy != null || stock?.price_max_jpy != null ? (
                    <> · 約{stock?.price_min_jpy ?? "—"}〜{stock?.price_max_jpy ?? "—"}円</>
                  ) : null}
                  <br />
                  最終更新: {stock?.updated_at ? formatUpdatedAt(stock.updated_at) : "—"}
                </div>
                {e.official_url && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: "var(--color-accent)" }}>公式 →</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
