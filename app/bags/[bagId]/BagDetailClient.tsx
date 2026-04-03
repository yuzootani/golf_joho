"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type {
  Bag,
  Club,
  ClubType,
  BagSnapshot,
  GripSize,
  IronSet,
  IronSetLabel,
  MyClub,
  ClubOverrides,
} from "@/lib/witbTypes";
import {
  CLUB_TYPE_ORDER,
  SHAFT_WEIGHT_BAND_OPTIONS,
  CLUB_TYPE_DISPLAY_LABEL,
  GRIP_SIZE_OPTIONS,
  IRON_SET_LABELS,
  displayShaftWeightSummary,
} from "@/lib/witbTypes";
import ironHeadsDb from "@/data/club_db/iron_heads.json";
import shaftsDb from "@/data/club_db/shafts.json";
import { getBags, saveBags, fetchInitialBags } from "@/lib/bagsStorage";
import { getMyClubsFromStorage, addMyClub } from "@/lib/myClubsStorage";

// ─── helpers ────────────────────────────────────────────────────────────────

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

/** 比較キー: label があれば label、なければ id */
function clubKey(c: Club): string {
  const L = (c.label ?? "").trim();
  return L || c.id;
}

/**
 * myClubId を持つクラブを、MyClubs の情報をベースに overrides で上書きした
 * 「実効クラブ」として返す。myClubId がない場合はそのまま返す。
 */
function resolveClub(club: Club, myClubsList: MyClub[]): Club {
  if (!club.myClubId) return club;
  const mc = myClubsList.find((m) => m.myClubId === club.myClubId);
  if (!mc) return club;
  const ov: ClubOverrides = club.overrides ?? {};
  return {
    id: club.id,
    label: club.label || mc.label || mc.headName,
    clubType: club.clubType || mc.clubType || "D",
    loftDeg: "loftDeg" in ov ? ov.loftDeg : mc.loftDeg,
    shaftName: "shaftName" in ov ? ov.shaftName : mc.shaftName,
    shaftFlex: "shaftFlex" in ov ? ov.shaftFlex : mc.shaftFlex,
    shaftWeightG: "shaftWeightG" in ov ? ov.shaftWeightG : mc.shaftWeightG,
    gripName: "gripName" in ov ? ov.gripName : mc.gripName,
    gripSize: "gripSize" in ov ? ov.gripSize : mc.gripSize,
    gripWraps: "gripWraps" in ov ? ov.gripWraps : mc.gripWraps,
    modelName: "modelName" in ov ? ov.modelName : mc.headName,
    isEnabled: club.isEnabled,
    myClubId: club.myClubId,
    overrides: club.overrides,
  };
}

/**
 * 編集後クラブと MyClub を比較し、異なるフィールドのみ overrides として返す。
 * 差分がない場合は undefined を返す。
 */
function computeOverridesFromMyClub(
  edited: Club,
  mc: MyClub
): ClubOverrides | undefined {
  const ov: ClubOverrides = {};
  if (edited.loftDeg !== mc.loftDeg) ov.loftDeg = edited.loftDeg;
  if ((edited.shaftName ?? "") !== (mc.shaftName ?? ""))
    ov.shaftName = edited.shaftName;
  if ((edited.shaftFlex ?? "") !== (mc.shaftFlex ?? ""))
    ov.shaftFlex = edited.shaftFlex;
  if (edited.shaftWeightG !== mc.shaftWeightG)
    ov.shaftWeightG = edited.shaftWeightG;
  if ((edited.gripName ?? "") !== (mc.gripName ?? ""))
    ov.gripName = edited.gripName;
  if ((edited.gripSize ?? "") !== (mc.gripSize ?? ""))
    ov.gripSize = edited.gripSize as GripSize | undefined;
  if (edited.gripWraps !== mc.gripWraps) ov.gripWraps = edited.gripWraps;
  if ((edited.modelName ?? "") !== (mc.headName ?? ""))
    ov.modelName = edited.modelName;
  return Object.keys(ov).length > 0 ? ov : undefined;
}

