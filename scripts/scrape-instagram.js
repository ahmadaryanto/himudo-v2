/**
 * Attempt to scrape public Instagram images for @himudo
 * Falls back to collecting image URLs from page / embed if available.
 */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "assets", "images", "gallery");
const REPORT = path.join(OUT_DIR, "scrape-report.json");
const PROFILE = "https://www.instagram.com/himudo/";

fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const results = { source: PROFILE, images: [], errors: [] };

  try {
    await page.goto(PROFILE, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(4000);

    // Dismiss cookie / login banners if present
    for (const label of ["Allow all cookies", "Allow essential and optional cookies", "Not Now", "Decline optional cookies"]) {
      try {
        const btn = page.getByRole("button", { name: label });
        if (await btn.count()) {
          await btn.first().click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(800);
        }
      } catch (_) {}
    }

    // Scroll to load more posts
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1200);
    }

    const urls = await page.evaluate(() => {
      const set = new Set();
      document.querySelectorAll("img").forEach((img) => {
        const src = img.currentSrc || img.src || "";
        const alt = img.alt || "";
        // Instagram CDN posts typically on scontent / cdninstagram
        if (
          src &&
          (src.includes("cdninstagram") ||
            src.includes("fbcdn") ||
            src.includes("scontent")) &&
          !src.includes("150x150") &&
          img.naturalWidth >= 150
        ) {
          set.add(src);
        }
        // Also grab srcset largest
        if (img.srcset) {
          const parts = img.srcset.split(",").map((p) => p.trim().split(" ")[0]);
          parts.forEach((u) => {
            if (u && (u.includes("cdninstagram") || u.includes("fbcdn") || u.includes("scontent"))) {
              set.add(u);
            }
          });
        }
      });
      // meta og:image
      const og = document.querySelector('meta[property="og:image"]');
      if (og?.content) set.add(og.content);
      return [...set];
    });

    results.foundOnPage = urls.length;
    console.log("Found candidate URLs:", urls.length);

    // Download up to 24 images
    let idx = 0;
    for (const url of urls.slice(0, 30)) {
      try {
        const res = await page.request.get(url, {
          headers: {
            Referer: "https://www.instagram.com/",
            Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
          },
        });
        if (!res.ok()) {
          results.errors.push({ url, status: res.status() });
          continue;
        }
        const buf = await res.body();
        if (buf.length < 3000) continue;
        const ct = res.headers()["content-type"] || "";
        const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
        idx += 1;
        const file = `ig-${String(idx).padStart(2, "0")}.${ext}`;
        fs.writeFileSync(path.join(OUT_DIR, file), buf);
        results.images.push({ file, url: url.slice(0, 180), size: buf.length });
        console.log("OK", file, buf.length);
        if (idx >= 18) break;
      } catch (e) {
        results.errors.push({ url: url.slice(0, 120), error: String(e.message || e) });
      }
    }

    await page.screenshot({
      path: path.join(__dirname, "..", "demo", "instagram-himudo.png"),
      fullPage: false,
    });
  } catch (e) {
    results.errors.push({ fatal: String(e.message || e) });
    console.error(e);
  }

  fs.writeFileSync(REPORT, JSON.stringify(results, null, 2));
  console.log("Saved", results.images.length, "images to", OUT_DIR);
  await browser.close();
  process.exit(results.images.length > 0 ? 0 : 1);
})();
