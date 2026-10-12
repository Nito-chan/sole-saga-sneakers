import { el } from "../lib/dom";
import type { Ctx } from "../lib/engine";

export function initMarquee(ctx: Ctx): void {
  const { site, gsap } = ctx;
  const app = document.getElementById("app");
  if (!app) return;

  const section = el("section", "");
  section.id = "marquee";
  section.dataset.header = "dark";

  const track = el("div", "marquee-track");
  const half = el("div", "marquee-half");
  site.marquee.items.forEach((item, i) => {
    const span = el("span", i % 2 === 0 ? "marquee-item" : "marquee-item marquee-item--ghost", item);
    half.appendChild(span);
    if (i < site.marquee.items.length - 1) {
      half.appendChild(el("span", "marquee-sep", site.marquee.separator));
    }
  });
  // Duplicated twice for a seamless loop; the clone is hidden from
  // assistive tech so items are not announced twice (ISS-016).
  const echo = half.cloneNode(true) as HTMLElement;
  echo.setAttribute("aria-hidden", "true");
  track.append(half, echo);
  section.appendChild(track);
  app.appendChild(section);

  if (ctx.prefersReduced) return;

  let x = 0;
  let halfW = half.offsetWidth;
  let inView = true;
  const SPEED = 60; // baseSpeedPxPerS
  let mult = 1;

  const measure = (): void => {
    halfW = half.offsetWidth;
    if (halfW > 0) x = -(((-x % halfW) + halfW) % halfW);
  };
  window.addEventListener("resize", measure);
  // Re-measure once display fonts arrive (ISS-033): the loop point captured
  // at init predates the font swap and the wrap visibly jumps.
  window.addEventListener("saga:ready", measure, { once: true });
  if (document.fonts) {
    document.fonts.ready.then(() => measure()).catch(() => undefined);
  }

  ctx.ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      inView = self.isActive;
    },
  });

  // Direction follows scroll; reversals ease over 400 ms.
  let flow = -1;
  let flowFrom = -1;
  let flowTo = -1;
  let reversal = 0;
  ctx.lenis.on("scroll", (e) => {
    const v = e.velocity ?? 0;
    mult = 1 + Math.min(Math.abs(v) * 0.4, 6);
    const want = (e.direction ?? 1) > 0 ? -1 : 1;
    if (want !== flowTo) {
      flowFrom = flow;
      flowTo = want;
      reversal = performance.now();
    }
  });

  gsap.ticker.add((_t, deltaMs) => {
    if (!inView || halfW === 0) return;
    const dt = Math.min(deltaMs / 1000, 0.1);
    const k = Math.min(1, (performance.now() - reversal) / 400);
    const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    flow = flowFrom + (flowTo - flowFrom) * eased;
    x += flow * SPEED * mult * dt;
    if (x <= -halfW) x += halfW;
    if (x > 0) x -= halfW;
    track.style.transform = `translateX(${x}px)`;
  });
}
