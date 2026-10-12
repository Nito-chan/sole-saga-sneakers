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

  // Mobile menu (ISS-010): nav links are hidden <=1023px with no replacement.
  // Approved addition: hamburger opening a full overlay reusing go().
  const menuBtn = el("button", "menu-btn") as HTMLButtonElement;
  menuBtn.type = "button";
  menuBtn.setAttribute("aria-label", "Open menu");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.setAttribute("aria-controls", "mobile-menu");
  menuBtn.append(el("span", "menu-bar"), el("span", "menu-bar"));
  const menu = el("div", "mobile-menu");
  menu.id = "mobile-menu";
  const menuList = el("nav", "mobile-menu-links");
  menuList.setAttribute("aria-label", "Sections");
  for (const item of site.nav) {
    const a = el("a", "mobile-menu-link", item.label);
    a.setAttribute("href", item.href);
    menuList.appendChild(a);
  }
  const menuCta = el("a", "btn mobile-menu-cta", site.cta.label);
  menuCta.setAttribute("href", site.cta.href);
  menu.append(menuList, menuCta);
  header.append(menuBtn, menu);
  document.body.appendChild(header);

  let menuOpen = false;
  const openMenu = (): void => {
    menuOpen = true;
    document.body.classList.add("menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close menu");
    if (!ctx.prefersReduced) lenis.stop();
    menuList.querySelector("a")?.focus();
  };
  const closeMenu = (): void => {
    if (!menuOpen) return;
    menuOpen = false;
    document.body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open menu");
    if (!ctx.prefersReduced) lenis.start();
  };
  menuBtn.addEventListener("click", () => (menuOpen ? (closeMenu(), menuBtn.focus()) : openMenu()));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (menuOpen) {
        closeMenu();
        menuBtn.focus();
      }
    }
    // Light focus trap: wrap Tab inside the open menu.
    if (e.key === "Tab" && menuOpen) {
      const focusables = Array.from(menu.querySelectorAll("a[href]")) as HTMLElement[];
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  const go = (href: string): void => {
    const target = document.querySelector(href);
    if (!target) return;
    if (ctx.prefersReduced) {
      target.scrollIntoView();
      return;
    }
    // Land below the fixed header instead of under it (ISS-029).
    const headerH = header.getBoundingClientRect().height || 72;
    lenis.scrollTo(target as HTMLElement, {
      duration: 1.4,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      offset: -headerH,
    });
  };
  header.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute("href") ?? "#hero";
    closeMenu();
    go(href);
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
