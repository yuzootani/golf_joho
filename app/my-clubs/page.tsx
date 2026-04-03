"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { MyClub } from "@/lib/witbTypes";
import { CLUB_TYPE_DISPLAY_LABEL } from "@/lib/witbTypes";
import { getMyClubsFromStorage, deleteMyClub } from "@/lib/myClubsStorage";

export default function MyClubsPage() {
  const [clubs, setClubs] = useState<MyClub[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setClubs(getMyClubsFromStorage());
    setMounted(true);
  }, []);

  function handleDelete(myClubId: string) {
    if (!confirm("このクラブをクラブ庫から削除しますか？")) return;
    deleteMyClub(myClubId);
    setClubs(getMyClubsFromStorage());
  }

  if (!mounted) {
    return (
      <main className="my-clubs-page">
        <p>読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="my-clubs-page">
      <h1 className="page-title">クラブ庫</h1>
      <p className="my-clubs-sub">
        所有クラブを登録しておくと、バッグ入力で選択できます。
      </p>
      <p style={{ marginBottom: 20 }}>
        <Link href="/my-clubs/new" className="my-clubs-new-btn">
          ＋ 新規クラブ登録
        </Link>
      </p>

      {clubs.length === 0 ? (
        <div className="my-clubs-empty">
          <p>まだクラブが登録されていません。</p>
          <p>
            <Link href="/my-clubs/new" className="my-clubs-new-btn">
              最初のクラブを登録する
            </Link>
          </p>
        </div>
      ) : (
        <div className="my-clubs-grid">
          {clubs.map((mc) => (
            <div key={mc.myClubId} className="my-clubs-card">
              <div className="my-clubs-card-header">
                <span className="my-clubs-card-type">
                  {mc.clubType ? (CLUB_TYPE_DISPLAY_LABEL[mc.clubType] ?? mc.clubType) : "—"}
                </span>
                <span className="my-clubs-card-name">{mc.headName}</span>
              </div>
              {mc.label && (
                <p className="my-clubs-card-label">「{mc.label}」</p>
              )}
              <dl className="my-clubs-card-details">
                {mc.loftDeg != null && (
                  <div>
                    <dt>ロフト</dt>
                    <dd>{mc.loftDeg}°</dd>
                  </div>
                )}
                {mc.shaftName && (
                  <div>
                    <dt>シャフト</dt>
                    <dd>
                      {mc.shaftName}
                      {mc.shaftFlex ? ` ${mc.shaftFlex}` : ""}
                      {mc.shaftWeightG != null ? ` ${mc.shaftWeightG}g` : ""}
                    </dd>
                  </div>
                )}
                {mc.gripName && (
                  <div>
                    <dt>グリップ</dt>
                    <dd>
                      {mc.gripName}
                      {mc.gripSize ? ` (${mc.gripSize})` : ""}
                      {mc.gripWraps != null ? ` ×${mc.gripWraps}` : ""}
                    </dd>
                  </div>
                )}
                {mc.memo && (
                  <div>
                    <dt>メモ</dt>
                    <dd>{mc.memo}</dd>
                  </div>
                )}
              </dl>
              {mc.updatedAt && (
                <p className="my-clubs-card-date">
                  更新: {new Date(mc.updatedAt).toLocaleDateString("ja-JP")}
                </p>
              )}
              <div className="my-clubs-card-actions">
                <Link href={`/my-clubs/${mc.myClubId}`} className="my-clubs-edit-btn">
                  編集
                </Link>
                <button
                  type="button"
                  className="my-clubs-delete-btn"
                  onClick={() => handleDelete(mc.myClubId)}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
