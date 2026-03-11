import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "my_bags.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as { bags?: unknown[] };
    const bags = Array.isArray(data?.bags) ? data.bags : [];
    return Response.json({ bags });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error && e.message.includes("ENOENT")
      ? "data/my_bags.json が見つかりません。ファイルを配置してください。"
      : "data/my_bags.json の読み込みに失敗しました。";
    return Response.json({ error: message, bags: [] }, { status: 500 });
  }
}
