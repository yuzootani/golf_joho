"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Bag, Club } from "@/lib/witbTypes";
import { CLUB_TYPE_ORDER, enabledClubs } from "@/lib/witbTypes";

const CLUB_TYPE_LABEL: Record<string, string> = {
  D: "ドライバー",
  FW: "フェアウェイ",
  UT: "ユーティリティ",
  IRON: "アイアン",
  WEDGE: "ウェッジ",
  PUTTER: "パター",
};

export default function BagDetailPage() {
  const params = useParams();
  const bagId = typeof params?.bagId === "string" ? params.bagId : "";
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bags")
      .then((res) => res.json())
      .then((json: { bags?: Bag[] }) => setBags(Array.isArray(json?.bags) ? json.bags : []))
      .catch(() => setBags([]))
      .finally(() => setLoading(false));
  }, []);

  const bag = bags.find((b) => b.bagId === bagId);
  const clubs = enabledClubs(bag?.clubs ?? []);
  const sorted = [...clubs].sort((a, b) => CLUB_TYPE_ORDER.indexOf(a.clubType) - CLUB_TYPE_ORDER.indexOf(b.clubType));

  if (loading) {
    return (
      <main className="bag-detail-page">
        <p>読み込み中...</p>
      </main>
    );
  }
  if (!bag) {
    return (
      <main className="bag-detail-page">
        <p>バッグが見つかりません</p>
        <Link href="/bags" className="bag-detail-back">← 一覧へ</Link>
      </main>
    );
  }

  return (
    <main className="bag-detail-page">
      <p className="bag-detail-back">
        <Link href="/bags">← マイバッグ一覧</Link>
      </p>
      <h1 className="page-title">{bag.name}</h1>
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 16 }}>
        更新: {new Date(bag.updatedAt).toLocaleDateString("ja-JP")} / クラブ {clubs.length} 本
      </p>

      <table className="bag-detail-table">
        <thead>
          <tr>
            <th>label</th>
            <th>clubType</th>
            <th>loftDeg</th>
            <th>shaftWeightBand</th>
            <th>modelName</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c: Club) => (
            <tr key={c.id}>
              <td>{c.label}</td>
              <td>{CLUB_TYPE_LABEL[c.clubType] ?? c.clubType}</td>
              <td>{c.loftDeg != null ? `${c.loftDeg}°` : "—"}</td>
              <td>{c.shaftWeightBand ?? "—"}</td>
              <td>{c.modelName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
