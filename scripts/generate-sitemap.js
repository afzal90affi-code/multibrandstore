// Build se pehle public/sitemap.xml banati hai (package.json build script already set hai)
const fs = require("fs");
const path = require("path");

const SITE_URL = "https://multibrandstore.vercel.app";
const API = "https://vieoyox0.api.sanity.io/v2021-10-21/data/query/production";

const slugify = (s) =>
  String(s).toLowerCase().trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function q(groq) {
  const res = await fetch(`${API}?query=${encodeURIComponent(groq)}`);
  if (!res.ok) throw new Error("Sanity query failed: " + res.status);
  const json = await res.json();
  return json.result || [];
}

(async () => {
  try {
    const cats = await q(`*[_type == "category"]{ name, _updatedAt }`);
    const subs = await q(`*[_type == "subCategory" && defined(parentCategory)]{ name, "parent": parentCategory->name, _updatedAt }`);
    const prods = await q(`*[_type == "product" && defined(category)]{ _id, _updatedAt }`);

    const today = new Date().toISOString().split("T")[0];
    const d = (t) => (t ? String(t).split("T")[0] : today);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    xml += `  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>\n`;
    for (const c of cats) {
      xml += `  <url><loc>${SITE_URL}/category/${slugify(c.name)}</loc><changefreq>daily</changefreq><priority>0.9</priority><lastmod>${d(c._updatedAt)}</lastmod></url>\n`;
    }
    for (const s of subs) {
      xml += `  <url><loc>${SITE_URL}/category/${slugify(s.parent)}/${slugify(s.name)}</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${d(s._updatedAt)}</lastmod></url>\n`;
    }
    for (const p of prods) {
      xml += `  <url><loc>${SITE_URL}/product/${p._id}</loc><changefreq>weekly</changefreq><priority>0.7</priority><lastmod>${d(p._updatedAt)}</lastmod></url>\n`;
    }
    xml += `</urlset>\n`;

    fs.writeFileSync(path.join(__dirname, "..", "public", "sitemap.xml"), xml);
    console.log(`sitemap.xml OK – ${cats.length} categories, ${subs.length} subcategories, ${prods.length} products`);
  } catch (e) {
    console.warn("Sitemap skip (build jaari rahegi):", e.message);
  }
})();