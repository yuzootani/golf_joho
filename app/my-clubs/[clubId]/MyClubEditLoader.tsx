"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { MyClub } from "@/lib/witbTypes";
import { getMyClubsFromStorage } from "@/lib/myClubsStorage";
import MyClubFormClient from "../MyClubFormClient";

export default function MyClubEditLoader() {
  const params = useParams();
  const clubId = typeof params.clubId === "string" ? params.clubId : "";
  const [club, setClub] = useState<MyClub | null | undefined>(undefined);

  useEffect(() => {
    const list = getMyClubsFromStorage();
    const found = list.find((c) => c.myClubId === clubId) ?? null;
    setClub(found);
  }, [clubId]);

  if (club === undefined) {
    return (
      <main className="my-clubs-form-page">
        <p>読み込み中...</p>
      </main>
    );
  }
  if (club === null) {
    return (
      <main className="my-clubs-form-page">
        <p>クラブが見つかりません（ID: {clubId}）</p>
        <p>
          <a href="/my-clubs">← クラブ庫一覧へ</a>
        </p>
      </main>
    );
  }

  return <MyClubFormClient initial={club} />;
}
