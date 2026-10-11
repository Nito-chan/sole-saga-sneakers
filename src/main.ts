import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/anton";
import "@fontsource-variable/dm-sans";
import "lenis/dist/lenis.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/sections.css";

import { ctx } from "./lib/engine";
import { queueIdle, watchLazyVideos } from "./lib/preload";
import { initPreloader } from "./sections/preloader";
import { initHero } from "./sections/hero";
import { initMarquee } from "./sections/marquee";
import { initAnatomy } from "./sections/anatomy";
import { initAngles } from "./sections/angles";
import { initColors } from "./sections/colors";
import { initAnime } from "./sections/anime";
import { initDrop } from "./sections/drop";
import { initFooter } from "./sections/footer";
import { initHeader } from "./sections/header";
import { initCursor } from "./sections/cursor";
import { initQa } from "./lib/qa";

const ready = initPreloader(ctx);

initHero(ctx);
initMarquee(ctx);
initAnatomy(ctx);
initAngles(ctx);
initColors(ctx);
initAnime(ctx);
initDrop(ctx);
initFooter(ctx);
initHeader(ctx);
initCursor(ctx);
initQa(ctx);

queueIdle([
  ...ctx.site.colors.items.map((c) => c.src),
  ...ctx.site.anime.items.flatMap((a) => [a.sneaker, a.character]),
  ctx.site.assets.base.front34.src,
  ctx.site.assets.base.rear34.src,
  ctx.site.assets.base.side.src,
  ctx.site.assets.base.top.src,
  ctx.site.assets.fx.speedlines.src,
  ctx.site.assets.fx.halftone.src,
  ...(ctx.site.assets.fx.cityNight ? [ctx.site.assets.fx.cityNight.src] : []),
]);
watchLazyVideos(document);

await ready;
