/**
 * Records a short scroll-through demo of the Himudo site (desktop + mobile).
 * Output: demo/himudo-demo.webm (and screenshots)
 */
const { chromium, devices } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = process.env.HIMUDO_URL || "http://localhost:8080";
const OUT = path.join(__dirname, "..", "demo");

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function smoothScroll(page, totalPx, steps = 24, stepDelay = 80) {
  const per = totalPx / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((y) => window.scrollBy({ top: y, behavior: "auto" }), per);
    await sleep(stepDelay);
  }
}

async function scrollToTop(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
}

async function recordDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUT,
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await sleep(800);
  await scrollToTop(page);
  await sleep(1000);

  // Hero pause
  await sleep(1500);

  // Scroll through page in stages
  const height = await page.evaluate(() => document.body.scrollHeight);
  await smoothScroll(page, height * 0.22, 18, 70);
  await sleep(900);
  await smoothScroll(page, height * 0.18, 16, 70);
  await sleep(900);
  await smoothScroll(page, height * 0.18, 16, 70);
  await sleep(900);
  await smoothScroll(page, height * 0.2, 18, 70);
  await sleep(900);
  await smoothScroll(page, height * 0.25, 20, 70);
  await sleep(1200);

  // Back toward top a bit (contact is bottom)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(1800);

  // Open/close nothing — click products nav
  await page.click('a.nav__link[href="#produk"]');
  await sleep(1600);
  await page.click('a.nav__link[href="#keunggulan"]');
  await sleep(1400);
  await page.click('a.nav__link[href="#kontak"]');
  await sleep(1600);

  // Full page screenshot
  await page.screenshot({
    path: path.join(OUT, "desktop-full.png"),
    fullPage: true,
  });
  await page.screenshot({
    path: path.join(OUT, "desktop-hero.png"),
    fullPage: false,
  });

  const video = page.video();
  await context.close();
  const videoPath = await video.path();
  const dest = path.join(OUT, "himudo-desktop-demo.webm");
  fs.renameSync(videoPath, dest);
  return dest;
}

async function recordMobile(browser) {
  const iPhone = devices["iPhone 13"];
  const context = await browser.newContext({
    ...iPhone,
    recordVideo: {
      dir: OUT,
      size: { width: iPhone.viewport.width, height: iPhone.viewport.height },
    },
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  await sleep(1000);
  await scrollToTop(page);
  await sleep(1200);

  // Open mobile menu
  const toggle = page.locator("#navToggle");
  if (await toggle.isVisible()) {
    await toggle.click();
    await sleep(1200);
    await page.locator('.mobile-menu__link[href="#produk"]').click();
    await sleep(1400);
  }

  const height = await page.evaluate(() => document.body.scrollHeight);
  await smoothScroll(page, height * 0.35, 22, 65);
  await sleep(800);
  await smoothScroll(page, height * 0.35, 22, 65);
  await sleep(800);
  await smoothScroll(page, height * 0.35, 22, 65);
  await sleep(1000);

  // Product horizontal scroll
  await page.evaluate(() => {
    const el = document.querySelector(".products__scroller");
    if (el) el.scrollBy({ left: 280, behavior: "smooth" });
  });
  await sleep(1200);
  await page.evaluate(() => {
    const el = document.querySelector(".products__scroller");
    if (el) el.scrollBy({ left: 280, behavior: "smooth" });
  });
  await sleep(1400);

  await page.screenshot({
    path: path.join(OUT, "mobile-hero.png"),
    fullPage: false,
  });
  await page.screenshot({
    path: path.join(OUT, "mobile-full.png"),
    fullPage: true,
  });

  const video = page.video();
  await context.close();
  const videoPath = await video.path();
  const dest = path.join(OUT, "himudo-mobile-demo.webm");
  fs.renameSync(videoPath, dest);
  return dest;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  console.log("Recording Himudo demo from", BASE);

  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await recordDesktop(browser);
    console.log("Desktop video:", desktop);
    const mobile = await recordMobile(browser);
    console.log("Mobile video:", mobile);
    console.log("Screenshots in:", OUT);
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
