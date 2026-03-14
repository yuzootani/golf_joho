"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Bag } from "@/lib/witbTypes";
import { ALLOWED_PLAYER_KEYS, getProInfo } from "@/lib/pro-map";
import { getBagsFromStorage, saveBagsToStorage, fetchInitialBags } from "@/lib/bagsStorage";

const PRO_LINKS = ALLOWED_PLAYER_KEYS.map((key) => ({
  key,
  ...getProInfo(key)!,
  href: `/compare/pro/${key}`,
}));

function generateBagId(): string {
  return `bag-${Date.now()}`;
}

export default function BagsListPage() {
  const router = useRouter();
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getBagsFromStorage();
    if (stored != null && stored.length > 0) {
      setBags(stored);
      setError(null);
      setLoading(false);
      return;
    }
    fetchInitialBags()
      .then((list) => {
        if (list.length === 0) {
          setError("バッグデータがありません。data/my_bags.json に最低1件のバッグを登録してください。");
          setBags([]);
        } else {
          setBags(list);
          setError(null);
          saveBagsToStorage(list);
        }
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

  function setActiveBag(bagId: string) {
    const next = bags.map((b) => ({
      ...b,
      isActive: b.bagId === bagId,
    }));
    setBags(next);
    saveBagsToStorage(next);
  }

  function handleNewBag() {
    const active = bags.find((b) => b.isActive) ?? bags[0];
    if (!active) return;
    const newBag: Bag = {
      ...active,
      bagId: generateBagId(),
      name: "コピー",
      updatedAt: new Date().toISOString(),
      isActive: false,
      clubs: active.clubs?.map((c, i) => ({
        ...c,
        id: `c-${Date.now()}-${i}`,
      })) ?? [],
    };
    const next = [...bags, newBag];
    setBags(next);
    saveBagsToStorage(next);
    router.push(`/bags/${encodeURIComponent(newBag.bagId)}`);
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
      <p className="bags-sub">クラブセッティングの一覧です。localStorage に保存されます。</p>

      {bags.length === 0 ? (
        <p className="bags-error">バッグデータがありません。data/my_bags.json に最低1件のバッグを登録してください。</p>
      ) : (
        <>
          <p style={{ marginBottom: 12 }}>
            <button type="button" className="bags-new-btn" onClick={handleNewBag}>
              新規バッグ作成
            </button>
          </p>
          <ul className="bags-ul">
            {bags.map((bag) => (
              <li key={bag.bagId} className="bags-card">
                <div className="bags-card-inner">
                  <Link href={`/bags/${encodeURIComponent(bag.bagId)}`} className="bags-card-link">
                    <span className="bags-card-name">{bag.name}</span>
                    <span className="bags-card-meta">更新: {formatDate(bag.updatedAt)}</span>
                    <span className="bags-card-meta">クラブ: {bag.clubs?.length ?? 0} 本</span>
                    {bag.isActive && <span className="bags-active">active</span>}
                  </Link>
                  {!bag.isActive && (
                    <button
                      type="button"
                      className="bags-set-active-btn"
                      onClick={(e) => { e.preventDefault(); setActiveBag(bag.bagId); }}
                    >
                      今日のセットにする
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

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
