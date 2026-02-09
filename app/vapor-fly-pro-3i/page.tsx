"use client";

import { useState } from "react";

type Snapshot = {
  count?: number; // 手入力でOK（無ければ非表示）
  minPrice?: number; // JPYなら円、USDならドル
  maxPrice?: number;
  currency: "JPY" | "USD";
  lastUpdated: string; // "2026-02-05 18:10"
};

type Marketplace = {
  name: string;
  region: "国内" | "海外";
  href: string;
  note?: string;
  queryHint?: string;
  snapshot?: Snapshot;
};

type Source = { label: string; href: string; note?: string };

type CommunityLink = { label: string; href: string; note?: string };

type DomesticShop = { name: string; href: string; note: string };

type WitbEntry = { player: string; when: string; label: string; href: string; note?: string };

type Video = {
  title: string;
  href: string;
  creator?: string;
  topic?: string;
  note?: string;
  startSeconds?: number;
};

const club = {
  name: "Nike Vapor Fly Pro 3 Iron",
  aboutBullets: [
    "市販終了後も探され続ける3番アイアン。いま手に入る可能性をまとめています。",
    "2016年発売のナイキ最終期モデル。市販終了・中古中心の“探すクラブ”",
    "同一モデル3Iを2016–2026年に渡り使用するプロがいる（WITB掲載が長期に渡る）",
    "新品流通はなく、中古・オークションで探されている",
    "3I / Driving用途の文脈で語られやすく、代替が見つからないという評価が多い",
  ],
  basicInfo: {
    releaseYear: "2016年",
    maker: "Nike",
    model: "Vapor Fly Pro",
    number: "3番",
    loft: "19度",
    lie: "59度",
    position: "3番アイアン・Driving用途",
  },
  proUsage: [
    { name: "Brooks Koepka", period: "2016–2026" },
    { name: "Tony Finau", period: "参考" },
  ],
  whySeek: [
    "同一モデルの3Iを2016年から長期にわたり使用し続けているプロがいる（WITBで確認可能）。",
    "新品は流通しておらず、中古・オークションで探すクラブとして知られている。",
    "コミュニティでは「代替が見つからない」という声が多く、今も探し続ける人がいる。",
  ],
  highlights: [
    "市販終了・中古中心の“探すクラブ”",
    "WITB掲載が長期に渡る（2016→2026）",
    "3I / Driving用途の文脈で語られやすい",
  ],
  marketplaces: [
    {
      name: "メルカリ",
      region: "国内",
      href: "https://www.mercari.com/jp/search/?keyword=Nike%20Vapor%20Fly%20Pro%203%20%E3%82%A2%E3%82%A4%E3%82%A2%E3%83%B3",
      note: "流通の中心。状態差が大きい",
      queryHint: "Vapor Fly Pro 3 / ナイキ ヴェイパー フライ プロ 3",
      // ↓ ここは手入力で更新（まずは仮でOK）
      snapshot: {
        count: 3,
        minPrice: 10000,
        maxPrice: 40000,
        currency: "JPY",
        lastUpdated: "2026-02-05 18:10",
      },
    },
    {
      name: "ヤフオク",
      region: "国内",
      href: "https://auctions.yahoo.co.jp/search/search?p=Nike+Vapor+Fly+Pro+3",
      note: "終了品で相場感も掴める",
      queryHint: "Vapor Fly Pro 3 / Vapor Fly Pro 3 iron",
      snapshot: {
        count: 2,
        minPrice: 12000,
        maxPrice: 45000,
        currency: "JPY",
        lastUpdated: "2026-02-05 18:10",
      },
    },
    {
      name: "ゴルフパートナー",
      region: "国内",
      href: "https://www.golfpartner.jp/search?q=Vapor%20Fly%20Pro",
      note: "出たり消えたり。不定期チェック",
      queryHint: "Vapor Fly Pro / Vapor Fly Pro 3",
      snapshot: {
        count: 1,
        minPrice: 18000,
        maxPrice: 38000,
        currency: "JPY",
        lastUpdated: "2026-02-05 18:10",
      },
    },
    {
      name: "eBay",
      region: "海外",
      href: "https://www.ebay.com/sch/i.html?_nkw=Nike+Vapor+Fly+Pro+3+iron",
      note: "US仕様・表記に注意",
      queryHint: "Nike Vapor Fly Pro 3 iron",
      snapshot: {
        count: 6,
        minPrice: 80,
        maxPrice: 180,
        currency: "USD",
        lastUpdated: "2026-02-05 18:10",
      },
    },
    {
      name: "2nd Swing",
      region: "海外",
      href: "https://www.2ndswing.com/golf-clubs/iron-sets?q=Nike+Vapor+Fly+Pro",
      note: "米国・アイアンセット中心",
      queryHint: "Nike Vapor Fly Pro 3 iron",
    },
    {
      name: "Golfbidder",
      region: "海外",
      href: "https://www.golfbidder.co.uk/golf-clubs/irons",
      note: "英国・欧州。サイト内でNike検索",
      queryHint: "Nike Vapor Fly Pro",
    },
    {
      name: "Golf Avenue",
      region: "海外",
      href: "https://www.golfavenue.ca/en/c/clubs/irons",
      note: "北米・中古アイアン",
      queryHint: "Nike Vapor Fly Pro",
    },
    {
      name: "SidelineSwap",
      region: "海外",
      href: "https://www.sidelineswap.com/shop/golf/l62?query=Nike+Vapor+Fly+Pro",
      note: "スポーツ中古マーケット",
      queryHint: "Nike Vapor Fly Pro 3 iron",
    },
  ] as Marketplace[],
  communityLinks: [
    {
      label: "MyCaddie",
      href: "https://mycaddie.jp/",
      note: "クラブのレビュー・口コミ・使用感が分かる",
    },
    {
      label: "Reddit r/golf",
      href: "https://www.reddit.com/r/golf/search/?q=Nike+Vapor+Fly+Pro+3",
      note: "海外ゴルファーの感想・議論が分かる",
    },
    {
      label: "GolfWRX フォーラム",
      href: "https://forums.golfwrx.com/search/?q=Nike%20Vapor%20Fly%20Pro%20%233&quick=1&type=forums_topic&nodes=12",
      note: "Vapor Fly Pro #3 のスレッド・専門的な議論が分かる",
    },
  ] as CommunityLink[],
  domesticShops: [
    {
      name: "ゴルフパートナー",
      href: "https://www.golfpartner.jp/search?q=Vapor%20Fly%20Pro",
      note: "在庫量が多く、状態表記が丁寧",
    },
    {
      name: "GDO 中古クラブ",
      href: "https://www.gdo-shop.jp/used/",
      note: "名器が眠ることがある。定期的にチェック",
    },
    {
      name: "ゴルフ5 中古",
      href: "https://www.golf5.co.jp/used/",
      note: "状態が良い中古品が多い",
    },
    {
      name: "二木ゴルフ",
      href: "https://www.nikigolf.co.jp/used/",
      note: "中古クラブの品揃えが豊富",
    },
    {
      name: "つるやゴルフ",
      href: "https://www.tsuruya-golf.com/used/",
      note: "信頼できる中古ショップ",
    },
    {
      name: "ゴルフドゥ",
      href: "https://www.golfdo.co.jp/used/",
      note: "中古クラブの検索がしやすい",
    },
    {
      name: "ゴルフエース",
      href: "https://ec.golf-kace.com/",
      note: "中古クラブの取り扱いあり",
    },
    {
      name: "ゴルフエフォート",
      href: "https://golfeffort.com/",
      note: "中古クラブの品揃えが良い",
    },
  ] as DomesticShop[],
  communitySummary: {
    title: "よく見られる口コミの傾向",
    bullets: [
      "3番アイアンとしてティーショット用途で評価されている",
      "代替モデルが見つからず、長く使い続けているという声が多い",
      "中古購入でも状態次第で十分実戦投入できるという意見",
    ],
    note: "MyCaddie、GolfWRX、Reddit など複数の投稿を編集要約しています。",
  },
  why: [
    "2016〜2026年にかけて WITB に継続して登場し、同一系統の3Iを長期運用している稀な例。",
    "新品流通がほぼなく、中古・オークション中心で「探すクラブ」になっている。",
    "コミュニティ（GolfWRX 等）でも『代替が見つからない』文脈の言及が見られる。",
  ],
  witb: [
    {
      player: "Brooks Koepka",
      when: "2016",
      label: "クラブセッティング（WITB）（2016）",
      href: "https://www.golfwrx.com/351072/brooks-koepka-witb-2016/",
    },
    {
      player: "Brooks Koepka",
      when: "2026 Jan",
      label: "クラブセッティング（WITB）（2026年1月）",
      href: "https://www.golfwrx.com/772517/brooks-koepka-witb-2026-january/",
      note: "同一3I継続使用の記録",
    },
    {
      player: "Tony Finau",
      when: "2025年5月",
      label: "クラブセッティング（WITB）（2025年5月）",
      href: "https://www.golfwrx.com/760806/tony-finau-witb-2025-may/",
    },
  ] as WitbEntry[],
  notes: [
    "「Vapor Fly」と「Vapor Fly Pro」が混同されやすい。商品名・刻印・形状を要確認。",
    "中古は状態差が大きい（溝・フェース・ソール）。写真が少ない出品は避けるのが無難。",
    "プロ/上級者はリシャフト前提のことが多い。純正シャフト前提で判断しない。",
    "『Tour issue』『プロ支給』表記は真偽確認が難しい。出品者評価や根拠をチェック。",
  ],
  videos: [
    {
      title: "Nike Vapor Fly Pro 3I 試打（実打）",
      creator: "YouTube",
      topic: "3番アイアンとしての球質・使いどころを確認",
      href: "https://youtu.be/ZlaYPVD-99o",
    },
    {
      title: "Nike Vapor Fly Pro の評価・レビュー（比較/文脈）",
      creator: "YouTube",
      topic: "名器として語られる理由や比較の視点",
      href: "https://youtu.be/Yn8gSqCbg50",
    },
    {
      title: "Koepka関連：言及シーン",
      creator: "YouTube",
      topic: "バッグ/クラブ紹介の流れで3Iが登場",
      href: "https://youtu.be/DnB-Y6_rOIk?si=EKfLDUBkEQiggg9p",
      note: "29:04 付近から",
      startSeconds: 29 * 60 + 4,
    },
  ] as Video[],
  sources: [
    {
      label: "GolfWRX フォーラム検索（Vapor Fly Pro #3）",
      href: "https://forums.golfwrx.com/search/?q=Nike%20Vapor%20Fly%20Pro%20%233&quick=1&type=forums_topic&nodes=12",
    },
    {
      label: "Koepka WITB（2016）",
      href: "https://www.golfwrx.com/351072/brooks-koepka-witb-2016/",
    },
    {
      label: "Koepka WITB（2026 Jan）",
      href: "https://www.golfwrx.com/772517/brooks-koepka-witb-2026-january/",
    },
  ] as Source[],
};

