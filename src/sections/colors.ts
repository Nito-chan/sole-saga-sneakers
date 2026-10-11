import { el } from "../lib/dom";
import { CFG } from "../config";
import type { Ctx } from "../lib/engine";
import type { ColorItem } from "../lib/data";

function luminance(hex: string): number {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

interface ContentSet {
  root: HTMLElement;
  chars: HTMLElement[];
  tagline: HTMLElement;
  specs: HTMLElement;
}

function buildSet(item: ColorItem): ContentSet {
  const root = el("div", "c-set");
  const name = el("h2", "t-color-name c-name", "");
  const chars: HTMLElement[] = [];
  for (const ch of item.name) {
    const mask = el("span", "c-char-mask");
    const c = el("span", "c-char", ch === " " ? " " : ch);
    mask.appendChild(c);
    name.appendChild(mask);
    chars.push(c);
  }
  const tagline = el("p", "c-tagline", item.tagline);
  const specs = el("ul", "c-specs");
  for (const s of item.specs) {
    const li = el("li", "");
    li.append(el("span", "c-spec-dot"), el("span", undefined, s));
    specs.appendChild(li);
  }
  root.append(name, tagline, specs);
  return { root, chars, tagline, specs };
}

export function initColors(ctx: Ctx): void {
  const { site, gsap } = ctx;
  const items: ColorItem[] = site.colors.items;
  const n = items.length;
  const app = document.getElementById("app");
  if (!app || n === 0) return;

  const section = el("section", "");
  section.id = "colors";
  section.dataset.header = "light";
  section.style.setProperty("--c-bg", items[0].bg);
  section.style.setProperty("--c-text", items[0].text);

  if (ctx.prefersReduced) {
    const wrap = el("div", "colors-static");
    wrap.appendChild(el("p", "t-eyebrow", site.colors.eyebrow));
    for (const item of items) {
      const card = el("article", "colors-card");
      card.style.background = item.bg;
      card.style.color = item.text;
      const img = el("img", "");
      img.setAttribute("src", item.src);
      img.setAttribute("alt", `Colorway ${item.name}`);
      img.setAttribute("decoding", "async");
      card.append(img, el("h3", "t-color-name", item.name), el("p", "t-body", item.tagline));
      for (const s of item.specs) card.appendChild(el("p", "t-body", s));
      wrap.appendChild(card);
    }
    section.appendChild(wrap);
    app.appendChild(section);
    return;
  }

  const bgStack = el("div", "c-bgstack");
  const bgLayers: HTMLElement[] = [];
  for (const item of items) {
    const layer = el("div", "c-bg-layer");
    layer.style.background = item.bg;
    bgStack.appendChild(layer);
    bgLayers.push(layer);
  }

  const giantDrift = el("div", "c-giant-drift");
  const giants: HTMLElement[] = [];
  for (const item of items) {
    const gdiv = el("div", "c-giant", item.name);
    giantDrift.appendChild(gdiv);
    giants.push(gdiv);
  }

  const stage = el("div", "c-stage");
  const bob = el("div", "c-bob");
  const shoes: HTMLImageElement[] = [];
  items.forEach((item, i) => {
    const img = el("img", "c-shoe");
    img.setAttribute("src", item.src);
    img.setAttribute("alt", `Colorway ${item.name}`);
    img.setAttribute("decoding", "async");
    if (i > 0) img.style.opacity = "0";
    bob.appendChild(img);
    shoes.push(img);
  });
  stage.append(bob, el("div", "c-shadow"));

  const content = el("div", "c-content");
  content.appendChild(el("p", "t-eyebrow", site.colors.eyebrow));
  const counter = el("div", "c-counter", `01 / ${String(n).padStart(2, "0")}`);
  content.appendChild(counter);
  const sets: ContentSet[] = items.map((item) => {
    const s = buildSet(item);
    content.appendChild(s.root);
    return s;
  });
  const swatches = el("div", "c-swatches");
  const swatchBtns: HTMLButtonElement[] = [];
  items.forEach((item, i) => {
    const b = el("button", "c-swatch");
    b.setAttribute("aria-label", `Colorway ${item.name}`);
    b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    b.style.background = item.bg;
    if (i === 0) b.classList.add("is-active");
    swatches.appendChild(b);
    swatchBtns.push(b);
  });
  const cta = el("a", "btn c-cta", site.colors.cta);
  cta.setAttribute("href", "#drop");
  content.append(swatches, cta);

  const rail = el("div", "c-rail");
  const railFill = el("div", "c-rail-fill");
  rail.appendChild(railFill);

  section.append(bgStack, giantDrift, stage, content, rail);
  app.appendChild(section);

  const HOLD = CFG.colors.holdEnd;
  let shownIdx = 0;

  const build = (wipeOrigin: string): void => {
    gsap.set(bgLayers.slice(1), { clipPath: `circle(0% at ${wipeOrigin})` });
    gsap.set(shoes.slice(1), { x: "4vw", rotate: 5, scale: 1.04, opacity: 0 });
    gsap.set(giants.slice(1), { x: "6vw", opacity: 0 });
    gsap.set(giants[0], { x: "0vw", opacity: 0.14 });
    sets.forEach((s, i) => {
      if (i === 0) return;
      gsap.set(s.root, { display: "none" });
      gsap.set(s.chars, { yPercent: 110 });
      gsap.set([s.tagline, s.specs], { y: 16, opacity: 0 });
    });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${n * CFG.colors.stepSvh}%`,
        scrub: 0.6,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        id: "colors",
        onUpdate: (self) => {
          const t = self.progress * n;
          const k = Math.min(n - 1, Math.floor(t));
          const frac = t - k;
          const targetIdx = k >= n - 1 || frac <= HOLD + (1 - HOLD) / 2 ? k : k + 1;
          if (targetIdx !== shownIdx) {
            shownIdx = targetIdx;
            counter.textContent = `${String(targetIdx + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
            const theme = luminance(items[targetIdx].bg) > 0.5 ? "light" : "dark";
            section.dataset.header = theme;
            swatchBtns.forEach((b, i) => {
              b.classList.toggle("is-active", i === targetIdx);
              b.setAttribute("aria-pressed", i === targetIdx ? "true" : "false");
            });
          }
          railFill.style.height = `${self.progress * 100}%`;
        },
      },
    });

    // One continuous giant-name drift across all steps (no per-step jumps).
    tl.fromTo(giantDrift, { x: "5vw" }, { x: `${5 - 10 * n}vw`, duration: n, ease: "none" }, 0);

    for (let k = 0; k < n - 1; k++) {
      const at = k + HOLD;
      const win = 1 - HOLD;
      const mid = at + win / 2;
      tl.fromTo(
        bgLayers[k + 1],
        { clipPath: `circle(0% at ${wipeOrigin})` },
        { clipPath: `circle(140% at ${wipeOrigin})`, duration: win, ease: "power2.inOut" },
        at,
      );
      tl.to(section, { "--c-text": items[k + 1].text, duration: win / 2 }, at + win / 4);
      tl.to(
        shoes[k],
        { x: "-4vw", rotate: -5, opacity: 0, scale: 0.96, duration: win * 0.45 },
        at,
      );
      tl.fromTo(
        shoes[k + 1],
        { x: "4vw", rotate: 5, scale: 1.04, opacity: 0 },
        { x: "0vw", rotate: 0, scale: 1, opacity: 1, duration: win * 0.6, ease: "back.out(1.2)" },
        at + win * 0.4,
      );
      tl.to(giants[k], { x: "-6vw", opacity: 0, duration: win }, at);
      tl.fromTo(
        giants[k + 1],
        { x: "6vw", opacity: 0 },
        { x: "0vw", opacity: 0.14, duration: win },
        at,
      );
      // Name roll + copy swap.
      tl.to(sets[k].chars, { yPercent: -110, duration: win * 0.4, stagger: 0.015 }, at);
      tl.to([sets[k].tagline, sets[k].specs], { y: -16, opacity: 0, duration: win * 0.25 }, at);
      tl.set(sets[k].root, { display: "none" }, mid);
      tl.set(sets[k + 1].root, { display: "block" }, mid);
      tl.to(
        sets[k + 1].chars,
        { yPercent: 0, duration: win * 0.55, stagger: 0.015, ease: "none" },
        at + win * 0.45,
      );
      tl.to(
        [sets[k + 1].tagline, sets[k + 1].specs],
        { y: 0, opacity: 1, duration: win * 0.5 },
        at + win * 0.5,
      );
    }
  };

  ctx.mm.add("(min-width: 1024px)", () => build("30% 52%"));
  ctx.mm.add("(max-width: 1023px)", () => build("50% 28%"));

  swatchBtns.forEach((b, k) => {
    b.addEventListener("click", () => {
      const cst = ctx.ScrollTrigger.getById("colors");
      if (!cst || ctx.prefersReduced) return;
      const y = cst.start + (k / n) * (cst.end - cst.start);
      ctx.lenis.scrollTo(y, { duration: 1.2 });
    });
  });
}
