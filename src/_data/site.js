// Reads all site content (edited via /admin) from src/content/*.yml
// and prepares ready-to-render page lists for every language.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = path.resolve("src/content");
const load = (f) => yaml.load(fs.readFileSync(f, "utf8")) || {};
const loadDir = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort()
        .map((f) => ({ _file: f.replace(/\.ya?ml$/, ""), ...load(path.join(dir, f)) }))
    : [];

const isoDate = (v) => (v instanceof Date ? v.toISOString() : String(v || "")).slice(0, 10);

const LANGS = ["ua", "en", "de"];
const prefix = (lang) => (lang === "ua" ? "/" : `/${lang}/`);

// URL scheme copied from the old site (.htaccess), so old links keep working.
const urls = {
  gallery: (lang, n = 1) => prefix(lang) + (n > 1 ? `page-${n}/` : ""),
  about: (lang) => prefix(lang) + "about.html",
  news: (lang) => prefix(lang) + "article/",
  newsItem: (lang, slug) => prefix(lang) + `article/${slug}.html`,
  contact: (lang) => prefix(lang) + "contact/",
};
const alts = (fn) => Object.fromEntries(LANGS.map((l) => [l, fn(l)]));

// Pick a translation; fall back to Ukrainian, then to any non-empty language.
const t = (obj, lang) => {
  if (!obj || typeof obj !== "object") return obj ?? "";
  return obj[lang] || obj.ua || LANGS.map((l) => obj[l]).find(Boolean) || "";
};

export default function () {
  const settings = load(path.join(ROOT, "settings.yml"));
  const about = load(path.join(ROOT, "about.yml"));
  const perPage = Number(settings.per_page) || 9;

  const paintings = loadDir(path.join(ROOT, "paintings"))
    .filter((p) => p.published !== false && p.image)
    .map((p) => ({ ...p, lot: String(p.lot ?? "").padStart(4, "0") }))
    .sort((a, b) => (parseInt(b.lot, 10) || 0) - (parseInt(a.lot, 10) || 0) || b._file.localeCompare(a._file));

  const news = loadDir(path.join(ROOT, "news"))
    .filter((n) => n.published !== false)
    .map((n) => ({ ...n, slug: String(n.slug || n._file), date: isoDate(n.date) }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const pagesCount = Math.max(1, Math.ceil(paintings.length / perPage));

  const galleryPages = [];
  const aboutPages = [];
  const newsLists = [];
  const newsPages = [];
  const contactPages = [];

  for (const lang of LANGS) {
    for (let n = 1; n <= pagesCount; n++) {
      galleryPages.push({
        lang, n, pagesCount,
        url: urls.gallery(lang, n),
        alts: alts((l) => urls.gallery(l, n)),
        pageLinks: Array.from({ length: pagesCount }, (_, i) => ({ n: i + 1, url: urls.gallery(lang, i + 1) })),
        title: t(settings.home_title, lang) + (n > 1 ? ` — ${n}` : ""),
        description: t(settings.home_description, lang),
        keywords: t(settings.keywords, lang),
        items: paintings.slice((n - 1) * perPage, n * perPage).map((p) => ({
          lot: p.lot,
          title: t(p.title, lang),
          description: t(p.description, lang),
          price: Number(p.price) || 0,
          image: p.image,
          thumb: p.thumb || p.image,
        })),
      });
    }

    aboutPages.push({
      lang, url: urls.about(lang), alts: alts(urls.about),
      title: t(about.title, lang), description: t(about.description, lang),
      keywords: t(settings.keywords, lang), body: t(about.body, lang),
    });

    newsLists.push({
      lang, url: urls.news(lang), alts: alts(urls.news),
      keywords: t(settings.keywords, lang),
      items: news.map((n) => ({
        url: urls.newsItem(lang, n.slug), date: n.date, image: n.image,
        title: t(n.title, lang), intro: t(n.intro, lang),
      })),
    });

    for (const n of news) {
      newsPages.push({
        lang, url: urls.newsItem(lang, n.slug), alts: alts((l) => urls.newsItem(l, n.slug)),
        title: t(n.title, lang), description: t(n.intro, lang), keywords: t(settings.keywords, lang),
        date: n.date, image: n.image, body: t(n.body, lang),
      });
    }

    contactPages.push({
      lang, url: urls.contact(lang), alts: alts(urls.contact),
      keywords: t(settings.keywords, lang), intro: t(settings.contact_intro, lang),
    });
  }

  const tagline = Object.fromEntries(LANGS.map((l) => [l, t(settings.tagline, l)]));

  return {
    langs: LANGS, urls, settings, tagline,
    galleryPages, aboutPages, newsLists, newsPages, contactPages,
    year: new Date().getFullYear(),
    // Filled in automatically by GitHub Actions (see .github/workflows/deploy.yml)
    repo: process.env.GITHUB_REPOSITORY || "OWNER/REPO",
    branch: process.env.GITHUB_REF_NAME || "main",
    siteUrl: (process.env.SITE_URL || "").replace(/\/$/, ""),
  };
}
