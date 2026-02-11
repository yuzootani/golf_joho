const CATEGORIES = [
  { href: "/witb/wedges", label: "Wedges" },
  { href: "/witb/drivers", label: "Drivers" },
  { href: "/witb/fairway-woods", label: "Fairway Woods" },
  { href: "/witb/utility", label: "Utility (UT)" },
  { href: "/witb/irons", label: "Irons" },
  { href: "/witb/grips", label: "Grips" },
];

export default function WitbHubPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>WITB Hub</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        カテゴリ別にWITBの検証済みデータを見られます。
      </p>

      <ul style={{ marginTop: 16, lineHeight: 1.9 }}>
        {CATEGORIES.map((c) => (
          <li key={c.href}>
            <a href={c.href}>{c.label}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