function clubFieldDiffLines(lastC: Club, curC: Club): string[] {
  const lines: string[] = [];
  if (String(lastC.label ?? "") !== String(curC.label ?? ""))
    lines.push(`label: ${lastC.label ?? "—"} → ${curC.label ?? "—"}`);
  if (lastC.loftDeg !== curC.loftDeg)
    lines.push(`loftDeg: ${lastC.loftDeg ?? "—"} → ${curC.loftDeg ?? "—"}`);
  if (String(lastC.modelName ?? "") !== String(curC.modelName ?? ""))
    lines.push(`modelName: ${lastC.modelName ?? "—"} → ${curC.modelName ?? "—"}`);
  if (String(lastC.shaftWeightBand ?? "") !== String(curC.shaftWeightBand ?? ""))
    lines.push(
      `shaftWeightBand: ${lastC.shaftWeightBand ?? "—"} → ${curC.shaftWeightBand ?? "—"}`
    );
  if ((lastC.shaftWeightG ?? null) !== (curC.shaftWeightG ?? null))
    lines.push(
      `shaftWeightG: ${lastC.shaftWeightG ?? "—"} → ${curC.shaftWeightG ?? "—"}`
    );
  if (String(lastC.shaftName ?? "") !== String(curC.shaftName ?? ""))
    lines.push(`shaftName: ${lastC.shaftName ?? "—"} → ${curC.shaftName ?? "—"}`);
  if (String(lastC.shaftFlex ?? "") !== String(curC.shaftFlex ?? ""))
    lines.push(`shaftFlex: ${lastC.shaftFlex ?? "—"} → ${curC.shaftFlex ?? "—"}`);
  if (String(lastC.gripName ?? "") !== String(curC.gripName ?? ""))
    lines.push(`gripName: ${lastC.gripName ?? "—"} → ${curC.gripName ?? "—"}`);
  if (String(lastC.gripSize ?? "") !== String(curC.gripSize ?? ""))
    lines.push(`gripSize: ${lastC.gripSize ?? "—"} → ${curC.gripSize ?? "—"}`);
  if ((lastC.gripWraps ?? null) !== (curC.gripWraps ?? null))
    lines.push(`gripWraps: ${lastC.gripWraps ?? "—"} → ${curC.gripWraps ?? "—"}`);
  if (
    Boolean(lastC.isEnabled !== false) !== Boolean(curC.isEnabled !== false)
  )
    lines.push(
      `isEnabled: ${lastC.isEnabled !== false ? "ON" : "OFF"} → ${curC.isEnabled !== false ? "ON" : "OFF"}`
    );
  return lines;
}

type BagDiff = {
  added: Club[];
  removed: Club[];
  changed: { club: Club; changes: string[] }[];
  memoChanges: string[];
};

function computeDiffFromSnapshot(
  current: Bag,
  snap: BagSnapshot | null | undefined
): BagDiff | null {
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
    if (!lastByKey.has(clubKey(c))) added.push(c);
  }
  for (const c of lastClubs) {
    if (!curByKey.has(clubKey(c))) removed.push(c);
  }

  const addedKeys = new Set(added.map(clubKey));
  const removedKeys = new Set(removed.map(clubKey));
  const overlapKeys = [...addedKeys].filter((k) => removedKeys.has(k));
  if (overlapKeys.length > 0) {
    for (const k of overlapKeys) {
      const curC = curByKey.get(k) ?? added.find((c) => clubKey(c) === k);
      const lastC = lastByKey.get(k) ?? removed.find((c) => clubKey(c) === k);
      if (curC && lastC) {
        const lines = clubFieldDiffLines(lastC, curC);
        changes.push({
          club: curC,
          changes: lines.length > 0 ? lines : ["内容が更新されました"],
        });
      }
    }
    const overlapSet = new Set(overlapKeys);
    for (let i = added.length - 1; i >= 0; i--)
      if (overlapSet.has(clubKey(added[i]))) added.splice(i, 1);
    for (let i = removed.length - 1; i >= 0; i--)
      if (overlapSet.has(clubKey(removed[i]))) removed.splice(i, 1);
  }

  for (const k of curByKey.keys()) {
    if (overlapKeys.includes(k)) continue;
    const curC = curByKey.get(k)!;
    const lastC = lastByKey.get(k);
    if (!lastC) continue;
    const lines = clubFieldDiffLines(lastC, curC);
    if (lines.length > 0) changes.push({ club: curC, changes: lines });
  }

  const memoChanges: string[] = [];
  if (String(snap.purpose ?? "") !== String(current.purpose ?? ""))
    memoChanges.push(`purpose: ${snap.purpose ?? "—"} → ${current.purpose ?? "—"}`);
  if (String(snap.course ?? "") !== String(current.course ?? ""))
    memoChanges.push(`course: ${snap.course ?? "—"} → ${current.course ?? "—"}`);
  if (String(snap.missTendency ?? "") !== String(current.missTendency ?? ""))
    memoChanges.push(
      `missTendency: ${snap.missTendency ?? "—"} → ${current.missTendency ?? "—"}`
    );
  if (String(snap.scoreMemo ?? "") !== String(current.scoreMemo ?? ""))
    memoChanges.push(
      `scoreMemo: ${snap.scoreMemo ?? "—"} → ${current.scoreMemo ?? "—"}`
    );
  if (String(snap.notes ?? "") !== String(current.notes ?? ""))
    memoChanges.push(`notes: ${snap.notes ?? "—"} → ${current.notes ?? "—"}`);

  if (
    added.length === 0 &&
    removed.length === 0 &&
    changes.length === 0 &&
    memoChanges.length === 0
  )
    return null;
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

function isEmptyString(v?: string): boolean {
  return v == null || v.trim() === "";
}

function isEmptyNumber(v?: number): boolean {
  return v == null || Number.isNaN(v);
}

function normalizeIronSetLabel(raw: string): IronSetLabel | null {
  const t = raw.trim().toUpperCase();
  if (t === "PW") return "PW";
  const m = t.match(/^([3-9])I$/);
  if (!m) return null;
  return `${m[1]}i` as IronSetLabel;
}

