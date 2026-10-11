import { el, qsa } from "../lib/dom";
import type { Ctx } from "../lib/engine";

function applyTheme(header: HTMLElement, theme: string): void {
  header.dataset.theme = theme === "dark" ? "dark" : "light";
}

export function initHeader(ctx: Ctx): void {
  const { site, lenis, ScrollTrigger } = ctx;
  const header = el("header", "site-header");
  header.dataset.theme = "light";

  const word = el("a", "wordmark", site.brand.name);
  word.setAttribute("href", "#hero");
  header.appendChild(word);

  const nav = el("nav", "nav-links");
  nav.setAttribute("aria-label", "Sections");
  for (const item of site.nav) {
    const a = el("a", undefined, item.label);
    a.setAttribute("href", item.href);
    nav.appendChild(a);
  }
  header.appendChild(nav);

  const cta = el("a", "btn btn--sm header-cta", site.cta.label);
  cta.setAttribute("href", site.cta.href);
  header.appendChild(cta);
  document.body.appendChild(header);

  const go = (href: string): void => {
    const target = document.querySelector(href);
    if (!target) return;
    if (ctx.prefersReduced) {
      target.scrollIntoView();
      return;
    }
    lenis.scrollTo(target as HTMLElement, {
      duration: 1.4,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      offset: 0,
    });
  };
  header.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a) return;
    e.preventDefault();
    go(a.getAttribute("href") ?? "#hero");
  });

  const sections = qsa<HTMLElement>(document, "section[data-header]");
  for (const section of sections) {
    ScrollTrigger.create({
      trigger: section,
      start: "top 72px",
      end: "bottom 72px",
      onToggle: (self) => {
        if (self.isActive) applyTheme(header, section.dataset.header ?? "light");
      },
    });
  }

  // The colorways section rewrites its own data-header at each wipe midpoint.
  const colors = document.getElementById("colors");
  if (colors) {
    const mo = new MutationObserver(() => {
      const r = colors.getBoundingClientRect();
      if (r.top <= 72 && r.bottom >= 72) {
        applyTheme(header, colors.dataset.header ?? "light");
      }
    });
    mo.observe(colors, { attributes: true, attributeFilter: ["data-header"] });
  }
}
