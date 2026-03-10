/**
 * プロ比較用 playerKey → WITB player id マッピング
 * playerKey は rory, hideki, brooks, rose, xander のみ許可
 */

export const ALLOWED_PLAYER_KEYS = [
  "rory",
  "hideki",
  "brooks",
  "rose",
  "xander",
] as const;

export type PlayerKey = (typeof ALLOWED_PLAYER_KEYS)[number];

const PLAYER_MAP: Record<PlayerKey, { witbId: string; displayName: string }> = {
  rory: { witbId: "rory_mcilroy", displayName: "Rory McIlroy" },
  hideki: { witbId: "hideki_matsuyama", displayName: "松山英樹" },
  brooks: { witbId: "brooks_koepka", displayName: "Brooks Koepka" },
  rose: { witbId: "justin_rose", displayName: "Justin Rose" },
  xander: { witbId: "xander_schauffele", displayName: "Xander Schauffele" },
};

export function getProInfo(key: string): { witbId: string; displayName: string } | null {
  if (!ALLOWED_PLAYER_KEYS.includes(key as PlayerKey)) return null;
  return PLAYER_MAP[key as PlayerKey] ?? null;
}

export function isAllowedPlayerKey(key: string): key is PlayerKey {
  return ALLOWED_PLAYER_KEYS.includes(key as PlayerKey);
}
