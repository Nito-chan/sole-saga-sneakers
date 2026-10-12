import { el } from "../lib/dom";
import { frameOrder, isSaveData, loadFonts, loadHeroFrames, type Frame } from "../lib/preload";
import type { Ctx } from "../lib/engine";

export interface ReadyDetail {
  frames: Frame[];
  fallback: boolean;
}

export interface FramesDetail {
  frames: Frame[];
}

export async function initPreloader(ctx: Ctx): Promise<void> {
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
  // Staged hero load (ISS-003): block only on frame 1 + every 6th (13 frames),
  // enough for the first paint; the rest stream in the background.
  const order = frameOrder(site.assets.hero.count);
  const priority = order.slice(0, 13);
  const rest = order.slice(13);
  const partial: (Frame | null)[] = new Array(site.assets.hero.count).fill(null);
  const total = 3 + priority.length;
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
  const firstPass = loadHeroFrames(heroSet.dir, site.assets.hero.count, tick, priority, partial);
  const timeoutPass = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 12000));

  const first = await Promise.race([firstPass, timeoutPass]);
  let frames: Frame[] = [];
  let loaded = 0;
  if (first === null) {
    // Slow network: release with the fallback; a late arrival still upgrades
    // the hero through saga:frames.
    console.warn("[preload] hero priority frames timed out; showing fallback until frames arrive");
    await fontsDone;
    void firstPass.then((r) => {
      if (r.loaded > 0) {
        window.dispatchEvent(
          new CustomEvent<FramesDetail>("saga:frames", { detail: { frames: r.frames } }),
        );
      }
    });
  } else {
    await fontsDone;
    frames = first.frames;
    loaded = first.loaded;
    for (let i = 0; i < frames.length; i++) partial[i] = frames[i];
  }

  // Background: fill the remaining frames, then swap them into the player.
  if (!isSaveData()) {
    void loadHeroFrames(heroSet.dir, site.assets.hero.count, () => undefined, rest, partial).then(
      (r) => {
        window.dispatchEvent(
          new CustomEvent<FramesDetail>("saga:frames", { detail: { frames: r.frames } }),
        );
      },
    );
  }

  cancelAnimationFrame(raf);
  target = 1;
  displayed = 1;
  fill.style.width = "100%";
  count.textContent = "100";

  const fallback = loaded === 0;
  if (fallback && first !== null) {
    console.warn("[preload] hero frames failed; showing base-front34 fallback");
  }

    const elapsed = performance.now() - startedAt;
    // Fast cached loads skip the branding hold (ISS-037).
    const wait = elapsed < 400 ? 250 : Math.max(0, 600 - elapsed) + 150;
  await new Promise<void>((resolve) => {
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
}
