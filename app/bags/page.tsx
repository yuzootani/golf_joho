"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Bag } from "@/lib/witbTypes";
import { ALLOWED_PLAYER_KEYS, getProInfo } from "@/lib/pro-map";

const PRO_LINKS = ALLOWED_PLAYER_KEYS.map((key) => ({
  key,
  ...getProInfo(key)!,
  href: `/compare/pro/${key}`,
}));

export default function BagsListPage() {
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bags")
      .then(async (res) => {
        const json = (await res.json()) as { bags?: Bag[]; error?: string };
        if (!res.ok) {
          setError(json?.error ?? "データの読み込みに失敗しました");
          setBags([]);
          return;
        }
        const list = Array.isArray(json?.bags) ? json.bags : [];
        if (list.length === 0) {
          setError("バッグデータがありません。data/my_bags.json に最低1件のバッグを登録してください。");
          setBags([]);
          return;
        }
        setBags(list);
        setError(null);
      })
      .catch((err) => {
        setError(err?.message ?? "データの読み込みに失敗しました");
        setBags([]);
      })
      .finally(() => setLoading(false));
  }, []);

  function formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  }

  if (loading) {
    return (
      <main className="bags-page">
        <p>読み込み中...</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className="bags-page">
        <h1 className="page-title">マイバッグ</h1>
        <p className="bags-error">{error}</p>
      </main>
    );
  }

  return (
    <main className="bags-page">
      <h1 className="page-title">マイバッグ</h1>
      <p className="bags-sub">クラブセッティングの一覧です。</p>

      <section className="bags-list">
        {bags.length === 0 ? (
          <p className="bags-empty">バッグがありません</p>
        ) : (
          <ul className="bags-ul">
            {bags.map((bag) => (
              <li key={bag.bagId} className="bags-card">
                <Link href={`/bags/${encodeURIComponent(bag.bagId)}`} className="bags-card-link">
                  <span className="bags-card-name">{bag.name}</span>
                  <span className="bags-card-meta">更新: {formatDate(bag.updatedAt)}</span>
                  <span className="bags-card-meta">クラブ: {bag.clubs?.length ?? 0} 本</span>
                  {bag.isActive && <span className="bags-active">active</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bags-pro-section">
        <h2 className="section-title">プロ比較</h2>
        <p className="bags-pro-desc">参考セットとの差分を表示します（傾向のみ）。</p>
        <ul className="bags-pro-links">
          {PRO_LINKS.map(({ key, displayName, href }) => (
            <li key={key}>
              <Link href={href} className="bags-pro-link">
                {displayName} との差分
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
