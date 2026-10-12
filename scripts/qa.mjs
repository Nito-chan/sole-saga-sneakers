import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";

const PORT = 4173, URL = `http://localhost:${PORT}/?qa=1&snap=0`;
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "mobile",  width: 390,  height: 844, mobile: true  },
];
fs.mkdirSync("qa", { recursive: true });

const server = spawn(process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore", shell: process.platform === "win32" });
async function waitForServer() {
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) return; } catch {} await new Promise(r => setTimeout(r, 500)); }
  throw new Error("preview server did not start (run `npm run build` first)");
}

const results = []; let failed = false;
const check = (vp, name, ok, detail = "") => { results.push({ vp, name, ok, detail }); if (!ok) failed = true; };

try {
  await waitForServer();
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
    const page = await ctx.newPage();
    const errors = [], bad = [];
    page.on("pageerror", e => errors.push(String(e)));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("response", r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 90000 });
    await page.waitForTimeout(1200);

    const m = await page.evaluate(() => ({
      sh: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth,
      expected: window.__qa.expectedScreens(),
    }));
    const screens = m.sh / m.ih;
    check(vp.name, "page length ≈ expected", Math.abs(screens - m.expected) / m.expected <= 0.12, `${screens.toFixed(1)} screens vs ${m.expected.toFixed(1)}`);
    check(vp.name, "no horizontal overflow", m.sw <= m.iw + 1, `${m.sw} vs ${m.iw}`);

    const cps = await page.evaluate(() => window.__qa.checkpoints());
    let i = 0;
    for (const cp of cps) {
      await page.evaluate(y => window.__qa.scrollTo(y), cp.y);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `qa/${vp.name}-${String(i++).padStart(2, "0")}-${cp.name}.png` });
      const ov = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      if (!ov) check(vp.name, `overflow at ${cp.name}`, false);
    }
    if (vp.name === "desktop") {   // OG image: hero at scroll 0, 1200x630 crop
      await page.evaluate(() => window.__qa.scrollTo(0));
      await page.waitForTimeout(1200);
      fs.mkdirSync("public", { recursive: true });
      await page.screenshot({ path: "public/og-image.jpg", type: "jpeg", quality: 88, clip: { x: 120, y: 135, width: 1200, height: 630 } });
    }
    check(vp.name, "no console/page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
    check(vp.name, "no failed requests (>=400)", bad.length === 0, bad.slice(0, 3).join(" | "));
    await ctx.close();
  }
  await browser.close();
} finally { server.kill(); }

fs.writeFileSync("qa/report.json", JSON.stringify(results, null, 2));
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  [${r.vp}] ${r.name} ${r.detail}`);
process.exit(failed ? 1 : 0);
