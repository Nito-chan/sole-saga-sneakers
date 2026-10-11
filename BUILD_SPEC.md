# BUILD_SPEC.md — Anime-inspired sneaker scroll site (master build specification)

> **HOW THE HUMAN STARTS YOU:** the human puts this file at the project root as `BUILD_SPEC.md`, puts the original images/videos in `source/`, and tells you:
> *"Read BUILD_SPEC.md completely, then execute it strictly phase by phase. Do not deviate."*
> Everything you need is in this file. Nothing else is to be assumed.

---

## 0. RULES OF ENGAGEMENT (binding — read before doing anything)

1. **Read this entire file first.** Then create `AGENTS.md` (Phase 1) so these rules persist across sessions.
2. **Execute phases in order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.** Never skip, merge or reorder phases. Inside Phase 6, build sections in the order 6.1 → 6.8.
3. **Do only what this file says.** Do not add features, sections, libraries, animations, copy, colours, fonts, pages or "improvements" that are not written here. If you believe something is missing or wrong, **STOP and ask the human one concise question**. Do not guess.
4. **Never invent content.** All visible text comes from `src/data/site.json` (Phase 4). All asset paths come from `src/data/assets.generated.json` (Phase 2). No hard-coded copy in TypeScript or HTML (except the strings listed in §9.6).
5. **Never modify, rename, move or delete anything inside `source/`.** It is the human's original material.
6. **Allowed packages only** (exact list in §3). Do not install anything else. No React, no Tailwind, no jQuery, no Three.js, no animation libraries other than GSAP, no CSS frameworks.
7. **Never run commands that need admin rights (`sudo`, global installs, registry edits) without asking.** If FFmpeg or Python is missing, show the install command for the human's OS and ask them to approve or install it.
8. **Verify every phase** with the checks listed at the end of the phase. Show a short result summary. Fix problems before moving on.
9. **Two hard gates — STOP and wait for the human to reply "continue":**
   - **GATE A** — end of Phase 2 (asset pipeline).
   - **GATE B** — end of Phase 7 (QA).
   Everywhere else, continue without asking.
10. **Keep `BUILD_LOG.md`** at the project root: one line per completed step with a timestamp. Append only.
11. **Cross-platform:** detect the OS (Windows / macOS / Linux) before running shell commands. Use the correct venv activation and path separators. Prefer the cross-platform commands given here.
12. **If a requirement says "exactly", do it exactly** (file names, numbers, easing names, pixel/viewport formulas). Where this file gives a number, use that number.
13. **Language/code rules:** TypeScript with `"strict": true`, ES modules, no `any`, one file per section module, every module exports one `initX(ctx)` function, no global variables except the ones named in §9.5. Comments only where the logic is non-obvious.
14. **Final deliverable:** a Vite static site that builds with `npm run build`, previews with `npm run preview`, passes the QA script, and is ready for Netlify. **Do not deploy** and **do not push** anywhere.

---

## 1. WHAT WE ARE BUILDING

A single-page, scroll-driven marketing site for a **concept** anime-inspired sneaker brand. It is the human's personal portfolio piece. There is **no 3D engine**: the "3D" feel comes from a **scroll-scrubbed frame sequence** (a rotating sneaker drawn on a `<canvas>`), scroll-scrubbed video, parallax depth, circle/diagonal colour wipes, and a speed-ramped character swap.

**Page flow (top to bottom):** Preloader → Header (fixed) → **1 Hero** → **2 Marquee** → **3 Anatomy** → **4 All Angles** → **5 Colorways** → **6 Anime Roster** → **7 Drop / Waitlist** → **8 Footer**.

**The one sneaker:** a pastel high-top (lavender, pink, mint, baby blue, cream) with wavy overlay panels, a padded white tongue and a clear air-cushion heel window. Every image and video in the site is this same shoe (recoloured or restyled).

**Look & feel:** soft pastel and airy for Hero / Anatomy / Angles / Colorways; hard, dark, high-contrast manga energy for the Anime Roster; dark glassy for Drop / Footer. The two animated "swap" sections (Colorways and Anime) MUST feel different (see §10.5 vs §10.6).

**Non-goals (do NOT build):** shop/cart/checkout, user accounts, CMS, blog, sound, a size guide, a lookbook, dark-mode toggle, language switcher, cookie banner, analytics, chat widgets, any 3D library.

---

## 2. INPUT FILES (human provides) AND STOP CONDITIONS

The human places originals in `source/`. **File stems must match exactly** (case-insensitive); extension may be any of: images `.png .jpg .jpeg .webp`, videos `.mp4 .mov .m4v .webm`.

| Stem in `source/` | Required? | Used for |
|---|---|---|
| `hero-turntable` | **required** (video) | Hero rotating sneaker (becomes 72 frames) |
| `base-front34`, `base-rear34`, `base-side`, `base-top` | **required** (images) | "All Angles" section |
| `showcase-sole-pushin`, `showcase-side-glide`, `showcase-laces-detail` | **required** (videos) | Anatomy beats 1–3 |
| `showcase-exploded` | optional (video) | Anatomy beat 4 (if absent → 3 beats) |
| `color-01-<slug>` … `color-NN-<slug>` | **required, ≥ 2** (images) | Colorway section; NN = scroll order |
| `anime-01-<slug>-sneaker` + `anime-01-<slug>-character` … (pairs) | **required, ≥ 2 pairs** (images) | Anime Roster; NN = order |
| `fx-ink-dark` | **required** (video, black background) | Ink burst in anime swaps |
| `fx-speedlines`, `fx-halftone` | **required** (images) | Anime overlays / textures |
| `bg-city-night` | optional (image) | Drop section background |
| `hero-hover`, `fx-ink-light`, `logo.svg` | optional / **unused in v1** | Ignore if present (`logo.svg`, if present, may be copied to `public/assets/brand/logo.svg` and used by the header instead of the text wordmark) |

`<slug>` = lowercase letters/digits/hyphens (e.g. `tomato-soda`, `mizuki`).
Expected from the human's plan: **6 colorways** and **5 anime pairs**; the code must work for any count ≥ 2 (never hard-code 6 or 5).

**STOP condition:** if any **required** file is missing, print the exact list of missing stems and STOP. Do not substitute or fabricate assets.

---

## 3. STACK AND EXACT INSTALLS

- **Node ≥ 20**, npm. **Python 3.10–3.13**. **FFmpeg + FFprobe** on PATH.
- **Vite** (latest stable, vanilla **TypeScript**, no framework), **GSAP** (`gsap`, ScrollTrigger plugin — GSAP is free, including ScrollTrigger), **Lenis** (`lenis`) for smooth scroll.
- **Fonts, self-hosted via Fontsource:** `@fontsource-variable/bricolage-grotesque`, `@fontsource/anton`, `@fontsource-variable/dm-sans`.
- **QA:** `playwright` (dev dependency) with Chromium.
- **Python (inside a venv `.venv-assets`):** `rembg` with CPU + CLI extras, `pillow`, `numpy`.

Allowed npm packages — **runtime:** `gsap`, `lenis`, `@fontsource-variable/bricolage-grotesque`, `@fontsource/anton`, `@fontsource-variable/dm-sans`. **Dev:** `vite`, `typescript`, `playwright`. Nothing else.

---

## 4. PROJECT STRUCTURE (create exactly this)

```
project-root/
  BUILD_SPEC.md            (this file, given)
  AGENTS.md                (you create, Phase 1)
  BUILD_LOG.md             (you create, append-only)
  package.json  tsconfig.json  vite.config.ts  netlify.toml  .gitignore
  index.html
  source/                  (human's originals — READ ONLY)
  scripts/
    process_assets.py      (Phase 2, content given in §6)
    qa.mjs                 (Phase 7, content given in §13)
  .venv-assets/  .work/    (git-ignored)
  public/
    favicon.svg            (Phase 5)
    og-image.jpg           (generated in Phase 7)
    assets/
      hero/desktop/0001.webp …    hero/mobile/0001.webp …
      base/  showcase/  colors/  anime/  fx/  brand/
  src/
    main.ts  config.ts
    data/
      site.json                    (Phase 4: all copy + settings)
      assets.generated.json        (Phase 2: asset manifest — never hand-edit)
    lib/
      engine.ts  preload.ts  frameplayer.ts  dom.ts  data.ts  qa.ts
    sections/
      header.ts  preloader.ts  cursor.ts  hero.ts  marquee.ts  anatomy.ts
      angles.ts  colors.ts  anime.ts  drop.ts  footer.ts
    styles/
      tokens.css  base.css  components.css  sections.css
```

`.gitignore`: `node_modules`, `dist`, `.venv-assets`, `.work`, `qa`, `source`, `.DS_Store`.

---

## 5. PHASE 1 — ENVIRONMENT SETUP

1. Print versions: `node -v`, `npm -v`, `python --version` (or `python3`/`py -3`), `ffmpeg -version`, `ffprobe -version`. If Node < 20, Python outside 3.10–3.13, or FFmpeg is missing → show the OS-specific install command (Windows: `winget install Gyan.FFmpeg` / `winget install OpenJS.NodeJS.LTS`; macOS: `brew install ffmpeg node`; Debian/Ubuntu: `sudo apt-get install -y ffmpeg`) and ASK before proceeding.
2. Confirm `source/` exists and list its files. Run the stop-condition check from §2 (print a table: stem → found file or MISSING). If anything required is missing, STOP.
3. Scaffold manually (do **not** use `npm create vite`, it prompts on non-empty folders):
   - `npm init -y`, then set in `package.json`: `"type": "module"`, `"private": true`, scripts:
     `"dev": "vite --host"`, `"build": "tsc --noEmit && vite build"`, `"preview": "vite preview --port 4173 --strictPort"`, `"assets": "python scripts/process_assets.py"`, `"qa": "node scripts/qa.mjs"`.
   - `npm i gsap lenis @fontsource-variable/bricolage-grotesque @fontsource/anton @fontsource-variable/dm-sans`
   - `npm i -D vite typescript playwright` then `npx playwright install chromium`
   - `tsconfig.json`:
     ```json
     { "compilerOptions": { "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
       "strict": true, "resolveJsonModule": true, "isolatedModules": true, "skipLibCheck": true,
       "noEmit": true, "lib": ["ES2022", "DOM", "DOM.Iterable"], "types": ["vite/client"] },
       "include": ["src", "vite.config.ts"] }
     ```
   - `vite.config.ts`: `import { defineConfig } from "vite"; export default defineConfig({ build: { target: "es2022", assetsInlineLimit: 0 }, server: { host: true } });`
4. Create the Python venv and install:
   - Windows: `py -3 -m venv .venv-assets` then `.venv-assets\Scripts\python -m pip install -U pip "rembg[cpu,cli]" pillow numpy`
   - macOS/Linux: `python3 -m venv .venv-assets` then `.venv-assets/bin/python -m pip install -U pip "rembg[cpu,cli]" pillow numpy`
   - From now on run the pipeline with the venv's Python (`.venv-assets/bin/python` or `.venv-assets\Scripts\python`).
   - On the first cut-out rembg downloads the `isnet-general-use` model (~170 MB) to the user's home folder. If the download is blocked, STOP and report; do not switch models silently.
5. Create the folders from §4, `.gitignore`, `netlify.toml` (Phase 8 content), `BUILD_LOG.md`, and **`AGENTS.md`** with exactly this text:
   ```
   # AGENTS.md
   This project is built strictly from BUILD_SPEC.md.
   - Follow BUILD_SPEC.md line by line. Never add features, libraries, copy or styling that it does not specify.
   - If something is unclear or missing, stop and ask the human. Do not guess.
   - Never touch source/. All visible text lives in src/data/site.json. Asset paths come from src/data/assets.generated.json.
   - Stop at GATE A and GATE B and wait for the human to say "continue".
   ```
6. `git init` (no commits needed).

**Phase 1 verification:** `npx tsc --version`, `npx vite --version`, `.venv-assets` python can `import rembg, PIL, numpy`. Log to `BUILD_LOG.md`.

---

## 6. PHASE 2 — ASSET PIPELINE (images, videos, background removal)

### 6.1 What the pipeline does (so you understand the script)

