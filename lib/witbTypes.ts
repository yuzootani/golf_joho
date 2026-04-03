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

/** プロ参考用：情報の確度 */
export type Confidence = "high" | "med" | "low";

/** グリップサイズ（編集・表示用） */
export type GripSize = "Std" | "Midsize" | "Oversize";

/** MyClub参照時の上書きフィールド */
export type ClubOverrides = {
  loftDeg?: number;
  shaftName?: string;
  shaftFlex?: string;
  shaftWeightG?: number;
  gripName?: string;
  gripSize?: GripSize;
  gripWraps?: number;
  modelName?: string;
};

export type Club = {
  id: string;
  label: string;
  clubType: ClubType;
  loftDeg?: number;
  shaftWeightBand?: string;
  /** シャフト名（モデル等） */
  shaftName?: string;
  /** フレックス（R/S/X/TX など任意） */
  shaftFlex?: string;
  /** シャフト重量（g）。入っている場合は shaftWeightBand より表示優先 */
  shaftWeightG?: number;
  modelName?: string;
  /** クラブ庫への参照ID */
  myClubId?: string;
  /** myClubId参照時の上書き値（設定されたフィールドのみMyClubを上書き） */
  overrides?: ClubOverrides;
  /** グリップ名 */
  gripName?: string;
  gripSize?: GripSize;
  /** ラップ数 */
  gripWraps?: number;
  isEnabled?: boolean;
  /** プロ参考用：確度（high/med/low）。表示例 [H][M][L] */
  confidence?: Confidence;
};

export type Bag = {
  bagId: string;
  name: string;
  updatedAt: string;
  isActive: boolean;
  clubs: Club[];
  /** アイアンセット（テンプレ） */
  ironSet?: IronSet;
  /** 用途（例：競技/狭いコース/風/テスト） */
  purpose?: string;
  /** コース（例：○○CC） */
  course?: string;
  /** ミス傾向（例：左/右/ダフリなど自由記述） */
  missTendency?: string;
  /** スコアメモ（例：79、80台前半） */
  scoreMemo?: string;
  /** 自由メモ */
  notes?: string;
  /** プロ参考用：出典URL（比較ページで出典リンクとして表示） */
  sourceUrl?: string;
  /** 保存直前のスナップショット（変更履歴用）。clubs とメモ欄のみ */
  previousSnapshot?: BagSnapshot;
};

/** 変更履歴用スナップショット（clubs + メモ欄） */
export type BagSnapshot = {
  clubs: Club[];
  purpose?: string;
  course?: string;
  missTendency?: string;
  scoreMemo?: string;
  notes?: string;
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

/** グリップサイズ（編集用） */
export const GRIP_SIZE_OPTIONS: { value: "" | GripSize; label: string }[] = [
  { value: "", label: "未指定" },
  { value: "Std", label: "Std" },
  { value: "Midsize", label: "Midsize" },
  { value: "Oversize", label: "Oversize" },
];

/** 一覧用: シャフト重量は shaftWeightG を優先、なければ shaftWeightBand */
export function displayShaftWeightSummary(c: Club): string {
  const g = c.shaftWeightG;
  if (g != null && !Number.isNaN(g)) return `${g}g`;
  const band = (c.shaftWeightBand ?? "").trim();
  if (band && band !== "unknown") return band;
  return "—";
}

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

/** アイアンセット用のラベル（反映対象） */
export const IRON_SET_LABELS = ["3i", "4i", "5i", "6i", "7i", "8i", "9i", "PW"] as const;
export type IronSetLabel = (typeof IRON_SET_LABELS)[number];

/** マイクラブ（クラブ庫に登録した所有クラブ） */
export type MyClub = {
  /** ユニークID */
  myClubId: string;
  /** ヘッド名（モデル名）*/
  headName: string;
  /** 任意ラベル（例「普段のドライバー」） */
  label?: string;
  /** クラブカテゴリ */
  clubType?: ClubType;
  /** ロフト角（任意） */
  loftDeg?: number;
  /** シャフト名 */
  shaftName?: string;
  /** シャフトフレックス */
  shaftFlex?: string;
  /** シャフト重量（g） */
  shaftWeightG?: number;
  /** グリップ名 */
  gripName?: string;
  /** グリップサイズ */
  gripSize?: GripSize;
  /** グリップラップ数 */
  gripWraps?: number;
  /** 自由メモ */
  memo?: string;
  /** 登録日時 (ISO) */
  createdAt: string;
  /** 更新日時 (ISO) */
  updatedAt?: string;
};

/** アイアンセット（テンプレ） */
export type IronSet = {
  /** ヘッドモデル名（DBキー） */
  headModel?: string;
  /** シャフト名 */
  shaftName?: string;
  /** シャフトフレックス */
  shaftFlex?: string;
  /** シャフト重量（g） */
  shaftWeightG?: number;
  /** グリップ名 */
  gripName?: string;
  /** グリップサイズ */
  gripSize?: GripSize;
  /** グリップラップ数 */
  gripWraps?: number;
  /** 反映開始番手 */
  includedStart?: IronSetLabel;
  /** 反映終了番手 */
  includedEnd?: IronSetLabel;
};

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
