import { el } from "../lib/dom";
import { CFG } from "../config";
import type { Ctx } from "../lib/engine";
import type { AnimeItem } from "../lib/data";

interface Geo {
  outSX: number; // sneaker exit x (vw)
  outSY: number; // sneaker exit y (vh)
  inSX: number; // sneaker entry x (vw)
  inSY: number; // sneaker entry y (vh)
  outPX: number; // portrait exit x (vw)
  inPX: number; // portrait entry x (vw)
  skewMax: number;
}

const DESKTOP_GEO: Geo = { outSX: -30, outSY: 12, inSX: -26, inSY: -12, outPX: 24, inPX: 22, skewMax: 5 };
const MOBILE_GEO: Geo = { outSX: -15, outSY: 6, inSX: -13, inSY: -6, outPX: 12, inPX: 11, skewMax: 3 };

function maskWrap(child: HTMLElement, spacing: string): HTMLElement {
  const mask = el("div", `a-mask ${spacing}`);
  mask.appendChild(child);
  return mask;
}

export function initAnime(ctx: Ctx): void {
  const { site, gsap } = ctx;
  const items: AnimeItem[] = site.anime.items;
  const N = items.length;
  const D = N + CFG.anime.rosterHold;
  const app = document.getElementById("app");
  if (!app || N === 0) return;

  const section = el("section", "");
  section.id = "anime";
  section.dataset.header = "dark";

  if (ctx.prefersReduced) {
    const wrap = el("div", "anime-static");
    wrap.appendChild(el("p", "t-eyebrow", site.anime.eyebrow));
    for (const item of items) {
      const card = el("article", "anime-card");
      card.style.background = item.theme.primary;
      card.style.color = item.theme.text;
      const cimg = el("img", "");
      cimg.setAttribute("src", item.character);
      cimg.setAttribute("alt", `Character ${item.name}`);
      cimg.setAttribute("decoding", "async");
      const simg = el("img", "");
      simg.setAttribute("src", item.sneaker);
      simg.setAttribute("alt", `Sneaker ${item.name}`);
      simg.setAttribute("decoding", "async");
      card.append(
        cimg,
        simg,
        el("h3", "t-anime-name", item.name),
        el("p", "t-body-l", item.line),
      );
      wrap.appendChild(card);
    }
    const row = el("div", "anime-roster-row", site.anime.rosterTitle);
    wrap.appendChild(row);
    section.appendChild(wrap);
    app.appendChild(section);
    return;
  }

  const stage = el("div", "an-stage");

  const bgLayers: HTMLElement[] = [];
  for (let i = 0; i <= N; i++) {
    const layer = el("div", "a-bg-layer");
    layer.style.background = i < N ? items[i].theme.primary : "var(--ink)";
    stage.appendChild(layer);
    bgLayers.push(layer);
  }

  const halftone = el("div", "a-halftone");
  halftone.style.backgroundImage = `url("${site.assets.fx.halftone.src}")`;
  const panel = el("div", "a-panel");
  panel.style.background = items[0].theme.deep;
  const dividerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  dividerSvg.setAttribute("class", "a-divider");
  dividerSvg.setAttribute("viewBox", "0 0 100 100");
  dividerSvg.setAttribute("preserveAspectRatio", "none");
  const dividerLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
  dividerLine.setAttribute("x1", "60");
  dividerLine.setAttribute("y1", "0");
  dividerLine.setAttribute("x2", "40");
  dividerLine.setAttribute("y2", "100");
  dividerLine.setAttribute("stroke", items[0].theme.accent);
  dividerLine.setAttribute("stroke-width", "6");
  dividerLine.setAttribute("vector-effect", "non-scaling-stroke");
  dividerSvg.appendChild(dividerLine);
  stage.append(halftone, panel, dividerSvg);

  const giants: HTMLElement[] = [];
  for (const item of items) {
    const gdiv = el("div", "a-name", item.name);
    if (item !== items[0]) gdiv.style.opacity = "0";
    stage.appendChild(gdiv);
    giants.push(gdiv);
  }

  interface Pair {
    portW: HTMLElement;
    portImg: HTMLImageElement;
    sneakImg: HTMLImageElement;
    info: HTMLElement;
    vel: HTMLElement[];
    mouseS: HTMLElement;
    mouseP: HTMLElement;
    infoLines: HTMLElement[];
  }
  const pairs: Pair[] = [];
  for (const item of items) {
    const sneakW = el("div", "a-sneaker");
    const sneakVel = el("div", "a-vel");
    const sneakMouse = el("div", "a-mouse");
    const sneakImg = el("img", "a-sneaker-img");
    sneakImg.setAttribute("src", item.sneaker);
    sneakImg.setAttribute("alt", `Sneaker ${item.name}`);
    sneakImg.setAttribute("decoding", "async");
    sneakImg.setAttribute("loading", "lazy");
    sneakMouse.appendChild(sneakImg);
    sneakVel.appendChild(sneakMouse);
    sneakW.appendChild(sneakVel);

    const portW = el("div", "a-port");
    portW.style.borderColor = item.theme.accent;
    portW.style.background = item.theme.deep;
    const portVel = el("div", "a-vel");
    const portMouse = el("div", "a-mouse");
    const portImg = el("img", "a-port-img");
    portImg.setAttribute("src", item.character);
    portImg.setAttribute("alt", `Character ${item.name}`);
    portImg.setAttribute("decoding", "async");
    portImg.setAttribute("loading", "lazy");
    portMouse.appendChild(portImg);
    portVel.appendChild(portMouse);
    portW.appendChild(portVel);
    stage.append(sneakW, portW);

    const info = el("div", "a-info");
    const epithet = el("p", "t-eyebrow a-epithet", item.epithet);
    epithet.style.color = item.theme.accent;
    const title = el("h3", "t-anime-name an-title", item.name);
    title.style.color = item.theme.text;
    const line = el("p", "t-body-l a-line", item.line);
    line.style.color = item.theme.text;
    const cta = el("a", "btn a-cta", site.anime.cta);
    cta.setAttribute("href", "#drop");
    const lines = [epithet, title, line, cta];
    const gaps = ["a-gap-s", "a-gap-s", "a-gap-l", "a-gap-n"];
    lines.forEach((l, li) => info.appendChild(maskWrap(l, gaps[li] ?? "a-gap-n")));
    stage.appendChild(info);

    pairs.push({
      portW,
      portImg,
      sneakImg,
      info,
      vel: [portVel, sneakVel],
      mouseS: sneakMouse,
      mouseP: portMouse,
      infoLines: lines,
    });
  }

  // Persistent roster rail: mini portraits double as jump buttons.
  const rail = el("div", "a-rail");
  rail.appendChild(el("span", "t-eyebrow a-rail-label", site.anime.eyebrow));
  const minis: HTMLButtonElement[] = [];
  items.forEach((item, i) => {
    const b = el("button", "a-mini");
    b.setAttribute("aria-label", `Show ${item.name}`);
    b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    if (i === 0) b.classList.add("is-active");
    const img = el("img", "a-mini-img");
    img.setAttribute("src", item.face);
    img.setAttribute("alt", "");
    img.setAttribute("decoding", "async");
    img.setAttribute("loading", "lazy");
    b.appendChild(img);
    b.addEventListener("click", () => {
      const cst = ctx.ScrollTrigger.getById("anime");
      if (!cst || ctx.prefersReduced) return;
      ctx.lenis.scrollTo(cst.start + (i / D) * (cst.end - cst.start), { duration: 1.2 });
    });
    rail.appendChild(b);
    minis.push(b);
  });
  stage.appendChild(rail);

  const speed = el("img", "a-speed");
  speed.setAttribute("src", site.assets.fx.speedlines.src);
  speed.setAttribute("alt", "");
  speed.setAttribute("aria-hidden", "true");
  const ink = el("video", "a-ink");
  ink.muted = true;
  (ink as HTMLVideoElement).playsInline = true;
  ink.preload = "metadata";
  ink.setAttribute("data-lazy", "");
  ink.setAttribute("aria-hidden", "true");
  const inkSrc = el("source", "");
  inkSrc.setAttribute("src", site.assets.fx.inkDark.src);
  inkSrc.setAttribute("type", "video/mp4");
  ink.appendChild(inkSrc);
  const flash = el("div", "a-flash");
  stage.append(speed, ink, flash);

  const roster = el("div", "a-roster");
  const rosterTitle = el("h3", "a-roster-title", site.anime.rosterTitle);
  const cols = el("div", "a-roster-cols");
  const rosterCols: HTMLElement[] = [];
  items.forEach((item, i) => {
    const col = el("div", `a-roster-col pos-${i}`);
    const glow = el("div", "a-roster-glow");
    glow.style.background = `radial-gradient(closest-side, ${item.theme.accent}, transparent)`;
    const simg = el("img", "a-roster-sneak");
    simg.setAttribute("src", item.sneaker);
    simg.setAttribute("alt", `Sneaker ${item.name}`);
    simg.setAttribute("decoding", "async");
    simg.setAttribute("loading", "lazy");
    const medal = el("div", "a-roster-medal");
    medal.style.boxShadow = `0 0 28px ${item.theme.accent}`;
    const cimg = el("img", "a-roster-medimg");
    cimg.setAttribute("src", item.face);
    cimg.setAttribute("alt", "");
    cimg.setAttribute("decoding", "async");
    cimg.setAttribute("loading", "lazy");
    medal.appendChild(cimg);
    col.append(glow, simg, medal, el("div", "a-roster-name", item.name));
    cols.appendChild(col);
    rosterCols.push(col);
  });
  const rosterCta = el("a", "btn a-roster-cta", site.anime.rosterCta);
  rosterCta.setAttribute("href", "#drop");
  roster.append(rosterTitle, cols, rosterCta);
  stage.appendChild(roster);

  section.appendChild(stage);
  app.appendChild(section);

  let activeIdx = 0;
  let halfStep = 0;
  let hx = 0;
  // Idle drift gets its own accumulator (ISS-038): sharing hx coupled the
  // swap pulse to the background drift.
  let driftX = 0;

  const setMini = (idx: number): void => {
    if (idx === activeIdx) return;
    activeIdx = idx;
    minis.forEach((b, i) => {
      b.classList.toggle("is-active", i === idx);
      b.setAttribute("aria-pressed", i === idx ? "true" : "false");
      b.style.borderColor = i === idx && items[idx] ? items[idx].theme.accent : "";
    });
  };
  if (items[0]) minis[0].style.borderColor = items[0].theme.accent;

  const build = (geo: Geo): void => {
    gsap.set(bgLayers.slice(1), { clipPath: "polygon(0% 0%, 0% 0%, -20% 100%, 0% 100%)" });
    pairs.forEach((p, i) => {
      if (i === 0) return;
      gsap.set([p.portW, p.sneakImg], { opacity: 0 });
      gsap.set(p.infoLines, { yPercent: 120 });
      p.info.setAttribute("aria-hidden", "true");
    });
    gsap.set(speed, { opacity: 0, scale: 1 });
    gsap.set(ink, { opacity: 0 });
    gsap.set(flash, { opacity: 0 });
    gsap.set(roster, { opacity: 0, visibility: "hidden" });
    gsap.set(rosterCols, { y: "30vh", opacity: 0 });
    gsap.set(rosterCta, { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: `+=${D * CFG.anime.stepSvh}%`,
        scrub: 0.4,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        id: "anime",
        onUpdate: (self) => {
          const p = self.progress * D;
          const idx = Math.min(N - 1, Math.max(0, Math.floor(p)));
          setMini(idx);
          // Masked-off info blocks stay in the a11y tree; expose one (ISS-017).
          pairs.forEach((pr, j) => pr.info.setAttribute("aria-hidden", String(j !== idx)));
          const step = Math.floor(p);
          if (step !== halfStep) {
            halfStep = step;
            hx += 60;
          }
        },
      },
    });

    const inkProxy = { t: 0 };
    // Anchor the timeline duration to D so step positions map 1:1 to scroll.
    tl.set({}, {}, D);
    const scrubInk = (at: number, dur: number): void => {
      inkProxy.t = 0;
      tl.to(
        inkProxy,
        {
          t: 1.2,
          duration: dur,
          ease: "none",
          onUpdate: () => {
            try {
              ink.currentTime = inkProxy.t;
            } catch {
              /* not ready */
            }
          },
        },
        at,
      );
    };

    for (let k = 0; k < N; k++) {
      const at = k + CFG.anime.swapStart; // 0.2; window length 0.6
      const last = k === N - 1;
      const out = pairs[k];
      const nxt = last ? null : pairs[k + 1];

      // Wind-up 0.00–0.18.
      tl.to(out.sneakImg, { scale: 0.94, rotation: -4, x: "-1vw", duration: 0.108 }, at);
      tl.to(out.portImg, { scale: 0.97, x: "1vw", duration: 0.108 }, at);
      tl.to(speed, { opacity: 0.6, scale: 1.08, duration: 0.108 }, at);

      // Hit (out) 0.18–0.46.
      tl.to(
        out.sneakImg,
        {
          x: `${geo.outSX}vw`,
          y: `${geo.outSY}vh`,
          rotation: -22,
          skewX: -22,
          filter: "blur(16px)",
          opacity: 0,
          duration: 0.168,
          ease: "power3.in",
        },
        at + 0.108,
      );
      tl.to(
        out.portImg,
        {
          x: `${geo.outPX}vw`,
          skewX: 18,
          filter: "blur(12px)",
          duration: 0.168,
          ease: "power3.in",
        },
        at + 0.108,
      );
      tl.to(out.portW, { opacity: 0, duration: 0.168 }, at + 0.108);
      tl.to(speed, { opacity: 1, scale: 1.35, duration: 0.168 }, at + 0.108);
      tl.to(ink, { opacity: 0.95, duration: 0.168 }, at + 0.108);
      scrubInk(at + 0.108, 0.168);
      tl.fromTo(
        bgLayers[k + 1],
        { clipPath: "polygon(0% 0%, 0% 0%, -20% 100%, 0% 100%)" },
        {
          clipPath: "polygon(0% 0%, 140% 0%, 120% 100%, 0% 100%)",
          duration: 0.168,
          ease: "power2.inOut",
        },
        at + 0.132,
      );
      if (!last && nxt) {
        tl.to(panel, { backgroundColor: items[k + 1].theme.deep, duration: 0.156 }, at + 0.144);
        tl.to(dividerLine, { stroke: items[k + 1].theme.accent, duration: 0.156 }, at + 0.144);
      }
      tl.to(giants[k], { y: "-10vh", opacity: 0, duration: 0.168 }, at + 0.108);
      tl.to(out.infoLines, { yPercent: -120, duration: 0.168, stagger: 0.02 }, at + 0.108);

      // Flash spike, capped low (ISS-005): full-white frames read as a glitch
      // and are a photosensitivity risk; speedlines + ink carry the impact.
      tl.to(flash, { opacity: 0.3, duration: 0.018, ease: "power4.out" }, at + 0.24);
      tl.to(flash, { opacity: 0, duration: 0.018, ease: "power4.out" }, at + 0.258);

      if (!last && nxt) {
        // Arrival (in) 0.46–0.84.
        tl.fromTo(
          nxt.sneakImg,
          {
            x: `${geo.inSX}vw`,
            y: `${geo.inSY}vh`,
            rotation: 40,
            skewX: 18,
            filter: "blur(14px)",
            opacity: 0,
          },
          {
            x: "0vw",
            y: "0vh",
            rotation: 0,
            skewX: 0,
            filter: "blur(0px)",
            opacity: 1,
            duration: 0.192,
            ease: "back.out(1.5)",
          },
          at + 0.276,
        );
        tl.fromTo(
          nxt.portImg,
          { x: `${geo.inPX}vw`, skewX: -14, filter: "blur(10px)" },
          {
            x: "0vw",
            skewX: 0,
            filter: "blur(0px)",
            duration: 0.192,
            ease: "back.out(1.2)",
          },
          at + 0.3,
        );
        tl.fromTo(nxt.portW, { opacity: 0 }, { opacity: 1, duration: 0.192 }, at + 0.3);
        tl.to(ink, { opacity: 0, duration: 0.192 }, at + 0.312);
        tl.to(speed, { opacity: 0, scale: 1.5, duration: 0.144 }, at + 0.36);
        tl.fromTo(
          giants[k + 1],
          { y: "20vh", opacity: 0 },
          { y: "0vh", opacity: 1, duration: 0.18 },
          at + 0.3,
        );
        tl.to(nxt.infoLines, { yPercent: 0, duration: 0.132, stagger: 0.04 }, at + 0.372);
      } else {
        // Roster beat: wipe ink layer, raise the roster.
        tl.to(ink, { opacity: 0, duration: 0.192 }, at + 0.312);
        tl.to(speed, { opacity: 0, scale: 1.5, duration: 0.144 }, at + 0.36);
        tl.set(roster, { visibility: "visible" }, at + 0.3);
        tl.to(roster, { opacity: 1, duration: 0.18 }, at + 0.3);
        tl.fromTo(
          rosterTitle,
          { color: "rgba(255,255,255,0)" },
          { color: "#ffffff", duration: 0.18 },
          at + 0.42,
        );
        tl.to(rosterCols, {
          y: "0vh",
          opacity: 1,
          duration: 0.27,
          stagger: 0.07,
          ease: "back.out(1.3)",
        }, at + 0.33);
        tl.to(rosterCta, { opacity: 1, duration: 0.18 }, at + 0.42);
      }
    }
  };

  ctx.mm.add("(min-width: 1024px)", () => build(DESKTOP_GEO));
  ctx.mm.add("(max-width: 1023px)", () => build(MOBILE_GEO));

  // Custom snap: one flick = one swap (never ScrollTrigger snap with Lenis).
  // Dormant under ?snap=0 so screenshots stay deterministic while a separate
  // pass exercises the real snap path (ISS-013).
  const isTouch = window.matchMedia("(hover: none)").matches;
  const idleMs = isTouch ? CFG.anime.snapIdleMsTouch : CFG.anime.snapIdleMsDesktop;
  let snapTimer = 0;
  let snapping = false;
  let lastSnapY = window.scrollY;
  let lastDir = 1;
  ctx.lenis.on("scroll", () => {
    const y = window.scrollY;
    if (y !== lastSnapY) lastDir = y > lastSnapY ? 1 : -1;
    lastSnapY = y;
    window.clearTimeout(snapTimer);
    if (ctx.prefersReduced) return;
    if (new URLSearchParams(window.location.search).get("snap") === "0") return;
    snapTimer = window.setTimeout(() => {
      const st = ctx.ScrollTrigger.getById("anime");
      if (!st || !st.isActive || snapping) return;
      if (ctx.lenis.isScrolling) return;
      const p = st.progress * D;
      if (p < 0 || p > N) return;
      const near = Math.round(p);
      let target: number;
      if (Math.abs(p - near) < CFG.anime.snapEps) target = near;
      else {
        // Local direction tracking (ISS-032): lenis.direction is version-fragile.
        target = lastDir > 0 ? Math.ceil(p - CFG.anime.snapEps) : Math.floor(p + CFG.anime.snapEps);
      }
      target = Math.min(N, Math.max(0, target));
      const y = st.start + (target / D) * (st.end - st.start);
      snapping = true;
      ctx.lenis.scrollTo(y, {
        duration: CFG.anime.snapDurS,
        easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      });
      window.setTimeout(() => {
        snapping = false;
      }, CFG.anime.snapDurS * 1000 + 100);
    }, idleMs);
  });

  // Scroll-velocity skew on the .a-vel wrappers.
  const velEls: HTMLElement[] = [];
  for (const p of pairs) velEls.push(...p.vel);
  gsap.ticker.add(() => {
    const st = ctx.ScrollTrigger.getById("anime");
    if (!st || !st.isActive) return;
    const max = window.innerWidth >= CFG.bpDesktop ? DESKTOP_GEO.skewMax : MOBILE_GEO.skewMax;
    const v = Math.min(max, Math.max(-max, ctx.lenis.velocity * 0.02));
    for (const node of velEls) node.style.transform = `skewX(${v}deg)`;
  });

  // Pointer parallax (desktop only).
  ctx.mm.add("(min-width: 1024px)", () => {
    const setters = pairs.map((p) => ({
      sx: gsap.quickTo(p.mouseS, "x", { duration: 0.6, ease: "power3.out" }),
      sy: gsap.quickTo(p.mouseS, "y", { duration: 0.6, ease: "power3.out" }),
      sr: gsap.quickTo(p.mouseS, "rotation", { duration: 0.6, ease: "power3.out" }),
      cx: gsap.quickTo(p.mouseP, "x", { duration: 0.6, ease: "power3.out" }),
      cy: gsap.quickTo(p.mouseP, "y", { duration: 0.6, ease: "power3.out" }),
    }));
    const onMove = (e: PointerEvent): void => {
      const r = stage.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const my = ((e.clientY - r.top) / r.height) * 2 - 1;
      const s = setters[activeIdx];
      if (!s) return;
      s.sx(mx * 18);
      s.sy(my * 10);
      s.sr(mx * 2);
      s.cx(-mx * 8);
      s.cy(-my * 5);
    };
    stage.addEventListener("pointermove", onMove);
    return () => stage.removeEventListener("pointermove", onMove);
  });

  // Idle halftone drift.
  gsap.ticker.add((_t, deltaMs) => {
    const st = ctx.ScrollTrigger.getById("anime");
    if (!st || !st.isActive) return;
    driftX += 20 * Math.min(deltaMs / 1000, 0.1);
    halftone.style.backgroundPosition = `${hx + driftX}px 0`;
  });
}