- **Hero turntable video → 72 frames.** Frames are sampled evenly over the clip (`fps = 72 / duration`, so the last frame is NOT a duplicate of the first), the bottom-right 8.5 % is painted white (removes the generator's sparkle mark), the background is removed with rembg (`isnet-general-use`), **one global bounding box** is computed across ALL frames and applied to ALL frames (never crop per frame), then frames are exported as WebP: `public/assets/hero/desktop/0001.webp…` (1000 px wide) and `hero/mobile/…` (560 px wide). A mask-overlap flicker check lists suspect frames (see §6.3 step 3).
- **Base angle stills (4):** corner cleaned, cut out, cropped to the shape + 4 % padding, longest side 1600 px (top view 1400 px) → `public/assets/base/base-*.webp`.
- **Showcase clips:** re-encoded to H.264, 1280 px wide, no audio, **every 2nd frame a keyframe** (`-g 2`) so scrubbing `currentTime` is smooth, corner cleaned; a poster WebP is extracted at 40 %.
- **Colorway images:** cut out, **mirrored horizontally by default** (the source shoe faces left; on the Colorway section the shoe sits on the LEFT of the screen and must face RIGHT, toward the text), fitted onto an identical 2000×1200 transparent canvas (shoe = 86 % of the canvas) so cross-fades never jump.
- **Anime sneakers:** same as colorways but 1600×1000 canvas, mirrored by default (face right, toward the character on the right).
- **Anime characters:** cut out, NOT mirrored by default (assumed to face left, toward the sneaker), fitted onto an identical 1200×1600 canvas anchored to the bottom (feet at the same height), 96 % fit.
- **Palette extraction:** for each anime pair the script derives `{primary, deep, accent, text}` from the character cut-out (dominant saturated hue → primary; very dark tint of it → deep; far-apart second hue or complement → accent; white/ink text by luminance). These are used when `site.json` says `"theme": "auto"`.
- **FX:** `fx-ink-dark` trimmed to 3 s (from 1.5 s), sparkle removed with `delogo`, 1280 px, CRF 28, no audio; `fx-speedlines`, `fx-halftone`, `bg-city-night` → WebP.
- Writes `src/data/assets.generated.json` (the manifest) and QA contact sheets + `report.md` in `.work/qa/`.

### 6.2 Create `scripts/process_assets.py` with EXACTLY this content

```python
#!/usr/bin/env python3
"""
process_assets.py
Reads originals from  <project>/source/
Writes web-ready files to  <project>/public/assets/
Writes the manifest to  <project>/src/data/assets.generated.json
Writes QA contact sheets + report to  <project>/.work/qa/

Run from the project root:
    python scripts/process_assets.py
    python scripts/process_assets.py --only hero            (re-run one group)
    python scripts/process_assets.py --no-flip-colors       (do not mirror colorway images)
    python scripts/process_assets.py --rembg-model birefnet-general   (cleaner edges, slower)
    python scripts/process_assets.py --cutout whitekey      (no AI model; white-background key, emergency fallback only)
"""
import argparse
import colorsys
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source"
WORK = ROOT / ".work"
OUT = ROOT / "public" / "assets"
GEN = ROOT / "src" / "data" / "assets.generated.json"
QA = WORK / "qa"

IMG_EXT = (".png", ".jpg", ".jpeg", ".webp")
VID_EXT = (".mp4", ".mov", ".m4v", ".webm")

GROUPS = ["hero", "base", "showcase", "colors", "anime", "fx"]
REPORT = []  # human-readable lines for qa/report.md


def log(msg):
    print(msg, flush=True)
    REPORT.append(msg)


def die(msg, code=2):
    print("\nERROR: " + msg, file=sys.stderr)
    sys.exit(code)


# ----------------------------------------------------------------------------- helpers
def run(cmd):
    cmd = [str(c) for c in cmd]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        die("Command failed:\n  " + " ".join(cmd) + "\n" + r.stderr[-1500:])
    return r


def probe(path):
    r = run(["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height:format=duration",
             "-of", "json", path])
    j = json.loads(r.stdout)
    return int(j["streams"][0]["width"]), int(j["streams"][0]["height"]), float(j["format"]["duration"])


def find_one(stem, exts):
    """Exact-stem match, case-insensitive, any allowed extension."""
    if not SRC.exists():
        return None
    for p in sorted(SRC.iterdir()):
        if p.is_file() and p.stem.lower() == stem.lower() and p.suffix.lower() in exts:
            return p
    return None


def find_many(prefix_regex, exts):
    import re
    rx = re.compile(prefix_regex, re.I)
    found = []
    if SRC.exists():
        for p in sorted(SRC.iterdir()):
            if p.is_file() and p.suffix.lower() in exts:
                m = rx.match(p.stem)
                if m:
                    found.append((m, p))
    return found


def web(p):
    return "/assets/" + str(Path(p).relative_to(OUT)).replace("\\", "/")


def save_webp(img, path, q=86):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    kw = dict(quality=q, method=6)
    if img.mode == "RGBA":
        kw["alpha_quality"] = 92
    img.save(path, "WEBP", **kw)


def kb(path):
    return Path(path).stat().st_size / 1024


def clean_corner(img, frac=0.085):
    """Paint over the bottom-right corner (AI generator sparkle mark) with the background colour."""
    img = img.convert("RGB")
    w, h = img.size
    patch = img.crop((0, 0, max(2, int(w * 0.03)), max(2, int(h * 0.03))))
    col = tuple(int(v) for v in ImageStat.Stat(patch).median[:3])
    ImageDraw.Draw(img).rectangle((int(w * (1 - frac)), int(h * (1 - frac)), w, h), fill=col)
    return img


_SESSION = None
MODEL = "isnet-general-use"


def cutout(img, mode):
    """RGB PIL image -> RGBA PIL image with the background removed."""
    img = img.convert("RGB")
    if mode == "rembg":
        global _SESSION
        try:
            from rembg import remove, new_session
        except ImportError:
            die("rembg is not installed. Run:  pip install \"rembg[cli]\" onnxruntime")
        if _SESSION is None:
            _SESSION = new_session(MODEL)
        out = remove(img, session=_SESSION, post_process_mask=True)
        return out.convert("RGBA")
    # whitekey: distance from the corner colour, fallback only
    a = np.asarray(img).astype(np.int16)
    h, w, _ = a.shape
    corner = np.median(a[: max(2, h // 40), : max(2, w // 40)].reshape(-1, 3), axis=0)
    diff = np.abs(a - corner).max(axis=2)
    alpha = np.clip((diff - 10) * 14, 0, 255).astype(np.uint8)
    out = img.convert("RGBA")
    out.putalpha(Image.fromarray(alpha))
    return out


def alpha_bbox(img, thr=10):
    a = np.asarray(img.getchannel("A"))
    ys, xs = np.where(a > thr)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def crop_pad(img, box, pad=0.04):
    l, t, r, b = box
    pw, ph = int((r - l) * pad), int((b - t) * pad)
    return img.crop((max(0, l - pw), max(0, t - ph), min(img.width, r + pw), min(img.height, b + ph)))


def fit_on_canvas(img, W, H, fit=0.86, anchor="center", bottom_margin=0.02):
    box = alpha_bbox(img)
    if box is None:
        die("Cut-out produced an empty image.")
    im = img.crop(box)
    s = min(W * fit / im.width, H * fit / im.height)
    im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = (W - im.width) // 2
    y = (H - im.height) // 2 if anchor == "center" else H - im.height - int(H * bottom_margin)
    canvas.paste(im, (x, y), im)
    return canvas


def contact_sheet(images, out_path, cell=320, cols=4):
    """Tile images on a mid-grey background so cut-out halos are visible."""
    if not images:
        return
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * cell), (122, 122, 133))
    for i, im in enumerate(images):
        im = im.convert("RGBA")
        im.thumbnail((cell - 16, cell - 16))
        x = (i % cols) * cell + (cell - im.width) // 2
        y = (i // cols) * cell + (cell - im.height) // 2
        sheet.paste(im, (x, y), im)
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def hex_of(r, g, b):
    return "#{:02X}{:02X}{:02X}".format(int(round(r * 255)), int(round(g * 255)), int(round(b * 255)))


def extract_palette(img):
    """Derive {primary, deep, accent, text} from a cut-out RGBA image."""
    im = img.convert("RGBA")
    im.thumbnail((256, 256))
    a = np.asarray(im)
    px = a[..., :3][a[..., 3] > 200]
    if len(px) < 50:
        return None
    step = max(1, len(px) // 4000)
    hsv = np.array([colorsys.rgb_to_hsv(*(p / 255.0)) for p in px[::step]])
    sel = hsv[(hsv[:, 1] > 0.28) & (hsv[:, 2] > 0.25)]
    if len(sel) < 30:
        sel = hsv
    nb = 24
    hb = (sel[:, 0] * nb).astype(int) % nb
    hist = np.bincount(hb, weights=sel[:, 1] * sel[:, 2], minlength=nb)
    h1 = int(hist.argmax())

    def bucket_color(b):
        m = hb == b
        s = float(np.median(sel[m, 1])) if m.any() else 0.7
        v = float(np.median(sel[m, 2])) if m.any() else 0.9
        return (b + 0.5) / nb, s, v

    h, s, v = bucket_color(h1)
    primary = colorsys.hsv_to_rgb(h, min(max(s, 0.5), 0.92), min(max(v, 0.7), 1.0))
    deep = colorsys.hsv_to_rgb(h, min(1.0, s), 0.24)
    far = [b for b in range(nb) if min((b - h1) % nb, (h1 - b) % nb) >= 4 and hist[b] > 0]
    if far:
        b2 = max(far, key=lambda b: hist[b])
        h2, s2, v2 = bucket_color(b2)
    else:
        h2, s2, v2 = (h + 0.5) % 1.0, 0.85, 1.0
    accent = colorsys.hsv_to_rgb(h2, min(max(s2, 0.6), 0.95), min(max(v2, 0.85), 1.0))
    lum = 0.2126 * primary[0] + 0.7152 * primary[1] + 0.0722 * primary[2]
    return {
        "primary": hex_of(*primary),
        "deep": hex_of(*deep),
        "accent": hex_of(*accent),
        "text": "#0D0B14" if lum > 0.62 else "#FFFFFF",
    }


# ----------------------------------------------------------------------------- groups
def do_hero(args, man):
    src = find_one("hero-turntable", VID_EXT)
    if not src:
        die("Missing source/hero-turntable.(mp4|mov|m4v|webm)")
    n = args.target_frames
    w, h, dur = probe(src)
    log(f"[hero] source {w}x{h}, {dur:.2f}s -> {n} frames")
    raw = WORK / "hero" / "raw"
    shutil.rmtree(WORK / "hero", ignore_errors=True)
    raw.mkdir(parents=True)
    vf = (f"drawbox=x=iw*0.915:y=ih*0.915:w=iw*0.085:h=ih*0.085:color=white:t=fill,"
          f"fps={n / dur:.6f},scale=1600:-2")
    run(["ffmpeg", "-y", "-i", src, "-an", "-vf", vf, "-frames:v", n, raw / "%04d.png"])
    frames = sorted(raw.glob("*.png"))
    if len(frames) < n:
        die(f"ffmpeg produced {len(frames)} frames, expected {n}. The video may be too short.")
    frames = frames[:n]

    imgs = []
    for i, f in enumerate(frames):
        im = cutout(Image.open(f).convert("RGB"), args.cutout)
        imgs.append(im)
        if (i + 1) % 12 == 0:
            log(f"[hero] processed {i + 1}/{n}")

    # one global bounding box for ALL frames (never crop per frame)
    boxes = [alpha_bbox(im) for im in imgs]
    if any(b is None for b in boxes):
        die("A hero frame came out empty after background removal.")
    gl = min(b[0] for b in boxes)
    gt = min(b[1] for b in boxes)
    gr = max(b[2] for b in boxes)
    gb = max(b[3] for b in boxes)
    pw, ph = int((gr - gl) * 0.03), int((gb - gt) * 0.03)
    gbox = (max(0, gl - pw), max(0, gt - ph), min(imgs[0].width, gr + pw), min(imgs[0].height, gb + ph))
    cw, ch = gbox[2] - gbox[0], gbox[3] - gbox[1]
    log(f"[hero] global crop box {gbox} -> {cw}x{ch}")

    meta = {"count": n}
    for label, width in (("desktop", args.hero_desktop_width), ("mobile", args.hero_mobile_width)):
        d = OUT / "hero" / label
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)
        tw, th = width, round(width * ch / cw)
        for i, im in enumerate(imgs, start=1):
            c = im.crop(gbox).resize((tw, th), Image.LANCZOS)
            save_webp(c, d / f"{i:04d}.webp", q=80)
        total = sum(kb(p) for p in d.glob("*.webp"))
        meta[label] = {"dir": f"/assets/hero/{label}/", "w": tw, "h": th, "kb": round(total)}
        log(f"[hero] {label}: {n} frames {tw}x{th}, total {total / 1024:.1f} MB")

    # flicker check: IoU of consecutive alpha masks (wraps around)
    masks = []
    for im in imgs:
        a = im.getchannel("A").resize((200, max(1, int(200 * im.height / im.width))))
        masks.append(np.asarray(a) > 10)
    ious = []
    for i in range(n):
        a, b = masks[i], masks[(i + 1) % n]
        ious.append(float((a & b).sum()) / max(1.0, float((a | b).sum())))
    med = float(np.median(ious))
    bad = [i + 1 for i, v in enumerate(ious) if v < med - 0.05]
    meta["flickerSuspects"] = bad
    log(f"[hero] mask IoU median {med:.3f}; suspect frames: {bad if bad else 'none'}")
    sample = [imgs[i] for i in range(0, n, max(1, n // 12))][:12]
    contact_sheet([im.crop(gbox) for im in sample], QA / "hero-contact.png", cell=360, cols=4)
    man["hero"] = meta


def do_base(args, man):
    out = {}
    for key, longest in (("front34", 1600), ("rear34", 1600), ("side", 1600), ("top", 1400)):
        p = find_one(f"base-{key}", IMG_EXT)
        if not p:
            die(f"Missing source/base-{key}.(png|jpg|webp)")
        im = cutout(clean_corner(Image.open(p)), args.cutout)
        box = alpha_bbox(im)
        im = crop_pad(im, box, 0.04)
        s = longest / max(im.size)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        dst = OUT / "base" / f"base-{key}.webp"
        save_webp(im, dst, 86)
        out[key] = {"src": web(dst), "w": im.width, "h": im.height}
        log(f"[base] {key}: {im.width}x{im.height}, {kb(dst):.0f} KB")
    man["base"] = out


def do_showcase(args, man):
    names = {"sole-pushin": True, "side-glide": True, "laces-detail": True, "exploded": False}
    out = {}
    (OUT / "showcase").mkdir(parents=True, exist_ok=True)
    for key, required in names.items():
        p = find_one(f"showcase-{key}", VID_EXT)
        if not p:
            if required:
                die(f"Missing source/showcase-{key}.(mp4|mov|m4v|webm)")
            log(f"[showcase] optional clip showcase-{key} not found, skipping")
            continue
        dst = OUT / "showcase" / f"showcase-{key}.mp4"
        vf = "drawbox=x=iw*0.915:y=ih*0.915:w=iw*0.085:h=ih*0.085:color=white:t=fill,scale=1280:-2"
        run(["ffmpeg", "-y", "-i", p, "-an", "-vf", vf, "-c:v", "libx264", "-preset", "slow",
             "-crf", "24", "-g", "2", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dst])
        w, h, dur = probe(dst)
        poster = OUT / "showcase" / f"showcase-{key}-poster.webp"
        tmp = WORK / f"poster-{key}.png"
        tmp.parent.mkdir(parents=True, exist_ok=True)
        run(["ffmpeg", "-y", "-ss", f"{dur * 0.4:.2f}", "-i", dst, "-frames:v", 1, tmp])
        save_webp(Image.open(tmp).convert("RGB"), poster, 80)
        out[key] = {"src": web(dst), "poster": web(poster), "w": w, "h": h, "duration": round(dur, 3)}
        log(f"[showcase] {key}: {w}x{h}, {dur:.1f}s, {kb(dst) / 1024:.1f} MB")
    man["showcase"] = out


def do_colors(args, man):
    items = find_many(r"^color-(\d{2})-(.+)$", IMG_EXT)
    if len(items) < 2:
        die("Need at least 2 files named source/color-01-<slug>.<ext>, source/color-02-<slug>.<ext> ...")
    out, sheet = [], []
    for m, p in sorted(items, key=lambda t: t[0].group(1)):
        idx, slug = m.group(1), m.group(2).lower()
        im = cutout(clean_corner(Image.open(p)), args.cutout)
        if args.flip_colors:
            im = ImageOps.mirror(im)
        canvas = fit_on_canvas(im, 2000, 1200, fit=0.86)
        dst = OUT / "colors" / f"color-{idx}-{slug}.webp"
        save_webp(canvas, dst, 86)
        out.append({"id": idx, "slug": slug, "src": web(dst), "w": 2000, "h": 1200})
        sheet.append(canvas)
        log(f"[colors] {idx} {slug}: {kb(dst):.0f} KB")
    contact_sheet(sheet, QA / "colors-contact.png", cell=420, cols=3)
    man["colors"] = out


def do_anime(args, man):
    sn = {m.group(1): (m.group(2).lower(), p) for m, p in find_many(r"^anime-(\d{2})-(.+)-sneaker$", IMG_EXT)}
    ch = {m.group(1): (m.group(2).lower(), p) for m, p in find_many(r"^anime-(\d{2})-(.+)-character$", IMG_EXT)}
    ids = sorted(set(sn) | set(ch))
    if not ids:
        die("No files named source/anime-01-<slug>-sneaker.<ext> and source/anime-01-<slug>-character.<ext> found.")
    missing = [i for i in ids if i not in sn or i not in ch]
    if missing:
        die(f"Anime pair incomplete for id(s) {missing}: each id needs BOTH a -sneaker and a -character file.")
    out, s_sheet, c_sheet = [], [], []
    for i in ids:
        slug = ch[i][0]
        im_s = cutout(clean_corner(Image.open(sn[i][1])), args.cutout)
        if args.flip_anime_sneakers:
            im_s = ImageOps.mirror(im_s)
        s_canvas = fit_on_canvas(im_s, 1600, 1000, fit=0.86)
        im_c = cutout(clean_corner(Image.open(ch[i][1])), args.cutout)
        if args.flip_characters:
            im_c = ImageOps.mirror(im_c)
        c_canvas = fit_on_canvas(im_c, 1200, 1600, fit=0.96, anchor="bottom", bottom_margin=0.02)
        d_s = OUT / "anime" / f"anime-{i}-{slug}-sneaker.webp"
        d_c = OUT / "anime" / f"anime-{i}-{slug}-character.webp"
        save_webp(s_canvas, d_s, 86)
        save_webp(c_canvas, d_c, 86)
        pal = extract_palette(c_canvas) or extract_palette(s_canvas)
        out.append({"id": i, "slug": slug, "sneaker": web(d_s), "character": web(d_c),
                    "sneakerSize": [1600, 1000], "characterSize": [1200, 1600], "palette": pal})
        s_sheet.append(s_canvas)
        c_sheet.append(c_canvas)
        log(f"[anime] {i} {slug}: sneaker {kb(d_s):.0f} KB, character {kb(d_c):.0f} KB, palette {pal}")
    contact_sheet(s_sheet, QA / "anime-sneakers-contact.png", cell=420, cols=3)
    contact_sheet(c_sheet, QA / "anime-characters-contact.png", cell=420, cols=3)
    man["anime"] = out


def do_fx(args, man):
    out = {}
    (OUT / "fx").mkdir(parents=True, exist_ok=True)
    p = find_one("fx-ink-dark", VID_EXT)
    if not p:
        die("Missing source/fx-ink-dark.(mp4|mov|m4v|webm)")
    w, h, dur = probe(p)
    ss = 1.5 if dur > 4.6 else 0.0
    t = min(3.0, dur - ss)
    # sparkle mark measured on a 1920x1080 clip at x=1695,y=855,w=90,h=90 (proportional here)
    dx, dy, dw, dh = int(w * 0.8828), int(h * 0.7917), int(w * 0.0469), int(h * 0.0833)
    vf = f"delogo=x={dx}:y={dy}:w={dw}:h={dh},scale=1280:-2"
    dst = OUT / "fx" / "fx-ink-dark.mp4"
    run(["ffmpeg", "-y", "-ss", f"{ss}", "-t", f"{t:.2f}", "-i", p, "-an", "-vf", vf,
         "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", dst])
    _, _, d2 = probe(dst)
    out["inkDark"] = {"src": web(dst), "duration": round(d2, 3)}
    log(f"[fx] ink-dark: {d2:.1f}s, {kb(dst) / 1024:.1f} MB (delogo box {dx},{dy},{dw},{dh})")
    for key, stem, maxw in (("speedlines", "fx-speedlines", 2400), ("halftone", "fx-halftone", 1024),
                            ("cityNight", "bg-city-night", 2400)):
        q = find_one(stem, IMG_EXT)
        if not q:
            if stem == "bg-city-night":
                log("[fx] optional bg-city-night not found, skipping")
                continue
            die(f"Missing source/{stem}.(png|jpg|webp)")
        im = Image.open(q).convert("RGB")
        if im.width > maxw:
            im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
        d = OUT / "fx" / f"{stem}.webp"
        save_webp(im, d, 82)
        out[key] = {"src": web(d), "w": im.width, "h": im.height}
        log(f"[fx] {stem}: {im.width}x{im.height}, {kb(d):.0f} KB")
    man["fx"] = out


# ----------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default=",".join(GROUPS), help="comma list of: " + ",".join(GROUPS))
    ap.add_argument("--cutout", choices=["rembg", "whitekey"], default="rembg")
    ap.add_argument("--target-frames", type=int, default=72)
    ap.add_argument("--hero-desktop-width", type=int, default=1000)
    ap.add_argument("--hero-mobile-width", type=int, default=560)
    ap.add_argument("--rembg-model", default="isnet-general-use",
                    help="rembg model name, e.g. isnet-general-use (default) or birefnet-general (cleaner edges, slower)")
    ap.add_argument("--flip-colors", action=argparse.BooleanOptionalAction, default=True)
    ap.add_argument("--flip-anime-sneakers", action=argparse.BooleanOptionalAction, default=True)
    ap.add_argument("--flip-characters", action=argparse.BooleanOptionalAction, default=False)
    args = ap.parse_args()
    global MODEL
    MODEL = args.rembg_model

    if not SRC.exists():
        die("Folder 'source/' not found. Put the original files there first.")
    for tool in ("ffmpeg", "ffprobe"):
        if shutil.which(tool) is None:
            die(f"{tool} not found on PATH. Install FFmpeg first.")

    man = {}
    if GEN.exists():
        try:
            man = json.loads(GEN.read_text(encoding="utf-8"))
        except Exception:
            man = {}
    todo = [g.strip() for g in args.only.split(",") if g.strip()]
    for g in todo:
        if g not in GROUPS:
            die(f"Unknown group '{g}'. Valid: {GROUPS}")
    fn = {"hero": do_hero, "base": do_base, "showcase": do_showcase,
          "colors": do_colors, "anime": do_anime, "fx": do_fx}
    for g in GROUPS:
        if g in todo:
            log(f"\n== {g} ==")
            fn[g](args, man)

    man["_options"] = {"cutout": args.cutout, "model": args.rembg_model, "flipColors": args.flip_colors,
                       "flipAnimeSneakers": args.flip_anime_sneakers, "flipCharacters": args.flip_characters}
    GEN.parent.mkdir(parents=True, exist_ok=True)
    GEN.write_text(json.dumps(man, indent=2), encoding="utf-8")
    QA.mkdir(parents=True, exist_ok=True)
    (QA / "report.md").write_text("# Asset report\n\n" + "\n".join("- " + l.strip() for l in REPORT if l.strip()),
                                  encoding="utf-8")
    log(f"\nWrote {GEN.relative_to(ROOT)} and {QA.relative_to(ROOT)}/report.md")


if __name__ == "__main__":
    main()
```

### 6.3 Run it

1. `.venv-assets/bin/python scripts/process_assets.py` (Windows: `.venv-assets\Scripts\python scripts\process_assets.py`). Default options: rembg cut-outs; mirror colorways = yes; mirror anime sneakers = yes; mirror characters = no.
2. If the script stops with an error about missing files, relay the message and STOP.
3. If the hero report lists **more than 4 flicker suspect frames**, re-run only the hero with a cleaner (slower) model: `python scripts/process_assets.py --only hero --rembg-model birefnet-general`, then compare the suspect list again and report both results. Do not try any other workaround.
4. Option reference (do not use unless told or required by step 3): `--only hero,base,showcase,colors,anime,fx`, `--no-flip-colors`, `--no-flip-anime-sneakers`, `--flip-characters`, `--rembg-model <name>`, `--cutout whitekey` (emergency only, no AI model, poor on white parts), `--target-frames N`, `--hero-desktop-width N`, `--hero-mobile-width N`.

### 6.4 Phase 2 verification

- `src/data/assets.generated.json` exists and has keys `hero, base, showcase, colors, anime, fx`.
- `public/assets/hero/desktop` and `/mobile` each contain exactly `hero.count` files, numbered `0001.webp…`.
- Size budget (print a table): hero desktop total ≤ 7 MB, hero mobile ≤ 3.5 MB, each colour/anime image ≤ 250 KB, each showcase clip ≤ 6 MB, ink clip ≤ 2 MB, whole `public/assets` ≤ 30 MB. If a budget is exceeded: lower WebP quality in the script by 4 points (hero 80→76, stills 86→82), re-run that group, re-check. Do not change dimensions.
- Open nothing visually; the human inspects the contact sheets.

### ⛔ GATE A — STOP HERE

Print this report, then wait for the human to say **"continue"**:

1. Table of every produced asset group with counts and sizes.
2. Hero: model used and the list of flicker-suspect frames.
3. The `anime` palettes the script derived (`primary/deep/accent/text` per character).
4. The paths of the contact sheets in `.work/qa/` (`hero-contact.png`, `colors-contact.png`, `anime-sneakers-contact.png`, `anime-characters-contact.png`) and this instruction to the human: *"Open the contact sheets and check: (a) white halos or missing parts at cut-out edges, (b) every colorway is the same size/position, (c) the sneakers face RIGHT and the characters face LEFT. If anything is wrong tell me which flag to change (`--no-flip-colors`, `--no-flip-anime-sneakers`, `--flip-characters`) or which file to replace."*

---

## 7. PHASE 3 — DESIGN SYSTEM

Create `src/styles/tokens.css`, `base.css`, `components.css`, `sections.css`. Import order in `main.ts`: fonts → `lenis/dist/lenis.css` → tokens → base → components → sections.

### 7.1 Tokens (`:root`)

```
--ink:#0D0B14;  --paper:#FBF8FF;  --lilac-50:#EFE9FB;  --lavender:#C9B8F5;  --lavender-deep:#7B5CE0;
--pink:#F6BFD3;  --mint:#BFE8D5;  --sky:#BBD6F5;  --cream:#FFF5E4;
--muted:rgba(13,11,20,.68);  --line-dark:rgba(255,255,255,.14);  --line-light:rgba(13,11,20,.12);
--grad-brand:linear-gradient(90deg,#C9B8F5,#F6BFD3);
--r-sm:12px; --r-md:20px; --r-lg:28px; --r-pill:999px;
--gutter:6vw;  --header-h:72px;  (≤1023px: --gutter:6vw; --header-h:60px)
--font-display:"Bricolage Grotesque Variable","Bricolage Grotesque",system-ui,sans-serif;
--font-anime:"Anton",Impact,"Arial Narrow Bold",sans-serif;
--font-body:"DM Sans Variable","DM Sans",system-ui,sans-serif;
--ease-out:cubic-bezier(.16,1,.3,1);  --ease-inout:cubic-bezier(.65,0,.35,1);
z-index map: bg 0 · bgword 1 · panel 1 · divider 2 · character 3 · sneaker 4 · info 5 · speedlines 6 · ink 7 · flash 8 · header 50 · cursor 60 · preloader 100
```

### 7.2 Type scale (desktop clamp → mobile floor)

| Role | Font / weight | Size | Line-height | Letter-spacing | Case |
|---|---|---|---|---|---|
| Hero H1 | display 800 | `clamp(44px, 6.6vw, 124px)` | .9 | -0.03em | upper |
| Section H2 | display 800 | `clamp(36px, 5vw, 88px)` | .95 | -0.02em | upper |
| Colour name | display 800 | `clamp(40px, 5.2vw, 96px)` | .92 | -0.02em | upper |
| Anime name | anime 400 | `clamp(44px, 5vw, 88px)` | .95 | .01em | upper |
| Anime giant bg name | anime 400 | `min(24vw, 42svh)` | .85 | 0 | upper |
| Eyebrow | body 600 | 13px | 1.2 | .28em | upper |
| Body L | body 400 | 20px (mobile 18px) | 1.5 | 0 | — |
| Body | body 400 | 18px (mobile 16px) | 1.5 | 0 | — |
| Small | body 500 | 14px | 1.4 | .02em | — |
| Micro | body 500 | 12px | 1.4 | .04em | — |

### 7.3 Global CSS rules

- `*{box-sizing:border-box}`; `html{background:var(--paper);color:var(--ink);font-family:var(--font-body);-webkit-text-size-adjust:100%}`; `body{margin:0;overflow-x:hidden}`; images `display:block;max-width:100%`.
- All section heights use **`svh`** (small viewport height) so mobile browser bars don't jump the layout. Provide a `100vh` fallback line before each `svh` line.
- `:focus-visible{outline:3px solid var(--lavender-deep);outline-offset:3px}`.
- `.sr-only` utility. `a{color:inherit;text-decoration:none}`. `button{font:inherit}`.
- **Primary button** `.btn`: height 56px (mobile 52px), padding 0 32px, radius pill, background `--ink`, colour `--paper`, font body 700 16px, inline-flex centred. Hover (pointer devices only): `translateY(-2px)` + a `--grad-brand` sheen sweep over 600 ms. **Ghost link** `.link-arrow`: body 600 16px, underline offset 6px, arrow `→` nudging 4px right on hover.
- **Pill chip** `.chip`: 13px uppercase tracking .12em, padding 6px 12px, radius pill, background `--paper`, 1px `--line-light` border.
- Reduced motion: `@media (prefers-reduced-motion: reduce)` → `*{animation:none!important;transition:none!important}`.

---

## 8. PHASE 4 — DATA FILE `src/data/site.json` (create exactly; the human will edit it later)

**Rules:** the app reads ALL text and settings from this file. Values `"AUTO"` / `"auto"` are resolved by code as documented in the comments below (JSON has no comments — the rules are in §8.2).

```json
{
  "meta": {
    "title": "SOLE SAGA — Anime-inspired sneakers (concept)",
    "description": "A concept drop of anime-inspired sneakers. Scroll to explore the sneaker, every colorway and the full roster.",
    "themeColor": "#FBF8FF",
    "lang": "en"
  },
  "brand": { "name": "SOLE SAGA", "short": "SAGA", "tagline": "Walk into the story." },
  "nav": [
    { "label": "Anatomy", "href": "#anatomy" },
    { "label": "Colors", "href": "#colors" },
    { "label": "Roster", "href": "#anime" },
    { "label": "Drop", "href": "#drop" }
  ],
  "cta": { "label": "Join the waitlist", "href": "#drop" },
  "hero": {
    "eyebrow": "DROP 001 · ANIME-INSPIRED SNEAKERS",
    "line1": "WALK INTO",
    "line2": "THE STORY.",
    "sub": "Anime-inspired sneakers for the ones who live in the scene. Soft shapes, loud stories.",
    "primary": { "label": "Join the waitlist", "href": "#drop" },
    "secondary": { "label": "Scroll to explore", "href": "#anatomy" },
    "bgWord": "KICKS",
    "scrollHint": "Scroll",
    "chips": [
      { "label": "Air-cushion heel", "x": 8, "y": 24 },
      { "label": "Suede + mesh upper", "x": 70, "y": 30 },
      { "label": "Padded collar", "x": 60, "y": 80 }
    ]
  },
  "marquee": { "items": [], "separator": "✦", "autoExtra": ["DROP 001", "LIMITED RUN", "ANIME-INSPIRED"] },
  "anatomy": {
    "eyebrow": "ANATOMY",
    "beats": [
      { "clip": "sole-pushin", "title": "Air that shows off.", "body": "A visible air-cushion heel softens every landing and looks good doing it.", "bg": "#EFE9FB",
        "callouts": [ { "label": "Air-cushion heel", "dot": [70, 64], "at": [84, 38] } ] },
      { "clip": "side-glide", "title": "Layers on layers.", "body": "Wavy overlays stack suede, leather and mesh into one flowing line.", "bg": "#FBE9F2",
        "callouts": [ { "label": "Layered overlays", "dot": [48, 42], "at": [40, 12] }, { "label": "Padded collar", "dot": [78, 28], "at": [86, 10] } ] },
      { "clip": "laces-detail", "title": "Locked in.", "body": "Flat laces, a sculpted tongue and a padded collar hold you in place.", "bg": "#E6F4EE",
        "callouts": [ { "label": "Flat laces", "dot": [44, 50], "at": [16, 24] }, { "label": "Sculpted tongue", "dot": [58, 26], "at": [80, 14] } ] },
      { "clip": "exploded", "title": "Every layer, one silhouette.", "body": "See how each part fits together before it becomes the shoe.", "bg": "#E7EFFB",
        "callouts": [ { "label": "Upper", "dot": [50, 38], "at": [16, 20] }, { "label": "Outsole", "dot": [50, 80], "at": [82, 88] } ] }
    ]
  },
  "angles": {
    "eyebrow": "ALL ANGLES",
    "title": "Every angle is the good angle.",
    "bgWord": "ANGLES",
    "labels": { "front34": "FRONT 3/4", "side": "SIDE", "rear34": "REAR 3/4", "top": "TOP" }
  },
  "colors": {
    "eyebrow": "COLORWAYS",
    "cta": "Join the waitlist",
    "items": [
      { "id": "01", "name": "COTTON CANDY", "tagline": "Soft on the eyes. Loud on the street.", "bg": "#EADFFB", "text": "#0D0B14", "specs": ["Premium suede and breathable mesh", "Visible air-cushion heel", "Numbered limited run"] },
      { "id": "02", "name": "TOMATO SODA", "tagline": "Fizz-red energy for every step.", "bg": "#F4776E", "text": "#FFFFFF", "specs": ["Premium suede and breathable mesh", "Visible air-cushion heel", "Numbered limited run"] },
      { "id": "03", "name": "BUTTER & COCOA", "tagline": "Warm tones, zero effort.", "bg": "#F5D76E", "text": "#3B2412", "specs": ["Premium suede and breathable mesh", "Visible air-cushion heel", "Numbered limited run"] },
      { "id": "04", "name": "ACID MATCHA", "tagline": "Neon green. No apologies.", "bg": "#C6F135", "text": "#0D0B14", "specs": ["Premium suede and breathable mesh", "Visible air-cushion heel", "Numbered limited run"] },
      { "id": "05", "name": "COBALT POP", "tagline": "Electric blue with an orange spark.", "bg": "#2B4EFF", "text": "#FFFFFF", "specs": ["Premium suede and breathable mesh", "Visible air-cushion heel", "Numbered limited run"] },
      { "id": "06", "name": "CHROME NOIR", "tagline": "After-dark armor.", "bg": "#111114", "text": "#F3F3F7", "specs": ["Premium suede and breathable mesh", "Visible air-cushion heel", "Numbered limited run"] }
    ]
  },
  "anime": {
    "eyebrow": "THE ROSTER",
    "cta": "Pre-order this pair",
    "rosterTitle": "THE FULL ROSTER",
    "rosterCta": "Join the waitlist",
    "items": [
      { "id": "01", "name": "AUTO", "epithet": "THE HERO", "line": "Loud, loyal and never out of the fight.", "theme": "auto" },
      { "id": "02", "name": "AUTO", "epithet": "THE RIVAL", "line": "Cold stare. Colder comebacks.", "theme": "auto" },
      { "id": "03", "name": "AUTO", "epithet": "THE BLADE", "line": "Three moves ahead, always.", "theme": "auto" },
      { "id": "04", "name": "AUTO", "epithet": "THE MYSTIC", "line": "Calm on the outside. Chaos on request.", "theme": "auto" },
      { "id": "05", "name": "AUTO", "epithet": "THE WILDCARD", "line": "Nobody knows the plan. Not even them.", "theme": "auto" }
    ]
  },
  "drop": {
    "eyebrow": "DROP 001",
    "dropDate": "2026-12-01T18:00:00+03:00",
    "liveMessage": "The drop is live.",
    "note": "Concept project. No products are for sale.",
    "formTitle": "Get first access.",
    "formBody": "Join the waitlist and be first to know when the pairs drop.",
    "placeholder": "you@email.com",
    "button": "Notify me",
    "success": "You're on the list ✦",
    "microcopy": "Demo form. Nothing is sent or stored.",
    "demoMode": true,
    "labels": { "days": "DAYS", "hours": "HRS", "minutes": "MIN", "seconds": "SEC" }
  },
  "footer": {
    "howTitle": "How it's built",
    "how": [
      "72-frame turntable scrubbed on a canvas",
      "GSAP ScrollTrigger and Lenis smooth scroll",
      "AI-generated imagery, hand-processed: cut-outs, alignment, compression",
      "Vite and TypeScript, deployed on Netlify",
      "Original characters. Concept project, not a real store."
    ],
    "links": [],
    "credit": "Designed & built by Nitō",
    "copyright": "Concept project"
  }
}
```

### 8.2 Resolution rules for the code (implement in `src/lib/data.ts`)

- **Colour/anime/anatomy items bind to assets by `id`** (the two-digit index in the file names), never by array position. If `site.json` has an item with no asset, or an asset with no item, throw a clear console error and skip that item. Always render the intersection, sorted by `id`.
- `anime.items[].name === "AUTO"` → use the asset `slug` uppercased with hyphens → spaces.
- `anime.items[].theme === "auto"` → use `assets.anime[].palette` from the manifest. If `theme` is an object `{primary, deep, accent, text}`, use it verbatim.
- `marquee.items` empty → build the list as: all colour names, then all anime display names, then `marquee.autoExtra`.
- `anatomy.beats`: keep only beats whose `clip` exists in `assets.showcase`. Beat count = number kept.
- `footer.links` empty → render no link column. `drop.dropDate` already past → show `liveMessage` instead of the countdown.
- Combine data + assets into one typed `Site` object exported from `data.ts`. Fully typed interfaces; no `any`.

**Phase 4 verification:** `npx tsc --noEmit` passes on `data.ts`.

---

## 9. PHASE 5 — APP SHELL AND ENGINE

### 9.1 `index.html` (static)

- `<html lang="en">` (hard-coded).
- `<head>`: charset, `viewport` = `width=device-width, initial-scale=1, viewport-fit=cover`, `<title>` and description (copy the strings from `site.json` → `meta`), `theme-color`, favicon `/favicon.svg`, Open Graph (`og:title`, `og:description`, `og:type=website`, `og:image=/og-image.jpg`), `twitter:card=summary_large_image`.
- `<body>`: skip-link `<a class="sr-only" href="#drop">Skip to waitlist</a>`, `<div id="app"></div>`, `<noscript>` message "This experience needs JavaScript.", and a **hidden static Netlify form** (so Netlify detects it at deploy time):
  ```html
  <form name="waitlist" method="POST" data-netlify="true" netlify-honeypot="bot-field" hidden>
    <input type="text" name="bot-field"><input type="email" name="email"><input type="text" name="colorway"><input type="text" name="character">
  </form>
  ```
- `<script type="module" src="/src/main.ts">`.

`public/favicon.svg`: a 64×64 rounded square (rx 16) filled `#C9B8F5` with the first letter of `brand.short` centred in `#0D0B14`, font-weight 800, system sans.

### 9.2 `src/config.ts` (all layout constants live here; sections import from it)

```ts
export const CFG = {
  bpDesktop: 1024,                       // px: >= desktop layout, < mobile layout
  hero:    { pinSvh: 300, idleFps: 6, turns: 1, lerpK: 10 },
  marquee: { heightSvh: 16, minPx: 120, baseSpeedPxPerS: 60 },
  anatomy: { stepSvh: 80 },
  angles:  { heightSvh: 220 },
  colors:  { stepSvh: 80, holdEnd: 0.65 },                 // transition = [k+0.65, k+1.00]
  anime:   { stepSvh: 110, swapStart: 0.2, swapEnd: 0.8, rosterHold: 0.6, snapEps: 0.06,
             snapIdleMsDesktop: 140, snapIdleMsTouch: 180, snapDurS: 0.9 },
  footer:  { minSvh: 60 },
  drop:    { minSvh: 100 },
} as const;
```

### 9.3 Engine (`src/lib/engine.ts`)

1. `gsap.registerPlugin(ScrollTrigger)`. `ScrollTrigger.config({ ignoreMobileResize: true })`.
2. Create `const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 })` (touch uses native scrolling: leave `syncTouch` false). Wire: `lenis.on("scroll", ScrollTrigger.update)`; `gsap.ticker.add((t) => lenis.raf(t * 1000))`; `gsap.ticker.lagSmoothing(0)`. Call `lenis.stop()` until the preloader finishes, then `lenis.start()`.
3. `const mm = gsap.matchMedia()`; sections register their animations inside `mm.add("(min-width: 1024px)", …)` and `mm.add("(max-width: 1023px)", …)` so each breakpoint builds its own timelines and reverts cleanly on resize. A third query `(prefers-reduced-motion: reduce)` activates the static fallback (§12.4) and disables Lenis.
4. Debounced `resize` (250 ms) → `ScrollTrigger.refresh()`. Also call `ScrollTrigger.refresh()` once after the preloader finishes and once more 600 ms later (images change layout).
5. Export `ctx = { lenis, gsap, ScrollTrigger, mm, site, isDesktop(): boolean, prefersReduced: boolean }`.
6. `ScrollTrigger` IDs (exact): `"hero"`, `"anatomy"`, `"colors"`, `"anime"`. Pinned sections use `pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true`.

### 9.4 Preloading (`src/lib/preload.ts`) and the preloader (`sections/preloader.ts`)

- **Critical set (blocks the preloader):** the 3 web fonts (`document.fonts.load` for `800 1em "Bricolage Grotesque Variable"`, `400 1em "Anton"`, `400 1em "DM Sans Variable"`) + all hero frames of the active set (desktop folder if viewport ≥ 1024 else mobile). Load with `fetch` → `blob` → `createImageBitmap`, **8 concurrent**. Order: frame 1, then every 6th, then the rest. A failed frame retries once, then is replaced by its nearest loaded neighbour.
- **Idle set (after the preloader, never blocks):** colour images, anime sneakers and characters, base stills, fx images — queued with `requestIdleCallback` (fallback `setTimeout 200`), decoded with `img.decode()`. Showcase and ink videos: `preload="metadata"` initially; when their section is within 150 % of the viewport (IntersectionObserver) set `preload="auto"` and call `.load()` once.
- **Preloader DOM (`position:fixed; inset:0; z-index:100`):** background `--paper`; centre: brand name `brand.name` (display 800, `clamp(28px,4vw,56px)`, letters revealed one by one, 40 ms stagger); under it a 240 px × 2 px track (`--line-light`) with a fill using `--grad-brand`; bottom-left a percentage counter (display 800, `clamp(64px,14vw,220px)`, `font-variant-numeric: tabular-nums`, colour `--ink`) counting 0→100 with smoothing (`displayed += (target - displayed) * 0.12` per tick).
- **When loaded = 100 %:** wait 300 ms, set `body.is-ready`, run the exit: panel `clip-path: inset(0 0 0 0) → inset(0 0 100% 0)` over 0.9 s `power4.inOut`, then remove the node, `lenis.start()`, play the hero intro (§10.1). Total minimum preloader time 900 ms even on a fast connection.
- If the critical set fails entirely (network error): show the static `base-front34` image in the hero, add `body.is-ready`, continue (log `console.warn`).

### 9.5 Globals permitted

Only these, and only when the URL has `?qa=1`: `window.__qa` (see §13.2). Nothing else on `window`.

### 9.6 Strings allowed in code (everything else comes from site.json)

`aria-label`s: "Rotating sneaker", "Colorway {name}", "Character {name}", "Join the waitlist form"; the `<noscript>` text; the debug label "x%, y%"; the skip-link text.

### 9.7 Header (`sections/header.ts`)

- `position:fixed; top:0; left:0; right:0; height:var(--header-h); padding:0 var(--gutter); display:flex; align-items:center; justify-content:space-between; z-index:50`.
- Left: `brand.name` wordmark (display 800, 20px, tracking .02em; or `logo.svg` at 28 px height if provided). Right (desktop): the `nav` links (body 600 14px uppercase tracking .12em, gap 32px) then a pill `.btn` (height 40px, padding 0 20px, 14px) with `cta.label`. **Mobile:** brand + the CTA pill only (no nav links).
- Colour theme: each `<section>` has `data-header="light|dark"`. A ScrollTrigger per section (start `top 72px`, end `bottom 72px`) toggles `header[data-theme]`. Light = ink text; dark = paper text. Colorway section: set theme by the **current colourway's `text`** (white vs. dark, via luminance of its `bg`). Anime: always dark except roster (dark). Hero/Anatomy/Angles: light. Marquee/Drop/Footer: dark.
- Backdrop: `backdrop-filter: blur(10px)` + background `rgba(251,248,255,.55)` in light theme / `rgba(13,11,20,.45)` in dark theme; border-bottom 1px `--line-light` / `--line-dark`. Transition 300 ms.
- Nav link and CTA clicks use `lenis.scrollTo(target, { duration: 1.4, easing: (t)=>1-Math.pow(1-t,4), offset: 0 })`.

### 9.8 Custom cursor (`sections/cursor.ts`) — only when `(hover: hover) and (pointer: fine)`

A 10 px dot and a 44 px ring (1.5 px border), both `position:fixed; pointer-events:none; mix-blend-mode:difference; background/border: white; z-index:60`. Dot follows the pointer exactly; ring follows with `gsap.quickTo` duration .35. Ring scales to 72 px (and the dot hides) while hovering `a, button, input, [data-cursor]`. Hide both when the pointer leaves the window. Not created on touch devices.

---

## 10. PHASE 6 — THE SECTIONS

**Reference viewport for pixel examples: 1440 × 900 desktop and 390 × 844 mobile.** Heights use `svh`. All sections are `position:relative; overflow:hidden` unless pinned (pinned sections get `overflow:hidden` on their inner stage). Each section root has its `id` and `data-header`.

### 10.1 HERO — `id="hero"`, `data-header="light"`

**Height / scroll:** section `100svh`, pinned for **300svh** of scroll (`end: "+=300%"`, trigger `#hero`, id `"hero"`). Page contribution = 400svh.

**Background:** `linear-gradient(135deg,#FBF8FF 0%,#F2E9FF 55%,#FFE9F1 100%)`. Three blurred blobs (`filter:blur(80px)`, absolute): lavender `#C9B8F5` 38vw circle at left 62vw / top 8svh; pink `#F6BFD3` 30vw at left 74vw / top 62svh; mint `#BFE8D5` 26vw at left 48vw / top 76svh, opacity .6. `fx-halftone` over everything at opacity .08, `mix-blend-mode:multiply`, `background-size:420px`. Giant outlined word `hero.bgWord` (display 800, `font-size:30vw`, `-webkit-text-stroke:2px var(--ink)`, `color:transparent`, opacity .07) centred at left 58vw / top 50svh.

**Left column (desktop):** `position:absolute; left:6vw; width:44vw; top:50%; transform:translateY(-48%)`. Stack, top to bottom, gaps in px: eyebrow (24) → H1 line 1 (0) → H1 line 2 (28; filled with `--grad-brand` via `background-clip:text; -webkit-text-fill-color:transparent`) → sub paragraph Body L, colour `--muted`, `max-width:34ch` (36) → CTA row: primary `.btn` then `.link-arrow` secondary, gap 24. Each H1 line is wrapped in an `overflow:hidden` line mask (for the intro reveal). Bottom-left scroll hint at `left:6vw; bottom:5svh`: text `hero.scrollHint` (eyebrow style) + a 1 px × 48 px line with a looping `scaleY` animation (1.6 s).

**Right stage (desktop):** `position:absolute; right:1vw; top:50%; width:58vw; height:82svh; transform:translateY(-50%)`. Contains: (1) a `<canvas>` filling the stage with `aria-label="Rotating sneaker"`; (2) a **contact shadow**: absolutely positioned ellipse, `width:42%; height:5svh; bottom:6%; left:29%`, `background:radial-gradient(closest-side,rgba(40,25,80,.30),transparent)`, `filter:blur(6px)`, animation `scaleX .88↔1.06` 4.2 s ease-in-out infinite; (3) three **spec chips** (`.chip` with a 6 px dot) from `hero.chips` placed at `left:x%; top:y%` of the stage, initially `opacity:0`. **Nesting (important — never put CSS and GSAP transforms on the same element):** `.hero-stage` (GSAP: intro, scroll `x`/`scale`) → `.hero-bob` (CSS only: `translateY(-14px ↔ 14px)`, 4.2 s ease-in-out infinite, in sync with the shadow) → `<canvas>`.

**Mobile (<1024px):** text block at top: `padding: calc(var(--header-h) + 4svh) 6vw 0`; H1 stays two lines at the clamp floor; sub paragraph; keep the primary `.btn` and the ghost link on one row. Stage below: `position:absolute; left:0; right:0; bottom:0; height:52svh`; chips hidden; scroll hint hidden.

**Frame player (`lib/frameplayer.ts`)** — a reusable class used here:
- Inputs: `canvas`, `frames: ImageBitmap[]` (transparent WebP cut-outs).
- Canvas internal size = stage CSS size × `min(devicePixelRatio, 2)`, capped at 1600 px wide; recompute on resize.
- Draw = "contain" fit of the frame inside the canvas, centred. Between two frames use **cross-dissolve**: draw frame `i` at `globalAlpha 1`, then frame `i+1` (wrapping) at `globalAlpha = frac` if `frac > 0.02` (this hides the 5° step and makes idle rotation smooth).
- State: `angle` (float, unwrapped, in frames), draw index = `mod(floor(angle), N)`, `frac = angle - floor(angle)`.
- Loop on `gsap.ticker` with `dt`:
  - **Idle mode** while `window.scrollY <= 2`: `angle += CFG.hero.idleFps * dt`.
  - **Scroll mode** while `scrollY > 2`: on the first tick after leaving idle capture `base = angle`; `target = base + progress * N * CFG.hero.turns`; `angle += (target - angle) * (1 - Math.exp(-CFG.hero.lerpK * dt))`.
  - Only redraw when the rounded draw state changed. Pause the loop when the hero is out of view (`progress >= 1`) and resume when it re-enters.
- `progress` = the ScrollTrigger `"hero"` progress (0→1).

**Scroll timeline (desktop), progress 0→1 over the pin, `scrub: 0.5`:**
- 0.00–0.30: left column `x: 0 → -14vw`, `opacity: 1 → 0`, ease `power2.in`, lines stagger .04; blobs parallax `y` by −12svh / +14svh / −8svh (full pin); bg word `x: 0 → +10vw`.
- 0.30–0.85: stage wrapper `x: 0 → -14vw`, `scale: 1 → 1.18` (ease `power1.inOut`) so the shoe ends centred.
- 0.55–0.70: chips fade in (`opacity 0→1`, `y 12→0`, stagger .05); 0.90–1.00: chips fade out.
- Mobile timeline: left text block `y: 0 → -8svh`, `opacity 1 → 0` over 0.00–0.30; stage `scale: 1 → 1.12` over 0.30–0.85.

**Intro (plays once when the preloader exits):** 1.4 s total. H1 line masks `yPercent: 110 → 0` (stagger .08, `expo.out`), eyebrow/sub/CTAs `y: 24 → 0`, `opacity 0 → 1` (stagger .08, start +0.25 s), stage wrapper `scale: 1.12 → 1`, `opacity: 0 → 1` (1.4 s `expo.out`), bg word `opacity: 0 → .07`.

**Assets:** frames from `assets.hero` (`desktop.dir` or `mobile.dir`, `count`). Fallback if frames fail: `<img>` of `assets.base.front34`.

### 10.2 MARQUEE — `data-header="dark"`

- Height `max(16svh, 120px)`; background `--ink`; text `--paper`. Top and bottom 1 px `--line-dark`.
- One flex row of the items (see §8.2) separated by `marquee.separator`, **duplicated twice** for a seamless loop. Item type: display 800 uppercase, `clamp(40px,7vw,112px)`, line-height 1; items alternate **filled** and **outlined** (`-webkit-text-stroke:2px var(--paper); color:transparent`). Gap 4vw.
- Motion: `translateX` loop at `CFG.marquee.baseSpeedPxPerS` (60 px/s) leftwards, driven by `gsap.ticker`. Speed multiplier `= 1 + min(abs(lenis.velocity) * 0.4, 6)`; direction follows `lenis.direction` (down = left, up = right) with a 400 ms eased reversal. Pause when out of view. Reduced motion: static, no loop.

### 10.3 ANATOMY — `id="anatomy"`, `data-header="light"`

**Height / scroll:** section `100svh`, pinned for `beats × 80svh` (`end: "+=" + beats*80 + "%"`, id `"anatomy"`). With 4 beats: 420svh total.

**Background:** the first beat's `bg`; it tweens to each beat's `bg` over the first 20 % of that beat.

**Desktop layout:** 
- Left text column `left:6vw; width:30vw; top:50%; transform:translateY(-50%)`: eyebrow `anatomy.eyebrow`; beat counter `01 / 04` (body 600 14px tabular); beat title (Section H2 scale but `clamp(36px,4.4vw,80px)`); beat body (Body L, `--muted`, `max-width:30ch`); a 2 px × 120 px vertical progress line to the left of the counter (fill = global section progress).
- Right video stage `left:38vw; width:58vw; top:50%; transform:translateY(-50%); aspect-ratio:16/9; max-height:70svh`. All beat `<video>` elements stacked absolutely: `muted playsinline preload="metadata" poster=… aria-hidden="true"; object-fit:contain; mix-blend-mode:multiply` (the clips have a white background; `multiply` makes the white disappear into the pastel background). **Blend-mode gotcha:** an ancestor with `transform`/`opacity`/`filter` creates a stacking context and blocks blending with anything behind it. Therefore the video stage element MUST have `background: var(--a-bg)` (the same colour value as the section background; both are driven by the CSS variable `--a-bg`, which GSAP tweens per beat), and the stage must not sit inside any other transformed element except the ScrollTrigger pin wrapper. Verify visually that no white rectangle is visible.
- **Callouts:** one `<svg>` overlay with `viewBox="0 0 100 100" preserveAspectRatio="none"` over the video stage. For each callout: a circle (r .7, fill `--ink`) at `dot`, a line from `dot` to `at` (stroke `--ink`, 1.5 px via `vector-effect:non-scaling-stroke`), and an HTML `.chip` positioned at `at` (left/top in %). **Placeholders:** the `dot`/`at` coordinates in `site.json` are first guesses; the human will tune them. Implement a debug helper: when the URL contains `?debug=callouts`, clicking the video stage prints `x%, y%` (of the stage) in a small fixed label and in `console.log`.
- Timeline units: beat `i` occupies time `[i, i+1]` on a master timeline of duration `beats`, `scrub: 0.5`.
  - Video `i` fades/wipes in over `[i-0.05, i+0.1]` (`opacity 0→1` plus `clip-path: inset(100% 0 0 0) → inset(0)`), fades out over `[i+0.9, i+1.05]`.
  - **Video scrubbing:** during `[i+0.1, i+0.9]` set `video.currentTime = ((t - (i+0.1)) / 0.8) * duration`, updated in the ticker with smoothing (`cur += (target-cur)*0.25`), writing only when `abs(cur - lastWritten) > 1/30`. Skip if `video.readyState < 2`.
  - Text swap at each beat boundary: outgoing title/body `y: 0 → -30`, `opacity → 0` (0.15 units), incoming `y: 40 → 0`, `opacity 0 → 1` (0.2 units, `expo.out`). Counter text swaps at the mid-point.
  - Callouts: line draws in (`stroke-dasharray` / `stroke-dashoffset`) over `[i+0.35, i+0.55]`, chips fade in with it, everything fades out `[i+0.85, i+1.0]`.
- **Mobile:** stage at top (`top:calc(var(--header-h)+2svh); left:0; right:0; height:40svh`), text block below (`left:6vw; right:6vw; top:48svh`), title `clamp(32px,9vw,48px)`. Same timeline.

### 10.4 ALL ANGLES — `id="angles"`, `data-header="light"`

**Not pinned.** Section height **220svh**, `background: var(--paper)`; a soft pink blob (`#F6BFD3`, 34vw, blur 90px, opacity .5) at left 70vw / top 30svh.

**Desktop placement** (each image absolutely positioned; `left/top` relative to the section; widths are CSS widths):

| Image (`assets.base.*`) | left | top | size | z | parallax `y` from → to | extra |
|---|---|---|---|---|---|---|
| title block (eyebrow + H2) | 6vw | 6svh | `max-width:44vw` | 3 | — | — |
| bg word `angles.bgWord` | −2vw | 40svh | `font-size:26vw` outlined | 0 | 0 | opacity .07 |
| `front34` | 8vw | 34svh | width 40vw | 2 | +8vh → −8vh | scale .96 → 1.04 |
| `side` | 46vw | 92svh | width 50vw | 3 | +18vh → −18vh | scale .96 → 1.04 |
| `rear34` | 4vw | 128svh | width 34vw | 2 | +28vh → −28vh | — |
| `top` | 62vw | 150svh | height 70svh (width auto) | 3 | +34vh → −34vh | rotate −18° → 0° |

Each image has a `.chip` label (from `angles.labels`) at its lower-left corner, offset (8px, −8px). **Parallax:** one `gsap.fromTo` per element with `ease:"none"` and a ScrollTrigger `{ trigger: section, start: "top bottom", end: "bottom top", scrub: true }`. Images enter with `opacity 0→1` over their first 15 % of visibility.

**Mobile:** single column; each image `width: 86vw`, `margin: 0 auto`, vertical gap 12svh, parallax distances halved; top-view image `height: 56svh`.

### 10.5 COLORWAYS — `id="colors"`, `data-header` = dynamic (see §9.7)

**Height / scroll:** section `100svh`, pinned for `N × 80svh` (`end: "+=" + N*80 + "%"`, id `"colors"`). N=6 → 580svh total. **Motion personality: calm, smooth, liquid. Continuous scrub (NO snapping), a long hold then a circle-wipe.**

**Layers (back → front):** background layers → giant outlined colourway name → shoe stage (left) → content column (right) → progress rail.

**Desktop layout:**
- `bg-layer[i]`: absolute `inset:0`, `background: colors.items[i].bg`. Layer 0 fully visible; layers ≥ 1 start with `clip-path: circle(0% at 30% 52%)`.
- **Giant name:** `font-size: min(26vw, 48svh)`, display 800, uppercase, `-webkit-text-stroke:2px currentColor; color:transparent`, opacity .14, centred in the left stage (`left:-2vw; top:50%; transform:translateY(-50%)`), `white-space:nowrap`, z 1. One per colourway, stacked; the active one is visible.
- **Shoe stage:** `left:3vw; width:55vw; top:0; height:100svh`. Shoe `<img>` (`assets.colors[i].src`, alt = `Colorway {name}`) centred at **(30vw, 52svh)** with `width:min(52vw, 118svh)` (aspect 2000×1200). Contact shadow: ellipse `width:60%` of the shoe, `height:4svh`, `rgba(0,0,0,.18)`, `blur(14px)`, 4 svh below the shoe's bottom edge. Idle bob: a `.c-bob` wrapper around all shoe images (CSS only, `translateY(±8px)`, 5 s); GSAP animates the individual `<img>`s inside it.
- **Content column:** `left:62vw; width:32vw; top:50%; transform:translateY(-50%)`. Stack: counter `02 / 06` (14px, tabular, margin-bottom 20) → name (Colour-name scale, max 2 lines, min-height 2 lines, margin-bottom 20) → tagline (22px, lh 1.35, `max-width:26ch`, margin-bottom 28) → 3 spec lines (18px, each with an 8 px round dot in `currentColor`, gap 10) → swatches row (margin-top 40) → CTA `.btn` with `colors.cta` (margin-top 28; background `currentColor`, text colour = the section background so it inverts per colourway).
- **Swatches:** `N` circles, 28 px, gap 12, background = that colourway's `bg`, 1.5 px border `currentColor`; active: 2 px ring in `currentColor` with 3 px gap and `scale(1.25)`. Clicking swatch `k` → `lenis.scrollTo(st.start + (k / N) * (st.end - st.start), { duration: 1.2 })`.
- **Progress rail:** a 2 px × 160 px vertical bar at `right:3vw; top:50%` with a fill tied to section progress; colour `currentColor`.
- Two CSS variables on the section drive the colours: `--c-text` (from `colors.items[i].text`, applied to every text/outline/ring element) and `--c-bg` (from `colors.items[i].bg`; used for the CTA text colour). Both tween during each wipe.

**Timeline:** master timeline duration `N`, `scrub: 0.6`. For colourway `k` the **hold** is `[k, k+0.65]` and the **transition into `k+1`** is `[k+0.65, k+1.0]` (the last colourway just holds through `[N-1, N]`). During a transition:
- Layer `k+1`: `clip-path: circle(0% at 30% 52%) → circle(140% at 30% 52%)`, ease `power2.inOut`, over the whole 0.35 window.
- `--c-text` tweens from colourway `k` text to `k+1` text over the middle half of the window.
- **Shoe:** outgoing `x: 0 → -4vw`, `rotate: 0 → -5deg`, `opacity: 1 → 0`, `scale: 1 → .96` over the first 45 %; incoming `x: 4vw → 0`, `rotate: 5deg → 0`, `scale: 1.04 → 1`, `opacity: 0 → 1`, ease `back.out(1.2)` over 40–100 %.
- **Name roll:** each character is wrapped in `overflow:hidden` spans; outgoing chars `yPercent: 0 → -110` (stagger .015, first 40 %); incoming chars `yPercent: 110 → 0` (stagger .015, 45–100 %).
- Tagline and specs: outgoing `y: 0 → -16`, `opacity: 0` (first 25 %); incoming `y: 16 → 0`, `opacity: 1` (50–100 %). Counter text swaps at 50 %.
- Giant name: outgoing `x: 0 → -6vw`, `opacity → 0`; incoming `x: +6vw → 0`, opacity → .14. Over the entire step, the active giant name drifts `x: +5vw → −5vw` linearly (parallax).
- The header theme (§9.7) switches at the wipe mid-point.

**Mobile:** shoe at top `top:calc(var(--header-h)+2svh); height:40svh` (width `min(96vw, 66svh)`), wipe origin `50% 28%`; content below `left:6vw; right:6vw; top:50svh`: counter, name (`clamp(36px,11vw,56px)`), tagline 18px, specs 16px, swatches, CTA full-width. Giant name `font-size:34vw`, centred behind the shoe. Rail hidden.

### 10.6 ANIME ROSTER — `id="anime"`, `data-header="dark"`

**Height / scroll:** section `100svh`, pinned for `(N + 0.6) × 110svh` (`end: "+=" + (N+0.6)*110 + "%"`, id `"anime"`). N=5 → 716svh total. **Motion personality: fast, hard-hitting, manga/anime. Discrete swaps with scroll snapping, a diagonal layout, directional smear, ink burst, speed lines, a flash frame.** This is deliberately different from the Colorways section (§10.5).

**Timeline model (positions are in "step units" `p`):**
- Master timeline duration `D = N + 0.6`. `scrub: 0.4`.
- Character `k` (0-based) is **settled** at position `k`. The **swap from `k` to `k+1`** runs over `p ∈ [k + 0.2, k + 0.8]` (window length 0.6). For `k = N-1` the swap goes into the **roster** (position `N`). The roster holds `[N + 0.2 … N + 0.6]` and the final pin tail.
- Before position 0.2 character 0 simply holds.

**Structure rule:** all anime layers listed below are siblings inside ONE container `.a-stage` (`position:absolute; inset:0; overflow:hidden`) that must have no transform/opacity/filter, so the `screen`/`multiply` layers blend with the backgrounds.

**Layers (back → front, z-index):** `a-bg` layers (0) → `a-halftone` (1) → `a-panel` (1) → `a-divider` (2) → `a-name` giant outlined text (2) → `a-char` (3) → `a-sneaker` (4) → `a-info` (5) → `a-roster` (4–5) → `a-speed` (6) → `a-ink` video (7) → `a-flash` (8) → left rail (5).

**Geometry (desktop):**
- `a-bg-layer[i]` (i = 0..N−1): `inset:0; background: primary_i`. Layer `N` (roster) background `--ink`. Layer 0 fully visible; the others start `clip-path: polygon(0% 0%, 0% 0%, -20% 100%, 0% 100%)` (zero area).
- `a-halftone`: `fx-halftone` tiled 420 px, `mix-blend-mode:multiply`, opacity .22, over the left area only (`clip-path: polygon(0 0, 62% 0, 42% 100%, 0 100%)`); `background-position` shifts +60 px per step.
- `a-panel`: `clip-path: polygon(60% 0%, 100% 0%, 100% 100%, 40% 100%)`, background `deep_i` (tweened across swaps).
- `a-divider`: SVG line from `(60vw, 0)` to `(40vw, 100svh)`, stroke `accent_i`, 6 px.
- **Giant name** `a-name-i`: anime font, `font-size:min(24vw, 42svh)`, uppercase, `-webkit-text-stroke:3px rgba(255,255,255,.45); color:transparent`, centred at `left:50%; top:38svh; transform:translate(-50%,-50%)`, `white-space:nowrap`.
- **Character** `a-char-i` (`assets.anime[i].character`, 1200×1600): `position:absolute; right:3vw; bottom:-3svh; height:94svh; width:auto`. Faces left, overlapping the divider. Style: sticker look: on the outer `.a-char` wrapper (NOT on the `<img>`) set `filter: drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(8px 8px 0 rgba(0,0,0,.35))`. The blur used in swaps is a *different* `filter` on the inner `<img>`, so the two never overwrite each other.
- **Sneaker** `a-sneaker-i` (`assets.anime[i].sneaker`, 1600×1000): centre at **(29vw, 38svh)**, `width:min(46vw, 80svh)`, base rotation **−12°**; the soft shadow `filter: drop-shadow(0 30px 30px rgba(0,0,0,.35))` goes on the outer `.a-sneaker` wrapper (the swap blur goes on the inner `<img>`).
- **Wrapper stack for sneaker and character (outer → inner):** `.a-sneaker` (position + CSS bob `translateY ±10px`, 3.6 s; character ±6px, 4.4 s) → `.a-vel` (scroll-velocity skew only) → `.a-mouse` (pointer parallax only) → `<img>` (choreography only). **Never put two systems on the same element.**
- **Info block** `a-info-i`: `left:6vw; bottom:9svh; width:36vw`. Stack: epithet (eyebrow style, colour `accent_i`, tracking .32em; margin-bottom 12) → name (Anime-name scale, colour `text_i`; margin-bottom 12) → line (Body L, colour `text_i` at 85 % opacity, `max-width:28ch`; margin-bottom 24) → CTA `.btn` (`anime.cta`; background `paper`, text `ink`; href `#drop`). Each text line sits in an `overflow:hidden` mask for the slice-in.
- **Left rail:** `left:2.2vw; top:50%`, vertical text `anime.eyebrow` rotated −90° (eyebrow style, `text_i`), and below it N small 2 px × 14 px ticks; the active tick grows to 36 px and takes `accent_i`.
- **`a-speed`:** `fx-speedlines`, `object-fit:cover; width:100%; height:100%; mix-blend-mode:screen; opacity:0; transform-origin:50% 45%`.
- **`a-ink`:** `<video muted playsinline preload="auto">` of `fx-ink-dark`, `object-fit:cover; mix-blend-mode:screen; opacity:0; filter:brightness(1.6) contrast(1.2)`.
- **`a-flash`:** `inset:0; background:#fff; opacity:0`.

**Swap choreography.** Local time `u ∈ [0,1]` across the 0.6-unit window of a swap `k → k+1`. Build one function `buildSwap(k)` returning a timeline of duration 0.6, added at position `k + 0.2` of the master timeline. All values below are for desktop.

| u range | What happens |
|---|---|
| **0.00 – 0.18 wind-up** | Sneaker `scale 1→0.94`, `rotate −12→−16°`, `x 0→−1vw`. Character `scale 1→0.97`, `x 0→+1vw`. Speed lines `opacity 0→0.6`, `scale 1→1.08`. |
| **0.18 – 0.46 hit (out)** | Sneaker exits: `x → −42vw`, `y → +14vh`, `rotate → −34°`, `skewX → −22°`, `filter blur(0→16px)`, `opacity 1→0`, ease `power3.in`. Character exits: `x → +36vw`, `skewX → +18°`, `blur(0→12px)`, `opacity 1→0`, ease `power3.in`. Speed lines `opacity →1`, `scale →1.35`. Ink video `opacity 0→0.95` and `currentTime` scrubbed `0 → 1.2 s`. Background wipe of layer `k+1`: `clip-path → polygon(0% 0%, 140% 0%, 120% 100%, 0% 100%)` over u 0.22–0.50, ease `power2.inOut`. Panel colour `deep_k → deep_{k+1}` and divider stroke `accent_k → accent_{k+1}` over u 0.24–0.50. Outgoing giant name `y 0 → −10vh`, `opacity → 0`. Outgoing info lines `yPercent 0 → −110` (stagger .02). |
| **flash spike** | `a-flash` `opacity 0 → 0.85` over u 0.40–0.43, `0.85 → 0` over u 0.43–0.46 (ease `power4.out`). |
| **0.46 – 0.84 arrival (in)** | New sneaker enters from `x −38vw, y −16vh, rotate +28°, skewX +18°, blur 14px, opacity 0` to rest (`x0, y0, rotate −12°, skew 0, blur 0, opacity 1`) over u 0.46–0.78, ease `back.out(1.5)`. New character enters from `x +34vw, skewX −14°, blur 10px, opacity 0` to rest over u 0.50–0.82, ease `back.out(1.2)`. Ink video `opacity 0.95→0` over u 0.52–0.84. Speed lines `opacity →0`, `scale →1.5` over u 0.60–0.84. New giant name `y 20vh → 0`, `opacity 0 → 1` over u 0.50–0.80. New info lines slice in (`yPercent 110 → 0`, stagger .04) over u 0.62–0.84. Left-rail ticks update at u 0.50. |
| **0.84 – 1.00 settle** | Hold (idle bob continues). |

**Speed ramp (what makes it feel fast):** the whole window uses `ease:"none"` on the parent; the *out* tweens accelerate (`power3.in`) and the *in* tweens decelerate with overshoot (`back.out`). Add **scroll-velocity skew**: on every ticker frame set `.a-vel` `skewX = clamp(lenis.velocity * 0.02, -5, 5)` degrees via `gsap.quickTo` (duration .4); this adds extra lean when the user scrolls fast. Pointer parallax (desktop only): on `pointermove` over the stage, `.a-mouse` of the sneaker moves `(mx*18px, my*10px)` and rotates `mx*2°`; the character moves `(-mx*10px, -my*6px)`, using `gsap.quickTo` (duration .6, `power3.out`), where `mx,my ∈ [-1,1]` relative to the stage centre.

**Roster beat (swap from the last character, `k = N−1`)**: the same out-choreography for sneaker/character/info/giant-name; then, instead of a new character, the layer `a-bg-layer[N]` (`--ink`) wipes in and `a-roster` appears:
- Title `anime.rosterTitle` (anime font, `clamp(44px,8vw,140px)`, top `12svh`, centred, outlined `-webkit-text-stroke:3px #fff; color:transparent`, filling to solid white over u 0.7–1.0).
- N columns in a flex row: `left:6vw; right:6vw; top:24svh; bottom:9svh; align-items:flex-end; gap:1vw`. Each column `flex:1 1 0`: character image `height:56svh`, the sneaker image overlapping its feet (`width:17vw; margin-top:-8svh`), the display name (anime font, 22px, white) underneath. Centre column scale 1.08, z-index higher. Entrance: columns `y: 30vh → 0`, `opacity 0→1`, stagger .07, `back.out(1.3)`, over u 0.55–1.0 of the swap and the following hold.
- CTA below: `anime.rosterCta` `.btn` (paper bg, ink text), `bottom:4svh`, centred.

**Snapping (custom — NOT ScrollTrigger snap, because it fights Lenis):**
- Active only while the section's pin is active and `0 ≤ p ≤ N` (`p = progress * D`).
- On every Lenis `scroll` event, reset a timer. When no scroll event has occurred for `snapIdleMs` (140 ms desktop, 180 ms touch) and `!lenis.isScrolling`, compute:
  ```
  near = Math.round(p)
  if (Math.abs(p - near) < CFG.anime.snapEps) target = near
  else target = (lenis.direction > 0) ? Math.ceil(p - CFG.anime.snapEps) : Math.floor(p + CFG.anime.snapEps)
  target = clamp(target, 0, N)
  y = st.start + (target / D) * (st.end - st.start)
  lenis.scrollTo(y, { duration: CFG.anime.snapDurS, easing: (t)=> t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2, lock: true })
  ```
- Result: **one flick = one swap**, and the user can never rest in the middle of a swap.

**Idle / settled life:** sneaker and character bob (CSS); `a-halftone` drifts `background-position` by 20 px per second; speed lines at rest `opacity 0`.

**Mobile (<1024px):**
- Character: `right:-6vw; top:calc(var(--header-h)+1svh); height:50svh`. Panel `clip-path: polygon(0 0, 100% 0, 100% 58%, 0 72%)`. Divider hidden.
- Sneaker: centre `(50vw, 64svh)`, `width:92vw`, base rotation −8°.
- Info: `left:6vw; right:6vw; bottom:4svh` (name `clamp(40px,12vw,64px)`; line 16px; CTA full-width, height 52).
- Giant name `font-size:34vw`, top `30svh`. Rail hidden. Swap distances halved (`x ±22vw`). Velocity skew limited to ±3°. No pointer parallax.
- Roster: hide characters, show a 2-column grid of the N sneakers (`width:44vw`) with names; title `clamp(36px,12vw,64px)`; CTA full-width.

### 10.7 DROP / WAITLIST — `id="drop"`, `data-header="dark"`

- `min-height:100svh`; background `--ink`; if `assets.fx.cityNight` exists: a cover background image at opacity .35 (`mix-blend-mode:screen`) with an overlay `linear-gradient(180deg,#0D0B14 0%,rgba(13,11,20,.55) 40%,#0D0B14 100%)`.
- **Desktop 2 columns.** Left `left:6vw; width:46vw`: eyebrow `drop.eyebrow` (paper, 70 %) → countdown: four blocks (DAYS / HRS / MIN / SEC): number in the anime font `clamp(72px,10vw,176px)`, tabular, colour `--paper`; label 12 px tracking .28em; blocks `gap:2vw` → note `drop.note` (Small, 60 % opacity, margin-top 24).
- Right `left:56vw; width:38vw`: a glass card (`background:rgba(255,255,255,.06); border:1px solid var(--line-dark); border-radius:var(--r-lg); padding:40px; backdrop-filter:blur(12px)`): form title (display 800, 44px, paper) → body (16px, 70 %) → form: email input (height 60, radius pill, `background:rgba(255,255,255,.08)`, 1 px `--line-dark` border, padding 0 24px, paper text, placeholder 50 %) and submit button (height 60, radius pill, `background:var(--grad-brand)`, ink text, 700) stacked with 12 px gap → microcopy (12 px, 50 % opacity).
- **Countdown logic:** tick every 1000 ms; when a digit changes, animate that digit `y: 40% → 0`, `opacity 0 → 1` (0.35 s `power3.out`). If `dropDate` is in the past show `drop.liveMessage` (anime font, same size) instead.
- **Form logic:** hidden fields `colorway` and `character` pre-filled from the URL query (`?color=<slug>`, `?character=<slug>`) if present. Honeypot input `bot-field` (visually hidden). Validate email with the browser's `type="email"` + a regex; on error show an inline message under the input (12 px, `#F6BFD3`). **If `drop.demoMode` is `true` (default): do NOT send anything — just show the success state.** If `demoMode` is `false`: `fetch("/", { method:"POST", headers:{ "Content-Type":"application/x-www-form-urlencoded" }, body: new URLSearchParams({ "form-name":"waitlist", ... }).toString() })` and show success on `res.ok`, otherwise an inline error. Success state replaces the form with `drop.success` (display 800, 28px, paper) with a 0.4 s fade/scale-in.
- **Entrance:** on `top 70%` the countdown blocks rise (`y 60→0`, opacity, stagger .08, `expo.out`) and the card rises (`y 80→0`, `opacity 0→1`, 0.9 s).
- **Mobile:** single column, padding `calc(var(--header-h)+6svh) 6vw 10svh`; countdown blocks in one row, numbers `clamp(44px,15vw,72px)`; card padding 24px.

### 10.8 FOOTER — `data-header="dark"`

- `min-height:max(60svh, 520px)`; background `--ink`; paper text; top border 1px `--line-dark`.
- **Giant wordmark:** `brand.name`, display 800, `font-size:min(20vw, 38svh)`, `-webkit-text-stroke:2px var(--paper); color:transparent`, `white-space:nowrap`, positioned so its bottom 12 % is clipped by the section edge (`bottom:-0.12em`), `left:50%; transform:translateX(-50%)`.
- **Content row** (above the wordmark), `padding: 12svh var(--gutter) 0`, 12-column grid:
  - Cols 1–6: `footer.howTitle` (eyebrow style) + the `footer.how` list (Body, 6 items max, each preceded by a 6 px dot in `--lavender`, gap 12).
  - Cols 8–10: links column only if `footer.links` is non-empty (`{label, href}`, Body, underline on hover).
  - Cols 11–12: `footer.credit` and `© <year> · footer.copyright` (Small, 60 % opacity; year via `new Date().getFullYear()`).
- Entrance: content fades up on `top 85%`; wordmark `y: 12vh → 0` scrubbed over the last 100 svh of the page.
- **Mobile:** single column, wordmark `font-size:34vw`.

---

## 11. PAGE LENGTH AND ASSET PLACEMENT

### 11.1 Scroll budget (svh; the QA script asserts the total ±12 %)

| Section | Calculation | svh |
|---|---|---|
| Hero | 100 + 300 pin | 400 |
| Marquee | max(16, 120px) | 16 |
| Anatomy | 100 + beats(4) × 80 | 420 |
| All Angles | fixed | 220 |
| Colorways | 100 + N(6) × 80 | 580 |
| Anime Roster | 100 + (N(5) + 0.6) × 110 | 716 |
| Drop | min | 100 |
| Footer | min | 60 |
| **Total** | | **≈ 2512 svh ≈ 25 screens** |

(Counts follow the real data: with 3 anatomy beats subtract 80; each colourway ±80; each anime character ±110.)

### 11.2 Where every asset is used

| Asset | Where | How it appears |
|---|---|---|
| `hero/desktop|mobile/NNNN.webp` | Hero stage canvas | rotating shoe, idle + scroll-scrubbed 1 turn |
| `base-front34 / side / rear34 / top` | All Angles | parallax images (table in §10.4) |
| `showcase-*` videos + posters | Anatomy video stage | scroll-scrubbed `currentTime`, `multiply` blend |
| `colors/color-NN-*.webp` | Colorways shoe stage | cross-faded, tilt, left side |
| `anime/…-sneaker.webp` | Anime stage left | smear-swap, −12° tilt |
| `anime/…-character.webp` | Anime stage right | smear-swap, sticker outline |
| `fx-ink-dark.mp4` | Anime `a-ink` | `screen`, scrubbed during hit |
| `fx-speedlines.webp` | Anime `a-speed` | `screen`, burst during wind-up/hit |
| `fx-halftone.webp` | Hero overlay (8 %) + Anime left area (22 %) | `multiply` tiles |
| `bg-city-night.webp` | Drop background | 35 %, `screen` |
| `favicon.svg`, `og-image.jpg` | `<head>` | generated / created |

---

## 12. PERFORMANCE, RESPONSIVENESS, ACCESSIBILITY

### 12.1 Performance rules

- Animate only `transform`, `opacity`, `clip-path`, and (briefly, during anime swaps) `filter: blur`. Never animate `width/height/top/left/margin`.
- **Blend modes** (`screen`, `multiply`, `difference`) only blend with elements painted earlier **inside the same stacking context**. Keep every blended layer and the layers it must blend with as siblings inside one container that has no `transform`, `opacity`, `filter` or `isolation` of its own (the Hero background container, the Anatomy video stage, the Anime `.a-stage`, the Drop section). If a blend looks like it is doing nothing, this is the cause.
- `will-change: transform` only on elements that animate continuously (hero canvas wrapper, colour shoe, anime sneaker/character wrappers); remove after intro animations.
- Images: explicit `width`/`height` attributes from the manifest; `decoding="async"`; below-the-fold images lazy-decoded (§9.4).
- The frame player keeps all hero `ImageBitmap`s in memory for the life of the page (do not close them); with 72 frames at 1000 px this is a deliberate memory/smoothness trade-off.
- Videos: `muted`, `playsinline`, never autoplay, scrub only while their section is active.
- Budgets: total transferred before the preloader ends ≤ 9 MB desktop / 5 MB mobile; JS bundle (gzip) ≤ 140 KB.

### 12.2 Responsive

- Breakpoint **1024px**: ≥ desktop layout, < mobile layout. Test widths: 390, 768 (tablet uses the mobile layout), 1024, 1440, 1920.
- No horizontal scrollbar at any width (`document.documentElement.scrollWidth <= innerWidth`).
- At 1920×1080 and above: clamp-capped sizes hold; the page `max-width` is NOT constrained (full-bleed), but text columns keep their `ch` limits.

### 12.3 Accessibility

- Meaningful `alt` text from data (colour/character names); decorative images `alt=""`; videos `aria-hidden="true"`.
- All interactive elements keyboard-reachable with visible focus; swatches are `<button aria-label="Colorway {name}" aria-pressed>`.
- Color contrast: text on each colourway background must meet 4.5:1 (the data values satisfy this; do not change them).

### 12.4 Reduced motion (`prefers-reduced-motion: reduce`)

No Lenis, no pins, no scrub, no marquee loop, no cursor, no idle rotation. Render static, readable layouts: Hero = text + `base-front34` image; Anatomy = 3–4 stacked blocks with the **poster** image + title + body; Angles = a 2-column grid; Colorways = N stacked cards (card background = `bg`, shoe image, name, tagline, specs); Anime = N stacked cards (primary background, character + sneaker, name, line) then the roster row; Drop and Footer unchanged (no digit animation).

---

## 13. PHASE 7 — QA

### 13.1 Build

`npm run build` must pass with zero TypeScript errors and zero Vite warnings about missing assets. Print the `dist` size summary.

### 13.2 `window.__qa` hook (`src/lib/qa.ts`, only if the URL contains `qa=1`)

```ts
window.__qa = {
  scrollTo(y: number): void,        // lenis.scrollTo(y, { immediate: true, force: true }); ScrollTrigger.update()
  checkpoints(): { name: string; y: number }[],  // see below
  expectedScreens(): number          // the total from §11.1 computed from real counts
}
```
`checkpoints()` returns, in order: `hero-0` (0), `hero-33`, `hero-66`, `hero-100` (st.start + fraction × (st.end − st.start)); `marquee` (element top); `anatomy-b1…bN` at the **middle of each beat** (`start + ((i + 0.5)/beats) × (end − start)`); `angles-25`, `angles-50`, `angles-75` (element top + fraction × height); `colors-hold-1…N` at `start + ((k + 0.3)/N) × (end − start)` and `colors-wipe-1…N-1` at `((k + 0.82)/N)`; `anime-hold-1…N` at `start + (k/D) × (end − start)`; `anime-swap-1…N` at `((k + 0.5)/D)` (mid-swap); `anime-roster` at `((N + 0.45)/D)`; `drop`, `footer` (element tops).

### 13.3 Create `scripts/qa.mjs` with exactly this behaviour

```js
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";

const PORT = 4173, URL = `http://localhost:${PORT}/?qa=1`;
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "mobile",  width: 390,  height: 844, mobile: true  },
];
fs.mkdirSync("qa", { recursive: true });

