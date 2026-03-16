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

/** 表示用 clubType ラベル（編集・一覧用） */
export const CLUB_TYPE_DISPLAY_LABEL: Record<ClubType, string> = {
  D: "ドライバー",
  FW: "FW",
  UT: "UT",
  IRON: "アイアン",
  WEDGE: "ウェッジ",
  PUTTER: "パター",
};

/** シャフト重量帯の選択肢（編集用） */
export const SHAFT_WEIGHT_BAND_OPTIONS: { value: string; label: string }[] = [
  { value: "unknown", label: "unknown" },
  { value: "<=59", label: "<=59" },
  { value: "60-69", label: "60-69" },
  { value: "70-79", label: "70-79" },
  { value: "80-89", label: "80-89" },
  { value: "90-99", label: "90-99" },
  { value: "100-109", label: "100-109" },
  { value: "110-124", label: "110-124" },
  { value: "125+", label: "125+" },
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

/** プロの clubs が空のときの仮参考テンプレ（構成のみ。典型的な14本セット） */
export const DEFAULT_PRO_TEMPLATE_CLUBS: Club[] = [
  { id: "t-d", label: "D", clubType: "D", loftDeg: 10.5, shaftWeightBand: "60-69" },
  { id: "t-3w", label: "3W", clubType: "FW", loftDeg: 15, shaftWeightBand: "70-79" },
  { id: "t-5w", label: "5W", clubType: "FW", loftDeg: 18, shaftWeightBand: "70-79" },
  { id: "t-4i", label: "4i", clubType: "IRON", loftDeg: 22, shaftWeightBand: "100-109" },
  { id: "t-5i", label: "5i", clubType: "IRON", loftDeg: 26, shaftWeightBand: "100-109" },
  { id: "t-6i", label: "6i", clubType: "IRON", loftDeg: 30, shaftWeightBand: "100-109" },
  { id: "t-7i", label: "7i", clubType: "IRON", loftDeg: 34, shaftWeightBand: "100-109" },
  { id: "t-8i", label: "8i", clubType: "IRON", loftDeg: 38, shaftWeightBand: "100-109" },
  { id: "t-9i", label: "9i", clubType: "IRON", loftDeg: 42, shaftWeightBand: "100-109" },
  { id: "t-pw", label: "PW", clubType: "IRON", loftDeg: 46, shaftWeightBand: "100-109" },
  { id: "t-50", label: "50°", clubType: "WEDGE", loftDeg: 50, shaftWeightBand: "100-109" },
  { id: "t-54", label: "54°", clubType: "WEDGE", loftDeg: 54, shaftWeightBand: "100-109" },
  { id: "t-58", label: "58°", clubType: "WEDGE", loftDeg: 58, shaftWeightBand: "100-109" },
  { id: "t-pt", label: "PT", clubType: "PUTTER", loftDeg: 3 },
];

/** 表示用カテゴリ（Woods / UT / Irons / Wedges / Putter） */
export type DisplayCategory = "Woods" | "UT" | "Irons" | "Wedges" | "Putter";

const DISPLAY_CATEGORY_ORDER: DisplayCategory[] = ["Woods", "UT", "Irons", "Wedges", "Putter"];

export function clubTypeToDisplayCategory(ct: ClubType): DisplayCategory {
  if (ct === "D" || ct === "FW") return "Woods";
  if (ct === "UT") return "UT";
  if (ct === "IRON") return "Irons";
  if (ct === "WEDGE") return "Wedges";
  return "Putter";
}

export function groupClubsByDisplayCategory(clubs: Club[]): Record<DisplayCategory, Club[]> {
  const r: Record<DisplayCategory, Club[]> = {
    Woods: [],
    UT: [],
    Irons: [],
    Wedges: [],
    Putter: [],
  };
  for (const c of clubs) {
    const cat = clubTypeToDisplayCategory(c.clubType);
    r[cat].push(c);
  }
  for (const cat of DISPLAY_CATEGORY_ORDER) {
    r[cat].sort((a, b) => CLUB_TYPE_ORDER.indexOf(a.clubType) - CLUB_TYPE_ORDER.indexOf(b.clubType) || (a.loftDeg ?? 0) - (b.loftDeg ?? 0));
  }
  return r;
}