function ClubIcon() {
  // 著作権を避けた“自作”のシンプルSVG（3Iの雰囲気だけ）
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
      <rect x="18" y="18" width="84" height="84" rx="18" fill="currentColor" opacity="0.06" />
      <path
        d="M42 78c10-26 14-36 28-44 6-3 12-2 16 2 4 4 4 10 1 16-8 14-18 18-45 26z"
        fill="currentColor"
        opacity="0.18"
      />
      <path d="M38 82l50-26" stroke="currentColor" strokeWidth="4" opacity="0.35" />
      <text x="60" y="66" textAnchor="middle" fontSize="20" fill="currentColor" opacity="0.65">
        3I
      </text>
    </svg>
  );
}

function formatPriceRange(s?: Snapshot) {
  if (!s || s.minPrice == null || s.maxPrice == null) return null;
  const symbol = s.currency === "JPY" ? "¥" : "$";
  const min = s.minPrice.toLocaleString();
  const max = s.maxPrice.toLocaleString();
  return `${symbol}${min} – ${symbol}${max}`;
}

function youtubeId(url: string) {
  try {
    const u = new URL(url);

    // youtu.be/<id>
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.split("/").filter(Boolean)[0] || null;
    }

    // youtube.com/watch?v=<id>
    if (u.searchParams.get("v")) return u.searchParams.get("v");

    // youtube.com/shorts/<id>
    const parts = u.pathname.split("/").filter(Boolean);
    const shortsIdx = parts.indexOf("shorts");
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];

    // youtube.com/embed/<id>
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1];

    return null;
  } catch {
    return null;
  }
}

