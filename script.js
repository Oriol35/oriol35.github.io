const root = document.documentElement;
const rail = document.querySelector(".worlds");
const worlds = [...document.querySelectorAll(".world")];
const tabs = [...document.querySelectorAll(".tab")];
const arrows = [...document.querySelectorAll(".arrow")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const contactSection = document.querySelector(".contact-section");
const pulseCooldown = 3000;

let current = -1;
let moving = false;
let movingTimer;
let lastPulse = -pulseCooldown;
let pulseWatch;

function indexOf(hash) {
  return worlds.findIndex((world) => `#${world.id}` === hash);
}

function setCurrent(index) {
  if (index === current) return;
  current = index;

  root.dataset.world = worlds[index].dataset.world;
  tabs.forEach((tab, i) => {
    if (i === index) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  arrows.forEach((arrow) => {
    const target = index + Number(arrow.dataset.step);
    arrow.disabled = target < 0 || target >= worlds.length;
  });
}

function goTo(index, behavior = reducedMotion.matches ? "auto" : "smooth") {
  if (index < 0 || index >= worlds.length) return;
  moving = true;
  clearTimeout(movingTimer);
  movingTimer = setTimeout(() => { moving = false; }, 1000);
  rail.scrollTo({ left: index * rail.clientWidth, behavior });
  history.replaceState(null, "", `#${worlds[index].id}`);
  setCurrent(index);
  worlds[index].focus({ preventScroll: true });
}

function syncCurrent() {
  const index = Math.min(Math.round(rail.scrollLeft / rail.clientWidth), worlds.length - 1);
  if (index === current) return;
  history.replaceState(null, "", `#${worlds[index].id}`);
  setCurrent(index);
}

rail.addEventListener("scroll", () => {
  if (!moving) syncCurrent();
}, { passive: true });

rail.addEventListener("scrollend", () => {
  moving = false;
  syncCurrent();
});

document.querySelectorAll(".brand, .tab").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    goTo(indexOf(link.getAttribute("href")));
  });
});

arrows.forEach((arrow) => {
  arrow.addEventListener("click", () => goTo(current + Number(arrow.dataset.step)));
});

document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    goTo(current + (event.key === "ArrowLeft" ? -1 : 1));
  }
  if (["1", "2", "3"].includes(event.key)) goTo(Number(event.key) - 1);
  if (!/^[a-z]$/i.test(event.key)) return;

  const selector = `[data-key="${event.key.toLowerCase()}"]`;
  const target = worlds[current].querySelector(selector) ?? document.querySelector(selector);
  if (!target) return;
  if (target.getAttribute("href")?.startsWith("#")) goTo(worlds.indexOf(target.closest(".world")));
  target.click();
});

function pulseContact() {
  const now = performance.now();
  if (now - lastPulse < pulseCooldown) return;
  lastPulse = now;

  pulseWatch?.disconnect();
  pulseWatch = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    pulseWatch.disconnect();
    contactSection.classList.add("pulse");
  }, { threshold: 0.5 });
  pulseWatch.observe(contactSection);
}

document.querySelector('[data-key="t"]').addEventListener("click", (event) => {
  event.preventDefault();
  const world = contactSection.closest(".world");
  const top = contactSection.getBoundingClientRect().top - world.getBoundingClientRect().top;
  world.scrollTo({ top: world.scrollTop + top });
  pulseContact();
});

contactSection.addEventListener("animationend", () => {
  contactSection.classList.remove("pulse");
});

addEventListener("resize", () => {
  rail.scrollTo({ left: current * rail.clientWidth, behavior: "auto" });
});

new ResizeObserver(([entry]) => {
  const height = entry.borderBoxSize[0].blockSize;
  root.style.setProperty("--education-height", `${height}px`);
}).observe(document.querySelector(".education"), { box: "border-box" });

const start = Math.max(indexOf(location.hash), 0);
rail.scrollTo({ left: start * rail.clientWidth, behavior: "auto" });
setCurrent(start);
