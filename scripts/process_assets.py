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
    out, s_sheet, c_sheet, f_sheet = [], [], [], []
    for i in ids:
        slug = ch[i][0]
        im_s = cutout(clean_corner(Image.open(sn[i][1])), args.cutout)
        if args.flip_anime_sneakers:
            im_s = ImageOps.mirror(im_s)
        s_canvas = fit_on_canvas(im_s, 1600, 1000, fit=0.86)
        raw_c = Image.open(ch[i][1])
        if "A" in raw_c.getbands():
            # Pre-matted source: keep the provided alpha, skip clean_corner/cutout.
            im_c = raw_c.convert("RGBA")
            log(f"[anime] {i} {slug}: using provided alpha, cut-out skipped")
        else:
            im_c = cutout(clean_corner(raw_c), args.cutout)
        if args.flip_characters:
            im_c = ImageOps.mirror(im_c)
        c_canvas = fit_on_canvas(im_c, 1200, 1600, fit=0.96, anchor="bottom", bottom_margin=0.02)
        d_s = OUT / "anime" / f"anime-{i}-{slug}-sneaker.webp"
        d_c = OUT / "anime" / f"anime-{i}-{slug}-character.webp"
        save_webp(s_canvas, d_s, 86)
        save_webp(c_canvas, d_c, 86)
        # Face thumbnail for roster medallions + rail minis: top-centered square
        # of the character canvas (heads live at the top; full-canvas cover
        # crops kept torsos and cut faces — AUDIT follow-up).
        face_box = (200, 0, 1000, 800)
        face = c_canvas.crop(face_box).resize((512, 512), Image.LANCZOS)
        d_f = OUT / "anime" / f"anime-{i}-{slug}-face.webp"
        save_webp(face, d_f, 82)
        pal = extract_palette(c_canvas) or extract_palette(s_canvas)
        out.append({"id": i, "slug": slug, "sneaker": web(d_s), "character": web(d_c),
                    "face": web(d_f),
                    "sneakerSize": [1600, 1000], "characterSize": [1200, 1600], "palette": pal})
        s_sheet.append(s_canvas)
        c_sheet.append(c_canvas)
        f_sheet.append(face)
        log(f"[anime] {i} {slug}: sneaker {kb(d_s):.0f} KB, character {kb(d_c):.0f} KB, face {kb(d_f):.0f} KB, palette {pal}")
    contact_sheet(s_sheet, QA / "anime-sneakers-contact.png", cell=420, cols=3)
    contact_sheet(c_sheet, QA / "anime-characters-contact.png", cell=420, cols=3)
    contact_sheet(f_sheet, QA / "anime-faces-contact.png", cell=420, cols=3)
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