const server = spawn(process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore", shell: process.platform === "win32" });
async function waitForServer() {
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) return; } catch {} await new Promise(r => setTimeout(r, 500)); }
  throw new Error("preview server did not start (run `npm run build` first)");
}

const results = []; let failed = false;
const check = (vp, name, ok, detail = "") => { results.push({ vp, name, ok, detail }); if (!ok) failed = true; };

try {
  await waitForServer();
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: vp.mobile, hasTouch: vp.mobile });
    const page = await ctx.newPage();
    const errors = [], bad = [];
    page.on("pageerror", e => errors.push(String(e)));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    page.on("response", r => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForFunction(() => document.body.classList.contains("is-ready"), null, { timeout: 90000 });
    await page.waitForTimeout(1200);

    const m = await page.evaluate(() => ({
      sh: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth,
      expected: window.__qa.expectedScreens(),
    }));
    const screens = m.sh / m.ih;
    check(vp.name, "page length ≈ expected", Math.abs(screens - m.expected) / m.expected <= 0.12, `${screens.toFixed(1)} screens vs ${m.expected.toFixed(1)}`);
    check(vp.name, "no horizontal overflow", m.sw <= m.iw + 1, `${m.sw} vs ${m.iw}`);

    const cps = await page.evaluate(() => window.__qa.checkpoints());
    let i = 0;
    for (const cp of cps) {
      await page.evaluate(y => window.__qa.scrollTo(y), cp.y);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `qa/${vp.name}-${String(i++).padStart(2, "0")}-${cp.name}.png` });
      const ov = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
      if (!ov) check(vp.name, `overflow at ${cp.name}`, false);
    }
    if (vp.name === "desktop") {   // OG image: hero at scroll 0, 1200x630 crop
      await page.evaluate(() => window.__qa.scrollTo(0));
      await page.waitForTimeout(1200);
      fs.mkdirSync("public", { recursive: true });
      await page.screenshot({ path: "public/og-image.jpg", type: "jpeg", quality: 88, clip: { x: 120, y: 135, width: 1200, height: 630 } });
    }
    check(vp.name, "no console/page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
    check(vp.name, "no failed requests (>=400)", bad.length === 0, bad.slice(0, 3).join(" | "));
    await ctx.close();
  }
  await browser.close();
} finally { server.kill(); }

