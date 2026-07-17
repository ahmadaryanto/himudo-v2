const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://www.youtube.com/channel/UCLJ9TdLB00xHRn0p7H5HFPA/videos", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(5000);
  const data = await page.evaluate(() => {
    const links = [
      ...document.querySelectorAll("a#video-title-link, a#video-title, ytd-rich-item-renderer a#video-title-link"),
    ];
    return links.slice(0, 20).map((a) => ({
      title: (a.getAttribute("title") || a.textContent || "").trim(),
      href: a.href,
    }));
  });
  console.log(JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(__dirname, "..", "demo", "yt-videos.json"), JSON.stringify(data, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
