import siteRaw from "../data/site.json";
import assetsRaw from "../data/assets.generated.json";

// Raw manifest shapes (what scripts/process_assets.py writes)
interface FrameSet {
  dir: string;
  w: number;
  h: number;
  kb: number;
}

interface HeroManifest {
  count: number;
  desktop: FrameSet;
  mobile: FrameSet;
  flickerSuspects: number[];
}

interface StillManifest {
  src: string;
  w: number;
  h: number;
}

interface ClipManifest {
  src: string;
  poster: string;
  w: number;
  h: number;
  duration: number;
}

export interface Palette {
  primary: string;
  deep: string;
  accent: string;
  text: string;
}

interface ColorAsset {
  id: string;
  slug: string;
  src: string;
  w: number;
  h: number;
}

interface AnimeAsset {
  id: string;
  slug: string;
  sneaker: string;
  character: string;
  sneakerSize: [number, number];
  characterSize: [number, number];
  palette: Palette | null;
}

interface FxManifest {
  inkDark: { src: string; duration: number };
  speedlines: StillManifest;
  halftone: StillManifest;
  cityNight?: StillManifest;
}

interface AssetsManifest {
  hero: HeroManifest;
  base: Record<string, StillManifest>;
  showcase: Record<string, ClipManifest>;
  colors: ColorAsset[];
  anime: AnimeAsset[];
  fx: FxManifest;
}

const assets = assetsRaw as unknown as AssetsManifest;

// Resolved site shapes (data + assets combined)
export interface Chip {
  label: string;
  x: number;
  y: number;
}

export interface Callout {
  label: string;
  dot: [number, number];
  at: [number, number];
}

export interface Beat {
  clip: string;
  title: string;
  body: string;
  bg: string;
  callouts: Callout[];
  src: string;
  poster: string;
  duration: number;
}

export interface ColorItem {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  text: string;
  specs: string[];
  slug: string;
  src: string;
}

export interface AnimeItem {
  id: string;
  name: string;
  epithet: string;
  line: string;
  theme: Palette;
  slug: string;
  sneaker: string;
  character: string;
}

interface RawBeat {
  clip: string;
  title: string;
  body: string;
  bg: string;
  callouts: { label: string; dot: [number, number]; at: [number, number] }[];
}

interface RawColor {
  id: string;
  name: string;
  tagline: string;
  bg: string;
  text: string;
  specs: string[];
}

interface RawAnime {
  id: string;
  name: string;
  epithet: string;
  line: string;
  theme: string | Palette;
}

function displayName(raw: string, slug: string): string {
  if (raw !== "AUTO") return raw;
  return slug.replace(/-/g, " ").toUpperCase();
}

function resolveTheme(raw: string | Palette, asset: AnimeAsset): Palette {
  if (typeof raw === "object") return raw;
  if (asset.palette) return asset.palette;
  console.error(`[data] anime id ${asset.id} has theme "auto" but no palette in manifest; using fallback`);
  return { primary: "#C9B8F5", deep: "#2A2140", accent: "#F6BFD3", text: "#FFFFFF" };
}

function buildBeats(rawBeats: RawBeat[]): Beat[] {
  const out: Beat[] = [];
  for (const b of rawBeats) {
    const clip = assets.showcase[b.clip];
    if (!clip) {
      console.error(`[data] anatomy beat clip "${b.clip}" has no asset; skipping beat`);
      continue;
    }
    out.push({ ...b, src: clip.src, poster: clip.poster, duration: clip.duration });
  }
  return out;
}

function buildColors(rawColors: RawColor[]): ColorItem[] {
  const byId = new Map(assets.colors.map((c) => [c.id, c]));
  const out: ColorItem[] = [];
  for (const c of rawColors) {
    const a = byId.get(c.id);
    if (!a) {
      console.error(`[data] color id ${c.id} has no asset; skipping`);
      continue;
    }
    out.push({ ...c, slug: a.slug, src: a.src });
  }
  for (const a of assets.colors) {
    if (!rawColors.some((c) => c.id === a.id)) {
      console.error(`[data] color asset id ${a.id} has no site.json item; skipping`);
    }
  }
  return out.sort((x, y) => (x.id < y.id ? -1 : 1));
}

