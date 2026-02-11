type WitbRow = {
  player_id: string;
  player_name?: string;
  category: string;
  as_of_date: string;
  published_date?: string;
  source_name: string;
  source_url: string;
  items_json: string;
  notes?: string;
  verified: boolean;
};

async function fetchWitb(sheet: string): Promise<WitbRow[]> {
  const base = process.env.WITB_API_BASE_URL;
  const token = process.env.WITB_API_TOKEN;
  if (!base || !token) return [];

  const url = `${base}?sheet=${encodeURIComponent(sheet)}&token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  return Array.isArray(data) ? data : [];
}

export default async function WedgesHubPage() {
  const rows = await fetchWitb("witb_wedges");

  return (
    <main style={{ padding: 24 }}>
      <h1>WITB – Wedges</h1>

      {rows.length === 0 ? (
        <p>データがまだありません（verified=true の行がない可能性）</p>
      ) : (
        rows.map((r) => {
          let items: any[] = [];
          try {
            items = JSON.parse(r.items_json);
          } catch {
            items = [];
          }

          return (
            <section
              key={`${r.player_id}-${r.as_of_date}`}
              style={{ border: "1px solid #ddd", padding: 16, marginTop: 16 }}
            >
              <h2>
                {r.player_name || r.player_id} / {r.as_of_date}
              </h2>

              <div style={{ marginBottom: 8 }}>
                Source:{" "}
                <a href={r.source_url} target="_blank" rel="noreferrer">
                  {r.source_name}
                </a>
                {r.published_date ? `（公開日: ${r.published_date}）` : null}
              </div>

              <ul>
                {items.map((item, i) => (
                  <li key={i}>
                    <strong>{item.slot}</strong> – {item.brand} {item.model}
                    {item.spec ? ` (${item.spec})` : ""}
                    {item.shaft ? ` / Shaft: ${item.shaft}` : ""}
                  </li>
                ))}
              </ul>

              {r.notes ? <div style={{ marginTop: 8 }}>Note: {r.notes}</div> : null}
            </section>
          );
        })
      )}

      <p style={{ marginTop: 24 }}>
        <a href="/witb">← WITB Hubへ戻る</a>
      </p>
    </main>
  );
}