fs.writeFileSync("qa/report.json", JSON.stringify(results, null, 2));
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  [${r.vp}] ${r.name} ${r.detail}`);
process.exit(failed ? 1 : 0);
```

### 13.4 Run and fix

1. `npm run build` → `npm run qa`. If anything FAILS: fix the cause in the code (not in the QA script), rebuild, re-run. Repeat until all PASS.
2. If you can view images: open the screenshots in `qa/` and compare against the layout in §10 (positions, overlaps, text legibility, no cut-off text, no empty layers, wipes complete). If you cannot view images, say so in the report and rely on the numeric checks.
3. Manual-behaviour checks you must verify by reading your own code (state each as PASS in the report): hero idle rotation resumes at scroll 0; hero returns to idle after scrolling back up; colour swatch click scrolls to the right step; anime snapping uses `lenis.scrollTo` and never ScrollTrigger snap; anime swap is reversible when scrolling up; reduced-motion fallback renders; demo form shows success without network.

### 13.5 Acceptance checklist (every line must be true)

- [ ] Preloader shows progress, exits with the clip-path panel, scroll is locked until then.
- [ ] Hero: shoe floats and rotates at rest; scroll turns it exactly one full turn; text exits left; chips appear; no frame stutter visible.
- [ ] Marquee scrolls; speeds up and reverses with scroll.
- [ ] Anatomy: N beats, video scrubs with scroll, callouts draw in, background tints per beat.
- [ ] All Angles: four images drift at different speeds; labels visible.
- [ ] Colorways: calm circle wipe from behind the shoe, name rolls, text colour inverts, swatches work; **no snapping**.
- [ ] Anime: diagonal layout, sneaker left/character right, **one flick = one swap**, smear + ink + speed lines + flash, giant outlined name, velocity skew, pointer parallax (desktop), roster beat at the end.
- [ ] Colorways and Anime feel clearly different in layout and motion.
- [ ] Drop: countdown ticks; demo form shows success.
- [ ] Footer content and wordmark correct.
- [ ] Mobile (390×844): every section usable, nothing overlapping, no horizontal scroll.
- [ ] Zero console errors; build passes; page length within ±12 % of §11.1.
- [ ] No text outside `site.json`; no unlisted packages; `source/` untouched.

