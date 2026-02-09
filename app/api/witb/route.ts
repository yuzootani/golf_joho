export async function GET() {
    const base = process.env.WITB_API_BASE_URL;
    const token = process.env.WITB_API_TOKEN;
  
    if (!base || !token) {
      return Response.json(
        { error: "Missing env: WITB_API_BASE_URL or WITB_API_TOKEN" },
        { status: 500 }
      );
    }
  
    const url =
      `${base}?mode=latest&token=` + encodeURIComponent(token);
  
    const res = await fetch(url, { next: { revalidate: 300 } });
    const data = await res.json();
  
    return Response.json(data, { status: res.ok ? 200 : 500 });
  }
  