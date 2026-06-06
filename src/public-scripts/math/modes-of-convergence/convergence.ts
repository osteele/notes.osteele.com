"use strict";

type PageWindow = Window &
  typeof globalThis & {
    renderMathInElement?: (element: Element | null, options: unknown) => void;
    __convScrubber?: {
      selectPreset: (key: string) => void;
    };
    __convPreset?: string;
  };

const pageWindow = window as PageWindow;

// ---- Palette & primitives -------------------------------------------------

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  red: "#b8412a",
  blue: "#1f4a8c",
  green: "#2d7a3e",
  orange: "#d4690a",
  purple: "#6b4592",
  gray: "#bfb9aa",
};

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width"), 10);
  const intrinsicH = parseInt(canvas.getAttribute("height"), 10);
  canvas.style.width = "100%";
  canvas.style.height = `${(canvas.getBoundingClientRect().width * intrinsicH) / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

function seeded(seed) {
  let s = seed | 0;
  return () => {
    s = (1664525 * s + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

function clear(ctx, w, h) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}

function plotBox(ctx, x, y, w, h) {
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function label(ctx, text, x, y, color = C.textDim, align = "left", baseline = "top") {
  ctx.fillStyle = color;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function readoutRows(id, rows) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = rows
    .map(([a, b]) => `<div class="row"><span class="lbl">${a}</span><span>${b}</span></div>`)
    .join("");
}

// ---- Samplers -------------------------------------------------------------

function gaussianSample(random) {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function cauchySample(random) {
  return Math.tan(Math.PI * (random() - 0.5));
}

function bernoulliSample(random, p) {
  return random() < p ? 1 : 0;
}

// ---- Presets --------------------------------------------------------------
//
// A preset defines:
//   limit:       the limit X (single number, same across all paths)
//   maxN:        upper bound for the scrub slider
//   makePath(omega, maxN, random): returns Float64Array of X_n values for n = 1..maxN.
//                The argument `omega` is a deterministic seed (for path-based
//                presets such as Typewriter/Spike) and `random` is a freshly
//                seeded PRNG for path-internal randomness (LLN, Cauchy).
//   yRange:      [yMin, yMax] for the canvas
//   blurb:       sentence under the figure
//   modes:       which modes converge (for the readout labels)

const PRESETS = {
  lln: {
    name: "LLN",
    limit: 0.5,
    maxN: 256,
    yRange: [-0.05, 1.05],
    blurb:
      "Running mean of iid $\\mathrm{Bernoulli}(1/2)$. Converges almost surely, in probability, and in $L^p$ to the mean $1/2$. The textbook convergent case.",
    modes: { as: true, prob: true, Lp: true, dist: true },
    makePath(omega, maxN, random) {
      const out = new Float64Array(maxN);
      let sum = 0;
      for (let n = 1; n <= maxN; n++) {
        sum += bernoulliSample(random, 0.5);
        out[n - 1] = sum / n;
      }
      return out;
    },
  },
  typewriter: {
    name: "Typewriter",
    limit: 0,
    maxN: 256,
    yRange: [-0.15, 1.15],
    blurb:
      "Sliding indicators of dyadic intervals on $[0,1]$. For each $\\omega$, the bump revisits infinitely often, so $X_n(\\omega) \\not\\to 0$ for any $\\omega$ — but the interval shrinks, so $\\mathbb{P}(X_n=1) = 2^{-k} \\to 0$. In probability and $L^p$, not almost surely.",
    modes: { as: false, prob: true, Lp: true, dist: true },
    makePath(omega, maxN, _random) {
      const out = new Float64Array(maxN);
      for (let n = 1; n <= maxN; n++) {
        // Re-index: n in 1..maxN maps to (k, j) with 2^k + j, j ∈ [0, 2^k).
        // The n-th sliding interval has length 2^{-k} starting at j·2^{-k}.
        const k = Math.floor(Math.log2(n + 1));
        const j = n + 1 - (1 << k);
        const width = 1 / (1 << k);
        const lo = j * width;
        const hi = lo + width;
        out[n - 1] = omega >= lo && omega < hi ? 1 : 0;
      }
      return out;
    },
  },
  spike: {
    name: "Spike",
    limit: 0,
    maxN: 64,
    yRange: [-2, 18],
    blurb:
      "$X_n(\\omega) = n \\cdot \\mathbf{1}_{[0,1/n]}(\\omega)$. For every $\\omega > 0$, $X_n(\\omega) \\to 0$ — converges a.s. and in probability. But $\\mathbb{E} X_n = 1$ for every $n$, so it fails in $L^1$.",
    modes: { as: true, prob: true, Lp: false, dist: true },
    makePath(omega, maxN, _random) {
      const out = new Float64Array(maxN);
      for (let n = 1; n <= maxN; n++) {
        out[n - 1] = omega < 1 / n ? n : 0;
      }
      return out;
    },
  },
  signflip: {
    name: "Sign flip",
    limit: 0, // We use limit = 0 nominally; the "in dist" readout uses the true limit X.
    maxN: 64,
    yRange: [-1.6, 1.6],
    blurb:
      "$X_n = (-1)^n X$ with $X$ a fair $\\pm 1$. Every $X_n$ has the same distribution as $X$, so $X_n \\overset{d}{\\to} X$ trivially. But $|X_n - X| \\in \\{0, 2\\}$, so $X_n$ does not converge in probability.",
    modes: { as: false, prob: false, Lp: false, dist: true },
    makePath(omega, maxN, _random) {
      const out = new Float64Array(maxN);
      const x = omega < 0.5 ? -1 : 1;
      for (let n = 1; n <= maxN; n++) {
        out[n - 1] = (n % 2 === 0 ? 1 : -1) * x;
      }
      return out;
    },
    pathLimit(omega) {
      return omega < 0.5 ? -1 : 1;
    },
  },
  cauchy: {
    name: "Cauchy mean",
    limit: 0,
    maxN: 256,
    yRange: [-6, 6],
    blurb:
      "Running mean of iid $\\mathrm{Cauchy}(0,1)$. The mean of $n$ iid Cauchy is itself Cauchy with the same scale — no concentration. The LLN fails; Chebyshev cannot help because $\\mathrm{Var} = \\infty$.",
    // X_n stays Cauchy(0,1) for all n — its law never approaches the point
    // mass at the nominal limit 0, so it fails in distribution too.
    modes: { as: false, prob: false, Lp: false, dist: false },
    makePath(omega, maxN, random) {
      const out = new Float64Array(maxN);
      let sum = 0;
      for (let n = 1; n <= maxN; n++) {
        sum += cauchySample(random);
        out[n - 1] = sum / n;
      }
      return out;
    },
  },
};

// ---- Scrubber figure (Figure 1) ------------------------------------------

(function scrubberFigure() {
  const canvas = document.getElementById("fig-scrubber");
  if (!canvas) return;
  const nIn = document.getElementById("scrub-n");
  const epsIn = document.getElementById("scrub-eps");
  const pathsIn = document.getElementById("scrub-paths");
  const reroll = document.getElementById("scrub-reroll");
  const blurb = document.getElementById("preset-blurb");
  const presetButtons = {
    lln: document.getElementById("preset-lln"),
    typewriter: document.getElementById("preset-typewriter"),
    spike: document.getElementById("preset-spike"),
    signflip: document.getElementById("preset-signflip"),
    cauchy: document.getElementById("preset-cauchy"),
  };
  const viewButtons = {
    all: document.getElementById("view-all"),
    as: document.getElementById("view-as"),
    prob: document.getElementById("view-prob"),
    dist: document.getElementById("view-dist"),
    lp: document.getElementById("view-lp"),
  };

  let presetKey = "lln";
  let viewMode = "all";
  let seedBase = 1;
  let cache = null; // { paths, outcomes, limits, outcomeLimits }
  let geom = null; // { padL, padT, plotW, plotH, maxN } in CSS px — for canvas dragging
  let dragging = false;

  function rebuildPaths() {
    const preset = PRESETS[presetKey];
    const numPaths = 32; // generate the maximum; we only draw the slider's value
    const rng = seeded(seedBase * 2654435761);
    const paths = [];
    const limits = [];
    for (let k = 0; k < numPaths; k++) {
      const omega = rng();
      const localRng = seeded((seedBase * 7919 + k * 4096 + 1) | 0);
      const values = preset.makePath(omega, preset.maxN, localRng);
      const limit = preset.pathLimit ? preset.pathLimit(omega) : preset.limit;
      paths.push({ omega, values });
      limits.push(limit);
    }
    const outcomes = [];
    const outcomeLimits = [];
    const outcomeCount = 360;
    for (let k = 0; k < outcomeCount; k++) {
      const omega = (k + 0.5) / outcomeCount;
      const localRng = seeded((seedBase * 104729 + k * 8191 + 13) | 0);
      const values = preset.makePath(omega, preset.maxN, localRng);
      const limit = preset.pathLimit ? preset.pathLimit(omega) : preset.limit;
      outcomes.push({ omega, values });
      outcomeLimits.push(limit);
    }
    cache = { paths, outcomes, limits, outcomeLimits };
  }

  function selectPreset(key) {
    presetKey = key;
    // Broadcast so the implication lattice can recolor its nodes to match the
    // loaded preset. Set a plain global too, for listeners that init later.
    pageWindow.__convPreset = key;
    document.dispatchEvent(new CustomEvent("conv-preset-change", { detail: { key } }));
    for (const k of Object.keys(presetButtons)) {
      presetButtons[k]?.classList.toggle("active", k === key);
    }
    const preset = PRESETS[key];
    nIn.max = String(preset.maxN);
    if (+nIn.value > preset.maxN) nIn.value = String(preset.maxN);
    blurb.innerHTML = renderInlineMath(`<strong>${preset.name}.</strong> ${preset.blurb}`);
    rebuildPaths();
    draw();
    // re-render math if KaTeX is available
    if (pageWindow.renderMathInElement) {
      pageWindow.renderMathInElement(blurb, {
        throwOnError: false,
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
      });
    }
  }

  function renderInlineMath(html) {
    // Just return the html; KaTeX auto-render runs after.
    return html;
  }

  // Per-step series for the four convergence modes, evaluated for every n.
  // Each metric should fall toward 0 over n where that mode converges.
  function computeSeries(paths, eps) {
    const preset = PRESETS[presetKey];
    const maxN = preset.maxN;
    const denom = paths.length || 1;
    const escapeFrac = new Array(maxN).fill(0);
    const everFrac = new Array(maxN).fill(0);
    const l1 = new Array(maxN).fill(0);
    const l2 = new Array(maxN).fill(0);
    const levy = new Array(maxN).fill(0);
    // Last n at which each path is outside the tube; a path is "ever outside
    // for some m >= n" exactly when its last escape is >= n.
    const lastEscape = paths.map((p, k) => {
      const lim = cache.limits[k];
      let last = 0;
      for (let n = 1; n <= maxN; n++) {
        if (Math.abs(p.values[n - 1] - lim) >= eps) last = n;
      }
      return last;
    });
    const slice = new Array(paths.length);
    for (let n = 1; n <= maxN; n++) {
      let esc = 0, sa = 0, sq = 0, ever = 0;
      for (let k = 0; k < paths.length; k++) {
        const v = paths[k].values[n - 1];
        const d = Math.abs(v - cache.limits[k]);
        if (d >= eps) esc++;
        sa += d;
        sq += d * d;
        if (lastEscape[k] >= n) ever++;
        slice[k] = v;
      }
      escapeFrac[n - 1] = esc / denom;
      everFrac[n - 1] = ever / denom;
      l1[n - 1] = sa / denom;
      l2[n - 1] = sq / denom;
      levy[n - 1] = distributionDistance(slice, cache.limits, preset);
    }
    return { escapeFrac, everFrac, l1, l2, levy };
  }

  // Settling index: smallest n past which a metric stays at or below θ for
  // every m ≥ n (a control-theory settling time on a discrete index).
  // Returns null when the metric is still above θ at the last step.
  // Almost-sure uses θ = 0 (exact: the curve hits zero); the bounded modes
  // use a small positive θ since their metrics only decay toward 0.
  const SETTLE_THETA = 0.1;
  function settlingIndex(data, theta) {
    let lastAbove = 0;
    for (let n = 1; n <= data.length; n++) {
      if (data[n - 1] > theta) lastAbove = n;
    }
    return lastAbove >= data.length ? null : lastAbove + 1;
  }
  function settleLabel(n) {
    return ` · settling index n* = ${n == null ? "—" : n}`;
  }

  function drawLegacy() {
    const preset = PRESETS[presetKey];
    const nCurrent = +nIn.value;
    const eps = +epsIn.value;
    const numPaths = +pathsIn.value;
    setText("scrub-n-v", String(nCurrent));
    setText("scrub-eps-v", eps.toFixed(2));
    setText("scrub-paths-v", String(numPaths));

    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);

    // Two stacked panels sharing the n-axis: the path plot on top, a strip of
    // mode-metric curves below. Heights are derived from h so the figure stays
    // responsive when the canvas is rendered narrower than its intrinsic size.
    const padL = 56;
    const padR = 18;
    const padT = 18;
    const padB = 42;
    const stripGap = 54;
    const plotW = w - padL - padR;
    const usable = h - padT - padB - stripGap;
    const stripH = Math.max(96, usable * 0.3);
    const pathH = usable - stripH;
    const pathTop = padT;
    const pathBot = padT + pathH;
    const stripTop = pathBot + stripGap;
    const stripBot = stripTop + stripH;
    const [yMin, yMax] = preset.yRange;
    const maxN = preset.maxN;

    geom = { padL, padT, plotW, plotH: pathH, maxN };

    const yToPx = (y) => pathTop + (1 - (y - yMin) / (yMax - yMin)) * pathH;
    const nToPx = (n) => padL + ((n - 1) / (maxN - 1)) * plotW;

    const paths = cache.paths.slice(0, numPaths);
    const series = computeSeries(paths, eps);
    const asSettle = settlingIndex(series.everFrac, 0);

    // ε-tube band around the limit
    const limitForBand = preset.pathLimit ? 0 : preset.limit;
    const yLoBand = clamp(yToPx(limitForBand - eps), pathTop, pathBot);
    const yHiBand = clamp(yToPx(limitForBand + eps), pathTop, pathBot);
    ctx.fillStyle = "rgba(184, 65, 42, 0.10)";
    ctx.fillRect(padL, Math.min(yLoBand, yHiBand), plotW, Math.abs(yHiBand - yLoBand));
    ctx.strokeStyle = "rgba(184, 65, 42, 0.45)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, yLoBand);
    ctx.lineTo(padL + plotW, yLoBand);
    ctx.moveTo(padL, yHiBand);
    ctx.lineTo(padL + plotW, yHiBand);
    ctx.stroke();
    ctx.setLineDash([]);

    plotBox(ctx, padL, pathTop, plotW, pathH);

    // almost-sure settling index: shade [1, n*) — the span where some path still escapes
    if (asSettle != null && asSettle > 1) {
      ctx.fillStyle = "rgba(90,101,119,0.07)";
      ctx.fillRect(padL, pathTop, nToPx(asSettle) - padL, pathH);
    }

    // y ticks (path plot)
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const yTicks = makeTicks(yMin, yMax, 5);
    ctx.strokeStyle = C.grid;
    for (const yt of yTicks) {
      const py = yToPx(yt);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();
      ctx.fillText(formatTick(yt), padL - 6, py);
    }

    // vertical n-grid through both panels; numbers only at the strip foot
    const xTickStep = maxN <= 64 ? 8 : 32;
    ctx.fillStyle = C.grid;
    for (let n = xTickStep; n <= maxN; n += xTickStep) {
      const px = nToPx(n);
      ctx.fillRect(px, pathTop, 1, pathH);
      ctx.fillRect(px, stripTop, 1, stripH);
    }
    label(ctx, "X_n(ω)", padL - 36, pathTop - 4, C.text, "left");

    // paths. Each convergence mode is tied to its natural carrier:
    //  • almost sure — a PATH property: paths that still escape at some m ≥ n
    //    keep full strength + red future-escape dots; paths that have settled
    //    fade back, so the eye lands on the ones still violating a.s.
    //  • L^p — driven by OUTLIER paths: the largest current deviation gets a
    //    purple ring (one big term dominates E|X_n − X|^p).
    let lpOutlier = { k: -1, dev: -1, x: 0, y: 0 };
    for (let k = 0; k < paths.length; k++) {
      const { values } = paths[k];
      const pathLimit = cache.limits[k];
      let stillEscapes = false;
      for (let m = nCurrent; m <= maxN; m++) {
        if (Math.abs(values[m - 1] - pathLimit) >= eps) { stillEscapes = true; break; }
      }
      ctx.strokeStyle = `hsla(${(210 + k * 17) % 360}, 55%, 38%, ${stillEscapes ? 0.66 : 0.2})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let n = 1; n <= maxN; n++) {
        const px = nToPx(n);
        const py = yToPx(values[n - 1]);
        if (n === 1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(184,65,42,0.5)";
      for (let m = nCurrent; m <= maxN; m++) {
        if (Math.abs(values[m - 1] - pathLimit) >= eps) {
          ctx.beginPath();
          ctx.arc(nToPx(m), yToPx(values[m - 1]), 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const curVal = values[nCurrent - 1];
      const dev = Math.abs(curVal - pathLimit);
      if (dev > lpOutlier.dev) lpOutlier = { k, dev, x: nToPx(nCurrent), y: yToPx(curVal) };
      const outside = dev >= eps;
      ctx.fillStyle = outside ? C.red : C.blue;
      ctx.beginPath();
      ctx.arc(nToPx(nCurrent), yToPx(curVal), outside ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // L^p carrier: ring the path with the largest current deviation in purple.
    if (lpOutlier.k >= 0) {
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lpOutlier.x, lpOutlier.y, 8.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // almost-sure settling-index line: beyond n* no path ever escapes the tube again
    if (asSettle != null) {
      const bx = nToPx(asSettle);
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, pathTop);
      ctx.lineTo(bx, pathBot);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "11px -apple-system, sans-serif";
      const txt = `a.s. settling index n*=${asSettle}`;
      const right = bx + 8 + ctx.measureText(txt).width < padL + plotW;
      label(ctx, txt, right ? bx + 6 : bx - 6, pathTop + 4, C.axis, right ? "left" : "right");
    }

    // in-probability carrier: a per-column band just under the path plot,
    // each slice tinted blue by its escape fraction (a SLICE property — no
    // single path owns it). Pale = converged, strong blue = many paths outside.
    const bandY = pathBot + 4;
    const bandH = 7;
    for (let n = 1; n <= maxN; n++) {
      const x0 = nToPx(n);
      const x1 = n < maxN ? nToPx(n + 1) : padL + plotW;
      ctx.fillStyle = `rgba(31,74,140,${(0.08 + 0.9 * series.escapeFrac[n - 1]).toFixed(3)})`;
      ctx.fillRect(x0, bandY, x1 - x0 + 0.5, bandH);
    }
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, bandY, plotW, bandH);
    label(ctx, "in-prob escape fraction", padL, bandY + bandH + 3, C.textDim, "left");

    // ---- mode strip ----
    const curves: { data: number[]; color: string; label: string; mode: string; theta: number; settle?: number | null }[] = [
      { data: series.escapeFrac, color: C.blue, label: "in probability", mode: "prob", theta: SETTLE_THETA },
      { data: series.everFrac, color: C.red, label: "almost sure", mode: "as", theta: 0 },
      { data: series.l1, color: C.purple, label: "L¹ (clipped at 1)", mode: "Lp", theta: SETTLE_THETA },
      { data: series.levy, color: C.green, label: "in distribution", mode: "dist", theta: SETTLE_THETA },
    ];
    for (const cur of curves) cur.settle = settlingIndex(cur.data, cur.theta);
    const presetModes = PRESETS[presetKey].modes;

    // strip title + legend, in the gap above the strip box. Each legend entry
    // carries a ✓/✗ badge: whether that mode converges for the loaded preset.
    label(ctx, "mode metrics vs n — each curve falls toward 0 where that mode converges",
      padL, pathBot + 24, C.textDim, "left");
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    let legendX = padL;
    const legendY = pathBot + 42;
    for (const cur of curves) {
      ctx.strokeStyle = cur.color;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 16, legendY);
      ctx.stroke();
      ctx.font = "10px -apple-system, sans-serif";
      ctx.fillStyle = C.textDim;
      ctx.fillText(cur.label, legendX + 21, legendY);
      const labelW = ctx.measureText(cur.label).width;
      const holds = !!presetModes[cur.mode];
      ctx.font = "700 11px -apple-system, sans-serif";
      ctx.fillStyle = holds ? C.green : C.red;
      ctx.fillText(holds ? "✓" : "✗", legendX + 25 + labelW, legendY);
      legendX += 21 + labelW + 14 + 18;
    }

    plotBox(ctx, padL, stripTop, plotW, stripH);
    const sToPx = (v) => stripBot - clamp(v, 0, 1) * stripH;
    ctx.strokeStyle = C.grid;
    ctx.beginPath();
    ctx.moveTo(padL, sToPx(0.5));
    ctx.lineTo(padL + plotW, sToPx(0.5));
    ctx.stroke();
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText("1", padL - 6, sToPx(1));
    ctx.fillText("0.5", padL - 6, sToPx(0.5));
    ctx.fillText("0", padL - 6, sToPx(0));

    // settling threshold for the bounded modes (almost-sure settles at exact 0)
    ctx.strokeStyle = C.textDim;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, sToPx(SETTLE_THETA));
    ctx.lineTo(padL + plotW, sToPx(SETTLE_THETA));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    label(ctx, `settled below θ=${SETTLE_THETA}`, padL + plotW - 4, sToPx(SETTLE_THETA) - 12, C.textDim, "right");

    for (const cur of curves) {
      ctx.strokeStyle = cur.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let n = 1; n <= maxN; n++) {
        const px = nToPx(n);
        const py = sToPx(cur.data[n - 1]);
        if (n === 1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = cur.color;
      ctx.beginPath();
      ctx.arc(nToPx(nCurrent), sToPx(cur.data[nCurrent - 1]), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // settling-index markers: hollow circle where each curve drops below θ for good
    for (const cur of curves) {
      if (cur.settle == null) continue;
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = cur.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(nToPx(cur.settle), sToPx(cur.data[cur.settle - 1]), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // shared x-axis ticks at the strip foot
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let n = xTickStep; n <= maxN; n += xTickStep) {
      ctx.fillText(String(n), nToPx(n), stripBot + 6);
    }
    label(ctx, "n", padL + plotW / 2, stripBot + 22, C.text, "center");

    // shared scrub line through both panels + drag handle
    const scrubX = nToPx(nCurrent);
    ctx.strokeStyle = "rgba(184,65,42,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(scrubX, pathTop);
    ctx.lineTo(scrubX, pathBot);
    ctx.moveTo(scrubX, stripTop);
    ctx.lineTo(scrubX, stripBot);
    ctx.stroke();
    ctx.fillStyle = dragging ? C.red : "rgba(184,65,42,0.85)";
    ctx.beginPath();
    ctx.moveTo(scrubX, pathTop + 9);
    ctx.lineTo(scrubX - 6, pathTop - 1);
    ctx.lineTo(scrubX + 6, pathTop - 1);
    ctx.closePath();
    ctx.fill();

    const i = nCurrent - 1;
    readoutRows("scrubber-readout", [
      ["preset", preset.name + " (limit X = " + (preset.pathLimit ? "±1" : preset.limit) + ")"],
      [
        "in probability — fraction outside tube at n",
        formatPct(series.escapeFrac[i]) + verdict(presetKey, "prob", series.escapeFrac[i], nCurrent) + settleLabel(curves[0].settle),
      ],
      [
        "almost sure — fraction ever outside for some m ≥ n",
        formatPct(series.everFrac[i]) + verdict(presetKey, "as", series.everFrac[i], nCurrent) + settleLabel(curves[1].settle),
      ],
      [
        "L¹ — sample E|X_n − X|",
        series.l1[i].toFixed(3) + verdict(presetKey, "Lp", series.l1[i], nCurrent) + settleLabel(curves[2].settle),
      ],
      [
        "L² — sample E|X_n − X|²",
        series.l2[i].toFixed(3),
      ],
      ["in distribution — Lévy distance to limit law", series.levy[i].toFixed(3) + settleLabel(curves[3].settle)],
    ]);
  }

  function verdict(key, mode, value, n) {
    const expectConverge = PRESETS[key].modes[mode];
    if (n < 8) return "";
    if (expectConverge && value < 0.1) return ` <span style="color:${C.green}">↘ shrinking</span>`;
    if (!expectConverge && value > 0.1) return ` <span style="color:${C.red}">does not shrink</span>`;
    return "";
  }

  function modeAlpha(mode) {
    return viewMode === "all" || viewMode === mode ? 1 : 0.28;
  }

  function isBad(values, limit, n, eps) {
    return Math.abs(values[n - 1] - limit) > eps;
  }

  function analyticTailBad(key, omega, n, eps) {
    if (key === "typewriter") return eps < 1;
    if (key === "signflip") return eps < 2;
    if (key === "cauchy") return true;
    if (key === "spike") {
      const firstBad = Math.max(n, Math.floor(eps) + 1);
      return omega < 1 / firstBad;
    }
    return null;
  }

  function tailBad(row, limit, n, eps) {
    const analytic = analyticTailBad(presetKey, row.omega, n, eps);
    if (analytic != null) return analytic;
    const maxN = PRESETS[presetKey].maxN;
    for (let m = n; m <= maxN; m++) {
      if (isBad(row.values, limit, m, eps)) return true;
    }
    return false;
  }

  function limsupBad(key, omega, eps) {
    if (key === "typewriter") return eps < 1;
    if (key === "signflip") return eps < 2;
    if (key === "cauchy") return true;
    if (key === "spike") return omega === 0;
    return false;
  }

  function targetCdf(preset, limit) {
    if (preset === PRESETS.signflip) {
      return (x) => (x < -1 ? 0 : x < 1 ? 0.5 : 1);
    }
    return (x) => (x < limit ? 0 : 1);
  }

  function computeLensMetrics(n, eps) {
    const preset = PRESETS[presetKey];
    const rows = cache.outcomes;
    const limits = cache.outcomeLimits;
    let bad = 0;
    let tail = 0;
    let limsup = 0;
    let l1 = 0;
    let l2 = 0;
    const samples = [];
    for (let k = 0; k < rows.length; k++) {
      const row = rows[k];
      const limit = limits[k];
      const value = row.values[n - 1];
      const d = Math.abs(value - limit);
      if (d > eps) bad++;
      if (tailBad(row, limit, n, eps)) tail++;
      if (limsupBad(presetKey, row.omega, eps)) limsup++;
      l1 += d;
      l2 += d * d;
      samples.push(value);
    }
    return {
      pBad: bad / rows.length,
      pTail: tail / rows.length,
      pLimsup: limsup / rows.length,
      l1: l1 / rows.length,
      l2: l2 / rows.length,
      levy: levyDistance(samples, targetCdf(preset, limits[0])),
      samples,
    };
  }

  function drawScrubLine(ctx, x, y0, y1) {
    ctx.strokeStyle = "rgba(184,65,42,0.62)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
  }

  function drawOutcomeLens(ctx, x, y, w, h, n, eps) {
    const rows = cache.outcomes;
    const limits = cache.outcomeLimits;
    const stripH = 22;
    const gap = 9;
    const names = [
      { key: "B_n(eps)", color: C.red, mode: "prob", test: (row, limit) => isBad(row.values, limit, n, eps) },
      { key: "A_n(eps)", color: C.orange, mode: "as", test: (row, limit) => tailBad(row, limit, n, eps) },
      { key: "limsup B_n", color: C.purple, mode: "as", test: (row) => limsupBad(presetKey, row.omega, eps) },
    ];
    label(ctx, "Outcome space Ω=[0,1]: current bad sets, tail bad sets, exceptional set",
      x, y - 15, C.text, "left");
    plotBox(ctx, x, y, w, h);
    for (let r = 0; r < names.length; r++) {
      const rowY = y + 13 + r * (stripH + gap);
      ctx.fillStyle = "rgba(227,221,208,0.48)";
      ctx.fillRect(x + 76, rowY, w - 88, stripH);
      const alpha = modeAlpha(names[r].mode);
      for (let k = 0; k < rows.length; k++) {
        if (!names[r].test(rows[k], limits[k])) continue;
        const x0 = x + 76 + (k / rows.length) * (w - 88);
        const x1 = x + 76 + ((k + 1) / rows.length) * (w - 88);
        ctx.fillStyle = hexToRgba(names[r].color, 0.18 + 0.72 * alpha);
        ctx.fillRect(x0, rowY, Math.max(1, x1 - x0), stripH);
      }
      ctx.strokeStyle = C.grid;
      ctx.strokeRect(x + 76, rowY, w - 88, stripH);
      label(ctx, names[r].key, x + 66, rowY + stripH / 2, C.textDim, "right", "middle");
    }
    label(ctx, "0", x + 76, y + h - 12, C.textDim, "left");
    label(ctx, "1", x + w - 12, y + h - 12, C.textDim, "right");
  }

  function drawPathLens(ctx, x, y, w, h, nCurrent, eps, numPaths) {
    const preset = PRESETS[presetKey];
    const paths = cache.paths.slice(0, numPaths);
    const [yMin, yMax] = preset.yRange;
    const maxN = preset.maxN;
    const xToPx = (n) => x + ((n - 1) / (maxN - 1)) * w;
    const yToPx = (v) => y + (1 - (v - yMin) / (yMax - yMin)) * h;
    const xStep = maxN <= 64 ? 8 : 32;

    label(ctx, "Sample paths: does this ω eventually stay inside the ε-tube?",
      x, y - 15, C.text, "left");
    plotBox(ctx, x, y, w, h);
    ctx.strokeStyle = C.grid;
    for (const yt of makeTicks(yMin, yMax, 5)) {
      const py = yToPx(yt);
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.lineTo(x + w, py);
      ctx.stroke();
      label(ctx, formatTick(yt), x - 7, py, C.textDim, "right", "middle");
    }
    for (let n = xStep; n <= maxN; n += xStep) {
      const px = xToPx(n);
      ctx.fillStyle = C.grid;
      ctx.fillRect(px, y, 1, h);
      label(ctx, String(n), px, y + h + 6, C.textDim, "center", "top");
    }
    label(ctx, "n", x + w / 2, y + h + 22, C.text, "center");

    drawScrubLine(ctx, xToPx(nCurrent), y, y + h);
    const limitForBand = preset.pathLimit ? 0 : preset.limit;
    const bandTop = clamp(yToPx(limitForBand + eps), y, y + h);
    const bandBot = clamp(yToPx(limitForBand - eps), y, y + h);
    ctx.fillStyle = "rgba(184,65,42,0.09)";
    ctx.fillRect(x, Math.min(bandTop, bandBot), w, Math.abs(bandBot - bandTop));
    ctx.strokeStyle = "rgba(184,65,42,0.42)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x, bandTop);
    ctx.lineTo(x + w, bandTop);
    ctx.moveTo(x, bandBot);
    ctx.lineTo(x + w, bandBot);
    ctx.stroke();
    ctx.setLineDash([]);

    let lpOutlier = { dev: -1, x: 0, y: 0 };
    for (let k = 0; k < paths.length; k++) {
      const path = paths[k];
      const limit = cache.limits[k];
      const willLeave = tailBad(path, limit, nCurrent, eps);
      const currentBad = isBad(path.values, limit, nCurrent, eps);
      const alpha = willLeave ? 0.72 * modeAlpha("as") : 0.18;
      ctx.strokeStyle = willLeave ? `rgba(31,74,140,${alpha})` : `rgba(90,101,119,${0.55 * modeAlpha("as")})`;
      ctx.lineWidth = willLeave ? 1.3 : 1;
      ctx.beginPath();
      for (let n = 1; n <= maxN; n++) {
        const px = xToPx(n);
        const py = yToPx(path.values[n - 1]);
        if (n === 1) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const curVal = path.values[nCurrent - 1];
      const px = xToPx(nCurrent);
      const py = yToPx(curVal);
      const dev = Math.abs(curVal - limit);
      if (dev > lpOutlier.dev) lpOutlier = { dev, x: px, y: py };
      ctx.fillStyle = currentBad ? hexToRgba(C.red, modeAlpha("prob")) : hexToRgba(C.blue, 0.82);
      ctx.beginPath();
      ctx.arc(px, py, currentBad ? 4.2 : 3, 0, Math.PI * 2);
      ctx.fill();
      if (!currentBad && willLeave) {
        ctx.fillStyle = hexToRgba(C.orange, modeAlpha("as"));
        ctx.beginPath();
        ctx.moveTo(px + 7, py);
        ctx.lineTo(px + 13, py - 5);
        ctx.lineTo(px + 13, py + 5);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (lpOutlier.dev >= 0) {
      ctx.strokeStyle = hexToRgba(C.purple, modeAlpha("lp"));
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.arc(lpOutlier.x, lpOutlier.y, 8.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawDistributionLens(ctx, x, y, w, h, samples, levy) {
    const preset = PRESETS[presetKey];
    const [lo, hi] = preset.yRange;
    const bins = 28;
    const counts = new Array(bins).fill(0);
    for (const sample of samples) {
      const idx = clamp(Math.floor(((sample - lo) / (hi - lo)) * bins), 0, bins - 1);
      counts[idx]++;
    }
    const maxCount = Math.max(1, ...counts);
    const axisY = y + h - 24;
    label(ctx, "Value space: law(X_n)=P∘X_n^{-1} versus law(X)",
      x, y - 15, C.text, "left");
    plotBox(ctx, x, y, w, h);
    for (let i = 0; i < bins; i++) {
      const barX = x + 12 + (i / bins) * (w - 24);
      const barW = (w - 24) / bins - 2;
      const barH = (counts[i] / maxCount) * (h - 50);
      ctx.fillStyle = hexToRgba(C.green, 0.22 + 0.58 * modeAlpha("dist"));
      ctx.fillRect(barX, axisY - barH, barW, barH);
    }
    const valueToPx = (value) => x + 12 + ((value - lo) / (hi - lo)) * (w - 24);
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(x + 12, axisY);
    ctx.lineTo(x + w - 12, axisY);
    ctx.stroke();
    for (const tick of makeTicks(lo, hi, 4)) {
      const px = valueToPx(tick);
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.moveTo(px, axisY);
      ctx.lineTo(px, axisY + 5);
      ctx.stroke();
      label(ctx, formatTick(tick), px, axisY + 8, C.textDim, "center", "top");
    }
    ctx.strokeStyle = hexToRgba(C.red, modeAlpha("dist"));
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 4]);
    const targetXs = preset === PRESETS.signflip ? [-1, 1] : [preset.limit];
    for (const target of targetXs) {
      const px = clamp(valueToPx(target), x + 12, x + w - 12);
      ctx.beginPath();
      ctx.moveTo(px, y + 12);
      ctx.lineTo(px, axisY);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    label(ctx, `d_L = ${levy.toFixed(3)}`, x + w - 10, y + 10, C.green, "right");
  }

  function hexToRgba(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
  }

  function draw() {
    const preset = PRESETS[presetKey];
    const nCurrent = +nIn.value;
    const eps = +epsIn.value;
    const numPaths = +pathsIn.value;
    setText("scrub-n-v", String(nCurrent));
    setText("scrub-eps-v", eps.toFixed(2));
    setText("scrub-paths-v", String(numPaths));
    for (const k of Object.keys(viewButtons)) {
      viewButtons[k]?.classList.toggle("active", k === viewMode);
    }

    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const padL = 72;
    const padR = 24;
    const padT = 30;
    const gap = 38;
    const plotW = w - padL - padR;
    const outcomeH = 110;
    const pathH = Math.max(210, h * 0.37);
    const distH = h - padT - outcomeH - pathH - gap * 2 - 30;
    const outcomeY = padT;
    const pathY = outcomeY + outcomeH + gap;
    const distY = pathY + pathH + gap;
    geom = { padL, padT: pathY, plotW, plotH: pathH, maxN: preset.maxN };

    const metrics = computeLensMetrics(nCurrent, eps);
    drawOutcomeLens(ctx, padL, outcomeY, plotW, outcomeH, nCurrent, eps);
    drawPathLens(ctx, padL, pathY, plotW, pathH, nCurrent, eps, numPaths);
    drawDistributionLens(ctx, padL, distY, plotW, Math.max(120, distH), metrics.samples, metrics.levy);

    const tailNote = presetKey === "lln" ? " (finite visible horizon)" : "";
    readoutRows("scrubber-readout", [
      ["preset", preset.name + " (limit X = " + (preset.pathLimit ? "±1" : preset.limit) + ")"],
      ["P(B_n(ε)) current bad set", formatPct(metrics.pBad) + verdict(presetKey, "prob", metrics.pBad, nCurrent)],
      ["P(A_n(ε)) tail bad set" + tailNote, formatPct(metrics.pTail) + verdict(presetKey, "as", metrics.pTail, nCurrent)],
      ["P(limsup B_n) exceptional set", formatPct(metrics.pLimsup)],
      ["d_L(law(X_n), law(X))", metrics.levy.toFixed(3) + verdict(presetKey, "dist", metrics.levy, nCurrent)],
      ["E|X_n − X|", metrics.l1.toFixed(3) + verdict(presetKey, "Lp", metrics.l1, nCurrent)],
      ["E|X_n − X|²", metrics.l2.toFixed(3)],
    ]);
  }

  // Lévy distance between the empirical CDF of `samples` and a reference CDF.
  // The Kolmogorov (sup |F_n − F|) distance does NOT metrize convergence in
  // distribution when the limit law has an atom: at a jump of F the sup never
  // vanishes even as X_n concentrates. The Lévy distance — the smallest ε with
  // F(x−ε)−ε ≤ F_n(x) ≤ F(x+ε)+ε for all x — does metrize weak convergence,
  // atoms included, so it falls to 0 exactly when X_n converges in distribution.
  function levyDistance(samples, cdf) {
    const N = samples.length;
    if (!N) return 0;
    const xs = [...samples].sort((a, b) => a - b);
    const feasible = (eps) => {
      for (let i = 1; i <= N; i++) {
        const xi = xs[i - 1];
        if (i / N - eps > cdf(xi + eps)) return false;
        if (cdf(xi - eps) - eps > (i - 1) / N) return false;
      }
      return true;
    };
    let lo = 0, hi = 1;
    for (let it = 0; it < 24; it++) {
      const mid = (lo + hi) / 2;
      if (feasible(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  }

  function distributionDistance(samples, limits, preset) {
    if (!samples.length) return 0;
    if (preset === PRESETS.signflip) {
      // Limit law: fair ±1, a two-step CDF.
      return levyDistance(samples, (x) => (x < -1 ? 0 : x < 1 ? 0.5 : 1));
    }
    // Degenerate limit: point mass at `limits[0]`.
    const c = limits[0];
    return levyDistance(samples, (x) => (x < c ? 0 : 1));
  }

  function makeTicks(lo, hi, count) {
    const ticks = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(lo + (i / count) * (hi - lo));
    }
    return ticks;
  }
  function formatTick(v) {
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 1) return v.toFixed(1);
    return v.toFixed(2);
  }
  function formatPct(v) {
    return (v * 100).toFixed(1) + "%";
  }

  for (const [k, btn] of Object.entries(presetButtons)) {
    if (btn) btn.addEventListener("click", () => selectPreset(k));
  }
  for (const [k, btn] of Object.entries(viewButtons)) {
    if (btn) btn.addEventListener("click", () => { viewMode = k; draw(); });
  }
  nIn.addEventListener("input", draw);
  epsIn.addEventListener("input", draw);
  pathsIn.addEventListener("input", draw);

  // Drag the step n directly on the canvas, not just via the slider.
  function nFromClientX(clientX) {
    if (!geom) return null;
    const rect = canvas.getBoundingClientRect();
    const frac = (clientX - rect.left - geom.padL) / geom.plotW;
    return clamp(Math.round(1 + frac * (geom.maxN - 1)), 1, geom.maxN);
  }
  function applyN(n) {
    if (n == null || String(n) === nIn.value) return;
    nIn.value = String(n);
    draw();
  }
  canvas.style.cursor = "ew-resize";
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (e) => {
    const n = nFromClientX(e.clientX);
    if (n == null) return;
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    applyN(n);
    draw();
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) applyN(nFromClientX(e.clientX));
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    if (e.pointerId != null && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    draw();
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  reroll.addEventListener("click", () => {
    seedBase = (seedBase + 17) | 0;
    rebuildPaths();
    draw();
  });
  window.addEventListener("resize", () => draw());

  selectPreset("lln");

  // Expose for cross-figure preset jumps (lattice navigator)
  pageWindow.__convScrubber = {
    selectPreset: (key) => {
      const blurbEl = document.getElementById("preset-blurb");
      selectPreset(key);
      const fig = canvas.closest(".figure") || canvas;
      fig.scrollIntoView({ behavior: "smooth", block: "center" });
      // re-pulse via the layout's existing helper
      fig.classList.add("is-pulsing");
      setTimeout(() => fig.classList.remove("is-pulsing"), 1500);
    },
  };
})();

// ---- Implication lattice (Figure 2) --------------------------------------

(function latticeFigure() {
  const svg = document.getElementById("lattice-svg");
  const caption = document.getElementById("lattice-caption");
  if (!svg || !caption) return;

  // Layout: a.s. and L^p at top (incomparable); in prob in middle; in dist at bottom.
  const nodes = {
    as: { x: 230, y: 60, label: "almost sure", sub: "X_n(ω) → X(ω) a.e." },
    Lp: { x: 590, y: 60, label: "L^p (here p=1)", sub: "E|X_n − X|^p → 0" },
    prob: { x: 410, y: 175, label: "in probability", sub: "P(|X_n−X|≥ε) → 0" },
    dist: { x: 410, y: 280, label: "in distribution", sub: "F_n(x) → F(x) at continuity pts" },
  };

  const edges = [
    // Solid implications
    { from: "as", to: "prob", solid: true, msg: "<strong>a.s. ⇒ in probability.</strong> The set $\\{\\omega : X_n(\\omega) \\not\\to X(\\omega)\\}$ has measure zero, so for any $\\varepsilon$ the indicator $\\mathbf{1}_{|X_n-X|\\geq\\varepsilon}$ converges to $0$ a.s. and is bounded by $1$ — apply DCT." },
    { from: "Lp", to: "prob", solid: true, msg: "<strong>$L^p$ ⇒ in probability.</strong> Markov's inequality: $\\mathbb{P}(|X_n - X| \\geq \\varepsilon) \\leq \\mathbb{E}|X_n-X|^p / \\varepsilon^p$. If the right side goes to zero, so does the left." },
    { from: "prob", to: "dist", solid: true, msg: "<strong>In probability ⇒ in distribution.</strong> Convergence in probability gives convergence of $\\mathbb{E} f(X_n) \\to \\mathbb{E} f(X)$ for bounded continuous $f$, which is the portmanteau characterization of weak convergence." },
    // Dashed non-implications
    { from: "prob", to: "as", solid: false, preset: "typewriter", msg: "<strong>In probability ⇏ a.s.</strong> The <em>typewriter</em>: $\\mathbb{P}(X_n=1) = 2^{-k} \\to 0$, but every $\\omega$ is hit infinitely often. Click to load." },
    { from: "as", to: "Lp", solid: false, preset: "spike", msg: "<strong>a.s. ⇏ $L^1$.</strong> The <em>spike</em>: $X_n \\to 0$ a.s. but $\\mathbb{E} X_n = 1$ for all $n$. The mass escapes to infinity. Click to load." },
    { from: "Lp", to: "as", solid: false, preset: "typewriter", msg: "<strong>$L^p$ ⇏ a.s.</strong> The typewriter again: $\\mathbb{E}|X_n| = 2^{-k} \\to 0$, but no path converges. Click to load." },
    { from: "prob", to: "Lp", solid: false, preset: "spike", msg: "<strong>In probability ⇏ $L^p$.</strong> The spike: $X_n \\to 0$ in probability, but $\\mathbb{E} X_n = 1$ always. The first moment can't follow. Click to load." },
    { from: "dist", to: "prob", solid: false, preset: "signflip", msg: "<strong>In distribution ⇏ in probability.</strong> The <em>sign flip</em>: $X_n = (-1)^n X$ has the same distribution as $X$ for every $n$, but $|X_n - X| \\in \\{0, 2\\}$. Click to load." },
  ];

  const SVGNS = "http://www.w3.org/2000/svg";

  function el(name, attrs) {
    const node = document.createElementNS(SVGNS, name);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      node.setAttribute(k, String(v));
    }
    return node;
  }

  function nodeAnchor(node, towardX, towardY) {
    // Approximate rounded-rect anchor: clip the line to the rect boundary.
    const w = 178;
    const h = 50;
    const cx = node.x;
    const cy = node.y;
    const dx = towardX - cx;
    const dy = towardY - cy;
    const sx = dx === 0 ? 0 : Math.sign(dx);
    const sy = dy === 0 ? 0 : Math.sign(dy);
    // Find intersection with rectangle.
    const tx = sx ? (w / 2) / Math.abs(dx) : Infinity;
    const ty = sy ? (h / 2) / Math.abs(dy) : Infinity;
    const t = Math.min(tx, ty);
    return { x: cx + dx * t, y: cy + dy * t };
  }

  function buildEdges() {
    const g = el("g", { "class": "edges" });
    // Arrow marker defs
    const defs = el("defs", {});
    for (const [name, color] of [["arr-solid", "#1f4a8c"], ["arr-dashed", "#b8412a"]]) {
      const marker = el("marker", { id: name, viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 8, markerHeight: 8, orient: "auto-start-reverse" });
      const path = el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color });
      marker.appendChild(path);
      defs.appendChild(marker);
    }
    svg.appendChild(defs);

    for (const edge of edges) {
      const from = nodes[edge.from];
      const to = nodes[edge.to];
      const start = nodeAnchor(from, to.x, to.y);
      const end = nodeAnchor(to, from.x, from.y);
      // Offset parallel pairs (prob<->as, prob<->Lp) so they don't overlap.
      const samePair = edges.find(
        (other) => other !== edge && other.from === edge.to && other.to === edge.from
      );
      let sx = start.x;
      let sy = start.y;
      let ex = end.x;
      let ey = end.y;
      if (samePair) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.hypot(dx, dy) || 1;
        const nxv = -dy / len;
        const nyv = dx / len;
        const sign = edge.solid ? 1 : -1;
        const off = 9 * sign;
        sx += nxv * off;
        sy += nyv * off;
        ex += nxv * off;
        ey += nyv * off;
      }
      const path = el("line", {
        x1: sx,
        y1: sy,
        x2: ex,
        y2: ey,
        class: `lattice-edge ${edge.solid ? "solid" : "dashed"}`,
        "marker-end": `url(#${edge.solid ? "arr-solid" : "arr-dashed"})`,
      });
      g.appendChild(path);

      // Wider invisible hit area for easier clicking.
      const hit = el("line", {
        x1: sx,
        y1: sy,
        x2: ex,
        y2: ey,
        class: "edge-hit",
      });
      hit.addEventListener("mouseenter", () => showEdge(edge, path));
      hit.addEventListener("mouseleave", () => resetEdge(path));
      hit.addEventListener("click", () => {
        showEdge(edge, path);
        if (edge.preset && pageWindow.__convScrubber) {
          pageWindow.__convScrubber.selectPreset(edge.preset);
        }
      });
      g.appendChild(hit);
    }
    svg.appendChild(g);
  }

  function buildNodes() {
    const g = el("g", { "class": "nodes" });
    for (const [key, node] of Object.entries(nodes)) {
      const group = el("g", { class: "lattice-node", "data-key": key });
      group.setAttribute("transform", `translate(${node.x - 89} ${node.y - 25})`);
      const rect = el("rect", { x: 0, y: 0, width: 178, height: 50, rx: 9, ry: 9 });
      const label1 = el("text", { x: 89, y: 19 });
      label1.textContent = node.label;
      const label2 = el("text", { x: 89, y: 36, class: "sub" });
      label2.textContent = node.sub;
      // Mode-status mark, set by applyPresetStatus to ✓ / ✗ for the loaded preset.
      const mark = el("text", { x: 163, y: 14, class: "mode-mark" });
      group.appendChild(rect);
      group.appendChild(label1);
      group.appendChild(label2);
      group.appendChild(mark);
      group.addEventListener("click", () => {
        // Node click: load the preset where this mode is the headline example.
        const presetForNode = {
          as: "spike",
          Lp: "typewriter",
          prob: "lln",
          dist: "signflip",
        }[key];
        if (presetForNode) {
          caption.innerHTML = renderCaption(
            `<strong>${PRESETS[presetForNode].name}.</strong> ${modesSummary(presetForNode)}`
          );
          if (pageWindow.__convScrubber) {
            pageWindow.__convScrubber.selectPreset(presetForNode);
          }
        }
      });
      g.appendChild(group);
    }
    svg.appendChild(g);
  }

  // Color the four lattice nodes by whether each mode converges for the loaded
  // preset, turning the abstract lattice into a live status display.
  function applyPresetStatus(key) {
    const modes = PRESETS[key]?.modes;
    if (!modes) return;
    for (const group of svg.querySelectorAll(".lattice-node")) {
      const holds = !!modes[group.getAttribute("data-key")];
      group.setAttribute("data-holds", String(holds));
      const mark = group.querySelector(".mode-mark");
      if (mark) mark.textContent = holds ? "✓" : "✗";
    }
  }

  // One-line per-mode verdict for the node-click caption.
  function modesSummary(key) {
    const m = PRESETS[key].modes;
    const order = [
      ["as", "almost sure"],
      ["prob", "in probability"],
      ["Lp", "$L^p$"],
      ["dist", "in distribution"],
    ];
    const parts = order.map(([k, lbl]) => `${lbl} ${m[k] ? "✓" : "✗"}`);
    const held = order.filter(([k]) => m[k]).length;
    const tail = held === 4 ? " — all four modes hold." : held === 0 ? " — no mode converges." : "";
    return parts.join(" · ") + tail;
  }

  function showEdge(edge, path) {
    path.classList.add("hover");
    caption.innerHTML = renderCaption(edge.msg);
  }
  function resetEdge(path) {
    path.classList.remove("hover");
  }
  function renderCaption(html) {
    // Defer KaTeX rendering until the html is inserted.
    queueMicrotask(() => {
      if (pageWindow.renderMathInElement) {
        pageWindow.renderMathInElement(caption, {
          throwOnError: false,
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
        });
      }
    });
    return html;
  }

  buildEdges();
  buildNodes();
  applyPresetStatus(pageWindow.__convPreset ?? "lln");
  document.addEventListener("conv-preset-change", (e) => applyPresetStatus((e as CustomEvent).detail.key));
})();

// ---- Inequalities (Figure 3) ---------------------------------------------

(function boundsFigure() {
  const canvas = document.getElementById("fig-bounds");
  if (!canvas) return;
  const epsIn = document.getElementById("bounds-eps");
  const repsIn = document.getElementById("bounds-reps");
  const buttons = {
    lln: document.getElementById("bounds-preset-lln"),
    spike: document.getElementById("bounds-preset-spike"),
    cauchy: document.getElementById("bounds-preset-cauchy"),
  };
  let presetKey = "lln";

  // For the bounds figure we need many sample paths and the
  // empirical escape rate as a function of n.
  function generate(maxN, reps, key) {
    const rngOmega = seeded(1234567);
    const preset = PRESETS[key];
    const pathLimits = [];
    const escape = new Float64Array(maxN); // count outside tube at each n
    const absSum = new Float64Array(maxN);
    const sqSum = new Float64Array(maxN);
    const eps = +epsIn.value;
    for (let k = 0; k < reps; k++) {
      const omega = rngOmega();
      const localRng = seeded((123 + k * 1009) | 0);
      const values = preset.makePath(omega, maxN, localRng);
      const lim = preset.pathLimit ? preset.pathLimit(omega) : preset.limit;
      pathLimits.push(lim);
      for (let n = 0; n < maxN; n++) {
        const d = values[n] - lim;
        if (Math.abs(d) >= eps) escape[n]++;
        absSum[n] += Math.abs(d);
        sqSum[n] += d * d;
      }
    }
    const empProb = Array.from(escape, (c) => c / reps);
    const eAbs = Array.from(absSum, (s) => s / reps);
    const eSq = Array.from(sqSum, (s) => s / reps);
    return { empProb, eAbs, eSq, eps };
  }

  function draw() {
    const preset = PRESETS[presetKey];
    const maxN = preset.maxN;
    const reps = +repsIn.value;
    const eps = +epsIn.value;
    setText("bounds-eps-v", eps.toFixed(2));
    setText("bounds-reps-v", String(reps));
    for (const k of Object.keys(buttons)) {
      buttons[k]?.classList.toggle("active", k === presetKey);
    }
    const { empProb, eAbs, eSq } = generate(maxN, reps, presetKey);

    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const padL = 56;
    const padR = 18;
    const padT = 18;
    const padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    plotBox(ctx, padL, padT, plotW, plotH);
    const nToPx = (n) => padL + ((n - 1) / (maxN - 1)) * plotW;
    const yToPx = (y) => padT + (1 - clamp(y, 0, 1)) * plotH;

    // Grid lines
    ctx.strokeStyle = C.grid;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      ctx.fillText((1 - i / 4).toFixed(2), padL - 6, padT + (i / 4) * plotH);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xStep = maxN <= 64 ? 8 : 32;
    for (let n = xStep; n <= maxN; n += xStep) {
      ctx.fillText(String(n), nToPx(n), padT + plotH + 6);
    }
    label(ctx, "n", padL + plotW / 2, padT + plotH + 22, C.text, "center");
    label(ctx, "tail prob", padL - 36, padT - 4, C.text, "left");

    // Markov bound: E|X_n - X| / eps  (drawn if finite)
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let n = 1; n <= maxN; n++) {
      const b = eAbs[n - 1] / eps;
      if (!Number.isFinite(b)) continue;
      const py = yToPx(b);
      if (!started) {
        ctx.moveTo(nToPx(n), py);
        started = true;
      } else {
        ctx.lineTo(nToPx(n), py);
      }
    }
    ctx.stroke();

    // Chebyshev bound: E|X_n - X|^2 / eps^2
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2;
    ctx.beginPath();
    started = false;
    for (let n = 1; n <= maxN; n++) {
      const b = eSq[n - 1] / (eps * eps);
      if (!Number.isFinite(b) || b > 50) continue; // skip wild Cauchy values
      const py = yToPx(b);
      if (!started) {
        ctx.moveTo(nToPx(n), py);
        started = true;
      } else {
        ctx.lineTo(nToPx(n), py);
      }
    }
    ctx.stroke();

    // Empirical escape rate (dots)
    ctx.fillStyle = C.blue;
    for (let n = 1; n <= maxN; n++) {
      ctx.beginPath();
      ctx.arc(nToPx(n), yToPx(empProb[n - 1]), 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Readout
    const finalProb = empProb[maxN - 1];
    const markovFinal = eAbs[maxN - 1] / eps;
    const chebFinal = eSq[maxN - 1] / (eps * eps);
    const cauchyNote = presetKey === "cauchy"
      ? `<span style="color:${C.red}"> — Chebyshev = ∞ (no variance)</span>`
      : "";
    readoutRows("bounds-readout", [
      ["preset", PRESETS[presetKey].name],
      ["ε", eps.toFixed(2)],
      [`empirical tail at n=${maxN}`, finalProb.toFixed(3)],
      [`Markov bound at n=${maxN}`, Number.isFinite(markovFinal) ? markovFinal.toFixed(3) : "∞"],
      [
        `Chebyshev bound at n=${maxN}`,
        (Number.isFinite(chebFinal) && chebFinal < 100 ? chebFinal.toFixed(3) : "∞") + cauchyNote,
      ],
    ]);
  }

  for (const [k, btn] of Object.entries(buttons)) {
    if (btn) btn.addEventListener("click", () => { presetKey = k; draw(); });
  }
  epsIn.addEventListener("input", draw);
  repsIn.addEventListener("input", draw);
  window.addEventListener("resize", () => draw());

  draw();
})();

// ---- Chernoff comparison (Figure 4) ---------------------------------------

(function chernoffFigure() {
  const canvas = document.getElementById("fig-chernoff");
  if (!canvas) return;
  const distIn = document.getElementById("chern-dist");
  const pIn = document.getElementById("chern-p");
  const tIn = document.getElementById("chern-t");
  const nMaxIn = document.getElementById("chern-nmax");
  const repsIn = document.getElementById("chern-reps");

  // Bernoulli KL rate function
  function klBer(q, p) {
    const eps = 1e-9;
    const qe = clamp(q, eps, 1 - eps);
    const pe = clamp(p, eps, 1 - eps);
    return qe * Math.log(qe / pe) + (1 - qe) * Math.log((1 - qe) / (1 - pe));
  }

  function simulate(distKey, p, nMax, reps, t) {
    // Generate (S_n - n*mu) for n = 1..nMax across reps, count tails.
    const rng = seeded(987654321);
    const counts = new Float64Array(nMax);
    const absSum = new Float64Array(nMax);
    const sqSum = new Float64Array(nMax);
    let mu, sigma2;
    if (distKey === "bernoulli") {
      mu = p;
      sigma2 = p * (1 - p);
    } else {
      mu = 0;
      sigma2 = 1;
    }
    for (let r = 0; r < reps; r++) {
      let sum = 0;
      for (let n = 1; n <= nMax; n++) {
        const x = distKey === "bernoulli" ? bernoulliSample(rng, p) : gaussianSample(rng);
        sum += x;
        const dev = sum / n - mu;
        if (dev >= t) counts[n - 1]++;
        absSum[n - 1] += Math.abs(dev);
        sqSum[n - 1] += dev * dev;
      }
    }
    return {
      empProb: Array.from(counts, (c) => c / reps),
      eAbs: Array.from(absSum, (s) => s / reps),
      eSq: Array.from(sqSum, (s) => s / reps),
      mu,
      sigma2,
    };
  }

  function draw() {
    const distKey = distIn.value;
    const p = +pIn.value;
    const t = +tIn.value;
    const nMax = +nMaxIn.value;
    const reps = +repsIn.value;
    setText("chern-p-v", p.toFixed(2));
    setText("chern-t-v", t.toFixed(2));
    setText("chern-nmax-v", String(nMax));
    setText("chern-reps-v", String(reps));
    // disable p slider for gaussian
    pIn.disabled = distKey === "gauss";

    const { empProb, eAbs, eSq, mu, sigma2 } = simulate(distKey, p, nMax, reps, t);

    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const padL = 56;
    const padR = 18;
    const padT = 18;
    const padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Log y axis from 1e-6 to 1
    const yLo = -6;
    const yHi = 0;
    const yToPx = (logp) => padT + (1 - (logp - yLo) / (yHi - yLo)) * plotH;
    const nToPx = (n) => padL + ((n - 1) / (nMax - 1)) * plotW;

    plotBox(ctx, padL, padT, plotW, plotH);
    // Decade grid
    ctx.strokeStyle = C.grid;
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let dec = yLo; dec <= yHi; dec++) {
      const py = yToPx(dec);
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(padL + plotW, py);
      ctx.stroke();
      ctx.fillText(`10^${dec}`, padL - 6, py);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xStep = nMax <= 100 ? 20 : nMax <= 300 ? 50 : 100;
    for (let n = xStep; n <= nMax; n += xStep) {
      const px = nToPx(n);
      ctx.fillStyle = C.grid;
      ctx.fillRect(px, padT, 1, plotH);
      ctx.fillStyle = C.textDim;
      ctx.fillText(String(n), px, padT + plotH + 6);
    }
    label(ctx, "n", padL + plotW / 2, padT + plotH + 22, C.text, "center");
    label(ctx, "log10 tail", padL - 36, padT - 4, C.text, "left");

    function plotLine(values, color, dashed = false) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (dashed) ctx.setLineDash([5, 4]);
      ctx.beginPath();
      let started = false;
      for (let n = 1; n <= nMax; n++) {
        const v = values[n - 1];
        if (!(v > 0) || !Number.isFinite(v)) continue;
        const logp = clamp(Math.log10(v), yLo, yHi);
        const py = yToPx(logp);
        if (!started) {
          ctx.moveTo(nToPx(n), py);
          started = true;
        } else {
          ctx.lineTo(nToPx(n), py);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Markov: P(|dev| >= t) <= E|dev|/t
    const markovVals = eAbs.map((v) => v / t);
    // Chebyshev: P(|dev| >= t) <= Var/t^2 = sigma2 / (n * t^2)
    const chebVals = new Float64Array(nMax);
    for (let n = 1; n <= nMax; n++) chebVals[n - 1] = sigma2 / (n * t * t);
    // Chernoff: P(S_n/n - mu >= t) <= exp(-n * I(t))
    // For Bernoulli, rate function is KL(mu+t || mu).
    // For Gaussian, rate function is t^2 / (2 * sigma2).
    let rate;
    if (distKey === "bernoulli") {
      rate = klBer(mu + t, mu);
    } else {
      rate = (t * t) / (2 * sigma2);
    }
    const chernVals = new Float64Array(nMax);
    for (let n = 1; n <= nMax; n++) chernVals[n - 1] = Math.exp(-n * rate);

    plotLine(markovVals, C.orange);
    plotLine(chebVals, C.purple);
    plotLine(chernVals, C.red);
    // Empirical
    ctx.fillStyle = C.blue;
    for (let n = 1; n <= nMax; n++) {
      const v = empProb[n - 1];
      if (!(v > 0)) continue;
      const logp = clamp(Math.log10(v), yLo, yHi);
      ctx.beginPath();
      ctx.arc(nToPx(n), yToPx(logp), 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    readoutRows("chernoff-readout", [
      ["distribution", distKey === "bernoulli" ? `Bernoulli(${p.toFixed(2)})` : "Gaussian(0,1)"],
      ["deviation t", t.toFixed(2)],
      [`empirical tail at n=${nMax}`, empProb[nMax - 1].toFixed(5)],
      [`Markov bound`, (eAbs[nMax - 1] / t).toExponential(2)],
      [`Chebyshev bound`, (sigma2 / (nMax * t * t)).toExponential(2)],
      [`Chernoff bound`, Math.exp(-nMax * rate).toExponential(2)],
      [`Chernoff rate I(t)`, rate.toFixed(4)],
    ]);
  }

  distIn.addEventListener("change", draw);
  pIn.addEventListener("input", draw);
  tIn.addEventListener("input", draw);
  nMaxIn.addEventListener("input", draw);
  repsIn.addEventListener("input", draw);
  window.addEventListener("resize", () => draw());

  draw();
})();

// ---- DCT failure / spike domination (Figure 5) ---------------------------

(function dctFigure() {
  const canvas = document.getElementById("fig-dct");
  if (!canvas) return;
  const alphaIn = document.getElementById("dct-alpha");
  const cIn = document.getElementById("dct-c");
  const nMaxIn = document.getElementById("dct-nmax");

  function draw() {
    const alpha = +alphaIn.value;
    const c = +cIn.value;
    const nMax = +nMaxIn.value;
    setText("dct-alpha-v", alpha.toFixed(2));
    setText("dct-c-v", c.toFixed(1));
    setText("dct-nmax-v", String(nMax));

    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const padL = 56;
    const padR = 18;
    const padT = 18;
    const padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // x axis: ω from 0 to 1.  y axis: 0 to nMax + 5.
    const yMax = nMax + 5;
    const xToPx = (omega) => padL + omega * plotW;
    const yToPx = (y) => padT + (1 - y / yMax) * plotH;
    plotBox(ctx, padL, padT, plotW, plotH);

    // Grid
    ctx.strokeStyle = C.grid;
    for (let i = 1; i < 5; i++) {
      const x = padL + (i / 5) * plotW;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 5; i++) {
      const omega = i / 5;
      ctx.fillText(omega.toFixed(1), padL + (i / 5) * plotW, padT + plotH + 6);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const yv = (i / 4) * yMax;
      ctx.fillText(yv.toFixed(0), padL - 6, padT + (1 - i / 4) * plotH);
    }
    label(ctx, "ω", padL + plotW / 2, padT + plotH + 22, C.text, "center");
    label(ctx, "value", padL - 36, padT - 4, C.text, "left");

    // Draw X_n as stacked translucent rectangles: rect from omega=0 to 1/n, height = n.
    for (let n = 1; n <= nMax; n++) {
      const xLeft = xToPx(0);
      const xRight = xToPx(1 / n);
      const yTop = yToPx(n);
      const yBot = yToPx(0);
      ctx.fillStyle = `rgba(31, 74, 140, ${0.10 + 0.4 / n})`;
      ctx.fillRect(xLeft, yTop, xRight - xLeft, yBot - yTop);
    }

    // Draw the candidate envelope g(omega) = c * omega^(-alpha)
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    let started = false;
    const samples = 400;
    for (let i = 1; i <= samples; i++) {
      const omega = i / samples;
      const gv = c * Math.pow(omega, -alpha);
      if (!Number.isFinite(gv)) continue;
      const py = yToPx(clamp(gv, 0, yMax));
      const px = xToPx(omega);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Compute ∫ g dω = c * ∫_0^1 ω^(-α) dω = c/(1-α) if α<1, else ∞.
    const integral = alpha < 1 ? c / (1 - alpha) : Infinity;
    // Check domination for n = 1..nMax. g must satisfy g(ω) ≥ n on (0, 1/n], i.e.
    //   c * (1/n)^(-α) ≥ n  ⇔  c · n^α ≥ n  ⇔  c ≥ n^(1-α).
    // Tightest constraint is the largest n in view.
    const needed = Math.pow(nMax, 1 - alpha);
    const dominatesView = c >= needed;
    const dominatesAll = alpha >= 1; // need α >= 1 for all n, but then integral is ∞
    let verdict;
    if (!dominatesView) {
      verdict = `<span style="color:${C.red}">does NOT dominate $X_{${nMax}}$ (need $c \\geq ${needed.toFixed(2)}$)</span>`;
    } else if (!dominatesAll) {
      verdict = `<span style="color:${C.red}">dominates up to $n=${nMax}$ but fails for larger $n$ unless $\\alpha \\geq 1$</span>`;
    } else if (integral === Infinity) {
      verdict = `<span style="color:${C.red}">dominates all $X_n$ but $\\int g = \\infty$ — not integrable</span>`;
    } else {
      verdict = `<span style="color:${C.green}">looks dominating and integrable — but check larger $n$</span>`;
    }
    readoutRows("dct-readout", [
      ["candidate g(ω)", `${c.toFixed(2)} · ω^(−${alpha.toFixed(2)})`],
      ["∫₀¹ g dω", alpha < 1 ? integral.toFixed(3) : "∞"],
      [`g(ω) ≥ n on (0, 1/n] requires c ≥ n^(1−α)`, `at n=${nMax}: need c ≥ ${needed.toFixed(2)}`],
      ["verdict", verdict],
    ]);
    // Re-render math
    queueMicrotask(() => {
      if (pageWindow.renderMathInElement) {
        pageWindow.renderMathInElement(document.getElementById("dct-readout"), {
          throwOnError: false,
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
        });
      }
    });
  }

  alphaIn.addEventListener("input", draw);
  cIn.addEventListener("input", draw);
  nMaxIn.addEventListener("input", draw);
  window.addEventListener("resize", () => draw());

  draw();
})();

// ---- MCT (Figure 6) ------------------------------------------------------

(function mctFigure() {
  const canvas = document.getElementById("fig-mct");
  if (!canvas) return;
  const nIn = document.getElementById("mct-n");
  const fnIn = document.getElementById("mct-fn");
  const monoIn = document.getElementById("mct-mono");

  function f(omega, kind) {
    switch (kind) {
      case "slope":
        return 1.8 * omega;
      case "sin":
        return 1 + 0.7 * Math.sin(2 * Math.PI * omega);
      default:
        return 1.6 * Math.exp(-Math.pow((omega - 0.5) * 4, 2));
    }
  }

  function draw() {
    const n = +nIn.value;
    const kind = fnIn.value;
    const monotone = monoIn.checked;
    setText("mct-n-v", String(n));

    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h);
    const padL = 56;
    const padR = 18;
    const padT = 18;
    const padB = 36;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    // Bounds
    const samples = 400;
    let yMax = 0;
    for (let i = 0; i <= samples; i++) {
      yMax = Math.max(yMax, f(i / samples, kind));
    }
    yMax = yMax * 1.15 + 0.05;

    const xToPx = (omega) => padL + omega * plotW;
    const yToPx = (y) => padT + (1 - y / yMax) * plotH;
    plotBox(ctx, padL, padT, plotW, plotH);

    // Axes
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 5; i++) {
      ctx.fillText((i / 5).toFixed(1), padL + (i / 5) * plotW, padT + plotH + 6);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      ctx.fillText(((i / 4) * yMax).toFixed(2), padL - 6, padT + (1 - i / 4) * plotH);
    }
    label(ctx, "ω", padL + plotW / 2, padT + plotH + 22, C.text, "center");
    label(ctx, "value", padL - 36, padT - 4, C.text, "left");

    // f(omega) curve
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const omega = i / samples;
      const y = f(omega, kind);
      if (i === 0) ctx.moveTo(xToPx(omega), yToPx(y));
      else ctx.lineTo(xToPx(omega), yToPx(y));
    }
    ctx.stroke();

    // X_n: in monotone mode, X_n = f * 1_{[0, 1 - 1/n]}.
    // In non-monotone mode, X_n = f * 1_{[a, b]} with a random window of width 1/n.
    let intervalLo, intervalHi;
    if (monotone) {
      intervalLo = 0;
      intervalHi = 1 - 1 / Math.max(1, n);
    } else {
      const r = seeded(91 + n * 17);
      const width = 1 / n;
      intervalLo = r() * (1 - width);
      intervalHi = intervalLo + width;
    }
    // Fill under X_n
    ctx.fillStyle = "rgba(31, 74, 140, 0.32)";
    ctx.beginPath();
    ctx.moveTo(xToPx(intervalLo), yToPx(0));
    for (let i = 0; i <= samples; i++) {
      const omega = intervalLo + (i / samples) * (intervalHi - intervalLo);
      ctx.lineTo(xToPx(omega), yToPx(f(omega, kind)));
    }
    ctx.lineTo(xToPx(intervalHi), yToPx(0));
    ctx.closePath();
    ctx.fill();
    // Outline
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const omega = intervalLo + (i / samples) * (intervalHi - intervalLo);
      if (i === 0) ctx.moveTo(xToPx(omega), yToPx(f(omega, kind)));
      else ctx.lineTo(xToPx(omega), yToPx(f(omega, kind)));
    }
    ctx.stroke();

    // Compute E[f] and E[X_n] via Riemann sum.
    let intF = 0;
    let intX = 0;
    const dx = 1 / samples;
    for (let i = 0; i < samples; i++) {
      const omega = (i + 0.5) * dx;
      const fv = f(omega, kind);
      intF += fv * dx;
      if (omega >= intervalLo && omega <= intervalHi) intX += fv * dx;
    }

    readoutRows("mct-readout", [
      ["mode", monotone ? "monotone fill-up (MCT applies)" : "random window (MCT does not apply)"],
      ["E[f]", intF.toFixed(3)],
      [`E[X_${n}]`, intX.toFixed(3) + ` ${monotone ? `<span style="color:${C.green}">↑ toward E[f]</span>` : `<span style="color:${C.textDim}">— no monotone guarantee</span>`}`],
      ["interval", `[${intervalLo.toFixed(2)}, ${intervalHi.toFixed(2)}]  (width ${(intervalHi - intervalLo).toFixed(3)})`],
    ]);
  }

  nIn.addEventListener("input", draw);
  fnIn.addEventListener("change", draw);
  monoIn.addEventListener("change", draw);
  window.addEventListener("resize", () => draw());

  draw();
})();
