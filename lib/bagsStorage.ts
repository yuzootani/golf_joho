/**
 * マイバッグの localStorage 読み書き
 * key: myBags.v1
 */

import type { Bag } from "./witbTypes";

const STORAGE_KEY = "myBags.v1";

export function getBagsFromStorage(): Bag[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return null;
    const data = JSON.parse(raw) as { bags?: unknown[] };
    const bags = Array.isArray(data?.bags) ? data.bags : [];
    return bags as Bag[];
  } catch {
    return null;
  }
}

/** localStorage（myBags.v1）優先でバッグ一覧を取得。クライアント専用。 */
export function getBags(): Bag[] | null {
  return getBagsFromStorage();
}

export function saveBagsToStorage(bags: Bag[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ bags }));
  } catch (e) {
    console.error("saveBagsToStorage", e);
  }
}

/** バッグ一覧を localStorage に保存。クライアント専用。 */
export function saveBags(bags: Bag[]): void {
  saveBagsToStorage(bags);
}

/** API から初期データ取得（サーバー/クライアント両方で fetch 可能） */
export async function fetchInitialBags(): Promise<Bag[]> {
  const res = await fetch("/api/bags");
  const json = (await res.json()) as { bags?: Bag[] };
  const list = Array.isArray(json?.bags) ? json.bags : [];
  return list as Bag[];
}
