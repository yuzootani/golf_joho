/**
 * WITB index generator from Google Spreadsheet (public CSV).
 * Format: 1 row = 1 club (witb_rows tab). items_json は使用しない。
 * Env: WITB_SHEET_ID, WITB_SHEETS (default: witb_rows).
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

const SHEET_ID = process.env.WITB_SHEET_ID ?? "";
const SHEETS_RAW = process.env.WITB_SHEETS ?? "witb_rows";
const TABS = SHEETS_RAW.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

type SpecParsed = {
  raw: string;
  loft_label?: number;
  bounce?: number;
  grind?: string;
  loft_actual?: number;
};

function parseSpec(raw: string, category: string): SpecParsed {
  const result: SpecParsed = { raw };
  const s = String(raw ?? "").trim();
  if (!s) return result;
  if (category !== "wedges") return result;

  const match = s.match(/^(\d+)-(\d+)([A-Za-z]+)\s*@(\d+(?:\.\d+)?)$/);
  if (match) {
    result.loft_label = parseInt(match[1], 10);
    result.bounce = parseInt(match[2], 10);
    result.grind = match[3];
    result.loft_actual = parseFloat(match[4]);
  }
  return result;
}

type ShaftParsed = {
  raw: string;
  display?: string;
  aliases?: string[];
};

function parseShaft(raw: string): ShaftParsed {
  const result: ShaftParsed = { raw };
  const s = String(raw ?? "").trim();
  if (!s) return result;

  const parts = s.split(/\s+/).filter(Boolean);
  const aliases: string[] = [];
  const displayParts: string[] = [];
  let hasDg = false;
  let hasTi = false;

  for (const p of parts) {
    if (p === "DG" || p === "dg") {
      aliases.push("DG", "Dynamic Gold", "DynamicGold");
      displayParts.push("Dynamic Gold");
      hasDg = true;
    } else if (p === "TI" || p === "ti") {
      aliases.push("TI", "Tour Issue");
      displayParts.push("Tour Issue");
      hasTi = true;
    } else if (p.match(/^[XSML]\d+/i)) {
      aliases.push(p);
      displayParts.push(p);
    } else {
      aliases.push(p);
      displayParts.push(p);
    }
  }

  if (hasDg && hasTi) aliases.push("DG TI");

  result.display = displayParts.join(" ");
  result.aliases = Array.from(new Set(aliases));
  return result;
}

function getField(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && v !== "") return String(v).trim();
    const lower = k.toLowerCase().replace(/\s+/g, "_");
    const found = Object.keys(row).find(
      (r) => r.toLowerCase().replace(/\s+/g, "_") === lower
    );
    if (found && row[found] != null && row[found] !== "")
      return String(row[found]).trim();
  }
  return "";
}

type WitbIndexItem = {
  id: string;
  player: { id: string; name: string };
  category: string;
  as_of_ym: string;
  slot: string;
  club: { brand: string; model: string };
  spec: SpecParsed;
  shaft: ShaftParsed;
  source: { name: string; url: string; verified: boolean };
  search_text: string;
};

function buildSearchText(item: WitbIndexItem): string {
  const parts: string[] = [];
  if (item.player?.name) parts.push(item.player.name);
  if (item.category) parts.push(item.category);
  if (item.club?.brand) parts.push(item.club.brand);
  if (item.club?.model) parts.push(item.club.model);
  if (item.spec?.raw) parts.push(item.spec.raw);
  if (item.spec?.loft_label != null) parts.push(String(item.spec.loft_label));
  if (item.spec?.loft_actual != null) parts.push(String(item.spec.loft_actual));
  if (item.spec?.bounce != null) parts.push(String(item.spec.bounce));
  if (item.spec?.grind) parts.push(item.spec.grind);
  if (item.shaft?.display) parts.push(item.shaft.display);
  if (item.shaft?.aliases?.length) parts.push(...item.shaft.aliases);
  if (item.source?.name) parts.push(item.source.name);
  return Array.from(new Set(parts)).filter(Boolean).join(" ");
}

function categoryFromTab(tab: string): string {
  const m = tab.match(/^witb_(.+)$/);
  return m ? m[1] : tab;
}

async function fetchTabCsv(
  sheetId: string,
  tab: string
): Promise<string | null> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  console.log("Fetch URL:", url);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error(
        `Fetch failed for ${tab}: status=${res.status} ${res.statusText}, body(200chars)=`,
        body.slice(0, 200)
      );
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`Fetch error for ${tab}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function main() {
  if (!SHEET_ID) {
    console.error("Error: WITB_SHEET_ID env var is required.");
    process.exit(1);
  }
  if (TABS.length === 0) {
    console.error("Error: WITB_SHEETS is empty (default: witb_rows).");
    process.exit(1);
  }

  const outPath = path.join(
    path.resolve(__dirname, ".."),
    "public",
    "witb_index.json"
  );
  const allItems: WitbIndexItem[] = [];
  let totalBeforeVerified = 0;
  let totalAfterVerified = 0;
  let headerKeysPrinted = false;

  for (const tab of TABS) {
    const csv = await fetchTabCsv(SHEET_ID, tab);
    if (!csv) {
      console.warn(`Fetch failed for tab: ${tab}`);
      continue;
    }

    const text = csv.replace(/^\uFEFF/, "");
    let rows: Record<string, unknown>[];
    try {
      rows = parse(text, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true,
      });
    } catch (err) {
      console.error(`Failed to parse CSV from ${tab}:`, err);
      continue;
    }

    console.log(`Fetched ${rows.length} rows from ${tab}`);
    totalBeforeVerified += rows.length;

    if (rows.length > 0 && !headerKeysPrinted) {
      console.log("Header keys:", Object.keys(rows[0]));
      headerKeysPrinted = true;
    }

    const categoryFallback = categoryFromTab(tab);

    for (const row of rows) {
      const verified = getField(row as Record<string, string>, "verified", "Verified").toUpperCase();
      if (verified !== "TRUE") continue;

      totalAfterVerified += 1;

      const player_id = getField(row as Record<string, string>, "player_id", "player id");
      const player_name = getField(row as Record<string, string>, "player_name", "player name");
      const category =
        getField(row as Record<string, string>, "category", "Category") ||
        categoryFallback;
      const as_of_date = getField(row as Record<string, string>, "as_of_date", "as_of_ym", "as of date", "as of ym");
      const as_of_ym = as_of_date || getField(row as Record<string, string>, "as_of_ym");
      const slot = getField(row as Record<string, string>, "slot", "Slot");
      const brand = getField(row as Record<string, string>, "brand", "Brand");
      const model = getField(row as Record<string, string>, "model", "Model");
      const specRaw = getField(row as Record<string, string>, "spec", "Spec");
      const shaftRaw = getField(row as Record<string, string>, "shaft", "Shaft");
      const source_name = getField(row as Record<string, string>, "source_name", "source name");
      const source_url = getField(row as Record<string, string>, "source_url", "source url");

      const spec = parseSpec(specRaw, category);
      const shaft = parseShaft(shaftRaw);

      const item: WitbIndexItem = {
        id: `${player_id}|${as_of_ym}|${category}|${slot}`,
        player: { id: player_id, name: player_name },
        category,
        as_of_ym,
        slot,
        club: { brand, model },
        spec,
        shaft,
        source: {
          name: source_name,
          url: source_url,
          verified: true,
        },
        search_text: "",
      };

      item.search_text = buildSearchText(item);
      allItems.push(item);
    }
  }

  console.log(
    `Rows: ${totalBeforeVerified} (before verified) -> ${totalAfterVerified} (after verified)`
  );

  const seen = new Set<string>();
  const unique = allItems.filter((it) => {
    if (seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });

  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2), "utf-8");
  console.log(`Generated ${unique.length} items -> ${outPath}`);

  // player_stats タブを取得して public/player_stats.json を生成
  const statsTab = "player_stats";
  const statsCsv = await fetchTabCsv(SHEET_ID, statsTab);
  if (statsCsv) {
    const statsText = statsCsv.replace(/^\uFEFF/, "");
    let statsRows: Record<string, unknown>[] = [];
    try {
      statsRows = parse(statsText, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        bom: true,
      });
    } catch (statsErr) {
      console.error("Failed to parse player_stats CSV:", statsErr);
    }
    if (statsRows.length > 0) {
      type PlayerStatRow = {
        stat_key: string;
        stat_label_en: string;
        stat_label_ja: string;
        value: string;
        unit: string;
        rank: string;
        source_name: string;
        source_url: string;
        notes: string;
      };
      type PlayerStatsByYear = Record<string, PlayerStatRow[]>;
      const byYearAndPlayer: Record<string, PlayerStatsByYear> = {};
      for (const row of statsRows) {
        const r = row as Record<string, string>;
        const player_id = getField(r, "player_id", "player id");
        if (!player_id) continue;
        const as_of_year = getField(r, "as_of_year", "as of year") || "_";
        const stat_key = getField(r, "stat_key", "stat key");
        const stat_label_en = getField(r, "stat_label_en", "stat label en");
        const stat_label_ja = getField(r, "stat_label_ja", "stat label ja");
        const value = getField(r, "value", "Value");
        const unit = getField(r, "unit", "Unit");
        const rank = getField(r, "rank", "Rank");
        const source_name = getField(r, "source_name", "source name");
        const source_url = getField(r, "source_url", "source url");
        const notes = getField(r, "notes", "Notes");
        if (!byYearAndPlayer[as_of_year]) {
          byYearAndPlayer[as_of_year] = {};
        }
        if (!byYearAndPlayer[as_of_year][player_id]) {
          byYearAndPlayer[as_of_year][player_id] = [];
        }
        byYearAndPlayer[as_of_year][player_id].push({
          stat_key,
          stat_label_en,
          stat_label_ja,
          value,
          unit,
          rank,
          source_name,
          source_url,
          notes,
        });
      }
      const statsOutPath = path.join(path.resolve(__dirname, ".."), "public", "player_stats.json");
      fs.writeFileSync(statsOutPath, JSON.stringify(byYearAndPlayer, null, 2), "utf-8");
      const totalStats = Object.values(byYearAndPlayer).reduce(
        (sum, byPlayer) => sum + Object.values(byPlayer).reduce((s, arr) => s + arr.length, 0),
        0
      );
      console.log(`Generated player_stats.json: ${totalStats} rows -> ${statsOutPath}`);
    }
  } else {
    console.warn(`player_stats tab not found or fetch failed. Skipping player_stats.json.`);
  }
}

main();
