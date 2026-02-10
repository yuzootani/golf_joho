const CATEGORIES = [
    { slug: "wedges", label: "Wedges", sheet: "witb_wedges" },
    { slug: "drivers", label: "Drivers", sheet: "witb_drivers" },
    { slug: "fairway-woods", label: "Fairway Woods", sheet: "witb_fairway_woods" },
    { slug: "utility", label: "Utility (UT)", sheet: "witb_utility" },
    { slug: "irons", label: "Irons", sheet: "witb_irons" },
    { slug: "grips", label: "Grips", sheet: "witb_grips" },
  ];
  
  export default function WitbHubPage() {
    return (
      <main style={{ padding: 16 }}>
        <h1>WITB Hub</h1>
        <p>カテゴリ別に、検証済み（verified）データの最新を一覧します。</p>
  
        <div style={{ marginTop: 16, display: "grid", gap: 12, maxWidth: 720 }}>
          {CATEGORIES.map((c) => (
            <a
              key={c.slug}
              href={`/witb/${c.slug}`}
              style={{
                display: "block",
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>{c.label}</div>
              <div style={{ opacity: 0.7, marginTop: 4 }}>Sheet: {c.sheet}</div>
            </a>
          ))}
        </div>
      </main>
    );
  }
  