"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MyClub, ClubType, GripSize } from "@/lib/witbTypes";
import {
  CLUB_TYPE_ORDER,
  CLUB_TYPE_DISPLAY_LABEL,
  GRIP_SIZE_OPTIONS,
} from "@/lib/witbTypes";
import { addMyClub, updateMyClub } from "@/lib/myClubsStorage";

type Props = {
  /** 編集の場合は既存クラブを渡す。新規の場合は undefined */
  initial?: MyClub;
};

export default function MyClubFormClient({ initial }: Props) {
  const router = useRouter();
  const isEdit = initial != null;

  const [headName, setHeadName] = useState(initial?.headName ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [clubType, setClubType] = useState<ClubType>(initial?.clubType ?? "D");
  const [loftDeg, setLoftDeg] = useState(
    initial?.loftDeg != null ? String(initial.loftDeg) : ""
  );
  const [shaftName, setShaftName] = useState(initial?.shaftName ?? "");
  const [shaftFlex, setShaftFlex] = useState(initial?.shaftFlex ?? "");
  const [shaftWeightG, setShaftWeightG] = useState(
    initial?.shaftWeightG != null ? String(initial.shaftWeightG) : ""
  );
  const [gripName, setGripName] = useState(initial?.gripName ?? "");
  const [gripSize, setGripSize] = useState<GripSize | "">(initial?.gripSize ?? "");
  const [gripWraps, setGripWraps] = useState(
    initial?.gripWraps != null ? String(initial.gripWraps) : ""
  );
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function parseNum(s: string): number | undefined {
    const t = s.trim();
    if (t === "") return undefined;
    const n = parseFloat(t);
    return Number.isNaN(n) ? undefined : n;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!headName.trim()) {
      setError("ヘッド名（モデル名）は必須です。");
      return;
    }
    setSaving(true);
    setError(null);

    const now = new Date().toISOString();

    if (isEdit && initial) {
      const updated: MyClub = {
        ...initial,
        headName: headName.trim(),
        label: label.trim() || undefined,
        clubType,
        loftDeg: parseNum(loftDeg),
        shaftName: shaftName.trim() || undefined,
        shaftFlex: shaftFlex.trim() || undefined,
        shaftWeightG: parseNum(shaftWeightG),
        gripName: gripName.trim() || undefined,
        gripSize: gripSize === "" ? undefined : gripSize,
        gripWraps: parseNum(gripWraps),
        memo: memo.trim() || undefined,
        updatedAt: now,
      };
      updateMyClub(updated);
    } else {
      const newClub: MyClub = {
        myClubId: `mc-${Date.now()}`,
        headName: headName.trim(),
        label: label.trim() || undefined,
        clubType,
        loftDeg: parseNum(loftDeg),
        shaftName: shaftName.trim() || undefined,
        shaftFlex: shaftFlex.trim() || undefined,
        shaftWeightG: parseNum(shaftWeightG),
        gripName: gripName.trim() || undefined,
        gripSize: gripSize === "" ? undefined : gripSize,
        gripWraps: parseNum(gripWraps),
        memo: memo.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      addMyClub(newClub);
    }

    router.push("/my-clubs");
  }

  return (
    <main className="my-clubs-form-page">
      <p className="bag-detail-back" style={{ marginBottom: 8 }}>
        <a href="/my-clubs">← クラブ庫一覧</a>
      </p>
      <h1 className="page-title">{isEdit ? "クラブを編集" : "クラブを登録"}</h1>

      {error && <p className="my-clubs-form-error">{error}</p>}

      <form className="my-clubs-form" onSubmit={handleSubmit}>
        <section className="my-clubs-form-section">
          <h2 className="my-clubs-form-section-title">基本情報</h2>

          <div className="my-clubs-field">
            <label>
              ヘッド名（モデル名）<span className="my-clubs-required">必須</span>
            </label>
            <input
              value={headName}
              onChange={(e) => setHeadName(e.target.value)}
              placeholder="例: Qi35 LS, TW747, i530"
              required
            />
          </div>

          <div className="my-clubs-field">
            <label>ラベル（任意）</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例: 普段のドライバー、競技用7番"
            />
            <span className="my-clubs-field-hint">バッグ追加時の表示名に使えます</span>
          </div>

          <div className="my-clubs-field">
            <label>クラブ種別</label>
            <select
              value={clubType}
              onChange={(e) => setClubType(e.target.value as ClubType)}
            >
              {(CLUB_TYPE_ORDER as ClubType[]).map((t) => (
                <option key={t} value={t}>
                  {CLUB_TYPE_DISPLAY_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="my-clubs-field">
            <label>ロフト角（°）</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="90"
              value={loftDeg}
              onChange={(e) => setLoftDeg(e.target.value)}
              placeholder="例: 10.5"
            />
          </div>
        </section>

        <section className="my-clubs-form-section">
          <h2 className="my-clubs-form-section-title">シャフト</h2>

          <div className="my-clubs-field-group">
            <div className="my-clubs-field">
              <label>シャフト名</label>
              <input
                value={shaftName}
                onChange={(e) => setShaftName(e.target.value)}
                placeholder="例: Ventus Black 6, DG S200"
              />
            </div>
            <div className="my-clubs-field">
              <label>フレックス</label>
              <input
                value={shaftFlex}
                onChange={(e) => setShaftFlex(e.target.value)}
                placeholder="例: S, X, TX"
              />
            </div>
            <div className="my-clubs-field">
              <label>重量（g）</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={shaftWeightG}
                onChange={(e) => setShaftWeightG(e.target.value)}
                placeholder="例: 70"
              />
            </div>
          </div>
        </section>

        <section className="my-clubs-form-section">
          <h2 className="my-clubs-form-section-title">グリップ</h2>

          <div className="my-clubs-field-group">
            <div className="my-clubs-field">
              <label>グリップ名</label>
              <input
                value={gripName}
                onChange={(e) => setGripName(e.target.value)}
                placeholder="例: Golf Pride MCC, Lamkin Crossline"
              />
            </div>
            <div className="my-clubs-field">
              <label>サイズ</label>
              <select
                value={gripSize}
                onChange={(e) => setGripSize(e.target.value as GripSize | "")}
              >
                {GRIP_SIZE_OPTIONS.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="my-clubs-field">
              <label>ラップ数</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={gripWraps}
                onChange={(e) => setGripWraps(e.target.value)}
                placeholder="例: 2"
              />
            </div>
          </div>
        </section>

        <section className="my-clubs-form-section">
          <h2 className="my-clubs-form-section-title">メモ</h2>
          <div className="my-clubs-field">
            <label>自由メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: 2024年購入、中古で程度B"
              rows={3}
            />
          </div>
        </section>

        <div className="my-clubs-form-actions">
          <button
            type="button"
            className="my-clubs-form-cancel-btn"
            onClick={() => router.push("/my-clubs")}
          >
            キャンセル
          </button>
          <button type="submit" className="my-clubs-form-save-btn" disabled={saving}>
            {saving ? "保存中..." : isEdit ? "更新する" : "登録する"}
          </button>
        </div>
      </form>
    </main>
  );
}
