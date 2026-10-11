import type { Ctx } from "./engine";

interface Checkpoint {
  name: string;
  y: number;
}

interface QaHook {
  scrollTo(y: number): void;
  checkpoints(): Checkpoint[];
  expectedScreens(): number;
}

declare global {
  interface Window {
    __qa?: QaHook;
  }
}

export function initQa(ctx: Ctx): void {
  if (!window.location.search.includes("qa=1")) return;
  const { site, lenis, ScrollTrigger } = ctx;

  const byId = (id: string) => ScrollTrigger.getById(id);
  const topOf = (sel: string): number => {
    const node = document.querySelector(sel) as HTMLElement | null;
    if (!node) return 0;
    return node.getBoundingClientRect().top + window.scrollY;
  };

  const scrollTo = (y: number): void => {
    lenis.scrollTo(y, { immediate: true, force: true });
    ScrollTrigger.update();
  };

  const checkpoints = (): Checkpoint[] => {
    const cps: Checkpoint[] = [];
    const hero = byId("hero");
    if (hero) {
      const span = hero.end - hero.start;
      for (const [name, f] of [["hero-0", 0], ["hero-33", 0.33], ["hero-66", 0.66], ["hero-100", 1]] as const) {
        cps.push({ name, y: hero.start + f * span });
      }
    }
    cps.push({ name: "marquee", y: topOf("#marquee") });
    const anatomy = byId("anatomy");
    const beats = site.anatomy.beats.length;
    if (anatomy) {
      const span = anatomy.end - anatomy.start;
      for (let i = 0; i < beats; i++) {
        cps.push({ name: `anatomy-b${i + 1}`, y: anatomy.start + ((i + 0.5) / beats) * span });
      }
    }
    const anglesTop = topOf("#angles");
    const anglesH = (document.getElementById("angles")?.offsetHeight ?? 1);
    for (const f of [0.25, 0.5, 0.75]) {
      cps.push({ name: `angles-${Math.round(f * 100)}`, y: anglesTop + f * anglesH });
    }
    const colors = byId("colors");
    const cn = site.colors.items.length;
    if (colors) {
      const span = colors.end - colors.start;
      for (let k = 0; k < cn; k++) {
        cps.push({ name: `colors-hold-${k + 1}`, y: colors.start + ((k + 0.3) / cn) * span });
        if (k < cn - 1) {
          cps.push({ name: `colors-wipe-${k + 1}`, y: colors.start + ((k + 0.82) / cn) * span });
        }
      }
    }
    const asite = site.anime.items.length;
    const D = asite + 0.6;
    const animeSt = byId("anime");
    if (animeSt) {
      const span = animeSt.end - animeSt.start;
      for (let k = 0; k < asite; k++) {
        cps.push({ name: `anime-hold-${k + 1}`, y: animeSt.start + (k / D) * span });
        cps.push({ name: `anime-swap-${k + 1}`, y: animeSt.start + ((k + 0.5) / D) * span });
      }
      cps.push({ name: "anime-roster", y: animeSt.start + ((asite + 0.45) / D) * span });
    }
    cps.push({ name: "drop", y: topOf("#drop") });
    cps.push({ name: "footer", y: topOf("#footer") });
    return cps;
  };

  const expectedScreens = (): number => {
    const beats = site.anatomy.beats.length;
    const cn = site.colors.items.length;
    const an = site.anime.items.length;
    const total =
      400 + 16 + (100 + beats * 80) + 220 + (100 + cn * 80) + (100 + (an + 0.6) * 110) + 100 + 60;
    return total / 100;
  };

  window.__qa = { scrollTo, checkpoints, expectedScreens };
}
