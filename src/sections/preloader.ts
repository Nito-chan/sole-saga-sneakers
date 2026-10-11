import { el } from "../lib/dom";
import { loadFonts, loadHeroFrames, type Frame } from "../lib/preload";
import type { Ctx } from "../lib/engine";

export interface ReadyDetail {
  frames: Frame[];
  fallback: boolean;
}

export function initPreloader(ctx: Ctx): Promise<void> {
  const { site, lenis, gsap, ScrollTrigger } = ctx;
  const reduced = ctx.prefersReduced;
  const startedAt = performance.now();

  const root = el("div", "preloader");
  root.setAttribute("role", "status");
  root.setAttribute("aria-label", "Loading");

  const brand = el("div", "preloader-brand t-hero");
  for (const ch of site.brand.name) {
    const s = el("span", "preloader-letter", ch === " " ? " " : ch);
    brand.appendChild(s);
  }
  const track = el("div", "preloader-track");
  const fill = el("div", "preloader-fill");
  track.appendChild(fill);
  const count = el("div", "preloader-count t-hero", "0");
  root.append(brand, track, count);
  document.body.appendChild(root);

  const heroSet = window.innerWidth >= 1024 ? site.assets.hero.desktop : site.assets.hero.mobile;
  const total = 3 + site.assets.hero.count;
  let done = 0;
  let target = 0;
  let displayed = 0;
  const tick = (): void => {
    done++;
    target = Math.min(1, done / total);
  };

  if (!reduced) {
    gsap.fromTo(
      root.querySelectorAll(".preloader-letter"),
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.04 },
    );
  }

  let raf = 0;
  const loop = (): void => {
    displayed += (target - displayed) * 0.12;
    if (target >= 1 && displayed > 0.995) displayed = 1;
    fill.style.width = `${displayed * 100}%`;
    count.textContent = String(Math.round(displayed * 100));
    if (displayed < 1) raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const fontsDone = loadFonts(tick);
  const framesDone = loadHeroFrames(heroSet.dir, site.assets.hero.count, tick);

  return Promise.all([fontsDone, framesDone]).then(([, { frames, loaded }]) => {
    cancelAnimationFrame(raf);
    target = 1;
    displayed = 1;
    fill.style.width = "100%";
    count.textContent = "100";

    const fallback = loaded === 0;
    if (fallback) {
      console.warn("[preload] hero frames failed; showing base-front34 fallback");
    }

    const elapsed = performance.now() - startedAt;
    const wait = Math.max(0, 900 - elapsed) + 300;
    return new Promise<void>((resolve) => {
      window.setTimeout(() => {
        document.body.classList.add("is-ready");
        const exit = (): void => {
          root.remove();
          if (!ctx.prefersReduced) lenis.start();
          ScrollTrigger.refresh();
          window.setTimeout(() => ScrollTrigger.refresh(), 600);
          window.dispatchEvent(
            new CustomEvent<ReadyDetail>("saga:ready", { detail: { frames, fallback } }),
          );
          resolve();
        };
        if (reduced) {
          exit();
        } else {
          gsap.to(root, {
            clipPath: "inset(0 0 100% 0)",
            duration: 0.9,
            ease: "power4.inOut",
            onComplete: exit,
          });
        }
      }, wait);
    });
  });
}
