/**
 * WITB index を 比較用のクラブリスト・カテゴリ集計に変換
 */

import type { Club, ClubType } from "./bag-types";
import { LOFT_BANDS } from "./bag-types";

export type WitbItem = {
  id?: string;
  player?: { id?: string; name?: string };
  category?: string;
  as_of_ym?: string;
  slot?: string;
  club?: { brand?: string; model?: string };
  spec?: { raw?: string; loft_label?: number; loft_actual?: number };
  shaft?: { raw?: string; display?: string };
  [key: string]: unknown;
};

const WITB_CAT_TO_CLUB_TYPE: Record<string, ClubType> = {
  drivers: "D",
  driver: "D",
  fairway_woods: "FW",
  fairway_wood: "FW",
  utility: "UT",
  irons: "IRON",
  iron: "IRON",
  wedges: "WEDGE",
  wedge: "WEDGE",
  putters: "PUTTER",
  putter: "PUTTER",
};

const COMPARE_CATEGORIES = new Set<string>([
  "drivers",
  "fairway_woods",
  "utility",
  "irons",
  "wedges",
  "putters",
]);

function getLoft(item: WitbItem): number | undefined {
  const s = item?.spec && typeof item.spec === "object" ? item.spec : null;
  if (!s) return undefined;
  if (s.loft_actual != null && typeof s.loft_actual === "number") return s.loft_actual;
  if (s.loft_label != null && typeof s.loft_label === "number") return s.loft_label;
  const raw = String(s?.raw ?? "").trim();
  const deg = raw.match(/(\d+(?:\.\d+)?)\s*°?/);
  if (deg) return parseFloat(deg[1]);
  return undefined;
}

/** シャフト表記から重量帯を推測（分かる範囲のみ）。例: "Ventus Black 6 X" → "60g帯" */
function inferShaftWeightBand(shaftRaw: string): string | undefined {
  const s = String(shaftRaw ?? "").trim();
  if (!s) return undefined;
  // 数字＋単位パターン (6 X, 7 S, 80X, 70g など)
  const m = s.match(/\b(\d{2,3})\s*(?:g|gram|grams)?\b/i) || s.match(/\b(\d)\s*[XSML]\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 40 && n < 55) return "40g帯";
    if (n >= 55 && n < 70) return "50–60g帯";
    if (n >= 70 && n < 85) return "70g帯";
    if (n >= 85 && n < 100) return "80–90g帯";
    if (n >= 100 && n < 120) return "100g帯";
    if (n >= 120) return "120g帯";
  }
  return undefined;
}

export function witbItemToClub(item: WitbItem): Club | null {
  const cat = String(item?.category ?? "").trim().toLowerCase();
  if (!COMPARE_CATEGORIES.has(cat)) return null;
  const clubType = WITB_CAT_TO_CLUB_TYPE[cat];
  if (!clubType) return null;
  const c = item?.club && typeof item.club === "object" ? item.club : null;
  const label = String(item?.slot ?? "").trim() || [c?.brand, c?.model].filter(Boolean).join(" ") || "-";
  const loft = getLoft(item);
  const shaftRaw = item?.shaft && typeof item.shaft === "object" ? (item.shaft.raw ?? item.shaft.display) : undefined;
  const shaftWeightBand = shaftRaw ? inferShaftWeightBand(String(shaftRaw)) : undefined;
  const modelName = c ? [c.brand, c.model].filter(Boolean).join(" ") : undefined;
  return {
    label,
    clubType,
    loft,
    shaftWeightBand,
    modelName,
  };
}

/** プレイヤーの最新1セット（as_of_ym 最新）のクラブのみ。grips/balls 除外 */
export function getLatestProSet(items: WitbItem[], witbPlayerId: string): Club[] {
  const byPlayer = items.filter(
    (i) => String(i?.player?.id ?? "").trim() === witbPlayerId && COMPARE_CATEGORIES.has(String(i?.category ?? "").trim().toLowerCase())
  );
  if (byPlayer.length === 0) return [];
  const yms = Array.from(new Set(byPlayer.map((i) => String(i?.as_of_ym ?? "").trim()).filter(Boolean))).sort((a, b) => (b < a ? -1 : b > a ? 1 : 0));
  const latestYm = yms[0] || "";
  const latest = byPlayer.filter((i) => String(i?.as_of_ym ?? "").trim() === latestYm);
  const clubs: Club[] = [];
  for (const item of latest) {
    const club = witbItemToClub(item);
    if (club) clubs.push(club);
  }
  return clubs;
}

export function getLoftBandKey(loft: number): string {
  const band = LOFT_BANDS.find((b) => loft >= b.min && loft <= b.max);
  return band?.key ?? "";
}