const ironHeadsByModel = ironHeadsDb as Record<
  string,
  Partial<Record<IronSetLabel, number>>
>;
const shaftWeightByName = shaftsDb as Record<string, number>;

function applyIronSetToClubs(
  clubs: Club[],
  ironSet: IronSet,
  overwrite: boolean
): { clubs: Club[]; appliedCount: number } {
  const headModelKey = ironSet.headModel?.trim() ?? "";
  const loftByLabel = headModelKey ? (ironHeadsByModel[headModelKey] ?? {}) : {};

  const start = ironSet.includedStart ?? "3i";
  const end = ironSet.includedEnd ?? "PW";
  const startIdx = IRON_SET_LABELS.indexOf(start);
  const endIdx = IRON_SET_LABELS.indexOf(end);
  const minIdx = Math.min(startIdx, endIdx);
  const maxIdx = Math.max(startIdx, endIdx);

  let appliedCount = 0;
  const next = clubs.map((c) => {
    if (c.clubType !== "IRON") return c;
    const clubLabel = normalizeIronSetLabel(c.label);
    if (!clubLabel) return c;
    const idx = IRON_SET_LABELS.indexOf(clubLabel);
    if (idx < minIdx || idx > maxIdx) return c;

    appliedCount++;
    const nextClub: Club = { ...c };

    if (overwrite || isEmptyString(c.shaftName))
      nextClub.shaftName = ironSet.shaftName?.trim() || undefined;
    if (overwrite || isEmptyString(c.shaftFlex))
      nextClub.shaftFlex = ironSet.shaftFlex?.trim() || undefined;
    if (overwrite || isEmptyNumber(c.shaftWeightG))
      nextClub.shaftWeightG = ironSet.shaftWeightG;
    if (overwrite || isEmptyString(c.gripName))
      nextClub.gripName = ironSet.gripName?.trim() || undefined;
    if (overwrite || c.gripSize == null) nextClub.gripSize = ironSet.gripSize;
    if (overwrite || isEmptyNumber(c.gripWraps))
      nextClub.gripWraps = ironSet.gripWraps;

    const templateLoftDeg = (
      loftByLabel as Partial<Record<IronSetLabel, number>>
    )[clubLabel];
    if (templateLoftDeg != null && (overwrite || isEmptyNumber(c.loftDeg))) {
      nextClub.loftDeg = templateLoftDeg;
    }
    return nextClub;
  });

  return { clubs: next, appliedCount };
}

// ─── ClubEditModal ────────────────────────────────────────────────────────────

