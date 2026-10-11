import { el, qsa } from "../lib/dom";
import { watchLazyVideos } from "../lib/preload";
import type { Ctx } from "../lib/engine";
import type { Beat } from "../lib/data";

const SVGNS = "http://www.w3.org/2000/svg";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function initAnatomy(ctx: Ctx): void {
  const { site, gsap, ScrollTrigger } = ctx;
  const beats: Beat[] = site.anatomy.beats;
  const app = document.getElementById("app");
  if (!app || beats.length === 0) return;

  const section = el("section", "");
  section.id = "anatomy";
  section.dataset.header = "light";
  section.style.setProperty("--a-bg", beats[0].bg);

  if (ctx.prefersReduced) {
    const wrap = el("div", "anatomy-static");
    wrap.appendChild(el("p", "t-eyebrow", site.anatomy.eyebrow));
    for (const b of beats) {
      const block = el("div", "anatomy-card");
      const img = el("img", "");
      img.setAttribute("src", b.poster);
      img.setAttribute("alt", b.title);
      img.setAttribute("decoding", "async");
      block.append(img, el("h3", "t-h2 anatomy-card-title", b.title), el("p", "t-body-l", b.body));
      wrap.appendChild(block);
    }
    section.appendChild(wrap);
    app.appendChild(section);
    return;
  }

  const text = el("div", "a-text");
  text.appendChild(el("p", "t-eyebrow", site.anatomy.eyebrow));
  const counterRow = el("div", "a-counter-row");
  const progress = el("div", "a-progress");
  const progressFill = el("div", "a-progress-fill");
  progress.appendChild(progressFill);
  const counter = el("div", "a-counter", `${pad(1)} / ${pad(beats.length)}`);
  counterRow.append(progress, counter);
  const titleStack = el("div", "a-title-stack");
  const bodyStack = el("div", "a-body-stack");
  beats.forEach((b, i) => {
    const t = el("h2", "a-title", b.title);
    const p = el("p", "t-body-l a-body", b.body);
    if (i > 0) {
      t.style.opacity = "0";
      p.style.opacity = "0";
    }
    titleStack.appendChild(t);
    bodyStack.appendChild(p);
  });
  text.append(counterRow, titleStack, bodyStack);

  const stage = el("div", "a-stage");
  const videos: HTMLVideoElement[] = [];
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("class", "a-callouts");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  const chipLayer = el("div", "a-chips");

  beats.forEach((b, i) => {
    const v = el("video", "a-video");
    v.muted = true;
    (v as HTMLVideoElement).playsInline = true;
    v.preload = "metadata";
    v.setAttribute("data-lazy", "");
    v.setAttribute("poster", b.poster);
    v.setAttribute("aria-hidden", "true");
    const src = el("source", "");
    src.setAttribute("src", b.src);
    src.setAttribute("type", "video/mp4");
    v.appendChild(src);
    if (i > 0) v.style.opacity = "0";
    stage.appendChild(v);
    videos.push(v);

    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "a-callout-g");
    g.setAttribute("opacity", "0");
    for (const c of b.callouts) {
      const circle = document.createElementNS(SVGNS, "circle");
      circle.setAttribute("cx", String(c.dot[0]));
      circle.setAttribute("cy", String(c.dot[1]));
      circle.setAttribute("r", "0.7");
      circle.setAttribute("fill", "var(--ink)");
      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", String(c.dot[0]));
      line.setAttribute("y1", String(c.dot[1]));
      line.setAttribute("x2", String(c.at[0]));
      line.setAttribute("y2", String(c.at[1]));
      line.setAttribute("stroke", "var(--ink)");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("vector-effect", "non-scaling-stroke");
      line.setAttribute("class", "a-line");
      g.append(circle, line);
      const chip = el("span", "chip a-chip", c.label);
      chip.style.left = `${c.at[0]}%`;
      chip.style.top = `${c.at[1]}%`;
      chip.style.opacity = "0";
      chip.dataset.beat = String(i);
      chipLayer.appendChild(chip);
    }
    svg.appendChild(g);
  });
  stage.append(svg, chipLayer);
  section.append(text, stage);
  app.appendChild(section);
  watchLazyVideos(section);

  const titles = qsa<HTMLElement>(titleStack, ".a-title");
  const bodies = qsa<HTMLElement>(bodyStack, ".a-body");

  // Scroll-scrubbed video currentTime with smoothing.
  const cur = new Array<number>(beats.length).fill(0);
  let pinActive = false;

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: `+=${beats.length * 80}%`,
      scrub: 0.5,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      id: "anatomy",
      onUpdate: (self) => {
        const p = self.progress;
        progressFill.style.height = `${p * 100}%`;
        const idx = Math.min(beats.length - 1, Math.floor(p * beats.length));
        counter.textContent = `${pad(idx + 1)} / ${pad(beats.length)}`;
        setBg(self.progress * beats.length);
      },
      onToggle: (self) => {
        pinActive = self.isActive;
      },
    },
  });

  const lineEls = qsa<SVGLineElement>(svg, ".a-line");
  for (const line of lineEls) {
    const len = line.getTotalLength();
    line.style.strokeDasharray = String(len);
    line.style.strokeDashoffset = String(len);
  }
  const groups = qsa<SVGGElement>(svg, ".a-callout-g");

  // Background tint: blend to each beat's bg over its first 20%, driven
  // directly so no CSS-var tween can clobber the value.
  const blend = gsap.utils.interpolate as unknown as (
    from: string,
    to: string,
  ) => (t: number) => string;
  const setBg = (time: number): void => {
    const k = Math.min(beats.length - 1, Math.max(0, Math.floor(time)));
    const frac = time - k;
    let color = beats[k].bg;
    if (k > 0 && frac < 0.2) {
      color = blend(beats[k - 1].bg, beats[k].bg)(frac / 0.2);
    }
    section.style.setProperty("--a-bg", color);
  };
  setBg(0);

  beats.forEach((b, i) => {
    const v = videos[i];
    tl.to(v, { opacity: 1, duration: 0.15 }, Math.max(0, i - 0.05));
    tl.fromTo(
      v,
      { clipPath: "inset(100% 0 0 0)" },
      { clipPath: "inset(0% 0 0 0)", duration: 0.15 },
      Math.max(0, i - 0.05),
    );
    if (i < beats.length - 1) {
      tl.to(v, { opacity: 0, duration: 0.15 }, i + 0.9);
    }
    if (i > 0) {
      tl.to(titles[i - 1], { y: -30, opacity: 0, duration: 0.15 }, i - 0.075);
      tl.to(bodies[i - 1], { y: -30, opacity: 0, duration: 0.15 }, i - 0.075);
      tl.fromTo(
        titles[i],
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.2, ease: "expo.out" },
        i,
      );
      tl.fromTo(
        bodies[i],
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.2, ease: "expo.out" },
        i,
      );
    }
    tl.to(groups[i], { opacity: 1, duration: 0.2 }, i + 0.35);
    const beatLines = lineEls.filter((l) => l.parentNode === groups[i]);
    for (const line of beatLines) {
      tl.to(line, { strokeDashoffset: 0, duration: 0.2 }, i + 0.35);
    }
    const beatChips = qsa<HTMLElement>(chipLayer, `.a-chip[data-beat="${i}"]`);
    if (beatChips.length > 0) {
      tl.to(beatChips, { opacity: 1, duration: 0.2 }, i + 0.35);
      tl.to(beatChips, { opacity: 0, duration: 0.15 }, i + 0.85);
    }
    tl.to(groups[i], { opacity: 0, duration: 0.15 }, i + 0.85);
  });

  // Scroll-scrubbed video currentTime with smoothing.
  gsap.ticker.add(() => {
    if (!pinActive) return;
    const t = tl.time();
    const i = Math.min(beats.length - 1, Math.max(0, Math.floor(t)));
    const local = (t - (i + 0.1)) / 0.8;
    if (local < 0 || local > 1) return;
    const v = videos[i];
    if (v.readyState < 2 || !v.duration) return;
    const targetTime = local * v.duration;
    cur[i] += (targetTime - cur[i]) * 0.25;
    if (Math.abs(cur[i] - v.currentTime) > 1 / 30) {
      try {
        v.currentTime = cur[i];
      } catch {
        /* seek transiently unavailable */
      }
    }
  });
  if (window.location.search.includes("debug=callouts")) {
    const label = el("div", "callout-debug", "x%, y%");
    document.body.appendChild(label);
    stage.addEventListener("click", (e) => {
      const r = stage.getBoundingClientRect();
      const x = Math.round(((e.clientX - r.left) / r.width) * 100);
      const y = Math.round(((e.clientY - r.top) / r.height) * 100);
      label.textContent = `${x}%, ${y}%`;
      console.log(`callout at ${x}%, ${y}%`);
    });
  }
}