function youtubeThumb(url: string) {
  const id = youtubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<"stock" | "videos" | "community">("stock");

  return (
    <main className="wrap">
      <header className="hero">
        <div className="heroLeft">
          <h1 className="title">{club.name}</h1>

          <div className="tabRow" style={{ marginTop: 16 }}>
            <button
              className={`tab ${activeTab === "stock" ? "active" : ""}`}
              onClick={() => setActiveTab("stock")}
            >
              在庫
            </button>
            <button
              className={`tab ${activeTab === "videos" ? "active" : ""}`}
              onClick={() => setActiveTab("videos")}
            >
              動画・実戦文脈
            </button>
            <button
              className={`tab ${activeTab === "community" ? "active" : ""}`}
              onClick={() => setActiveTab("community")}
            >
              コミュニティ・評価
            </button>
          </div>
        </div>

        <div className="heroRight">
          <div className="updateDate">
            <div className="updateDateLabel">最終更新</div>
            <div className="updateDateValue">
              {club.marketplaces[0]?.snapshot?.lastUpdated ?? "-"}
            </div>
          </div>
        </div>
      </header>

      {/* このクラブについて - 横長カード */}
      <div className="aboutCard">
        <div className="aboutCardCol">
          <h3 className="h3">このクラブについて</h3>
          <ul className="bullets">
            {club.aboutBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
        <div className="aboutCardCol">
          <h3 className="h3">基本情報</h3>
          <dl className="specTable">
            <dt>発売年</dt>
            <dd>{club.basicInfo.releaseYear}</dd>
            <dt>メーカー</dt>
            <dd>{club.basicInfo.maker}</dd>
            <dt>モデル</dt>
            <dd>{club.basicInfo.model}</dd>
            <dt>番手</dt>
            <dd>{club.basicInfo.number}</dd>
            <dt>ロフト角</dt>
            <dd>{club.basicInfo.loft}</dd>
            <dt>ライ角</dt>
            <dd>{club.basicInfo.lie}</dd>
            <dt>位置づけ</dt>
            <dd>{club.basicInfo.position}</dd>
          </dl>
        </div>
        <div className="aboutCardCol">
          <h3 className="h3">使用が確認されているプロ</h3>
          <ul className="bullets">
            {club.proUsage.map((p) => (
              <li key={p.name}>{p.name}（{p.period}）</li>
            ))}
          </ul>
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === "stock" && (
        <section className="section">
          {/* 在庫状況サマリー */}
          <div className="stockSummaryCard">
            <div className="stockSummaryHeader">
              <h2 className="h2" style={{ margin: 0 }}>在庫状況サマリー</h2>
              <div className="stockSummaryInline">
                <div className="stockSummaryInlineItem">
                  <span className="stockSummaryInlineLabel">国内</span>
                  <span className="stockSummaryInlineValue">
                    {club.marketplaces
                      .filter((m) => m.region === "国内")
                      .reduce((a, m) => a + (m.snapshot?.count ?? 0), 0)}
                    件
                  </span>
                </div>
                <div className="stockSummaryInlineItem">
                  <span className="stockSummaryInlineLabel">海外</span>
                  <span className="stockSummaryInlineValue">
                    {club.marketplaces
                      .filter((m) => m.region === "海外")
                      .reduce((a, m) => a + (m.snapshot?.count ?? 0), 0)}
                    件
                  </span>
                </div>
              </div>
            </div>
            <p className="muted2" style={{ marginTop: 8, marginBottom: 0, fontSize: "12px" }}>
              件数・価格は目安です。在庫は流動的なので、最終的にはリンク先で確認してください。
            </p>
          </div>

          {/* 在庫あり（いま確認できているショップ） */}
          <div style={{ marginTop: 24 }}>
            <h2 className="h2" style={{ marginBottom: 12 }}>
              在庫あり（いま確認できているショップ）
            </h2>
            <div className="grid2">
              {(["国内", "海外"] as const).map((region) => {
                const withStock = club.marketplaces.filter(
                  (m) => m.region === region && (m.snapshot?.count ?? 0) > 0
                );
                if (withStock.length === 0) return null;

                return (
                  <div key={region} className="panel">
                    <h3 className="h3">{region}</h3>
                    <div className="cards">
                      {withStock.map((m) => {
                        const range = formatPriceRange(m.snapshot);
                        return (
                          <a key={m.href} className="mCard" href={m.href} target="_blank" rel="noreferrer">
                            <div className="mTop">
                              <div className="mName">{m.name}</div>
                              {m.snapshot?.count !== undefined && <span className="pill">{m.snapshot.count}件</span>}
                            </div>

                            {m.snapshot && (
                              <div className="mMeta">
                                {range && (
                                  <div className="mPrice">
                                    {range}
                                    <span className="mSmall">（目安）</span>
                                  </div>
                                )}
                                <div className="mUpdated">最終更新：{m.snapshot.lastUpdated}</div>
                              </div>
                            )}

                            {m.note && <div className="mNote">{m.note}</div>}
                            {m.queryHint && <div className="mHint">検索ワード例：{m.queryHint}</div>}

                            <div className="mGo">検索結果へ →</div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 定期的にチェックしたい中古ショップ（在庫は流動的） */}
          <div style={{ marginTop: 34 }}>
            <h2 className="h2" style={{ marginBottom: 12 }}>
              定期的にチェックしたい中古ショップ（在庫は流動的）
            </h2>
            <p className="muted2" style={{ marginBottom: 16 }}>
              在庫は流動的なので定期的にチェックしてください。
            </p>

            {/* 定期チェック - マーケットプレイス */}
            <div className="grid2" style={{ marginBottom: 24 }}>
              {(["国内", "海外"] as const).map((region) => {
                const noStock = club.marketplaces.filter(
                  (m) => m.region === region && (!m.snapshot || (m.snapshot?.count ?? 0) === 0)
                );
                if (noStock.length === 0) return null;

                return (
                  <div key={region} className="panel">
                    <h3 className="h3">{region}</h3>
                    <div className="cards">
                      {noStock.map((m) => {
                        return (
                          <a key={m.href} className="mCard" href={m.href} target="_blank" rel="noreferrer">
                            <div className="mTop">
                              <div className="mName">{m.name}</div>
                            </div>
                            {m.note && <div className="mNote">{m.note}</div>}
                            {m.queryHint && <div className="mHint">検索ワード例：{m.queryHint}</div>}
                            <div className="mGo">検索結果へ →</div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 定期チェック - 国内中古ショップ（在庫ありに出ているものは除外） */}
            {(() => {
              const withStockNames = club.marketplaces
                .filter((m) => (m.snapshot?.count ?? 0) > 0)
                .map((m) => m.name);
              const shopsToShow = club.domesticShops.filter(
                (shop) => !withStockNames.includes(shop.name)
              );

              if (shopsToShow.length === 0) return null;

              return (
                <div>
                  <h3 className="h3" style={{ marginBottom: 12 }}>国内中古ショップ</h3>
                  <div className="list">
                    {shopsToShow.map((shop) => (
                      <a key={shop.href} className="item" href={shop.href} target="_blank" rel="noreferrer">
                        <div className="itemTitle">{shop.name}</div>
                        <div className="itemNote">{shop.note}</div>
                        <div style={{ marginTop: 6, fontSize: "13px", fontWeight: 800, opacity: 0.9 }}>
                          ショップへ →
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {activeTab === "videos" && (
        <section className="section">
          <h2 className="h2">動画・実戦文脈</h2>
          <div className="videoGrid">
            {club.videos.map((v) => {
              const thumb = youtubeThumb(v.href);
              const urlWithTime =
                v.startSeconds ? `${v.href}${v.href.includes("?") ? "&" : "?"}t=${v.startSeconds}s` : v.href;

              return (
                <a key={v.href} className="vCard" href={urlWithTime} target="_blank" rel="noreferrer">
                  {thumb ? <img className="vThumb" src={thumb} alt={v.title} /> : <div className="vThumb ph" />}
                  <div className="vBody">
                    <div className="vTitle">{v.title}</div>
                    {v.topic && <div className="vNote">{v.topic}</div>}
                    {v.note && <div className="vNote">{v.note}</div>}
                    <div className="vGo">動画へ →</div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "community" && (
        <section className="section">
          <h2 className="h2">コミュニティ・評価</h2>
          <div className="panel" style={{ marginTop: 12 }}>
            <h3 className="h3">{club.communitySummary.title}</h3>
            <ul className="bullets">
              {club.communitySummary.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="footnote" style={{ marginTop: 10, marginBottom: 0 }}>
              {club.communitySummary.note}
            </p>
          </div>
          <h3 className="h3" style={{ marginTop: 16, marginBottom: 10 }}>
            口コミ・議論を確認するリンク
          </h3>
          <div className="list">
            {club.communityLinks.map((c) => (
              <a key={c.href} className="item" href={c.href} target="_blank" rel="noreferrer">
                <div className="itemTitle">{c.label}</div>
                {c.note && <div className="itemNote">{c.note}</div>}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* WITB - Always visible */}
      <section className="section">
        <h2 className="h2">
          使用プロのクラブセッティング<span className="witbSub">（WITB）</span>
        </h2>
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="witbGrid">
            {club.witb.map((w) => (
              <a key={w.href} className="witbCard" href={w.href} target="_blank" rel="noreferrer">
                <div className="witbPlayer">{w.player}</div>
                <div className="witbWhen">{w.when}</div>
                <div className="witbLabel">{w.label}</div>
                {w.note && <div className="witbNote">{w.note}</div>}
                <div className="witbGo">記事へ →</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* NOTES */}
      <section className="section">
        <h2 className="h2">中古・オークションの注意点</h2>
        <details className="details" open>
          <summary>クリックして確認（重要チェック）</summary>
          <ul className="check">
            {club.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </details>
      </section>

      {/* NEXT */}
      <section className="section">
        <h2 className="h2">次に見る（他の名器も探す）</h2>
        <div className="nextGrid">
          <a className="nextCard" href="/tags/driving-iron">
            <div className="nextTitle">Driving Iron / 3I</div>
            <div className="nextNote">同じ用途の名器を横断で探す</div>
          </a>
          <a className="nextCard" href="/tags/nike">
            <div className="nextTitle">Nike 名器</div>
            <div className="nextNote">ナイキ時代の“探すクラブ”一覧</div>
          </a>
          <a className="nextCard" href="/">
            <div className="nextTitle">名器一覧へ</div>
            <div className="nextNote">在庫探索ハブのトップへ</div>
          </a>
        </div>
      </section>

      <style jsx>{`
        .wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 18px 80px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          line-height: 1.6;
        }
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
          margin-bottom: 34px;
        }
        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
          }
        }
        .updateDate {
          text-align: right;
          padding: 12px 0;
        }
        .updateDateLabel {
          font-size: 12px;
          opacity: 0.7;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .updateDateValue {
          font-size: 18px;
          font-weight: 900;
          color: #111;
        }
        @media (max-width: 900px) {
          .updateDate {
            text-align: left;
            margin-top: 16px;
          }
        }
        .aboutCard {
          display: grid;
          grid-template-columns: 1.5fr 1fr 0.8fr;
          gap: 20px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 18px;
          padding: 16px 20px;
          background: #fff;
          margin-bottom: 24px;
        }
        @media (max-width: 900px) {
          .aboutCard {
            grid-template-columns: 1fr;
          }
        }
        .aboutCardCol {
          display: flex;
          flex-direction: column;
        }
        .title {
          font-size: 40px;
          letter-spacing: -0.02em;
          margin: 0 0 10px;
        }
        .tagline {
          font-size: 16px;
          opacity: 0.85;
          margin: 0 0 14px;
        }
        .tabRow {
          display: flex;
          gap: 8px;
          margin: 10px 0 14px;
          flex-wrap: wrap;
          border-bottom: 2px solid rgba(0, 0, 0, 0.1);
        }
        .tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: rgba(0, 0, 0, 0.7);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: -2px;
          transition: color 0.2s, border-color 0.2s;
        }
        .tab:hover {
          color: rgba(0, 0, 0, 0.9);
        }
        .tab.active {
          color: #111;
          border-bottom-color: #111;
        }
        .miniGuide {
          display: grid;
          gap: 8px;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.02);
        }
        .step {
          display: grid;
          grid-template-columns: 24px 1fr;
          gap: 10px;
          align-items: center;
          font-size: 14px;
        }
        .badge {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }
        .highlights {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .card {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 18px;
          padding: 16px;
          background: #fff;
        }
        .cardTop {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 14px;
          align-items: center;
        }
        .kicker {
          font-size: 12px;
          opacity: 0.6;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .cardTitle {
          font-size: 16px;
          font-weight: 900;
          margin-top: 4px;
        }
        .muted {
          font-size: 13px;
          opacity: 0.75;
          margin-top: 6px;
        }
        .cardStats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 14px;
        }
        .stat {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.015);
        }
        .statK {
          font-size: 12px;
          opacity: 0.7;
          font-weight: 800;
        }
        .statV {
          font-weight: 900;
          margin-top: 4px;
        }

        .section {
          margin-top: 34px;
        }
        .h2 {
          font-size: 22px;
          margin: 0 0 10px;
        }
        .h3 {
          font-size: 16px;
          margin: 0 0 10px;
        }
        .specTable {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 4px 12px;
          margin: 0;
          font-size: 14px;
        }
        .specTable dt {
          font-weight: 800;
          opacity: 0.9;
        }
        .specTable dd {
          margin: 0;
        }
        .witbHeading {
          font-size: 18px;
          font-weight: 900;
          margin: 0 0 12px;
        }
        .witbSub {
          font-size: 14px;
          font-weight: 700;
          opacity: 0.8;
          margin-left: 2px;
        }
        .muted2 {
          font-size: 13px;
          opacity: 0.75;
          margin: 0 0 14px;
        }
        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .grid2 {
            grid-template-columns: 1fr;
          }
        }
        .stockSummaryCard {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 18px;
          padding: 12px 20px;
          background: rgba(0, 0, 0, 0.015);
        }
        .stockSummaryHeader {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 40px;
        }
        @media (max-width: 900px) {
          .stockSummaryHeader {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
        .stockSummaryInline {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-left: auto;
          margin-right: auto;
        }
        @media (max-width: 900px) {
          .stockSummaryInline {
            margin-left: 0;
            margin-right: 0;
          }
        }
        @media (max-width: 900px) {
          .stockSummaryInline {
            gap: 16px;
          }
        }
        .stockSummaryInlineItem {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .stockSummaryInlineLabel {
          font-size: 14px;
          opacity: 0.8;
          font-weight: 800;
        }
        .stockSummaryInlineValue {
          font-size: 20px;
          font-weight: 900;
          color: #111;
        }
        .panel {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.015);
        }

        .cards {
          display: grid;
          gap: 12px;
        }
        .mCard {
          display: block;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
          text-decoration: none;
          color: inherit;
        }
        .mCard:hover {
          border-color: rgba(0, 0, 0, 0.22);
        }
        .mTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .mName {
          font-weight: 900;
          font-size: 15px;
        }
        .pill {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          background: rgba(0, 0, 0, 0.02);
          font-weight: 900;
        }
        .mMeta {
          margin-top: 8px;
        }
        .mPrice {
          font-weight: 900;
          font-size: 14px;
        }
        .mSmall {
          font-weight: 700;
          opacity: 0.65;
          margin-left: 6px;
          font-size: 12px;
        }
        .mUpdated {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 3px;
        }
        .mNote {
          font-size: 13px;
          opacity: 0.8;
          margin-top: 8px;
        }
        .mHint {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 6px;
        }
        .mGo {
          margin-top: 10px;
          font-weight: 900;
          font-size: 13px;
          opacity: 0.9;
        }

        .videoGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .videoGrid {
            grid-template-columns: 1fr;
          }
        }
        .vCard {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 12px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
          text-decoration: none;
          color: inherit;
        }
        .vCard:hover {
          border-color: rgba(0, 0, 0, 0.22);
        }
        .vThumb {
          width: 180px;
          height: 102px;
          object-fit: cover;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.04);
        }
        .vThumb.ph {
          background: rgba(0, 0, 0, 0.04);
        }
        @media (max-width: 520px) {
          .vCard {
            grid-template-columns: 1fr;
          }
          .vThumb {
            width: 100%;
            height: auto;
            aspect-ratio: 16 / 9;
          }
        }
        .vBody {
          display: grid;
          gap: 6px;
          align-content: start;
        }
        .vTitle {
          font-weight: 900;
        }
        .vNote {
          font-size: 13px;
          opacity: 0.75;
        }
        .vGo {
          margin-top: 4px;
          font-weight: 900;
          font-size: 13px;
          opacity: 0.9;
        }

        .bullets {
          margin: 0;
          padding-left: 18px;
        }
        .timeline {
          display: grid;
          gap: 10px;
        }
        .tlRow {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 12px;
          align-items: center;
          padding: 10px 10px;
          border-radius: 12px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }
        .tlYear {
          font-weight: 900;
          opacity: 0.75;
        }
        .tlLink {
          font-weight: 900;
          text-decoration: none;
          color: inherit;
          border-bottom: 1px dotted rgba(0, 0, 0, 0.3);
        }
        .witbGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .witbCard {
          display: block;
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
          text-decoration: none;
          color: inherit;
        }
        .witbCard:hover {
          border-color: rgba(0, 0, 0, 0.22);
        }
        .witbPlayer {
          font-weight: 900;
          font-size: 15px;
        }
        .witbWhen {
          font-size: 13px;
          opacity: 0.85;
          margin-top: 2px;
        }
        .witbLabel {
          font-size: 13px;
          font-weight: 800;
          margin-top: 6px;
        }
        .witbNote {
          font-size: 12px;
          opacity: 0.75;
          margin-top: 4px;
        }
        .witbGo {
          margin-top: 8px;
          font-weight: 800;
          font-size: 13px;
          opacity: 0.9;
        }

        .details {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 16px;
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.015);
        }
        summary {
          cursor: pointer;
          font-weight: 900;
        }
        .check {
          margin: 12px 0 0;
          padding-left: 18px;
        }

        .list {
          display: grid;
          gap: 10px;
        }
        .item {
          display: block;
          padding: 12px 12px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
          background: #fff;
        }
        .item:hover {
          border-color: rgba(0, 0, 0, 0.22);
        }
        .itemTitle {
          font-weight: 900;
        }
        .itemNote {
          font-size: 13px;
          opacity: 0.75;
          margin-top: 4px;
        }
        .footnote {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 12px;
        }

        .nextGrid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 900px) {
          .nextGrid {
            grid-template-columns: 1fr;
          }
        }
        .nextCard {
          display: block;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.015);
          text-decoration: none;
          color: inherit;
        }
        .nextCard:hover {
          border-color: rgba(0, 0, 0, 0.22);
          background: rgba(0, 0, 0, 0.02);
        }
        .nextTitle {
          font-weight: 900;
        }
        .nextNote {
          font-size: 13px;
          opacity: 0.75;
          margin-top: 4px;
        }
      `}</style>
    </main>
  );
}

async function fetchWitb() {
  const res = await fetch("http://localhost:3000/api/witb", {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch WITB");
  }
  return await res.json();
}

export default async function Page() {
  const rows = await fetchWitb();

  return (
    <main>
      <h2>WITB Wedges</h2>
      {rows.map((r: any) => (
        <div key={r.player_id}>
          <h3>{r.player_id} / {r.as_of_date}</h3>
          <ul>
            {[r.wedge_1, r.wedge_2, r.wedge_3, r.wedge_4]
              .filter(Boolean)
              .map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
          </ul>
        </div>
      ))}
    </main>
  );
}
