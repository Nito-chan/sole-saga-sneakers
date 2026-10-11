import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { CFG } from "../config";
import { site, type Site } from "./data";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t: number) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

const mm = gsap.matchMedia();
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function isDesktop(): boolean {
  return window.innerWidth >= CFG.bpDesktop;
}

let refreshTimer = 0;
window.addEventListener("resize", () => {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 250);
});

export interface Ctx {
  lenis: Lenis;
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  mm: ReturnType<typeof gsap.matchMedia>;
  site: Site;
  isDesktop(): boolean;
  prefersReduced: boolean;
}

export const ctx: Ctx = { lenis, gsap, ScrollTrigger, mm, site, isDesktop, prefersReduced };
