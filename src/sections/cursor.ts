import { el } from "../lib/dom";
import type { Ctx } from "../lib/engine";

export function initCursor(ctx: Ctx): void {
  if (ctx.prefersReduced) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const dot = el("div", "cursor-dot");
  const ring = el("div", "cursor-ring");
  document.body.append(dot, ring);

  const rx = ctx.gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
  const ry = ctx.gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });
  let shown = false;

  window.addEventListener(
    "pointermove",
    (e) => {
      if (!shown) {
        shown = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      rx(e.clientX);
      ry(e.clientY);
    },
    { passive: true },
  );

  document.documentElement.addEventListener("mouseleave", () => {
    shown = false;
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  });

  const hoverSel = "a, button, input, [data-cursor]";
  document.addEventListener("mouseover", (e) => {
    const hot = (e.target as HTMLElement).closest(hoverSel);
    ring.classList.toggle("is-hot", hot !== null);
    dot.classList.toggle("is-hot", hot !== null);
  });
}
