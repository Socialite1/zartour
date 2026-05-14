import { writeFileSync } from "fs"
import { resolve } from "path"

const BASE_URL = "https://zartour-go.lovable.app"

interface SitemapEntry {
  path: string
  lastmod?: string
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority?: string
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/auth", changefreq: "monthly", priority: "0.3" },
  { path: "/checkin", changefreq: "daily", priority: "0.8" },
  { path: "/feed", changefreq: "daily", priority: "0.7" },
  { path: "/leaderboard", changefreq: "daily", priority: "0.8" },
  { path: "/profile", changefreq: "weekly", priority: "0.5" },
  { path: "/quests", changefreq: "weekly", priority: "0.7" },
  { path: "/quest-path", changefreq: "weekly", priority: "0.7" },
  { path: "/explore", changefreq: "daily", priority: "0.9" },
  { path: "/guide", changefreq: "weekly", priority: "0.6" },
  { path: "/vote", changefreq: "hourly", priority: "0.9" },
  { path: "/vote-qr", changefreq: "weekly", priority: "0.4" },
  { path: "/vote/shared", changefreq: "weekly", priority: "0.4" },
  { path: "/club", changefreq: "weekly", priority: "0.6" },
  { path: "/events", changefreq: "daily", priority: "0.8" },
]

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  )

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n")
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries))
console.log(`sitemap.xml written (${entries.length} entries)`)
