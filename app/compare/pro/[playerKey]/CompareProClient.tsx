"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Bag, Club, ClubType } from "@/lib/witbTypes";
import { CLUB_TYPE_ORDER, enabledClubs } from "@/lib/witbTypes";
import { getProInfo } from "@/lib/pro-map";
import { categoryCountDiffs, loftBandDiffs, shaftWeightBandDiffs } from "@/lib/compare";

const CLUB_TYPE_LABEL: Record<ClubType, string> = {
  D: "D", FW: "FW", UT: "UT", IRON: "IRON", WEDGE: "WEDGE", PUTTER: "PUTTER",
};

type Props = { playerKey: string };

export default function CompareProClient({ playerKey }: Props) {
  const [bags, setBags] = useState<Bag[]>([]);
  const [proBags, setProBags] = useState<Record<string, Bag>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/bags").then((r) => r.json()),
      fetch("/api/pro-reference").then((r) => r.json()),
    ])
      .then(([bagsRes, proRes]) => {
        const bagsData = bagsRes as { bags?: Bag[] };
        setBags(Array.isArray(bagsData?.bags) ? bagsData.bags : []);
        setProBags(typeof proRes === "object" && proRes !== null ? (proRes as Record<string, Bag>) : {});
      })
      .catch(() => {
        setBags([]);
        setProBags({});
      })
      .finally(() => setLoading(false));
  }, []);

  const proInfo = getProInfo(playerKey)!;
  const activeBag = bags.find((b) => b.isActive) ?? bags[0];
  const myClubs = enabledClubs(activeBag?.clubs ?? []);
  const proBag = proBags[playerKey];
  const proClubs = proBag?.clubs ? enabledClubs(proBag.clubs) : [];

  const catDiffs = categoryCountDiffs(myClubs, proClubs);
  const loftDiffs = loftBandDiffs(myClubs, proClubs);
  const shaftDiffs = shaftWeightBandDiffs(myClubs, proClubs);

  const sortedMy = [...myClubs].sort((a, b) => CLUB_TYPE_ORDER.indexOf(a.clubType) - CLUB_TYPE_ORDER.indexOf(b.clubType));
  const sortedPro = [...proClubs].sort((a, b) => CLUB_TYPE_ORDER.indexOf(a.clubType) - CLUB_TYPE_ORDER.indexOf(b.clubType));

  if (loading) {
    return (
      <main className="compare-page">
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="compare-page">
      <p style={{ marginBottom: 8, fontSize: 14 }}>
        <Link href="/bags">← マイバッグ</Link>
      </p>
      <h1 className="page-title">プロ参考セットとの差分</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 24 }}>
        {proInfo.displayName} 参考セットとの傾向比較です。表示は差分・傾向のみです。
      </p>

      <div className="compare-grid">
        <div className="compare-panel">
          <h3>自分のバッグ{activeBag ? `: ${activeBag.name}` : ""}</h3>
          {sortedMy.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>active なバッグがありません</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14 }}>
              {sortedMy.map((c) => (
                <li key={c.id}>{c.clubType} {c.label} {c.loftDeg != null ? `${c.loftDeg}°` : ""} {c.modelName ?? ""}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="compare-panel">
          <h3>プロ参考: {proInfo.displayName}</h3>
          {sortedPro.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>空です</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14 }}>
              {sortedPro.map((c) => (
                <li key={c.id}>{c.clubType} {c.label} {c.loftDeg != null ? `${c.loftDeg}°` : ""} {c.modelName ?? ""}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <section className="compare-highlights">
        <h2>差分ハイライト（傾向）</h2>
        {proClubs.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>プロ側にクラブを入れると差分が表示されます。</p>
        ) : (
          <>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 16, marginBottom: 8 }}>カテゴリ別本数</h3>
            <ul className="compare-diff-list">
              {catDiffs.map((d) => (
                <li key={d.clubType} className={d.diffText === "同じ" ? "compare-diff-same" : ""}>
                  {CLUB_TYPE_LABEL[d.clubType]}: 自分 {d.mine} 本 / 参考 {d.pro} 本 → {d.diffText}
                </li>
              ))}
            </ul>
            {loftDiffs.length > 0 && (
              <>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 16, marginBottom: 8 }}>ロフト帯の分布</h3>
                <ul className="compare-diff-list">
                  {loftDiffs.map((d) => (
                    <li key={d.bandKey} className={d.diffText === "同じ" ? "compare-diff-same" : ""}>
                      {d.bandLabel}: 自分 {d.mine} / 参考 {d.pro} → {d.diffText}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {shaftDiffs.length > 0 && (
              <>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 16, marginBottom: 8 }}>シャフト重量帯の分布（分かる範囲）</h3>
                <ul className="compare-diff-list">
                  {shaftDiffs.map((d) => (
                    <li key={d.bandLabel} className={d.diffText === "同じ" ? "compare-diff-same" : ""}>
                      {d.bandLabel}: 自分 {d.mine} / 参考 {d.pro} → {d.diffText}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
