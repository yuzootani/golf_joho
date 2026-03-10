/**
 * 自分のバッグ vs プロ参考セット の差分（傾向のみ。診断・推奨はしない）
 */

import type { Club, ClubType } from "./bag-types";
import { CLUB_TYPE_ORDER, LOFT_BANDS } from "./bag-types";
import { getLoftBandKey } from "./witb-to-bag";

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
    if (c.loft != null) {
      const key = getLoftBandKey(c.loft);
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

export function categoryCountDiffs(myClubs: Club[], proClubs: Club[]): CategoryCountDiff[] {
  const mine = countByCategory(myClubs);
  const pro = countByCategory(proClubs);
  return CLUB_TYPE_ORDER.map((clubType) => {
    const m = mine[clubType] ?? 0;
    const p = pro[clubType] ?? 0;
    let diffText: "多め" | "少なめ" | "同じ" = "同じ";
    if (m > p) diffText = "多め";
    else if (m < p) diffText = "少なめ";
    return { clubType, mine: m, pro: p, diffText };
  });
}

export function loftBandDiffs(myClubs: Club[], proClubs: Club[]): LoftBandDiff[] {
  const mine = countByLoftBand(myClubs);
  const pro = countByLoftBand(proClubs);
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

export function shaftWeightBandDiffs(myClubs: Club[], proClubs: Club[]): ShaftWeightDiff[] {
  const mine = countByShaftBand(myClubs);
  const pro = countByShaftBand(proClubs);
  const allBands = new Set([...Object.keys(mine), ...Object.keys(pro)]);
  const result: ShaftWeightDiff[] = [];
  for (const bandLabel of Array.from(allBands)) {
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