function ClubEditModal({
  club,
  myClubLabel,
  onSave,
  onCancel,
}: {
  club: Club;
  myClubLabel?: string;
  onSave: (c: Club) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(club.label);
  const [clubType, setClubType] = useState<ClubType>(club.clubType);
  const [loftDeg, setLoftDeg] = useState(
    club.loftDeg === undefined ? "" : String(club.loftDeg)
  );
  const [shaftWeightBand, setShaftWeightBand] = useState(
    club.shaftWeightBand ?? "unknown"
  );
  const [shaftName, setShaftName] = useState(club.shaftName ?? "");
  const [shaftFlex, setShaftFlex] = useState(club.shaftFlex ?? "");
  const [shaftWeightG, setShaftWeightG] = useState(
    club.shaftWeightG === undefined ? "" : String(club.shaftWeightG)
  );
  const [modelName, setModelName] = useState(club.modelName ?? "");
  const [gripName, setGripName] = useState(club.gripName ?? "");
  const [gripSize, setGripSize] = useState<GripSize | "">(club.gripSize ?? "");
  const [gripWraps, setGripWraps] = useState(
    club.gripWraps === undefined ? "" : String(club.gripWraps)
  );
  const [isEnabled, setIsEnabled] = useState(club.isEnabled !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deg =
      loftDeg.trim() === "" ? undefined : parseFloat(loftDeg);
    const gNum =
      shaftWeightG.trim() === "" ? undefined : parseFloat(shaftWeightG);
    const wrapsNum =
      gripWraps.trim() === "" ? undefined : parseFloat(gripWraps);
    onSave({
      ...club,
      label: label.trim() || club.label,
      clubType,
      loftDeg: deg !== undefined && !Number.isNaN(deg) ? deg : undefined,
      shaftWeightBand: shaftWeightBand === "unknown" ? undefined : shaftWeightBand,
      shaftName: shaftName.trim() || undefined,
      shaftFlex: shaftFlex.trim() || undefined,
      shaftWeightG:
        gNum !== undefined && !Number.isNaN(gNum) ? gNum : undefined,
      modelName: modelName.trim() || undefined,
      gripName: gripName.trim() || undefined,
      gripSize: gripSize === "" ? undefined : gripSize,
      gripWraps:
        wrapsNum !== undefined && !Number.isNaN(wrapsNum) ? wrapsNum : undefined,
      isEnabled,
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <h4>クラブを編集</h4>
        {myClubLabel && (
          <p className="modal-myclub-ref">
            ◎ クラブ庫参照中: <strong>{myClubLabel}</strong>
            <span className="modal-myclub-ref-hint">
              （変更分のみ上書き保存されます）
            </span>
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label>label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="1W, 3W, 4U, 7i, PW, 56°"
            />
          </div>
          <div className="modal-field">
            <label>clubType</label>
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
          <div className="modal-field">
            <label>loftDeg（空OK）</label>
            <input
              type="number"
              step="0.5"
              value={loftDeg}
              onChange={(e) => setLoftDeg(e.target.value)}
              placeholder="10.5"
            />
          </div>
          <div className="modal-field">
            <label>shaftWeightBand</label>
            <select
              value={shaftWeightBand}
              onChange={(e) => setShaftWeightBand(e.target.value)}
            >
              {SHAFT_WEIGHT_BAND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>shaftWeightG（g・空OK）</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={shaftWeightG}
              onChange={(e) => setShaftWeightG(e.target.value)}
              placeholder="例: 70"
            />
          </div>
          <div className="modal-field">
            <label>shaftName</label>
            <input
              value={shaftName}
              onChange={(e) => setShaftName(e.target.value)}
              placeholder="Ventus TR Blue 6 など"
            />
          </div>
          <div className="modal-field">
            <label>shaftFlex（空OK）</label>
            <input
              value={shaftFlex}
              onChange={(e) => setShaftFlex(e.target.value)}
              placeholder="R / S / X / TX など"
            />
          </div>
          <div className="modal-field">
            <label>modelName（空OK）</label>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="ヘッドモデル名"
            />
          </div>
          <div className="modal-field">
            <label>gripName</label>
            <input
              value={gripName}
              onChange={(e) => setGripName(e.target.value)}
              placeholder="グリップ名"
            />
          </div>
          <div className="modal-field">
            <label>gripSize</label>
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
          <div className="modal-field">
            <label>gripWraps（空OK）</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={gripWraps}
              onChange={(e) => setGripWraps(e.target.value)}
              placeholder="ラップ数"
            />
          </div>
          <div className="modal-field bag-edit-active-wrap">
            <label>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
              isEnabled（ON）
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel}>
              キャンセル
            </button>
            <button type="submit">OK</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MyClubPickerModal ────────────────────────────────────────────────────────

function MyClubPickerModal({
  myClubs,
  onSelect,
  onCancel,
}: {
  myClubs: MyClub[];
  onSelect: (mc: MyClub) => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box modal-box-wide">
        <h4>クラブ庫から追加</h4>
        {myClubs.length === 0 ? (
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              クラブ庫にクラブがまだ登録されていません。
            </p>
            <p>
              <a href="/my-clubs/new" target="_blank" rel="noopener">
                → クラブ庫で登録する
              </a>
            </p>
          </div>
        ) : (
          <ul className="myclub-picker-list">
            {myClubs.map((mc) => (
              <li key={mc.myClubId} className="myclub-picker-item">
                <button
                  type="button"
                  className="myclub-picker-btn"
                  onClick={() => onSelect(mc)}
                >
                  <span className="myclub-picker-type">
                    {mc.clubType
                      ? (CLUB_TYPE_DISPLAY_LABEL[mc.clubType] ?? mc.clubType)
                      : "—"}
                  </span>
                  <span className="myclub-picker-name">{mc.headName}</span>
                  {mc.label && (
                    <span className="myclub-picker-label">「{mc.label}」</span>
                  )}
                  <span className="myclub-picker-meta">
                    {mc.loftDeg != null ? `${mc.loftDeg}° ` : ""}
                    {mc.shaftName
                      ? `${mc.shaftName}${mc.shaftFlex ? ` ${mc.shaftFlex}` : ""}${mc.shaftWeightG != null ? ` ${mc.shaftWeightG}g` : ""}`
                      : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BagDetailClient ──────────────────────────────────────────────────────────

type Props = { bagId: string };

export default function BagDetailClient({ bagId }: Props) {
  const [bag, setBag] = useState<Bag | null>(null);
  const [lastSavedBag, setLastSavedBag] = useState<Bag | null>(null);
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingClubIndex, setEditingClubIndex] = useState<number | null>(null);
  const [showMyClubsPicker, setShowMyClubsPicker] = useState(false);
  const [showClubDetails, setShowClubDetails] = useState(false);
  const [ironSetOverwrite, setIronSetOverwrite] = useState(false);
  const [ironSetStatus, setIronSetStatus] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"localStorage" | "json" | null>(
    null
  );
  const [activeBagId, setActiveBagId] = useState<string | null>(null);
  const [saveToMyClubStatus, setSaveToMyClubStatus] = useState<string | null>(null);

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
    fetchInitialBags()
      .then((list) => {
        const b = list.find((bagItem) => bagItem.bagId === bagId);
        const active = list.find((bagItem) => bagItem.isActive);
        const copy = b ? (JSON.parse(JSON.stringify(b)) as Bag) : null;
        setBag(copy);
        setLastSavedBag(copy ? (JSON.parse(JSON.stringify(b)) as Bag) : null);
        setDataSource("json");
        setActiveBagId(active?.bagId ?? null);
      })
      .catch(() => setBag(null))
      .finally(() => setLoading(false));
  }, [bagId]);

  useEffect(() => {
    loadBag();
    setMyClubs(getMyClubsFromStorage());
  }, [loadBag]);

  function saveBag(updated: Bag) {
    const stored = getBags() ?? [];
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
    setActiveBagId(
      updated.isActive
        ? updated.bagId
        : (stored.find((b) => b.isActive)?.bagId ?? null)
    );
    setEditMode(false);
  }

  function handleSave() {
    if (!bag) return;
    saveBag(bag);
  }

  function handleCancel() {
    loadBag();
    setMyClubs(getMyClubsFromStorage());
    setEditMode(false);
    setEditingClubIndex(null);
  }

  /** 手入力で空クラブを追加 */
  function addClubManual() {
    if (!bag) return;
    const newId = `c-${Date.now()}`;
    const next = [...bag.clubs, emptyClub(newId)];
    setBag({ ...bag, clubs: next });
    setEditingClubIndex(next.length - 1);
  }

  /** MyClubs から選択してクラブを追加 */
  function addClubFromMyClubs(mc: MyClub) {
    if (!bag) return;
    const newId = `c-${Date.now()}`;
    const newClub: Club = {
      id: newId,
      label: mc.label || mc.headName,
      clubType: mc.clubType ?? "D",
      myClubId: mc.myClubId,
      isEnabled: true,
    };
    const next = [...bag.clubs, newClub];
    setBag({ ...bag, clubs: next });
    setShowMyClubsPicker(false);
  }

  /**
   * クラブを更新する。myClubId がある場合は MyClub との差分のみ overrides に保存し、
   * それ以外のフィールドを除去することでデータを最小化する。
   */
  function updateClub(index: number, editedClub: Club) {
    if (!bag) return;
    const next = [...bag.clubs];
    const original = bag.clubs[index];

    if (original.myClubId) {
      const mc = myClubs.find((m) => m.myClubId === original.myClubId);
      if (mc) {
        const overrides = computeOverridesFromMyClub(editedClub, mc);
        next[index] = {
          id: original.id,
          label: editedClub.label || mc.label || mc.headName,
          clubType: editedClub.clubType,
          myClubId: original.myClubId,
          isEnabled: editedClub.isEnabled,
          ...(overrides ? { overrides } : {}),
        };
        setBag({ ...bag, clubs: next });
        setEditingClubIndex(null);
        return;
      }
    }

    next[index] = editedClub;
    setBag({ ...bag, clubs: next });
    setEditingClubIndex(null);
  }

  function deleteClub(index: number) {
    if (!bag) return;
    const next = bag.clubs.filter((_, i) => i !== index);
    setBag({ ...bag, clubs: next });
  }

  /** バッグのクラブをクラブ庫に保存する */
  function saveClubToMyClubs(club: Club) {
    if (club.myClubId) return; // すでにクラブ庫参照の場合はスキップ
    const now = new Date().toISOString();
    const newMc: MyClub = {
      myClubId: `mc-${Date.now()}`,
      headName: club.modelName?.trim() || club.label?.trim() || "未入力",
      label: club.label?.trim() || undefined,
      clubType: club.clubType,
      loftDeg: club.loftDeg,
      shaftName: club.shaftName,
      shaftFlex: club.shaftFlex,
      shaftWeightG: club.shaftWeightG,
      gripName: club.gripName,
      gripSize: club.gripSize,
      gripWraps: club.gripWraps,
      createdAt: now,
      updatedAt: now,
    };
    addMyClub(newMc);
    setMyClubs(getMyClubsFromStorage());
    setSaveToMyClubStatus(`「${newMc.headName}」をクラブ庫に保存しました`);
    window.setTimeout(() => setSaveToMyClubStatus(null), 2500);
  }

  // ─── early returns ───────────────────────────────────────────────────────

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
        <Link href="/bags" className="bag-detail-back">
          ← 一覧へ
        </Link>
      </main>
    );
  }

  // ─── derived state ───────────────────────────────────────────────────────

  const sorted = [...bag.clubs].sort(
    (a, b) =>
      CLUB_TYPE_ORDER.indexOf(a.clubType) -
      CLUB_TYPE_ORDER.indexOf(b.clubType)
  );

  const diffEdit = editMode
    ? computeDiffFromSnapshot(bag, lastSavedBag ? makeSnapshot(lastSavedBag) : null)
    : null;
  const diffFromPrevious = bag.previousSnapshot
    ? computeDiffFromSnapshot(bag, bag.previousSnapshot)
    : null;

  const ironSetDefaults: IronSet = { includedStart: "3i", includedEnd: "PW" };
  const ironSet: IronSet = { ...ironSetDefaults, ...(bag.ironSet ?? {}) };

  function updateIronSet(patch: Partial<IronSet>) {
    setBag({
      ...bag!,
      ironSet: { ...ironSetDefaults, ...(bag!.ironSet ?? {}), ...patch },
    });
  }

  function handleApplyIronSet() {
    const { clubs: nextClubs, appliedCount } = applyIronSetToClubs(
      bag!.clubs,
      ironSet,
      ironSetOverwrite
    );
    setBag({ ...bag!, clubs: nextClubs });
    setIronSetStatus(`アイアン${appliedCount}本に反映しました`);
    window.setTimeout(() => setIronSetStatus(null), 2500);
  }

  // ─── render ─────────────────────────────────────────────────────────────

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
            <button
              type="button"
              className="bag-detail-save-btn"
              onClick={handleSave}
            >
              保存
            </button>
            <button
              type="button"
              className="bag-detail-cancel-btn"
              onClick={handleCancel}
            >
              キャンセル
            </button>
            <button
              type="button"
              className="bag-detail-add-btn"
              onClick={addClubManual}
            >
              ＋ 手入力で追加
            </button>
            <button
              type="button"
              className="bag-detail-add-from-myclub-btn"
              onClick={() => {
                setMyClubs(getMyClubsFromStorage());
                setShowMyClubsPicker(true);
              }}
            >
              ◎ クラブ庫から追加
            </button>
          </>
        )}
      </div>

      {saveToMyClubStatus && (
        <p className="bag-detail-myclub-status">{saveToMyClubStatus}</p>
      )}

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
                onChange={(e) =>
                  setBag({ ...bag, isActive: e.target.checked })
                }
              />
              今日のセット（isActive）
            </label>
          </div>
        </>
      )}

      {!editMode && <h1 className="page-title">{bag.name}</h1>}
      <p
        style={{
          fontSize: 14,
          color: "var(--color-text-muted)",
          marginBottom: 16,
        }}
      >
        更新: {new Date(bag.updatedAt).toLocaleDateString("ja-JP")} / クラブ{" "}
        {bag.clubs.length} 本
      </p>

      {/* 編集中の差分ログ */}
      {editMode && diffEdit && (
        <section className="bag-diff-log">
          <h3 className="bag-diff-log-title">変更履歴（編集中・未保存）</h3>
          <ul className="bag-diff-log-list">
            {diffEdit.added.map((c) => (
              <li key={clubKey(c)}>
                追加: {c.label || c.clubType}{" "}
                {c.modelName ? `（${c.modelName}）` : ""}
              </li>
            ))}
            {diffEdit.removed.map((c) => (
              <li key={clubKey(c)}>
                削除: {c.label || c.clubType}{" "}
                {c.modelName ? `（${c.modelName}）` : ""}
              </li>
            ))}
            {diffEdit.changed.map(({ club, changes }) => (
              <li key={clubKey(club)}>
                変更: {club.label || club.clubType} —{" "}
                {changes.join(" / ")}
              </li>
            ))}
            {diffEdit.memoChanges.map((line, i) => (
              <li key={`memo-${i}`}>変更（メモ）: {line}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 前回からの変更点 */}
      <section className="bag-diff-log">
        <h3 className="bag-diff-log-title">前回からの変更点</h3>
        {!bag.previousSnapshot ||
        !bag.previousSnapshot.clubs ||
        bag.previousSnapshot.clubs.length === 0 ? (
          <p className="bag-diff-log-empty">
            まだ変更がありません（保存後に表示されます）
          </p>
        ) : diffFromPrevious &&
          (diffFromPrevious.added.length > 0 ||
            diffFromPrevious.removed.length > 0 ||
            diffFromPrevious.changed.length > 0 ||
            diffFromPrevious.memoChanges.length > 0) ? (
          <ul className="bag-diff-log-list">
            {diffFromPrevious.added.map((c) => (
              <li key={clubKey(c)}>追加: {c.label || c.clubType}</li>
            ))}
            {diffFromPrevious.removed.map((c) => (
              <li key={clubKey(c)}>削除: {c.label || c.clubType}</li>
            ))}
            {diffFromPrevious.changed.map(({ club, changes }) => (
              <li key={clubKey(club)}>
                変更: {club.label || club.clubType} — {changes.join(" / ")}
              </li>
            ))}
            {diffFromPrevious.memoChanges.map((line, i) => (
              <li key={`memo-${i}`}>変更（メモ）: {line}</li>
            ))}
          </ul>
        ) : (
          <p className="bag-diff-log-empty">変更なし</p>
        )}
      </section>

      {/* メモ欄 */}
      <section className="bag-memo-card">
        <h3 className="bag-memo-title">メモ欄</h3>
        {editMode ? (
          <div className="bag-memo-form">
            <div className="bag-memo-field">
              <label>用途（purpose）</label>
              <input
                type="text"
                value={bag.purpose ?? ""}
                onChange={(e) =>
                  setBag({ ...bag, purpose: e.target.value.trim() || undefined })
                }
                placeholder="競技/狭いコース/風/テスト"
              />
            </div>
            <div className="bag-memo-field">
              <label>コース（course）</label>
              <input
                type="text"
                value={bag.course ?? ""}
                onChange={(e) =>
                  setBag({ ...bag, course: e.target.value.trim() || undefined })
                }
                placeholder="○○CC"
              />
            </div>
            <div className="bag-memo-field">
              <label>ミス傾向（missTendency）</label>
              <input
                type="text"
                value={bag.missTendency ?? ""}
                onChange={(e) =>
                  setBag({
                    ...bag,
                    missTendency: e.target.value.trim() || undefined,
                  })
                }
                placeholder="左/右/ダフリなど"
              />
            </div>
            <div className="bag-memo-field">
              <label>スコアメモ（scoreMemo）</label>
              <input
                type="text"
                value={bag.scoreMemo ?? ""}
                onChange={(e) =>
                  setBag({
                    ...bag,
                    scoreMemo: e.target.value.trim() || undefined,
                  })
                }
                placeholder="79、80台前半"
              />
            </div>
            <div className="bag-memo-field">
              <label>自由メモ（notes）</label>
              <textarea
                value={bag.notes ?? ""}
                onChange={(e) =>
                  setBag({ ...bag, notes: e.target.value.trim() || undefined })
                }
                placeholder="任意"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <dl className="bag-memo-view">
            <div>
              <dt>用途</dt>
              <dd>{bag.purpose || "—"}</dd>
            </div>
            <div>
              <dt>コース</dt>
              <dd>{bag.course || "—"}</dd>
            </div>
            <div>
              <dt>ミス傾向</dt>
              <dd>{bag.missTendency || "—"}</dd>
            </div>
            <div>
              <dt>スコアメモ</dt>
              <dd>{bag.scoreMemo || "—"}</dd>
            </div>
            <div>
              <dt>メモ</dt>
              <dd>{bag.notes || "—"}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* アイアンセット */}
      {editMode && (
        <section className="bag-iron-set-card">
          <h3 className="bag-iron-set-title">アイアンセット</h3>
          <div className="bag-iron-set-form">
            <div className="bag-iron-set-field">
              <label>headModel（loftDBキー）</label>
              <input
                value={ironSet.headModel ?? ""}
                onChange={(e) =>
                  updateIronSet({ headModel: e.target.value.trim() || undefined })
                }
                placeholder="例: Generic"
              />
            </div>
            <div className="bag-iron-set-field">
              <label>shaftName</label>
              <input
                value={ironSet.shaftName ?? ""}
                onChange={(e) => {
                  const nextName = e.target.value.trim() || undefined;
                  let nextWeight = ironSet.shaftWeightG;
                  if (isEmptyNumber(nextWeight) && nextName) {
                    const found = shaftWeightByName[nextName];
                    if (found != null) nextWeight = found;
                  }
                  updateIronSet({ shaftName: nextName, shaftWeightG: nextWeight });
                }}
                placeholder="シャフト名"
              />
            </div>
            <div className="bag-iron-set-field">
              <label>shaftFlex</label>
              <input
                value={ironSet.shaftFlex ?? ""}
                onChange={(e) =>
                  updateIronSet({ shaftFlex: e.target.value.trim() || undefined })
                }
                placeholder="R / S / X / TX など"
              />
            </div>
            <div className="bag-iron-set-field">
              <label>shaftWeightG（g）</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={ironSet.shaftWeightG ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") return updateIronSet({ shaftWeightG: undefined });
                  const num = Number(raw);
                  updateIronSet({ shaftWeightG: Number.isNaN(num) ? undefined : num });
                }}
                placeholder="例: 70"
              />
            </div>
            <div className="bag-iron-set-field">
              <label>gripName</label>
              <input
                value={ironSet.gripName ?? ""}
                onChange={(e) =>
                  updateIronSet({ gripName: e.target.value.trim() || undefined })
                }
                placeholder="グリップ名"
              />
            </div>
            <div className="bag-iron-set-field">
              <label>gripSize</label>
              <select
                value={ironSet.gripSize ?? ""}
                onChange={(e) =>
                  updateIronSet({
                    gripSize:
                      e.target.value === ""
                        ? undefined
                        : (e.target.value as GripSize),
                  })
                }
              >
                {GRIP_SIZE_OPTIONS.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="bag-iron-set-field">
              <label>gripWraps（任意）</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={ironSet.gripWraps ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") return updateIronSet({ gripWraps: undefined });
                  const num = Number(raw);
                  updateIronSet({ gripWraps: Number.isNaN(num) ? undefined : num });
                }}
                placeholder="ラップ数"
              />
            </div>
            <div className="bag-iron-set-field">
              <label>includedStart</label>
              <select
                value={ironSet.includedStart ?? "3i"}
                onChange={(e) =>
                  updateIronSet({ includedStart: e.target.value as IronSetLabel })
                }
              >
                {IRON_SET_LABELS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="bag-iron-set-field">
              <label>includedEnd</label>
              <select
                value={ironSet.includedEnd ?? "PW"}
                onChange={(e) =>
                  updateIronSet({ includedEnd: e.target.value as IronSetLabel })
                }
              >
                {IRON_SET_LABELS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="bag-iron-set-actions">
            <label className="bag-iron-set-overwrite">
              <input
                type="checkbox"
                checked={ironSetOverwrite}
                onChange={(e) => setIronSetOverwrite(e.target.checked)}
              />
              overwrite（既存を上書き）
            </label>
            <button
              type="button"
              className="bag-iron-set-apply-btn"
              onClick={handleApplyIronSet}
            >
              アイアンに反映
            </button>
          </div>
          {ironSetStatus && (
            <p className="bag-iron-set-status">{ironSetStatus}</p>
          )}
        </section>
      )}

      {/* クラブテーブル */}
      <div className="bag-detail-table-toolbar">
        <label className="bag-detail-details-toggle">
          <input
            type="checkbox"
            checked={showClubDetails}
            onChange={(e) => setShowClubDetails(e.target.checked)}
          />
          詳細表示（シャフト名・重量帯・グリップ）
        </label>
      </div>

      <div className="bag-detail-table-scroll">
        <table className="bag-detail-table">
          <thead>
            <tr>
              <th>label</th>
              <th>clubType</th>
              <th>loftDeg</th>
              <th>シャフト重量</th>
              {showClubDetails && (
                <>
                  <th>shaftWeightBand</th>
                  <th>shaftName</th>
                  <th>shaftFlex</th>
                  <th>gripName</th>
                  <th>gripSize</th>
                  <th>gripWraps</th>
                </>
              )}
              <th>modelName</th>
              <th>isEnabled</th>
              {editMode && <th>操作</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((rawClub) => {
              const c = resolveClub(rawClub, myClubs);
              const rowIndex = bag.clubs.findIndex((x) => x.id === rawClub.id);
              const hasMyClubRef = Boolean(rawClub.myClubId);
              const hasOverrides =
                rawClub.overrides &&
                Object.keys(rawClub.overrides).length > 0;
              const bandCell = (() => {
                const b = (c.shaftWeightBand ?? "").trim();
                if (!b || b === "unknown") return "—";
                return b;
              })();
              return (
                <tr key={rawClub.id}>
                  <td>
                    <span>{c.label || "—"}</span>
                    {hasMyClubRef && (
                      <span
                        className="bag-myclub-badge"
                        title={
                          hasOverrides
                            ? `クラブ庫参照（上書きあり: ${Object.keys(rawClub.overrides!).join(", ")}）`
                            : "クラブ庫参照"
                        }
                      >
                        {hasOverrides ? "◎*" : "◎"}
                      </span>
                    )}
                  </td>
                  <td>{CLUB_TYPE_DISPLAY_LABEL[c.clubType] ?? c.clubType}</td>
                  <td>{c.loftDeg != null ? `${c.loftDeg}°` : "—"}</td>
                  <td>{displayShaftWeightSummary(c)}</td>
                  {showClubDetails && (
                    <>
                      <td>{bandCell}</td>
                      <td>{c.shaftName?.trim() ? c.shaftName : "—"}</td>
                      <td>{c.shaftFlex?.trim() ? c.shaftFlex : "—"}</td>
                      <td>{c.gripName?.trim() ? c.gripName : "—"}</td>
                      <td>{c.gripSize ?? "—"}</td>
                      <td>
                        {c.gripWraps != null && !Number.isNaN(c.gripWraps)
                          ? String(c.gripWraps)
                          : "—"}
                      </td>
                    </>
                  )}
                  <td>{c.modelName ?? "—"}</td>
                  <td>{c.isEnabled !== false ? "ON" : "OFF"}</td>
                  {editMode && (
                    <td>
                      <div className="bag-detail-row-actions">
                        <button
                          type="button"
                          className="bag-detail-edit-row-btn"
                          onClick={() => setEditingClubIndex(rowIndex)}
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          className="bag-detail-delete-btn"
                          onClick={() => deleteClub(rowIndex)}
                        >
                          削除
                        </button>
                        {!hasMyClubRef && (
                          <button
                            type="button"
                            className="bag-detail-save-myclub-btn"
                            title="クラブ庫に保存"
                            onClick={() => saveClubToMyClubs(rawClub)}
                          >
                            庫へ保存
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* クラブ編集モーダル */}
      {editingClubIndex !== null && bag.clubs[editingClubIndex] && (() => {
        const rawClub = bag.clubs[editingClubIndex];
        const resolved = resolveClub(rawClub, myClubs);
        const mc = rawClub.myClubId
          ? myClubs.find((m) => m.myClubId === rawClub.myClubId)
          : undefined;
        return (
          <ClubEditModal
            club={resolved}
            myClubLabel={mc ? (mc.label || mc.headName) : undefined}
            onSave={(c) => updateClub(editingClubIndex, c)}
            onCancel={() => setEditingClubIndex(null)}
          />
        );
      })()}

      {/* MyClubs ピッカーモーダル */}
      {showMyClubsPicker && (
        <MyClubPickerModal
          myClubs={myClubs}
          onSelect={addClubFromMyClubs}
          onCancel={() => setShowMyClubsPicker(false)}
        />
      )}
    </main>
  );
}
