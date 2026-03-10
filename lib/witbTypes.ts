/**
 * バッグ・クラブの型定義（data/*.json スキーマ）
 */

export type ClubType =
  | "D"
  | "FW"
  | "UT"
  | "IRON"
  | "WEDGE"
  | "PUTTER";

export type Club = {
  id: string;
  label: string;
  clubType: ClubType;
  loftDeg?: number;
  shaftWeightBand?: string;
  modelName?: string;
  isEnabled?: boolean;
};

export type Bag = {
  bagId: string;
  name: string;
  updatedAt: string;
  isActive: boolean;
  clubs: Club[];
};

/** 比較用カテゴリ順 */
export const CLUB_TYPE_ORDER: ClubType[] = [
  "D", "FW", "UT", "IRON", "WEDGE", "PUTTER",
];

/** ロフト帯（度） */
export const LOFT_BANDS: { key: string; label: string; min: number; max: number }[] = [
  { key: "10-15", label: "10–15°", min: 10, max: 15 },
  { key: "16-20", label: "16–20°", min: 16, max: 20 },
  { key: "21-25", label: "21–25°", min: 21, max: 25 },
  { key: "26-35", label: "26–35°", min: 26, max: 35 },
  { key: "36-46", label: "36–46°", min: 36, max: 46 },
  { key: "47-52", label: "47–52°", min: 47, max: 52 },
  { key: "53-60", label: "53–60°", min: 53, max: 60 },
];

/** isEnabled !== false のクラブだけ返す */
export function enabledClubs(clubs: Club[]): Club[] {
  return (clubs ?? []).filter((c) => c.isEnabled !== false);
}
