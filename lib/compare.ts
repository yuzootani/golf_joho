/**
 * 差分計算：本数、ロフト帯、重量帯、ハイライト文言生成
 * 診断・推奨はしない。差分・傾向のみ。
 */

import type { Club, ClubType } from "./witbTypes";
import { CLUB_TYPE_ORDER, LOFT_BANDS } from "./witbTypes";
import { enabledClubs } from "./witbTypes";

function getLoftBandKey(loftDeg: number): string {
  const band = LOFT_BANDS.find((b) => loftDeg >= b.min && loftDeg <= b.max);
  return band?.key ?? "";
}

export type CategoryCountDiff = {
  clubType: ClubType;
  mine: number;
  pro: number;
  diffText: "多め" | "少なめ" | "同じ";
};

export type LoftBandDiff = {
  bandKey: string;
  bandLabel: string;
  mine: number;
  pro: number;
  diffText: "厚め" | "薄め" | "同じ" | "異なります";
};

export type ShaftWeightDiff = {
  bandLabel: string;
  mine: number;
  pro: number;
  diffText: "多め" | "少なめ" | "同じ" | "異なります";
};

function countByCategory(clubs: Club[]): Record<ClubType, number> {
  const r: Record<string, number> = {};
  for (const t of CLUB_TYPE_ORDER) r[t] = 0;
  for (const c of clubs) {
    if (CLUB_TYPE_ORDER.includes(c.clubType)) r[c.clubType] = (r[c.clubType] ?? 0) + 1;
  }
  return r as Record<ClubType, number>;
}

function countByLoftBand(clubs: Club[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const b of LOFT_BANDS) r[b.key] = 0;
  for (const c of clubs) {
    const deg = c.loftDeg;
    if (deg != null) {
      const key = getLoftBandKey(deg);
      if (key) r[key] = (r[key] ?? 0) + 1;
    }
  }
  return r;
}

function countByShaftBand(clubs: Club[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (const c of clubs) {
    const band = (c.shaftWeightBand ?? "").trim();
    if (!band) continue;
    r[band] = (r[band] ?? 0) + 1;
  }
  return r;
}

/** カテゴリ別本数差分とハイライト文言 */
export function categoryCountDiffs(myClubs: Club[], proClubs: Club[]): CategoryCountDiff[] {
  const mine = countByCategory(enabledClubs(myClubs));
  const pro = countByCategory(enabledClubs(proClubs));
  return CLUB_TYPE_ORDER.map((clubType) => {
    const m = mine[clubType] ?? 0;
    const p = pro[clubType] ?? 0;
    let diffText: "多め" | "少なめ" | "同じ" = "同じ";
    if (m > p) diffText = "多め";
    else if (m < p) diffText = "少なめ";
    return { clubType, mine: m, pro: p, diffText };
  });
}

/** ロフト帯の分布差分 */
export function loftBandDiffs(myClubs: Club[], proClubs: Club[]): LoftBandDiff[] {
  const mine = countByLoftBand(enabledClubs(myClubs));
  const pro = countByLoftBand(enabledClubs(proClubs));
  return LOFT_BANDS.map((b) => {
    const m = mine[b.key] ?? 0;
    const p = pro[b.key] ?? 0;
    let diffText: "厚め" | "薄め" | "同じ" | "異なります" = "同じ";
    if (m !== p) {
      if (m > p) diffText = "厚め";
      else diffText = "薄め";
    }
    return { bandKey: b.key, bandLabel: b.label, mine: m, pro: p, diffText };
  }).filter((d) => d.mine > 0 || d.pro > 0);
}

/** シャフト重量帯の分布差分（分かる範囲のみ） */
export function shaftWeightBandDiffs(myClubs: Club[], proClubs: Club[]): ShaftWeightDiff[] {
  const mine = countByShaftBand(enabledClubs(myClubs));
  const pro = countByShaftBand(enabledClubs(proClubs));
  const allBands = Array.from(new Set([...Object.keys(mine), ...Object.keys(pro)]));
  const result: ShaftWeightDiff[] = [];
  for (const bandLabel of allBands) {
    const m = mine[bandLabel] ?? 0;
    const p = pro[bandLabel] ?? 0;
    let diffText: "多め" | "少なめ" | "同じ" | "異なります" = "同じ";
    if (m !== p) {
      if (m > p) diffText = "多め";
      else diffText = "少なめ";
    }
    result.push({ bandLabel, mine: m, pro: p, diffText });
  }
  return result.filter((d) => d.mine > 0 || d.pro > 0);
}