### ⛔ GATE B — STOP HERE

Print: the PASS/FAIL table, the acceptance checklist with ✔/✘, the page length in screens, the bundle sizes, and the list of **placeholder content still in use** (brand name "SOLE SAGA", default taglines/specs, `AUTO` character names, callout coordinates, drop date, `demoMode: true`). Wait for the human to say **"continue"**.

---

## 14. PHASE 8 — NETLIFY PACKAGING (do NOT deploy)

1. `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[headers]]
     for = "/assets/*"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"

   [[headers]]
     for = "/*"
     [headers.values]
       X-Content-Type-Options = "nosniff"
       Referrer-Policy = "strict-origin-when-cross-origin"
   ```
2. Confirm `public/og-image.jpg` exists (created in QA) and that `dist/index.html` contains the hidden `waitlist` form.
3. `git add -A` and make **one** commit: `Initial build: anime sneaker scroll site`. Do not push.
4. Print the two deploy options for the human: (a) drag the `dist` folder into Netlify, (b) push the repo to GitHub and import it in Netlify (build command and publish directory are already in `netlify.toml`; the `source/` folder is git-ignored by design, the processed `public/assets` are committed). Mention that `demoMode` must be set to `false` in `site.json` before collecting real emails.

---

## 15. FINAL REPORT FORMAT (print when everything is done)

