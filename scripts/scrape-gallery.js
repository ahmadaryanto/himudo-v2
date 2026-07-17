/**
 * Build gallery from himudo.com media + any IG images already saved.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "assets", "images", "gallery");
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  "http://himudo.com/",
  "http://himudo.com/about-us/",
  "http://himudo.com/product/",
  "http://himudo.com/contact-us/",
  "https://www.facebook.com/HimudoOfficial/photos",
];

function isUsefulImage(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  if (!/\.(jpe?g|png|webp)(\?|$)/i.test(u) && !u.includes("wp-content/uploads")) return false;
  if (/logo|favicon|icon|avatar|emoji|sprite|placeholder|1x1|pixel/i.test(u)) return false;
  if (/sni-mui|partner-himudo|partner_himudo|client/i.test(u)) return false;
  return true;
}

function fileNameFromUrl(url, i) {
  try {
    const base = path.basename(new URL(url).pathname).replace(/[^\w.-]+/g, "-");
    if (base && base.length > 4) return base.toLowerCase();
  } catch (_) {}
  return `gallery-${String(i).padStart(2, "0")}.jpg`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
  });

  const found = new Map(); // url -> meta

  for (const url of PAGES) {
    try {
      console.log("Visit", url);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(2000);
      // scroll
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(600);
      }

      const imgs = await page.evaluate(() => {
        const list = [];
        document.querySelectorAll("img").forEach((img) => {
          const src = img.currentSrc || img.src || "";
          const srcset = img.srcset || "";
          let best = src;
          if (srcset) {
            const parts = srcset.split(",").map((p) => {
              const [u, w] = p.trim().split(/\s+/);
              return { u, w: parseInt(w, 10) || 0 };
            });
            parts.sort((a, b) => b.w - a.w);
            if (parts[0]?.u) best = parts[0].u;
          }
          list.push({
            src: best,
            alt: img.alt || "",
            w: img.naturalWidth || 0,
            h: img.naturalHeight || 0,
          });
        });
        // background images in style
        document.querySelectorAll("[style*='background']").forEach((el) => {
          const m = String(el.getAttribute("style") || "").match(/url\(["']?([^"')]+)["']?\)/i);
          if (m?.[1]) list.push({ src: m[1], alt: "", w: 0, h: 0 });
        });
        return list;
      });

      imgs.forEach((img) => {
        let src = img.src;
        if (src.startsWith("//")) src = "https:" + src;
        if (src.startsWith("/")) src = "http://himudo.com" + src;
        if (!isUsefulImage(src)) return;
        if (img.w && img.w < 120) return;
        if (!found.has(src)) found.set(src, img);
      });
    } catch (e) {
      console.log("Skip page", url, e.message);
    }
  }

  // Known product / marketing assets from old site (from prior research)
  const known = [
    "http://himudo.com/wp-content/uploads/2021/06/Produk.png",
    "http://himudo.com/wp-content/uploads/2021/01/Screenshot_10.png",
    "http://himudo.com/wp-content/uploads/2016/07/small-shad.png",
    "http://himudo.com/wp-content/uploads/2016/07/med-shad.png",
    "http://himudo.com/wp-content/uploads/2016/07/large-shad.png",
    "http://himudo.com/wp-content/uploads/2021/01/app2.png",
    "http://himudo.com/wp-content/uploads/2021/01/sni-mui.png",
  ];
  known.forEach((u) => {
    if (!found.has(u)) found.set(u, { src: u, alt: "", w: 0, h: 0 });
  });

  console.log("Unique candidates:", found.size);

  // Visit media library style listing via sitemap if possible
  try {
    await page.goto("http://himudo.com/wp-sitemap-posts-attachment-1.xml", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    const xml = await page.content();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    console.log("Attachment sitemap locs:", locs.length);
    locs.slice(0, 80).forEach((loc) => {
      // attachment pages - we'll open a few later if needed
    });
  } catch (_) {
    console.log("No attachment sitemap");
  }

  let i = 0;
  const saved = [];
  for (const [url] of found) {
    i += 1;
    const name = fileNameFromUrl(url, i);
    const dest = path.join(OUT, name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 3000) {
      saved.push({ file: name, url, skipped: true });
      console.log("EXISTS", name);
      continue;
    }
    try {
      const res = await page.request.get(url, {
        headers: {
          Referer: "http://himudo.com/about-us/",
          Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        },
      });
      if (!res.ok()) {
        console.log("FAIL", res.status(), name);
        continue;
      }
      const buf = await res.body();
      if (buf.length < 4000) {
        console.log("SMALL", name, buf.length);
        continue;
      }
      // skip pure white / tiny placeholders via size only
      fs.writeFileSync(dest, buf);
      saved.push({ file: name, url, size: buf.length });
      console.log("OK", name, buf.length);
      if (saved.filter((s) => s.size).length >= 24) break;
    } catch (e) {
      console.log("ERR", name, e.message);
    }
  }

  // Also try Instagram oEmbed / public profile picture already done

  // Collect all gallery files on disk
  const files = fs
    .readdirSync(OUT)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .filter((f) => !f.includes("report"))
    .map((f) => ({
      file: f,
      size: fs.statSync(path.join(OUT, f)).size,
    }))
    .filter((f) => f.size > 4000)
    .sort((a, b) => b.size - a.size);

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note: "Gallery images collected for Himudo site. Instagram is often blocked; sources include himudo.com media.",
        images: files.map((f, idx) => ({
          file: f.file,
          alt: `Himudo gallery ${idx + 1}`,
        })),
      },
      null,
      2
    )
  );

  console.log("Gallery files on disk:", files.length);
  await browser.close();
  process.exit(files.length > 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
