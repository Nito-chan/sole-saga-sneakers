import { el } from "../lib/dom";
import type { Ctx } from "../lib/engine";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function initDrop(ctx: Ctx): void {
  const { site, gsap } = ctx;
  const drop = site.drop;
  const app = document.getElementById("app");
  if (!app) return;

  const section = el("section", "");
  section.id = "drop";
  section.dataset.header = "dark";

  if (site.assets.fx.cityNight) {
    const bg = el("img", "drop-bg");
    bg.setAttribute("src", site.assets.fx.cityNight.src);
    bg.setAttribute("alt", "");
    bg.setAttribute("aria-hidden", "true");
    bg.setAttribute("decoding", "async");
    section.appendChild(bg);
    section.appendChild(el("div", "drop-veil"));
  }

  const left = el("div", "drop-left");
  left.appendChild(el("p", "t-eyebrow drop-eyebrow", drop.eyebrow));
  const countdown = el("div", "drop-countdown");
  const digits: Record<string, HTMLElement> = {};
  for (const key of ["days", "hours", "minutes", "seconds"] as const) {
    const block = el("div", "drop-block");
    const num = el("div", "drop-num", "00");
    const lab = el("div", "drop-label", drop.labels[key]);
    block.append(num, lab);
    countdown.appendChild(block);
    digits[key] = num;
  }
  left.append(countdown, el("p", "t-small drop-note", drop.note));

  const right = el("div", "drop-right");
  const card = el("div", "drop-card");
  card.append(
    el("h2", "drop-form-title", drop.formTitle),
    el("p", "drop-form-body", drop.formBody),
  );
  const form = el("form", "drop-form") as HTMLFormElement;
  form.setAttribute("novalidate", "");
  form.setAttribute("aria-label", "Join the waitlist form");
  const params = new URLSearchParams(window.location.search);
  const hiddenColor = el("input", "") as HTMLInputElement;
  hiddenColor.type = "hidden";
  hiddenColor.name = "colorway";
  hiddenColor.value = params.get("color") ?? "";
  const hiddenChar = el("input", "") as HTMLInputElement;
  hiddenChar.type = "hidden";
  hiddenChar.name = "character";
  hiddenChar.value = params.get("character") ?? "";
  const honey = el("input", "drop-honey") as HTMLInputElement;
  honey.type = "text";
  honey.name = "bot-field";
  honey.tabIndex = -1;
  honey.setAttribute("aria-hidden", "true");
  honey.autocomplete = "off";
  const email = el("input", "drop-email") as HTMLInputElement;
  email.type = "email";
  email.name = "email";
  email.placeholder = drop.placeholder;
  email.required = true;
  email.setAttribute("aria-label", drop.placeholder);
  const submit = el("button", "drop-submit", drop.button) as HTMLButtonElement;
  submit.type = "submit";
  const err = el("p", "drop-error", "");
  err.setAttribute("role", "alert");
  form.append(hiddenColor, hiddenChar, honey, email, submit, err);
  card.append(form, el("p", "drop-micro", drop.microcopy));
  right.appendChild(card);

  section.append(left, right);
  app.appendChild(section);

  // Countdown.
  const target = new Date(drop.dropDate).getTime();
  const setDigit = (key: string, value: string): void => {
    const node = digits[key];
    if (node.textContent === value) return;
    node.textContent = value;
    if (!ctx.prefersReduced) {
      gsap.fromTo(
        node,
        { y: "40%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 0.35, ease: "power3.out" },
      );
    }
  };
  const tick = (): void => {
    const leftMs = target - Date.now();
    if (leftMs <= 0) {
      countdown.textContent = "";
      countdown.appendChild(el("div", "drop-live", drop.liveMessage));
      return;
    }
    const s = Math.floor(leftMs / 1000);
    setDigit("days", pad2(Math.floor(s / 86400)));
    setDigit("hours", pad2(Math.floor((s % 86400) / 3600)));
    setDigit("minutes", pad2(Math.floor((s % 3600) / 60)));
    setDigit("seconds", pad2(s % 60));
    window.setTimeout(tick, 1000);
  };
  tick();

  // Form.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (honey.value) return; // honeypot
    const value = email.value.trim();
    if (!EMAIL_RE.test(value)) {
      err.textContent = "Enter a valid email address.";
      email.focus();
      return;
    }
    err.textContent = "";
    const done = (): void => {
      const ok = el("div", "drop-success", drop.success);
      form.replaceWith(ok);
      if (!ctx.prefersReduced) {
        gsap.fromTo(ok, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.4 });
      }
    };
    if (drop.demoMode) {
      done();
      return;
    }
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "form-name": "waitlist",
        email: value,
        colorway: hiddenColor.value,
        character: hiddenChar.value,
      }).toString(),
    })
      .then((res) => {
        if (res.ok) done();
        else err.textContent = "Something went wrong. Try again.";
      })
      .catch(() => {
        err.textContent = "Something went wrong. Try again.";
      });
  });

  if (!ctx.prefersReduced) {
    gsap.from("#drop .drop-block", {
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: section, start: "top 70%" },
    });
    gsap.from("#drop .drop-card", {
      y: 80,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      scrollTrigger: { trigger: section, start: "top 70%" },
    });
  }
}
