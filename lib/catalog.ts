/**
 * カタログDB：ヘッドモデル・シャフトの正規化と照合ロジック
 */
import ironHeadsCatalog from "@/data/catalog/iron_heads.json";
import shaftsCatalog from "@/data/catalog/shafts.json";
import aliasesData from "@/data/catalog/aliases.json";
import type { IronSetLabel } from "@/lib/witbTypes";

const ironHeadsDb = ironHeadsCatalog as Record<
  string,
  Partial<Record<IronSetLabel, number>>
>;
const shaftsDb = shaftsCatalog as Record<string, number>;
const aliases = aliasesData as Record<string, string>;

/**
 * 入力文字列を正規化する：小文字化・記号をスペースに統一・前後スペース除去・連続スペース圧縮
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\-_\.]+/g, " ")
    .trim();
}

/**
 * headModel 入力 → canonicalKey を返す。一致しない場合は null
 * 照合順: 1) canonicalKey の直接一致 2) alias 経由
 */
export function resolveHeadModelKey(input: string): string | null {
  if (!input.trim()) return null;
  const norm = normalize(input);
  if (ironHeadsDb[norm] != null) return norm;
  const via = aliases[norm];
  if (via && ironHeadsDb[via] != null) return via;
  return null;
}

/**
 * shaftName 入力 → canonicalKey を返す。一致しない場合は null
 */
export function resolveShaftKey(input: string): string | null {
  if (!input.trim()) return null;
  const norm = normalize(input);
  if (shaftsDb[norm] != null) return norm;
  const via = aliases[norm];
  if (via && shaftsDb[via] != null) return via;
  return null;
}

/**
 * canonicalKey → 番手別ロフト表
 */
export function getLoftTable(
  canonicalKey: string
): Partial<Record<IronSetLabel, number>> | null {
  return ironHeadsDb[canonicalKey] ?? null;
}

/**
 * canonicalKey → シャフト代表重量 (g)
 */
export function getShaftWeight(canonicalKey: string): number | null {
  const w = shaftsDb[canonicalKey];
  return w != null ? w : null;
}
