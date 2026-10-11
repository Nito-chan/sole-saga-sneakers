import gsap from "gsap";
import { CFG } from "../config";
import type { Frame } from "./preload";

// Scroll-scrubbed turntable: idle rotation at rest, exactly one full turn
// across hero scroll progress, with cross-dissolve between frames.
export class FramePlayer {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D | null;
  private frames: Frame[] = [];
  private progress = 0;
  private angle = 0;
  private base = 0;
  private wasIdle = true;
  private active = true;
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
    if (window.scrollY <= 2) {
      this.angle += CFG.hero.idleFps * dt;
      this.wasIdle = true;
    } else {
      if (this.wasIdle) {
        this.base = this.angle;
        this.wasIdle = false;
      }
      const target = this.base + this.progress * n * CFG.hero.turns;
      this.angle += (target - this.angle) * (1 - Math.exp(-CFG.hero.lerpK * dt));
    }
    const fl = Math.floor(this.angle);
    const i = ((fl % n) + n) % n;
    const frac = this.angle - fl;
    const key = `${i}:${Math.round(frac * 32)}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    this.draw(i, frac);
  };

  private draw(i: number, frac: number): void {
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
    g.globalAlpha = 1;
    g.drawImage(a, x, y, w, h);
    if (frac > 0.02) {
      const b = this.frames[(i + 1) % n];
      if (b.width > 0 && b.height > 0) {
        g.globalAlpha = frac;
        g.drawImage(b, x, y, w, h);
        g.globalAlpha = 1;
      }
    }
  }
}
