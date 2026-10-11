import { el } from "../lib/dom";
import type { Ctx } from "../lib/engine";

interface AngleDef {
  key: string;
  left: string;
  top: string;
  size: string;
  z: number;
  yFrom: string;
  yTo: string;
  extraFrom: Record<string, number | string>;
  extraTo: Record<string, number | string>;
}

const DESKTOP: AngleDef[] = [
  { key: "front34", left: "8vw", top: "34svh", size: "40vw", z: 2, yFrom: "8vh", yTo: "-8vh",
    extraFrom: { scale: 0.96 }, extraTo: { scale: 1.04 } },
  { key: "side", left: "46vw", top: "92svh", size: "50vw", z: 3, yFrom: "18vh", yTo: "-18vh",
    extraFrom: { scale: 0.96 }, extraTo: { scale: 1.04 } },
  { key: "rear34", left: "4vw", top: "128svh", size: "34vw", z: 2, yFrom: "28vh", yTo: "-28vh",
    extraFrom: {}, extraTo: {} },
  { key: "top", left: "62vw", top: "150svh", size: "70svh", z: 3, yFrom: "34vh", yTo: "-34vh",
    extraFrom: { rotation: -18 }, extraTo: { rotation: 0 } },
];

export function initAngles(ctx: Ctx): void {
  const { site, gsap } = ctx;
  const app = document.getElementById("app");
  if (!app) return;

  const section = el("section", "");
  section.id = "angles";
  section.dataset.header = "light";

  const blob = el("div", "angles-blob");
  section.appendChild(blob);

  const titleBlock = el("div", "angles-title");
  titleBlock.append(el("p", "t-eyebrow", site.angles.eyebrow), el("h2", "t-h2", site.angles.title));
  section.appendChild(titleBlock);
  section.appendChild(el("div", "angles-bgword", site.angles.bgWord));

  const figs: HTMLElement[] = [];
  const keys = ["front34", "side", "rear34", "top"];
  for (const key of keys) {
    const asset = site.assets.base[key];
    if (!asset) {
      console.error(`[angles] missing base asset ${key}`);
      continue;
    }
    const fig = el("figure", `angles-fig angles-fig--${key}`);
    const img = el("img", "angles-img");
    img.setAttribute("src", asset.src);
    img.setAttribute("alt", `${site.angles.labels[key] ?? key} view of the sneaker`);
    img.setAttribute("width", String(asset.w));
    img.setAttribute("height", String(asset.h));
    img.setAttribute("decoding", "async");
    const chip = el("figcaption", "chip angles-chip", site.angles.labels[key] ?? key);
    fig.append(img, chip);
    section.appendChild(fig);
    figs.push(fig);
  }
  app.appendChild(section);

  if (ctx.prefersReduced) {
    section.classList.add("is-reduced");
    return;
  }

  ctx.mm.add("(min-width: 1024px)", () => {
    figs.forEach((fig, i) => {
      const def = DESKTOP[i];
      if (!def) return;
      gsap.fromTo(
        fig,
        { y: def.yFrom, ...def.extraFrom },
        {
          y: def.yTo,
          ...def.extraTo,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
      gsap.fromTo(
        fig,
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: fig, start: "top 100%", end: "top 85%", scrub: true },
        },
      );
    });
  });

  ctx.mm.add("(max-width: 1023px)", () => {
    const halves = ["4vh", "9vh", "14vh", "17vh"];
    figs.forEach((fig, i) => {
      const half = halves[i] ?? "9vh";
      gsap.fromTo(
        fig,
        { y: half },
        {
          y: `-${half}`,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
  });
}
