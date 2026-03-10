"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type StockSummaryItem = {
  gear_id: string;
  updated_at?: string;
  jp_count?: number;
  global_count?: number;
  price_min_jpy?: number;
  price_max_jpy?: number;
  sources?: string[];
};

type GearEntry = {
  gear_type?: string;
  brand?: string;
  model?: string;
  display_name?: string;
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

export default function HomePage() {
  const [digest, setDigest] = useState<StockSummaryItem[]>([]);
  const [gearMap, setGearMap] = useState<Record<string, GearEntry>>({});
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/stock_summary.json").then((res) => (res.ok ? res.json() : [])),
      fetch("/gear_master.json").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([stockJson, gearJson]) => {
        const list = Array.isArray(stockJson) ? (stockJson as StockSummaryItem[]) : [];
        const sorted = [...list].sort((a, b) =>
          (b.updated_at || "").localeCompare(a.updated_at || "")
        );
        setDigest(sorted.slice(0, 10));

        const arr = Array.isArray(gearJson) ? gearJson : [];
        const map: Record<string, GearEntry> = {};
        const typesSeen = new Set<string>();
        arr.forEach((e: GearEntry) => {
          const id = (e.display_name ?? "").trim();
          if (id) map[id] = e;
          const t = (e.gear_type ?? "").trim().toLowerCase();
          if (t) typesSeen.add(t);
        });
        setGearMap(map);
        setCategories(Array.from(typesSeen).sort());
      })
      .catch(() => {
        setDigest([]);
        setGearMap({});
        setCategories([]);
      });
  }, []);

  return (
    <main>
      <h1 className="page-title">Golf 名器図鑑</h1>

      <section style={{ marginTop: 24 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>カテゴリ</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 12 }}>
          {categories.map((type) => (
            <li key={type}>
              <Link
                href={`/clubs?type=${encodeURIComponent(type)}`}
                style={{
                  display: "inline-block",
                  padding: "10px 16px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius)",
                  background: "var(--color-surface)",
                  fontWeight: 600,
                }}
              >
                {TYPE_LABEL[type] ?? type}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 className="section-title">更新ダイジェスト</h2>
        {digest.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>在庫データを読み込み中です。</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {digest.map((item) => {
              const gear = gearMap[item.gear_id];
              const name = gear ? [gear.brand, gear.model].filter(Boolean).join(" ") : item.gear_id;
              const href = `/${encodeURIComponent(item.gear_id)}`;
              return (
                <li
                  key={item.gear_id}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    padding: "12px 0",
                  }}
                >
                  <Link href={href} style={{ fontWeight: 600 }}>
                    {name}
                  </Link>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
                    国内 {item.jp_count ?? "—"} 件 / 海外 {item.global_count ?? "—"} 件
                    {(item.price_min_jpy != null || item.price_max_jpy != null) &&
                      ` · 約${item.price_min_jpy ?? "—"}〜${item.price_max_jpy ?? "—"}円`}
                    {" · "}
                    最終更新: {formatUpdatedAt(item.updated_at)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
