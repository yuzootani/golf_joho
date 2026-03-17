"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Bag, Club, ClubType, BagSnapshot } from "@/lib/witbTypes";
import { CLUB_TYPE_ORDER, SHAFT_WEIGHT_BAND_OPTIONS, CLUB_TYPE_DISPLAY_LABEL } from "@/lib/witbTypes";

function makeSnapshot(bag: Bag): BagSnapshot {
  return {
    clubs: JSON.parse(JSON.stringify(bag.clubs ?? [])),
    purpose: bag.purpose,
    course: bag.course,
    missTendency: bag.missTendency,
    scoreMemo: bag.scoreMemo,
    notes: bag.notes,
  };
}
import { getBags, saveBags, fetchInitialBags } from "@/lib/bagsStorage";

/** 比較キー: label があれば label、なければ id */
function clubKey(c: Club): string {
  const L = (c.label ?? "").trim();
  return L || c.id;
}

type BagDiff = {
  added: Club[];
  removed: Club[];
  changed: { club: Club; changes: string[] }[];
  memoChanges: string[];
};

function computeBagDiff(current: Bag, last: Bag | null): BagDiff | null {
  if (!last) return null;
  return computeDiffFromSnapshot(current, makeSnapshot(last));
}

function computeDiffFromSnapshot(current: Bag, snap: BagSnapshot | null | undefined): BagDiff | null {
  if (!snap) return null;
  const curClubs = current.clubs ?? [];
  const lastClubs = snap.clubs ?? [];
  const curByKey = new Map<string, Club>();
  const lastByKey = new Map<string, Club>();
  for (const c of curClubs) curByKey.set(clubKey(c), c);
  for (const c of lastClubs) lastByKey.set(clubKey(c), c);

  const added: Club[] = [];
  const removed: Club[] = [];
  const changes: { club: Club; changes: string[] }[] = [];

  for (const c of curClubs) {
    const k = clubKey(c);
    if (!lastByKey.has(k)) added.push(c);
  }
  for (const c of lastClubs) {
    const k = clubKey(c);
    if (!curByKey.has(k)) removed.push(c);
  }

  // 同一 label で「追加」と「削除」が両方出ている → 「変更」にまとめる
  const addedKeys = new Set(added.map(clubKey));
  const removedKeys = new Set(removed.map(clubKey));
  const overlapKeys = [...addedKeys].filter((k) => removedKeys.has(k));
  if (overlapKeys.length > 0) {
    for (const k of overlapKeys) {
      const curC = curByKey.get(k) ?? added.find((c) => clubKey(c) === k);
      const lastC = lastByKey.get(k) ?? removed.find((c) => clubKey(c) === k);
      if (curC && lastC) {
        const lines: string[] = [];
        if (String(lastC.label ?? "") !== String(curC.label ?? "")) lines.push(`label: ${lastC.label ?? "—"} → ${curC.label ?? "—"}`);
        if (lastC.loftDeg !== curC.loftDeg) lines.push(`loftDeg: ${lastC.loftDeg ?? "—"} → ${curC.loftDeg ?? "—"}`);
        if (String(lastC.modelName ?? "") !== String(curC.modelName ?? "")) lines.push(`modelName: ${lastC.modelName ?? "—"} → ${curC.modelName ?? "—"}`);
        if (String(lastC.shaftWeightBand ?? "") !== String(curC.shaftWeightBand ?? "")) lines.push(`shaftWeightBand: ${lastC.shaftWeightBand ?? "—"} → ${curC.shaftWeightBand ?? "—"}`);
        if (Boolean(lastC.isEnabled !== false) !== Boolean(curC.isEnabled !== false)) lines.push(`isEnabled: ${lastC.isEnabled !== false ? "ON" : "OFF"} → ${curC.isEnabled !== false ? "ON" : "OFF"}`);
        changes.push({ club: curC, changes: lines.length > 0 ? lines : ["内容が更新されました"] });
      }
    }
    const overlapSet = new Set(overlapKeys);
    for (let i = added.length - 1; i >= 0; i--) if (overlapSet.has(clubKey(added[i]))) added.splice(i, 1);
    for (let i = removed.length - 1; i >= 0; i--) if (overlapSet.has(clubKey(removed[i]))) removed.splice(i, 1);
  }

  // 同じキーで両方に存在するもの → 差分があれば「変更」
  for (const k of curByKey.keys()) {
    if (overlapKeys.includes(k)) continue;
    const curC = curByKey.get(k)!;
    const lastC = lastByKey.get(k);
    if (!lastC) continue;
    const lines: string[] = [];
    if (String(lastC.label ?? "") !== String(curC.label ?? "")) lines.push(`label: ${lastC.label ?? "—"} → ${curC.label ?? "—"}`);
    if (lastC.loftDeg !== curC.loftDeg) lines.push(`loftDeg: ${lastC.loftDeg ?? "—"} → ${curC.loftDeg ?? "—"}`);
    if (String(lastC.modelName ?? "") !== String(curC.modelName ?? "")) lines.push(`modelName: ${lastC.modelName ?? "—"} → ${curC.modelName ?? "—"}`);
    if (String(lastC.shaftWeightBand ?? "") !== String(curC.shaftWeightBand ?? "")) lines.push(`shaftWeightBand: ${lastC.shaftWeightBand ?? "—"} → ${curC.shaftWeightBand ?? "—"}`);
    if (Boolean(lastC.isEnabled !== false) !== Boolean(curC.isEnabled !== false)) lines.push(`isEnabled: ${lastC.isEnabled !== false ? "ON" : "OFF"} → ${curC.isEnabled !== false ? "ON" : "OFF"}`);
    if (lines.length > 0) changes.push({ club: curC, changes: lines });
  }

  const memoChanges: string[] = [];
  if (String(snap.purpose ?? "") !== String(current.purpose ?? "")) memoChanges.push(`purpose: ${snap.purpose ?? "—"} → ${current.purpose ?? "—"}`);
  if (String(snap.course ?? "") !== String(current.course ?? "")) memoChanges.push(`course: ${snap.course ?? "—"} → ${current.course ?? "—"}`);
  if (String(snap.missTendency ?? "") !== String(current.missTendency ?? "")) memoChanges.push(`missTendency: ${snap.missTendency ?? "—"} → ${current.missTendency ?? "—"}`);
  if (String(snap.scoreMemo ?? "") !== String(current.scoreMemo ?? "")) memoChanges.push(`scoreMemo: ${snap.scoreMemo ?? "—"} → ${current.scoreMemo ?? "—"}`);
  if (String(snap.notes ?? "") !== String(current.notes ?? "")) memoChanges.push(`notes: ${snap.notes ?? "—"} → ${current.notes ?? "—"}`);
  if (added.length === 0 && removed.length === 0 && changes.length === 0 && memoChanges.length === 0) return null;
  return { added, removed, changed: changes, memoChanges };
}

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
  const [lastSavedBag, setLastSavedBag] = useState<Bag | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingClubIndex, setEditingClubIndex] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<"localStorage" | "json" | null>(null);
  const [activeBagId, setActiveBagId] = useState<string | null>(null);

  const loadBag = useCallback(() => {
    const stored = getBags();
    if (stored != null && stored.length > 0) {
      const b = stored.find((bagItem) => bagItem.bagId === bagId);
      const active = stored.find((bagItem) => bagItem.isActive);
      if (b) {
        const copy = JSON.parse(JSON.stringify(b)) as Bag;
        setBag(copy);
        setLastSavedBag(JSON.parse(JSON.stringify(b)) as Bag);
        setDataSource("localStorage");
        setActiveBagId(active?.bagId ?? null);
        setLoading(false);
        return;
      }
    }
    fetchInitialBags().then((list) => {
      const b = list.find((bagItem) => bagItem.bagId === bagId);
      const active = list.find((bagItem) => bagItem.isActive);
      const copy = b ? (JSON.parse(JSON.stringify(b)) as Bag) : null;
      setBag(copy);
      setLastSavedBag(copy ? (JSON.parse(JSON.stringify(b)) as Bag) : null);
      setDataSource("json");
      setActiveBagId(active?.bagId ?? null);
    }).catch(() => setBag(null)).finally(() => setLoading(false));
  }, [bagId]);

  useEffect(() => {
    loadBag();
  }, [loadBag]);

  function saveBag(updated: Bag) {
    const stored = getBags() ?? [];
    // 保存順序: previousSnapshot = 保存直前の状態 → その後に clubs/notes を新状態で保存
    const prevSnapshot = lastSavedBag ? makeSnapshot(lastSavedBag) : undefined;
    const updatedWithTime = {
      ...updated,
      updatedAt: new Date().toISOString(),
      previousSnapshot: prevSnapshot,
    };
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
    const savedCopy = JSON.parse(JSON.stringify(updatedWithTime)) as Bag;
    setBag(savedCopy);
    setLastSavedBag(savedCopy);
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
  const diffEdit = editMode ? computeBagDiff(bag, lastSavedBag) : null;
  const diffFromPrevious = bag.previousSnapshot ? computeDiffFromSnapshot(bag, bag.previousSnapshot) : null;

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

      {editMode && diffEdit && (
        <section className="bag-diff-log">
          <h3 className="bag-diff-log-title">変更履歴（編集中・未保存）</h3>
          <ul className="bag-diff-log-list">
            {diffEdit.added.map((c) => (
              <li key={clubKey(c)}>追加: {c.label || c.clubType} {c.modelName ? `（${c.modelName}）` : ""}</li>
            ))}
            {diffEdit.removed.map((c) => (
              <li key={clubKey(c)}>削除: {c.label || c.clubType} {c.modelName ? `（${c.modelName}）` : ""}</li>
            ))}
            {diffEdit.changed.map(({ club, changes }) => (
              <li key={clubKey(club)}>変更: {club.label || club.clubType} — {changes.join(" / ")}</li>
            ))}
            {diffEdit.memoChanges.map((line, i) => (
              <li key={`memo-${i}`}>変更（メモ）: {line}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="bag-diff-log">
        <h3 className="bag-diff-log-title">前回からの変更点</h3>
        {(!bag.previousSnapshot || !bag.previousSnapshot.clubs || bag.previousSnapshot.clubs.length === 0) ? (
          <p className="bag-diff-log-empty">まだ変更がありません（保存後に表示されます）</p>
        ) : (diffFromPrevious && (diffFromPrevious.added.length > 0 || diffFromPrevious.removed.length > 0 || diffFromPrevious.changed.length > 0 || diffFromPrevious.memoChanges.length > 0)) ? (
          <ul className="bag-diff-log-list">
            {diffFromPrevious.added.map((c) => (
              <li key={clubKey(c)}>追加: {c.label || c.clubType}</li>
            ))}
            {diffFromPrevious.removed.map((c) => (
              <li key={clubKey(c)}>削除: {c.label || c.clubType}</li>
            ))}
            {diffFromPrevious.changed.map(({ club, changes }) => (
              <li key={clubKey(club)}>変更: {club.label || club.clubType} — {changes.join(" / ")}</li>
            ))}
            {diffFromPrevious.memoChanges.map((line, i) => (
              <li key={`memo-${i}`}>変更（メモ）: {line}</li>
            ))}
          </ul>
        ) : (
          <p className="bag-diff-log-empty">変更なし</p>
        )}
      </section>

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
