const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://himudo.com/about-us/#Order", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    const order =
      document.querySelector("#Order") ||
      document.querySelector("[id*='Order']") ||
      document.querySelector("[id*='order']");

    const sliders = [...document.querySelectorAll(".swiper, .slick-slider, .owl-carousel, [class*='slider'], [class*='carousel']")].map(
      (el) => ({
        id: el.id,
        className: String(el.className).slice(0, 200),
        html: el.outerHTML.slice(0, 4000),
      })
    );

    const imgs = [...document.querySelectorAll("img")]
      .map((img) => ({ src: img.src, alt: img.alt, w: img.naturalWidth, h: img.naturalHeight }))
      .filter((i) => /product|botol|galon|shad|app|cup|ml|liter|order/i.test(i.src + i.alt));

    return {
      orderId: order?.id || null,
      orderHtml: order ? order.outerHTML.slice(0, 10000) : null,
      orderText: order ? order.innerText.slice(0, 2000) : null,
      sliders: sliders.slice(0, 8),
      imgs,
      anchors: [...document.querySelectorAll("a[href*='Order'], [id*='Order'], [id*='order']")].map(
        (a) => a.id || a.getAttribute("href")
      ),
      bodySnippet: document.body.innerText.slice(0, 2500),
    };
  });

  const out = path.join(__dirname, "..", "demo", "order-scrape.json");
  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  await page.screenshot({ path: path.join(__dirname, "..", "demo", "about-order.png"), fullPage: true });
  console.log("Wrote", out);
  console.log(JSON.stringify(data, null, 2).slice(0, 8000));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
