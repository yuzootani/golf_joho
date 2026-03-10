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
    return Response.json({ error: "Failed to load my_bags.json", bags: [] }, { status: 500 });
  }
}
