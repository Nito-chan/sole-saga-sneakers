export const CFG = {
  bpDesktop: 1024,                       // px: >= desktop layout, < mobile layout
  hero:    { pinSvh: 300, idleFps: 5, turns: 1, lerpK: 16, hoverFade: 0.03 },
// idleFps 5 (~25deg/s, full turn ~14s): 12 read as a low-FPS flipbook (AUDIT 0a).
// lerpK 16 (SPEC §9.2 says 10): snappier scrub follow, tuned with velocity hard-cut.
  marquee: { heightSvh: 16, minPx: 120, baseSpeedPxPerS: 60 },
  anatomy: { stepSvh: 80 },
  angles:  { heightSvh: 220 },
  colors:  { stepSvh: 80, holdEnd: 0.65 },                 // transition = [k+0.65, k+1.00]
  anime:   { stepSvh: 110, swapStart: 0.2, swapEnd: 0.8, rosterHold: 0.6, snapEps: 0.06,
             snapIdleMsDesktop: 140, snapIdleMsTouch: 180, snapDurS: 0.9 },
  footer:  { minSvh: 60 },
  drop:    { minSvh: 100 },
} as const;
