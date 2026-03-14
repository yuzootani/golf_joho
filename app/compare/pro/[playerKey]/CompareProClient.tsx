"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Bag, Club, ClubType } from "@/lib/witbTypes";
import {
  CLUB_TYPE_ORDER,
  enabledClubs,
  DEFAULT_PRO_TEMPLATE_CLUBS,
  groupClubsByDisplayCategory,
  type DisplayCategory,
} from "@/lib/witbTypes";
import { getProInfo } from "@/lib/pro-map";
import { getBagsFromStorage } from "@/lib/bagsStorage";
import { categoryCountDiffs, loftBandDiffs, shaftWeightBandDiffs } from "@/lib/compare";

const CLUB_TYPE_LABEL: Record<ClubType, string> = {
  D: "D", FW: "FW", UT: "UT", IRON: "IRON", WEDGE: "WEDGE", PUTTER: "PUTTER",
};

const DISPLAY_CAT_LABEL: Record<DisplayCategory, string> = {
  Woods: "Woods",
  UT: "UT",
  Irons: "Irons",
  Wedges: "Wedges",
  Putter: "Putter",
};

function formatClubLine(c: Club): string {
  const parts = [c.clubType, c.label];
  if (c.loftDeg != null) parts.push(`${c.loftDeg}°`);
  if (c.modelName) parts.push(c.modelName);
  return parts.join(" ");
}

function SummaryCards({
  catDiffs,
  loftDiffs,
  shaftDiffs,
}: {
  catDiffs: ReturnType<typeof categoryCountDiffs>;
  loftDiffs: ReturnType<typeof loftBandDiffs>;
  shaftDiffs: ReturnType<typeof shaftWeightBandDiffs>;
}) {
  const countSummary = catDiffs
    .filter((d) => d.diffText !== "同じ")
    .map((d) => `${CLUB_TYPE_LABEL[d.clubType]}:${d.diffText}`)
    .join(" / ") || "同じ";
  const loftSummary = loftDiffs.length === 0
    ? "差なし"
    : loftDiffs.filter((d) => d.diffText !== "同じ").map((d) => `${d.bandLabel}:${d.diffText}`).join(" / ") || "同じ";
  const shaftSummary = shaftDiffs.length === 0
    ? "差なし"
    : shaftDiffs.filter((d) => d.diffText !== "同じ").map((d) => `${d.bandLabel}:${d.diffText}`).join(" / ") || "同じ";

  return (
    <div className="compare-summary-cards">
      <div className="compare-summary-card">
        <h4>構成本数差</h4>
        <p>{countSummary}</p>
      </div>
      <div className="compare-summary-card">
        <h4>ロフト帯分布差</h4>
        <p>{loftSummary}</p>
      </div>
      <div className="compare-summary-card">
        <h4>重量帯の分布差</h4>
        <p>{shaftSummary}</p>
      </div>
    </div>
  );
}

function BagColumn({
  title,
  isTemplate,
  clubs,
}: { title: string; isTemplate?: boolean; clubs: Club[] }) {
  const byCat = groupClubsByDisplayCategory(clubs);
  const order: DisplayCategory[] = ["Woods", "UT", "Irons", "Wedges", "Putter"];

  return (
    <div className="compare-panel">
      <h3>{title}</h3>
      {isTemplate && <p className="compare-template-note">仮の参考テンプレ（構成のみ）</p>}
      {clubs.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>—</p>
      ) : (
        order.map((cat) => {
          const list = byCat[cat];
          if (!list.length) return null;
          return (
            <div key={cat} className="compare-category-block">
              <div className="compare-category-title">{DISPLAY_CAT_LABEL[cat]}</div>
              <ul className="compare-category-list">
                {list.map((c) => (
                  <li key={c.id}>{formatClubLine(c)}</li>
                ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}

type Props = { playerKey: string };

export default function CompareProClient({ playerKey }: Props) {
  const [bags, setBags] = useState<Bag[]>([]);
  const [proBags, setProBags] = useState<Record<string, Bag>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getBagsFromStorage();
    const bagsPromise = stored != null && stored.length > 0
      ? Promise.resolve(stored)
      : fetch("/api/bags").then((r) => r.json()).then((j: { bags?: Bag[] }) => Array.isArray(j?.bags) ? j.bags : []);
    Promise.all([
      bagsPromise,
      fetch("/api/pro-reference").then((r) => r.json()),
    ])
      .then(([bagsList, proRes]) => {
        setBags(bagsList);
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
  const proClubsRaw = proBag?.clubs ? enabledClubs(proBag.clubs) : [];
  const useTemplate = proClubsRaw.length === 0;
  const proClubsForDiff = useTemplate ? DEFAULT_PRO_TEMPLATE_CLUBS : proClubsRaw;

  const catDiffs = categoryCountDiffs(myClubs, proClubsForDiff);
  const loftDiffs = loftBandDiffs(myClubs, proClubsForDiff);
  const shaftDiffs = shaftWeightBandDiffs(myClubs, proClubsForDiff);

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
      <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 16 }}>
        {proInfo.displayName} 参考セットとの傾向比較です。表示は差分・傾向のみです。
      </p>

      <SummaryCards catDiffs={catDiffs} loftDiffs={loftDiffs} shaftDiffs={shaftDiffs} />

      <div className="compare-grid">
        <BagColumn
          title="あなたのバッグ"
          clubs={myClubs}
        />
        <BagColumn
          title={useTemplate ? `プロ参考バッグ（${proInfo.displayName}）` : `プロ参考バッグ: ${proInfo.displayName}`}
          isTemplate={useTemplate}
          clubs={proClubsForDiff}
        />
      </div>

      <section className="compare-highlights">
        <h2>差分ハイライト（傾向）</h2>
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
      </section>
    </main>
  );
}
