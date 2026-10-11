import { el } from "../lib/dom";
import type { Ctx } from "../lib/engine";

export function initFooter(ctx: Ctx): void {
  const { site, gsap } = ctx;
  const app = document.getElementById("app");
  if (!app) return;

  const section = el("footer", "");
  section.id = "footer";
  section.dataset.header = "dark";

  const row = el("div", "f-row");
  const howCol = el("div", "f-how");
  howCol.appendChild(el("p", "t-eyebrow", site.footer.howTitle));
  const list = el("ul", "f-list");
  for (const line of site.footer.how.slice(0, 6)) {
    const li = el("li", "");
    li.append(el("span", "f-dot"), el("span", undefined, line));
    list.appendChild(li);
  }
  howCol.appendChild(list);
  row.appendChild(howCol);

  if (site.footer.links.length > 0) {
    const linkCol = el("div", "f-links");
    for (const l of site.footer.links) {
      const a = el("a", "f-link", l.label);
      a.setAttribute("href", l.href);
      linkCol.appendChild(a);
    }
    row.appendChild(linkCol);
  }

  const meta = el("div", "f-meta");
  meta.appendChild(el("p", "t-small", site.footer.credit));
  meta.appendChild(el("p", "t-small f-dim", `© ${new Date().getFullYear()} · ${site.footer.copyright}`));
  row.appendChild(meta);

  const word = el("div", "f-word", site.brand.name);
  section.append(row, word);
  app.appendChild(section);

  if (ctx.prefersReduced) return;
  gsap.from("#footer .f-row", {
    y: 40,
    opacity: 0,
    duration: 0.9,
    ease: "expo.out",
    scrollTrigger: { trigger: section, start: "top 85%" },
  });
  gsap.fromTo(
    "#footer .f-word",
    { y: "12vh" },
    {
      y: "0vh",
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom bottom", scrub: true },
    },
  );
}
