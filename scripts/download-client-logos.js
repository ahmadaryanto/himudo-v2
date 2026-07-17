const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const OUT = path.join(__dirname, "..", "assets", "images", "clients");

const LOGOS = [
  { file: "kasimura.png", url: "http://himudo.com/wp-content/uploads/2021/07/Kasimura-Partner-Himudo.png", name: "Kasimura" },
  { file: "maybank.png", url: "http://himudo.com/wp-content/uploads/2021/07/Bank-Maybank-Partner-Himudo.png", name: "Maybank" },
  { file: "nirvana.png", url: "http://himudo.com/wp-content/uploads/2021/07/Nirvana-logo-Partner-Himudo.png", name: "Nirvana" },
  { file: "hypermart.png", url: "http://himudo.com/wp-content/uploads/2021/07/LOGO-HYPERMART-Partner-Himudo.png", name: "Hypermart" },
  { file: "irian.png", url: "http://himudo.com/wp-content/uploads/2021/07/Irian-Partner-Himudo.png", name: "Irian" },
  { file: "smarco.png", url: "http://himudo.com/wp-content/uploads/2021/07/Smarco-Partner-Himudo.png", name: "Smarco" },
  { file: "yuki.png", url: "http://himudo.com/wp-content/uploads/2021/07/LOGO-YUKI-Partner-Himudo.png", name: "Yuki" },
  { file: "ocbc.png", url: "http://himudo.com/wp-content/uploads/2021/07/Logo-Bank-OCBC-NISP-Partner-Himudo.png", name: "OCBC NISP" },
  { file: "idexpress.png", url: "http://himudo.com/wp-content/uploads/2021/07/Logo-IDExpress-Partner-Himudo.png", name: "ID Express" },
  { file: "columbia.png", url: "http://himudo.com/wp-content/uploads/2021/07/Columbia-Asia-logo-Partner-Himudo.png", name: "Columbia Asia" },
  { file: "uob.png", url: "http://himudo.com/wp-content/uploads/2021/07/logo-UOB-Partner-Himudo.png", name: "UOB" },
  { file: "jco.png", url: "http://himudo.com/wp-content/uploads/2021/07/LOGO-JCO.png", name: "J.CO" },
  { file: "sinarmas.png", url: "http://himudo.com/wp-content/uploads/2021/07/Bank-sinarmas-Partner-Himudo.png", name: "Bank Sinarmas" },
  { file: "idcommerce.png", url: "http://himudo.com/wp-content/uploads/2021/07/IDcommerce-logo-Partner-Himudo.png", name: "IDcommerce" },
  { file: "tanto.png", url: "http://himudo.com/wp-content/uploads/2021/07/tanto-logo-Partner-Himudo.png", name: "Tanto" },
];

async function downloadWithBrowser(page, url, dest) {
  const response = await page.request.get(url, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: "http://himudo.com/about-us/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });
  if (!response.ok()) {
    throw new Error(`HTTP ${response.status()} for ${url}`);
  }
  const buf = await response.body();
  if (buf.length < 500) {
    throw new Error(`Too small (${buf.length} bytes) for ${url}`);
  }
  fs.writeFileSync(dest, buf);
  return buf.length;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("http://himudo.com/about-us/", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.waitForTimeout(1500);

  const results = [];
  for (const logo of LOGOS) {
    const dest = path.join(OUT, logo.file);
    try {
      const size = await downloadWithBrowser(page, logo.url, dest);
      results.push({ ...logo, ok: true, size });
      console.log("OK", logo.file, size);
    } catch (err) {
      results.push({ ...logo, ok: false, error: String(err.message || err) });
      console.log("FAIL", logo.file, err.message || err);
    }
  }

  // Also try capturing client imgs directly from the page DOM
  const pageImgs = await page.evaluate(() =>
    [...document.querySelectorAll("img")]
      .map((img) => ({ src: img.currentSrc || img.src, alt: img.alt, w: img.naturalWidth, h: img.naturalHeight }))
      .filter((i) => /partner|client|logo/i.test(i.src + " " + i.alt))
  );
  console.log("PAGE IMGS", JSON.stringify(pageImgs, null, 2));

  fs.writeFileSync(
    path.join(OUT, "download-report.json"),
    JSON.stringify({ results, pageImgs }, null, 2)
  );

  await browser.close();
  const ok = results.filter((r) => r.ok).length;
  console.log(`Done: ${ok}/${results.length} logos`);
  process.exit(ok > 0 ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
