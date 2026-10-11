// Preloading: critical set (fonts + hero frames) blocks the preloader;
// everything else queues idle or upgrades on approach.
export type Frame = ImageBitmap | HTMLImageElement;

function idle(cb: () => void): void {
  const w = window as unknown as { requestIdleCallback?: (c: () => void) => number };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(cb);
  else window.setTimeout(cb, 200);
}

async function decodeBlob(blob: Blob): Promise<Frame> {
  try {
    return await createImageBitmap(blob);
  } catch {
    // Hidden tabs / some webviews reject createImageBitmap; <img> decodes everywhere.
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("frame decode failed"));
      img.src = url;
    });
    return img;
  }
}

export function loadFonts(onOne: () => void): Promise<void> {
  const asks: [string, string][] = [
    ["800", '"Bricolage Grotesque Variable"'],
    ["400", '"Anton"'],
    ["400", '"DM Sans Variable"'],
  ];
  return Promise.all(
    asks.map(([weight, family]) =>
      document.fonts
        .load(`${weight} 1em ${family}`)
        .then(() => onOne())
        .catch(() => onOne()),
    ),
  ).then(() => undefined);
}

function frameOrder(count: number): number[] {
  const order = [0];
  for (let i = 6; i < count; i += 6) order.push(i);
  for (let i = 1; i < count; i++) {
    if (i % 6 !== 0) order.push(i);
  }
  return order;
}

export async function loadHeroFrames(
  dir: string,
  count: number,
  onOne: () => void,
): Promise<{ frames: Frame[]; loaded: number }> {
  const frames: (Frame | null)[] = new Array(count).fill(null);
  const queue = frameOrder(count);
  const pad = (i: number): string => `${dir}${String(i + 1).padStart(4, "0")}.webp`;

  async function job(i: number): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(pad(i));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        frames[i] = await decodeBlob(await res.blob());
        onOne();
        return;
      } catch {
        if (attempt === 1) onOne();
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let w = 0; w < 8; w++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (next === undefined) return;
          await job(next);
        }
      })(),
    );
  }
  await Promise.all(workers);

  // Replace failures with the nearest loaded neighbour.
  let loaded = 0;
  for (let i = 0; i < count; i++) {
    if (frames[i]) {
      loaded++;
      continue;
    }
    for (let d = 1; d < count; d++) {
      const a = frames[i - d];
      const b = frames[i + d];
      if (a) {
        frames[i] = a;
        break;
      }
      if (b) {
        frames[i] = b;
        break;
      }
    }
  }
  return { frames: frames as Frame[], loaded };
}

// Idle set: decoded with img.decode(), never blocks.
export function queueIdle(srcs: string[]): void {
  idle(() => {
    for (const src of srcs) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      img.decode().catch(() => undefined);
    }
  });
}

// Videos start preload="metadata"; upgrade once when the section nears the viewport.
export function watchLazyVideos(scope: ParentNode): void {
  const videos = Array.from(scope.querySelectorAll("video[data-lazy]")) as HTMLVideoElement[];
  if (videos.length === 0) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const v = e.target as HTMLVideoElement;
        io.unobserve(v);
        v.preload = "auto";
        v.load();
      }
    },
    { rootMargin: "100% 0px 100% 0px" },
  );
  for (const v of videos) io.observe(v);
}
