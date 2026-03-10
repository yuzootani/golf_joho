import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "pro_reference_bags.json");
    const raw = await readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as Record<string, unknown>;
    return Response.json(data);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load pro_reference_bags.json" }, { status: 500 });
  }
}
