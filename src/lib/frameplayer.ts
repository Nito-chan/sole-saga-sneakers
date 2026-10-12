import gsap from "gsap";
import { CFG } from "../config";
import type { Frame } from "./preload";

// Scroll-scrubbed turntable: holds its frame at rest (CSS .hero-bob does
// the hovering float), scrubs exactly one full turn across hero scroll
// progress, with cross-dissolve between frames.
export class FramePlayer {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D | null;
  private frames: Frame[] = [];
  private progress = 0;
  private angle = 0;
  private active = false;
  private lastKey = "";

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d");
    this.resize();
    gsap.ticker.add(this.onTick);
  }

  setFrames(frames: Frame[]): void {
    this.frames = frames;
    this.lastKey = "";
  }

  setProgress(p: number): void {
    this.progress = Math.min(1, Math.max(0, p));
  }

  setActive(active: boolean): void {
    this.active = active;
    if (active) this.lastKey = "";
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = Math.round(this.canvas.clientWidth * dpr);
    let h = Math.round(this.canvas.clientHeight * dpr);
    if (w > 1600) {
      h = Math.max(1, Math.round((h * 1600) / w));
      w = 1600;
    }
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.lastKey = "";
    }
  }

  destroy(): void {
    gsap.ticker.remove(this.onTick);
  }

  private onTick = (_t: number, deltaMs: number): void => {
    const n = this.frames.length;
    if (!this.active || n === 0 || !this.g) return;
    const dt = Math.min(deltaMs / 1000, 0.1);
    // Deterministic scrub: angle converges to progress * frames.
    // When scroll stops, progress freezes, the lerp settles, the draw key
    // stops changing and the ticker early-returns — the frame holds.
    const target = this.progress * n * CFG.hero.turns;
    const gap = Math.abs(target - this.angle);
    this.angle += (target - this.angle) * (1 - Math.exp(-CFG.hero.lerpK * dt));
    const fl = Math.floor(this.angle);
    const i = ((fl % n) + n) % n;
    const frac = this.angle - fl;
    // Dissolve quantized to 8 steps: same visible smoothness, ~4x fewer redraws.
    const key = `${i}:${Math.round(frac * 8)}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    // Fast scrolls span several frames per tick: hard-cut instead of
    // dissolving, which would smear into a double image.
    // Slow motion uses a 3-frame weighted blend to hide the 5-degree steps.
    this.draw(i, gap > 2 ? 0 : frac, gap > 2);
  };

  private draw(i: number, frac: number, hardCut: boolean): void {
    const g = this.g;
    const n = this.frames.length;
    if (!g || n === 0) return;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    if (cw === 0 || ch === 0) return;
    const a = this.frames[i];
    const aw = a.width;
    const ah = a.height;
    if (!aw || !ah) return;
    g.clearRect(0, 0, cw, ch);
    const s = Math.min(cw / aw, ch / ah);
    const w = aw * s;
    const h = ah * s;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    // Leading ghost of the previous frame softens the 5-degree steps
    // (frames are opaque cutouts, so extra blends only touch edge pixels).
    if (!hardCut && frac < 0.98) {
      const p = this.frames[(i - 1 + n) % n];
      if (p.width > 0 && p.height > 0) {
        g.globalAlpha = (1 - frac) * 0.35;
        g.drawImage(p, x, y, w, h);
      }
    }
    g.globalAlpha = 1;
    g.drawImage(a, x, y, w, h);
    if (!hardCut && frac > 0.02) {
      const b = this.frames[(i + 1) % n];
      if (b.width > 0 && b.height > 0) {
        g.globalAlpha = frac;
        g.drawImage(b, x, y, w, h);
        g.globalAlpha = 1;
      }
    }
  }
}
