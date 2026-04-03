/**
 * マイクラブ（クラブ庫）の localStorage 読み書き
 * key: myClubs.v1
 */

import type { MyClub } from "./witbTypes";

const STORAGE_KEY = "myClubs.v1";

export function getMyClubsFromStorage(): MyClub[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return [];
    const data = JSON.parse(raw) as { clubs?: unknown[] };
    return Array.isArray(data?.clubs) ? (data.clubs as MyClub[]) : [];
  } catch {
    return [];
  }
}

export function saveMyClubsToStorage(clubs: MyClub[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ clubs }));
  } catch (e) {
    console.error("saveMyClubsToStorage", e);
  }
}

export function addMyClub(club: MyClub): void {
  const current = getMyClubsFromStorage();
  saveMyClubsToStorage([...current, club]);
}

export function deleteMyClub(myClubId: string): void {
  const current = getMyClubsFromStorage();
  saveMyClubsToStorage(current.filter((c) => c.myClubId !== myClubId));
}

export function updateMyClub(updated: MyClub): void {
  const current = getMyClubsFromStorage();
  const withTimestamp: MyClub = { ...updated, updatedAt: new Date().toISOString() };
  saveMyClubsToStorage(current.map((c) => (c.myClubId === withTimestamp.myClubId ? withTimestamp : c)));
}
