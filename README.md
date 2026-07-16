# Himudo V2

Company profile website for **Himudo** — air mineral beroksigen with balanced pH, based in Medan, Sumatera Utara.

No e-commerce or checkout. Professional company profile only.

## Live preview (local)

```bash
# From this folder
npx serve -l 8080
```

Open: [http://localhost:8080](http://localhost:8080)

Or open `index.html` directly in a browser.

## Stack

- Static HTML / CSS / JS
- Mobile-first responsive layout
- WhatsApp contact form (no backend transactions)

## Structure

```
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/          # SVG branding & product art
├── demo/                # Walkthrough videos & screenshots
└── scripts/             # Optional demo recording helpers
```

## Contact (from brand)

- Hotline: 061-6637188
- WhatsApp: 0821-6883-6677 / 0821-6607-0040
- Email: support@himudo.com · sales@himudo.com
- Instagram: [@himudo](https://www.instagram.com/himudo/)

## Demo recordings

See the `demo/` folder:

- `himudo-desktop-demo.mp4`
- `himudo-mobile-demo.mp4`

To re-record (requires local server + Playwright):

```bash
npm install
npx playwright install chromium
node scripts/record-demo.js
node scripts/convert-mp4.js
```

## License

© Himudo. All rights reserved. This is a company profile redesign project.