function buildAnime(rawItems: RawAnime[]): AnimeItem[] {
  const byId = new Map(assets.anime.map((a) => [a.id, a]));
  const out: AnimeItem[] = [];
  for (const r of rawItems) {
    const a = byId.get(r.id);
    if (!a) {
      console.error(`[data] anime id ${r.id} has no asset pair; skipping`);
      continue;
    }
    out.push({
      id: r.id,
      name: displayName(r.name, a.slug),
      epithet: r.epithet,
      line: r.line,
      theme: resolveTheme(r.theme, a),
      slug: a.slug,
      sneaker: a.sneaker,
      character: a.character,
    });
  }
  for (const a of assets.anime) {
    if (!rawItems.some((r) => r.id === a.id)) {
      console.error(`[data] anime asset id ${a.id} has no site.json item; skipping`);
    }
  }
  return out.sort((x, y) => (x.id < y.id ? -1 : 1));
}

export interface Site {
  meta: { title: string; description: string; themeColor: string; lang: string };
  brand: { name: string; short: string; tagline: string };
  nav: { label: string; href: string }[];
  cta: { label: string; href: string };
  hero: {
    eyebrow: string;
    line1: string;
    line2: string;
    sub: string;
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
    bgWord: string;
    scrollHint: string;
    chips: Chip[];
  };
  marquee: { items: string[]; separator: string };
  anatomy: { eyebrow: string; beats: Beat[] };
  angles: {
    eyebrow: string;
    title: string;
    bgWord: string;
    labels: Record<string, string>;
  };
  colors: { eyebrow: string; cta: string; items: ColorItem[] };
  anime: { eyebrow: string; cta: string; rosterTitle: string; rosterCta: string; items: AnimeItem[] };
  drop: {
    eyebrow: string;
    dropDate: string;
    liveMessage: string;
    note: string;
    formTitle: string;
    formBody: string;
    placeholder: string;
    button: string;
    success: string;
    microcopy: string;
    demoMode: boolean;
    labels: { days: string; hours: string; minutes: string; seconds: string };
  };
  footer: {
    howTitle: string;
    how: string[];
    links: { label: string; href: string }[];
    credit: string;
    copyright: string;
  };
  assets: AssetsManifest;
}

type SiteRaw = Omit<Site, "marquee" | "anatomy" | "colors" | "anime" | "assets"> & {
  marquee: { items: string[]; separator: string; autoExtra: string[] };
  anatomy: { eyebrow: string; beats: RawBeat[] };
  colors: { eyebrow: string; cta: string; items: RawColor[] };
  anime: { eyebrow: string; cta: string; rosterTitle: string; rosterCta: string; items: RawAnime[] };
};

const raw = siteRaw as unknown as SiteRaw;

const colors = buildColors(raw.colors.items);
const anime = buildAnime(raw.anime.items);

const marqueeItems: string[] =
  raw.marquee.items.length > 0
    ? raw.marquee.items
    : [...colors.map((c) => c.name), ...anime.map((a) => a.name), ...raw.marquee.autoExtra];

export const site: Site = {
  meta: raw.meta,
  brand: raw.brand,
  nav: raw.nav,
  cta: raw.cta,
  hero: raw.hero,
  marquee: { items: marqueeItems, separator: raw.marquee.separator },
  anatomy: { eyebrow: raw.anatomy.eyebrow, beats: buildBeats(raw.anatomy.beats) },
  angles: raw.angles,
  colors: { eyebrow: raw.colors.eyebrow, cta: raw.colors.cta, items: colors },
  anime: {
    eyebrow: raw.anime.eyebrow,
    cta: raw.anime.cta,
    rosterTitle: raw.anime.rosterTitle,
    rosterCta: raw.anime.rosterCta,
    items: anime,
  },
  drop: raw.drop,
  footer: raw.footer,
  assets,
};
