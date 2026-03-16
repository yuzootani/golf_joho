"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Bag, Club, ClubType } from "@/lib/witbTypes";
import { CLUB_TYPE_ORDER, SHAFT_WEIGHT_BAND_OPTIONS, CLUB_TYPE_DISPLAY_LABEL } from "@/lib/witbTypes";
import { getBags, saveBags, fetchInitialBags } from "@/lib/bagsStorage";

function emptyClub(id: string): Club {
  return {
    id,
    label: "",
    clubType: "D",
    loftDeg: undefined,
    shaftWeightBand: "unknown",
    modelName: "",
    isEnabled: true,
  };
}

function ClubEditModal({
  club,
  onSave,
  onCancel,
}: {
  club: Club;
  onSave: (c: Club) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(club.label);
  const [clubType, setClubType] = useState<ClubType>(club.clubType);
  const [loftDeg, setLoftDeg] = useState(club.loftDeg === undefined ? "" : String(club.loftDeg));
  const [shaftWeightBand, setShaftWeightBand] = useState(club.shaftWeightBand ?? "unknown");
  const [modelName, setModelName] = useState(club.modelName ?? "");
  const [isEnabled, setIsEnabled] = useState(club.isEnabled !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deg = loftDeg.trim() === "" ? undefined : parseFloat(loftDeg);
    onSave({
      ...club,
      label: label.trim() || club.label,
      clubType,
      loftDeg: deg !== undefined && !Number.isNaN(deg) ? deg : undefined,
      shaftWeightBand: shaftWeightBand === "unknown" ? undefined : shaftWeightBand,
      modelName: modelName.trim() || undefined,
      isEnabled,
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <h4>クラブを編集</h4>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label>label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="1W, 3W, 4U, 7i, PW, 56°" />
          </div>
          <div className="modal-field">
            <label>clubType</label>
            <select value={clubType} onChange={(e) => setClubType(e.target.value as ClubType)}>
              {(CLUB_TYPE_ORDER as ClubType[]).map((t) => (
                <option key={t} value={t}>{CLUB_TYPE_DISPLAY_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>loftDeg（空OK）</label>
            <input type="number" step="0.5" value={loftDeg} onChange={(e) => setLoftDeg(e.target.value)} placeholder="10.5" />
          </div>
          <div className="modal-field">
            <label>shaftWeightBand</label>
            <select value={shaftWeightBand} onChange={(e) => setShaftWeightBand(e.target.value)}>
              {SHAFT_WEIGHT_BAND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>modelName（空OK）</label>
            <input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="モデル名" />
          </div>
          <div className="modal-field bag-edit-active-wrap">
            <label>
              <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
              isEnabled（ON）
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel}>キャンセル</button>
            <button type="submit">OK</button>
          </div>
        </form>
      </div>
    </div>
  );
}

type Props = { bagId: string };

export default function BagDetailClient({ bagId }: Props) {
  const [bag, setBag] = useState<Bag | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingClubIndex, setEditingClubIndex] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<"localStorage" | "json" | null>(null);
  const [activeBagId, setActiveBagId] = useState<string | null>(null);

  const loadBag = useCallback(() => {
    const stored = getBags();
    if (stored != null && stored.length > 0) {
      const b = stored.find((bag) => bag.bagId === bagId);
      const active = stored.find((bag) => bag.isActive);
      if (b) {
        setBag(JSON.parse(JSON.stringify(b)));
        setDataSource("localStorage");
        setActiveBagId(active?.bagId ?? null);
        setLoading(false);
        return;
      }
    }
    fetchInitialBags().then((list) => {
      const b = list.find((bag) => bag.bagId === bagId);
      const active = list.find((bag) => bag.isActive);
      setBag(b ? JSON.parse(JSON.stringify(b)) : null);
      setDataSource("json");
      setActiveBagId(active?.bagId ?? null);
    }).catch(() => setBag(null)).finally(() => setLoading(false));
  }, [bagId]);

  useEffect(() => {
    loadBag();
  }, [loadBag]);

  function saveBag(updated: Bag) {
    const stored = getBags() ?? [];
    const updatedWithTime = { ...updated, updatedAt: new Date().toISOString() };
    const nextList = stored.map((b) => {
      if (b.bagId !== updated.bagId) {
        if (updated.isActive) return { ...b, isActive: false };
        return b;
      }
      return updatedWithTime;
    });
    const idx = nextList.findIndex((b) => b.bagId === updated.bagId);
    if (idx === -1) nextList.push(updatedWithTime);
    else nextList[idx] = updatedWithTime;
    saveBags(nextList);
    setBag(JSON.parse(JSON.stringify(updatedWithTime)));
    setActiveBagId(updated.isActive ? updated.bagId : (stored.find((b) => b.isActive)?.bagId ?? null));
    setEditMode(false);
  }

  function handleSave() {
    if (!bag) return;
    saveBag(bag);
  }

  function handleCancel() {
    loadBag();
    setEditMode(false);
    setEditingClubIndex(null);
  }

  function updateClub(index: number, c: Club) {
    if (!bag) return;
    const next = [...bag.clubs];
    next[index] = c;
    setBag({ ...bag, clubs: next });
    setEditingClubIndex(null);
  }

  function addClub() {
    if (!bag) return;
    const newId = `c-${Date.now()}`;
    const next = [...bag.clubs, emptyClub(newId)];
    setBag({ ...bag, clubs: next });
    setEditingClubIndex(next.length - 1);
  }

  function deleteClub(index: number) {
    if (!bag) return;
    const next = bag.clubs.filter((_, i) => i !== index);
    setBag({ ...bag, clubs: next });
  }

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

  const sorted = [...bag.clubs].sort((a, b) => CLUB_TYPE_ORDER.indexOf(a.clubType) - CLUB_TYPE_ORDER.indexOf(b.clubType));

  return (
    <main className="bag-detail-page">
      <p className="bag-detail-back">
        <Link href="/bags">← マイバッグ一覧</Link>
      </p>

      <p className="bag-detail-dev-indicator">
        source: {dataSource ?? "—"} | activeBagId: {activeBagId ?? "—"}
      </p>

      <div className="bag-detail-toolbar">
        <button
          type="button"
          className={editMode ? "bag-detail-edit-btn-on" : "bag-detail-edit-btn"}
          onClick={() => (editMode ? handleCancel() : setEditMode(true))}
          aria-pressed={editMode}
        >
          編集モード
        </button>
        {editMode && (
          <>
            <button type="button" className="bag-detail-save-btn" onClick={handleSave}>保存</button>
            <button type="button" className="bag-detail-cancel-btn" onClick={handleCancel}>キャンセル</button>
            <button type="button" className="bag-detail-add-btn" onClick={addClub}>クラブ追加</button>
          </>
        )}
      </div>

      {editMode && (
        <>
          <div className="bag-edit-name-wrap">
            <label>バッグ名</label>
            <input
              className="bag-edit-name-input"
              value={bag.name}
              onChange={(e) => setBag({ ...bag, name: e.target.value })}
            />
          </div>
          <div className="bag-edit-active-wrap">
            <label>
              <input
                type="checkbox"
                checked={bag.isActive}
                onChange={(e) => setBag({ ...bag, isActive: e.target.checked })}
              />
              今日のセット（isActive）
            </label>
          </div>
        </>
      )}

      {!editMode && <h1 className="page-title">{bag.name}</h1>}
      <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 16 }}>
        更新: {new Date(bag.updatedAt).toLocaleDateString("ja-JP")} / クラブ {bag.clubs.length} 本
      </p>

      <section className="bag-memo-card">
        <h3 className="bag-memo-title">メモ欄</h3>
        {editMode ? (
          <div className="bag-memo-form">
            <div className="bag-memo-field">
              <label>用途（purpose）</label>
              <input
                type="text"
                value={bag.purpose ?? ""}
                onChange={(e) => setBag({ ...bag, purpose: e.target.value.trim() || undefined })}
                placeholder="競技/狭いコース/風/テスト"
              />
            </div>
            <div className="bag-memo-field">
              <label>コース（course）</label>
              <input
                type="text"
                value={bag.course ?? ""}
                onChange={(e) => setBag({ ...bag, course: e.target.value.trim() || undefined })}
                placeholder="○○CC"
              />
            </div>
            <div className="bag-memo-field">
              <label>ミス傾向（missTendency）</label>
              <input
                type="text"
                value={bag.missTendency ?? ""}
                onChange={(e) => setBag({ ...bag, missTendency: e.target.value.trim() || undefined })}
                placeholder="左/右/ダフリなど"
              />
            </div>
            <div className="bag-memo-field">
              <label>スコアメモ（scoreMemo）</label>
              <input
                type="text"
                value={bag.scoreMemo ?? ""}
                onChange={(e) => setBag({ ...bag, scoreMemo: e.target.value.trim() || undefined })}
                placeholder="79、80台前半"
              />
            </div>
            <div className="bag-memo-field">
              <label>自由メモ（notes）</label>
              <textarea
                value={bag.notes ?? ""}
                onChange={(e) => setBag({ ...bag, notes: e.target.value.trim() || undefined })}
                placeholder="任意"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <dl className="bag-memo-view">
            <div><dt>用途</dt><dd>{bag.purpose || "—"}</dd></div>
            <div><dt>コース</dt><dd>{bag.course || "—"}</dd></div>
            <div><dt>ミス傾向</dt><dd>{bag.missTendency || "—"}</dd></div>
            <div><dt>スコアメモ</dt><dd>{bag.scoreMemo || "—"}</dd></div>
            <div><dt>メモ</dt><dd>{bag.notes || "—"}</dd></div>
          </dl>
        )}
      </section>

      <table className="bag-detail-table">
        <thead>
          <tr>
            <th>label</th>
            <th>clubType</th>
            <th>loftDeg</th>
            <th>shaftWeightBand</th>
            <th>modelName</th>
            <th>isEnabled</th>
            {editMode && <th>操作</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const rowIndex = bag.clubs.findIndex((x) => x.id === c.id);
            return (
              <tr key={c.id}>
                <td>{c.label || "—"}</td>
                <td>{CLUB_TYPE_DISPLAY_LABEL[c.clubType] ?? c.clubType}</td>
                <td>{c.loftDeg != null ? `${c.loftDeg}°` : "—"}</td>
                <td>{c.shaftWeightBand ?? "—"}</td>
                <td>{c.modelName ?? "—"}</td>
                <td>{c.isEnabled !== false ? "ON" : "OFF"}</td>
                {editMode && (
                  <td>
                    <div className="bag-detail-row-actions">
                      <button type="button" className="bag-detail-edit-row-btn" onClick={() => setEditingClubIndex(rowIndex)}>編集</button>
                      <button type="button" className="bag-detail-delete-btn" onClick={() => deleteClub(rowIndex)}>削除</button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {editingClubIndex !== null && bag.clubs[editingClubIndex] && (
        <ClubEditModal
          club={bag.clubs[editingClubIndex]}
          onSave={(c) => updateClub(editingClubIndex, c)}
          onCancel={() => setEditingClubIndex(null)}
        />
      )}
    </main>
  );
}