1. One-paragraph summary of what was built.
2. How to run: `npm run dev`, `npm run build`, `npm run preview`, `npm run qa`, and `python scripts/process_assets.py --only <group>` to reprocess assets.
3. Where to edit: `src/data/site.json` (all copy/colours/settings), `src/config.ts` (lengths/timings), `source/` + re-run the pipeline (assets).
4. Anything you could not do or had to deviate from (should be empty), and any placeholder content remaining.

---

## APPENDIX A — EASING AND TIMING REFERENCE (use these exact names)

| Use | GSAP ease |
|---|---|
| Intro reveals, entrances | `expo.out` |
| Section transitions (wipes) | `power2.inOut` |
| Anime "out" (accelerate away) | `power3.in` |
| Anime "in" (slam + overshoot) | `back.out(1.5)` (sneaker), `back.out(1.2)` (character) |
| Flash | `power4.out` |
| Scroll-linked parallax | `none` |
| Programmatic scroll (nav, swatch) | `1 - (1 - t)^4` (nav), cubic in-out (anime snap) |
| Scrub smoothing | hero .5 · anatomy .5 · colors .6 · anime .4 |

## APPENDIX B — TROUBLESHOOTING TABLE

| Symptom | Cause | Fix |
|---|---|---|
| Pinned section jumps or has a gap | Layout shifted after images loaded | `ScrollTrigger.refresh()` after preloader and 600 ms later; set explicit `width/height` on images |
| Hero shoe edges shimmer | Per-frame matting differences | Re-run `--only hero --rembg-model birefnet-general` |
| Hero shoe jumps in size | Per-frame crop | Never crop per frame; the pipeline uses one global box |
| Video does not scrub in Safari | Keyframes too sparse | Re-encode with `-g 2` (the pipeline already does) |
| Anime snaps fight scrolling | ScrollTrigger snap used with Lenis | Use the custom Lenis-based snap in §10.6 only |
| White halo around cut-outs | Light fringe from the source | Re-generate that image on a flat contrasting colour and re-run `--only colors,anime` |
| Shoe faces the wrong way | Mirror default wrong for that source | Use `--no-flip-colors` / `--no-flip-anime-sneakers` / `--flip-characters` |
| Mobile hero feels heavy | Too many/large frames | Lower `--hero-mobile-width` to 480 and re-run `--only hero` |
