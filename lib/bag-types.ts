/**
 * バッグ・クラブの型定義（MVP: 閲覧・比較用）
 */

export type ClubType =
  | "D"
  | "FW"
  | "UT"
  | "IRON"
  | "WEDGE"
  | "PUTTER";

export type Club = {
  label: string;
  clubType: ClubType;
  loft?: number;
  shaftWeightBand?: string;
  modelName?: string;
};

export type Bag = {
  id: string;
  name: string;
  updatedAt: string; // ISO date
  active: boolean;
  clubs: Club[];
};

/** 比較用カテゴリ順 */
export const CLUB_TYPE_ORDER: ClubType[] = [
  "D",
  "FW",
  "UT",
  "IRON",
  "WEDGE",
  "PUTTER",
];

/** ロフト帯（度）: 比較用 */
export const LOFT_BANDS: { key: string; label: string; min: number; max: number }[] = [
  { key: "10-15", label: "10–15°", min: 10, max: 15 },
  { key: "16-20", label: "16–20°", min: 16, max: 20 },
  { key: "21-25", label: "21–25°", min: 21, max: 25 },
  { key: "26-35", label: "26–35°", min: 26, max: 35 },
  { key: "36-46", label: "36–46°", min: 36, max: 46 },
  { key: "47-52", label: "47–52°", min: 47, max: 52 },
  { key: "53-60", label: "53–60°", min: 53, max: 60 },
];

/** シャフト重量帯（分かる範囲のみ。例: 軽め/ミドル/重め など） */
export type ShaftWeightBandLabel = string;
