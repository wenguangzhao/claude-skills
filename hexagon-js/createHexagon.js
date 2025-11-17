(() => {
  // Config (Tailwind utility classes; light-mode friendly)
  const CONFIG = {
    hexSize: 40,
    containerBgClass: "bg-white", // brighter light background
    staticFillClass: "fill-slate-100", // static polygon fill
    strokeClass: "stroke-slate-400/30", // subtle stroke
    fastHoverMs: 120,
    slowReturnMs: 1500,
    paletteFillClasses: [
      "fill-blue-500",
      "fill-purple-500",
      "fill-pink-500",
      "fill-rose-500",
      "fill-orange-500",
      "fill-amber-500",
      "fill-yellow-500",
      "fill-lime-500",
      "fill-green-500",
      "fill-emerald-500",
      "fill-teal-500",
      "fill-cyan-500",
      "fill-sky-500",
      "fill-indigo-500",
      "fill-violet-500",
    ],
  };

  // Derived measurements
  const HEX_W = Math.round((CONFIG.hexSize * Math.sqrt(3)) / 2) * 2;
  const HEX_H = CONFIG.hexSize * 2;
  const VERTICAL_SPACING = HEX_H * 0.75;

  // Ensure Tailwind CDN is present (load in JS, not HTML)
  let _twPromise;
  function ensureTailwind() {
    if (_twPromise) return _twPromise;
    const CDN_SRC = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";
    _twPromise = new Promise((resolve, reject) => {
      // Already loaded
      if (window.tailwind) return resolve();
      // Existing tag present but maybe still loading
      const existing = document.querySelector("script[data-tailwind-cdn]");
      // Inject config with safelist for dynamic classes
      const hasCfg = document.querySelector(
        "script[data-hexagon-tailwind-config]"
      );
      if (!hasCfg) {
        const cfgScript = document.createElement("script");
        cfgScript.dataset.hexagonTailwindConfig = "true";
        const safelist = [
          "transition-colors",
          "ease-out",
          "ease-in",
          "duration-150",
          "duration-[1500ms]",
          "fixed",
          "inset-0",
          "overflow-hidden",
          "pointer-events-none",
          "flex",
          "z-0",
          CONFIG.containerBgClass,
          CONFIG.staticFillClass,
          CONFIG.strokeClass,
          ...CONFIG.paletteFillClasses,
        ];
        cfgScript.text = `window.tailwind = window.tailwind || {}; window.tailwind.config = Object.assign({}, window.tailwind.config || {}, { safelist: Array.from(new Set((window.tailwind.config && window.tailwind.config.safelist) ? window.tailwind.config.safelist.concat(${JSON.stringify(
          safelist
        )}) : ${JSON.stringify(safelist)})) });`;
        document.head.appendChild(cfgScript);
      }
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", (e) => reject(e), { once: true });
        return;
      }
      // Inject new tag
      const s = document.createElement("script");
      s.src = CDN_SRC;
      s.async = true;
      s.dataset.tailwindCdn = "true";
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
    return _twPromise;
  }

  function getMarginBySize(size) {
    const height = size * 2;
    const overlapRatio = 0.25;
    return -(height * overlapRatio);
  }

  function createHexagon(size, staticFillClass, hoverFillClass) {
    const width = Math.round((size * Math.sqrt(3)) / 2) * 2;
    const height = size * 2;
    const points = `${width / 2},0 ${width},${height * 0.25} ${width},${
      height * 0.75
    } ${width / 2},${height} 0,${height * 0.75} 0,${height * 0.25}`;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.classList.add("pointer-events-none");

    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    polygon.setAttribute("points", points);
    polygon.setAttribute("stroke-width", "1");
    polygon.classList.add(
      CONFIG.strokeClass,
      staticFillClass,
      "transition-colors",
      "duration-[1500ms]",
      "ease-out"
    );
    // Allow hover over the polygon without blocking the page
    polygon.style.pointerEvents = "fill";

    polygon.addEventListener("mouseenter", () => {
      polygon.classList.remove(staticFillClass, "duration-[1500ms]", "ease-in");
      polygon.classList.add(hoverFillClass, "duration-150", "ease-out");
    });

    polygon.addEventListener("mouseleave", () => {
      polygon.classList.remove(hoverFillClass, "duration-150", "ease-out");
      polygon.classList.add(staticFillClass, "duration-[1500ms]", "ease-in");
    });

    svg.appendChild(polygon);
    return svg;
  }

  function createHexagonRow(cols, isEven, staticFillClass, hoverFillClass) {
    const margin = getMarginBySize(CONFIG.hexSize);
    const row = document.createElement("div");
    row.className = "flex";
    row.style.transform = `translateX(${isEven ? -HEX_W / 2 : 0}px)`;
    row.style.marginTop = `${margin}px`;

    const count = isEven ? cols + 1 : cols;
    for (let i = 0; i < count; i++) {
      const wrap = document.createElement("div");
      const hex = createHexagon(
        CONFIG.hexSize,
        staticFillClass,
        hoverFillClass
      );
      wrap.appendChild(hex);
      row.appendChild(wrap);
    }
    return row;
  }

  function getOrCreateContainer() {
    let container = document.getElementById("bg-container");

    if (!container) {
      const root = document.getElementById("root");
      container = document.createElement("div");
      container.id = "bg-container";
      // Prefer attaching under #root if present; otherwise fall back to body
      if (root) {
        root.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }

    // Normalize container styling via Tailwind classes
    container.className = `fixed inset-0 overflow-hidden pointer-events-none ${CONFIG.containerBgClass} z-0`;
    return container;
  }

  function render() {
    const container = getOrCreateContainer();
    container.innerHTML = "";

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cols = Math.ceil(viewportWidth / HEX_W) + 2;
    const rows = Math.ceil(viewportHeight / VERTICAL_SPACING) + 1;

    for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
      const hoverClass =
        CONFIG.paletteFillClasses[rowIndex % CONFIG.paletteFillClasses.length];
      const row = createHexagonRow(
        cols,
        rowIndex % 2 === 1,
        CONFIG.staticFillClass,
        hoverClass
      );
      container.appendChild(row);
    }
  }

  async function init() {
    // Load Tailwind first so utility classes render correctly
    try {
      await ensureTailwind();
    } catch (e) {
      /* continue without Tailwind */
    }
    // Keep page from scrolling due to large fixed background
    document.body.classList.add("overflow-hidden");
    render();
    // Keep background in sync with viewport
    window.addEventListener("resize", render);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  // Expose a manual trigger for hosts that want control
  window.createHexagonBackground = render;
})();
