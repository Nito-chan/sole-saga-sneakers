import { el } from "../lib/dom";
import { FramePlayer } from "../lib/frameplayer";
import type { ReadyDetail } from "./preloader";
import type { Ctx } from "../lib/engine";

export function initHero(ctx: Ctx): void {
  const { site, gsap, ScrollTrigger } = ctx;
  const hero = site.hero;
  const app = document.getElementById("app");
  if (!app) return;

  const section = el("section", "");
  section.id = "hero";
  section.dataset.header = "light";

  if (ctx.prefersReduced) {
    const wrap = el("div", "hero-static");
    const eyebrow = el("p", "t-eyebrow", hero.eyebrow);
    const h1 = el("h1", "t-hero");
    h1.append(el("span", "line", hero.line1), el("span", "line line--grad", hero.line2));
    const sub = el("p", "t-body-l hero-sub", hero.sub);
    const ctaRow = el("div", "cta-row");
    const primary = el("a", "btn", hero.primary.label);
    primary.setAttribute("href", hero.primary.href);
    ctaRow.appendChild(primary);
    const img = el("img", "hero-fallback");
    img.setAttribute("src", site.assets.base.front34.src);
    img.setAttribute("alt", "Rotating sneaker");
    img.setAttribute("width", String(site.assets.base.front34.w));
    img.setAttribute("height", String(site.assets.base.front34.h));
    wrap.append(eyebrow, h1, sub, ctaRow, img);
    section.appendChild(wrap);
    app.appendChild(section);
    return;
  }

  const bg = el("div", "hero-bg");
  for (const cls of ["blob blob--a", "blob blob--b", "blob blob--c"]) {
    bg.appendChild(el("div", cls));
  }
  const halftone = el("img", "hero-halftone");
  halftone.setAttribute("src", site.assets.fx.halftone.src);
  halftone.setAttribute("alt", "");
  halftone.setAttribute("aria-hidden", "true");
  bg.appendChild(halftone);
  bg.appendChild(el("div", "hero-bgword", hero.bgWord));

  const copy = el("div", "hero-copy");
  const eyebrow = el("p", "t-eyebrow hero-eyebrow", hero.eyebrow);
  const h1 = el("h1", "t-hero hero-h1");
  const mask1 = el("span", "line-mask");
  mask1.appendChild(el("span", "line", hero.line1));
  const mask2 = el("span", "line-mask");
  mask2.appendChild(el("span", "line line--grad", hero.line2));
  h1.append(mask1, mask2);
  const sub = el("p", "t-body-l hero-sub", hero.sub);
  const ctaRow = el("div", "cta-row");
  const primary = el("a", "btn", hero.primary.label);
  primary.setAttribute("href", hero.primary.href);
  const ghost = el("a", "link-arrow", hero.secondary.label);
  ghost.setAttribute("href", hero.secondary.href);
  ghost.appendChild(el("span", "arr", "→"));
  ctaRow.append(primary, ghost);
  copy.append(eyebrow, h1, sub, ctaRow);

  const hint = el("div", "scroll-hint");
  hint.append(el("span", "t-eyebrow", hero.scrollHint), el("span", "hint-line"));

  const stage = el("div", "hero-stage");
  const bob = el("div", "hero-bob");
  const canvas = el("canvas", "hero-canvas");
  canvas.setAttribute("aria-label", "Rotating sneaker");
  canvas.setAttribute("role", "img");
  bob.appendChild(canvas);
  const shadow = el("div", "hero-shadow");
  stage.append(bob, shadow);
  for (const chip of hero.chips) {
    const c = el("span", "chip hero-chip");
    c.append(el("span", "dot"), el("span", undefined, chip.label));
    c.style.left = `${chip.x}%`;
    c.style.top = `${chip.y}%`;
    stage.appendChild(c);
  }

  section.append(bg, copy, hint, stage);
  app.appendChild(section);

  const player = new FramePlayer(canvas);
  window.addEventListener("resize", () => player.resize());

  // Intro (paused until the preloader exits).
  gsap.set("#hero .line", { yPercent: 110 });
  gsap.set(["#hero .hero-eyebrow", "#hero .hero-sub", "#hero .cta-row"], { y: 24, opacity: 0 });
  gsap.set("#hero .hero-stage", { scale: 1.12, opacity: 0 });
  gsap.set("#hero .hero-bgword", { opacity: 0 });
  const intro = gsap.timeline({ paused: true });
  intro
    .to("#hero .line", { yPercent: 0, duration: 1.0, ease: "expo.out", stagger: 0.08 }, 0)
    .to(
      ["#hero .hero-eyebrow", "#hero .hero-sub", "#hero .cta-row"],
      { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.08 },
      0.25,
    )
    .to("#hero .hero-stage", { scale: 1, opacity: 1, duration: 1.4, ease: "expo.out" }, 0)
    .to("#hero .hero-bgword", { opacity: 0.07, duration: 1.0 }, 0);

  window.addEventListener(
    "saga:ready",
    (e) => {
      const detail = (e as CustomEvent<ReadyDetail>).detail;
      if (detail.fallback || detail.frames.length === 0) {
        const img = el("img", "hero-fallback");
        img.setAttribute("src", site.assets.base.front34.src);
        img.setAttribute("alt", "Rotating sneaker");
        img.setAttribute("width", String(site.assets.base.front34.w));
        img.setAttribute("height", String(site.assets.base.front34.h));
        bob.replaceChildren(img);
        player.destroy();
      } else {
        player.setFrames(detail.frames);
      }
      intro.play();
    },
    { once: true },
  );

  const buildDesktop = (): void => {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=300%",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        id: "hero",
        onUpdate: (self) => player.setProgress(self.progress),
        onToggle: (self) => player.setActive(self.isActive),
      },
    });
    tl.to("#hero .hero-copy .line", { x: "-14vw", duration: 0.3, ease: "power2.in", stagger: 0.04 }, 0);
    tl.to("#hero .hero-copy", { opacity: 0, duration: 0.3, ease: "power2.in" }, 0);
    tl.to("#hero .blob--a", { y: "-12svh", duration: 1 }, 0);
    tl.to("#hero .blob--b", { y: "14svh", duration: 1 }, 0);
    tl.to("#hero .blob--c", { y: "-8svh", duration: 1 }, 0);
    tl.to("#hero .hero-bgword", { x: "10vw", duration: 0.3 }, 0);
    tl.to("#hero .hero-stage", { x: "-14vw", scale: 1.18, duration: 0.55, ease: "power1.inOut" }, 0.3);
    tl.to("#hero .hero-chip", { opacity: 1, y: 0, duration: 0.15, stagger: 0.05 }, 0.55);
    tl.to("#hero .hero-chip", { opacity: 0, duration: 0.1 }, 0.9);
  };

  const buildMobile = (): void => {
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=300%",
        scrub: 0.5,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        id: "hero",
        onUpdate: (self) => player.setProgress(self.progress),
        onToggle: (self) => player.setActive(self.isActive),
      },
    });
    tl.to("#hero .hero-copy", { y: "-8svh", opacity: 0, duration: 0.3 }, 0);
    tl.to("#hero .hero-stage", { scale: 1.12, duration: 0.55 }, 0.3);
  };

  ctx.mm.add("(min-width: 1024px)", buildDesktop);
  ctx.mm.add("(max-width: 1023px)", buildMobile);
}
