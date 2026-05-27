// General CLT viz: for any of four base distributions (Uniform, Exponential,
// Bimodal mixture, Bernoulli), Monte-Carlo the density of the standardized
// sample mean Z_n = (mean_n − μ) · √n / σ as n grows. Watch the histogram
// approach N(0,1) regardless of the base shape.
//
// Two stacked panels:
//   top    — base distribution density (histogram of one batch of n samples)
//   bottom — standardized-sum density (histogram across 5000 trials) + N(0,1).

type Base = "uniform" | "exponential" | "bimodal" | "bernoulli";

interface BaseSpec {
  display: string;
  sample: (rng: () => number) => number;
  mean: number;
  std: number;
  xRange: [number, number]; // for top-panel histogram
}

const RNG_SEED = 0x9E3779B9;
function mulberry32(a: number) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASES: Record<Base, BaseSpec> = {
  uniform: {
    display: "Uniform(0, 1)",
    sample: (rng) => rng(),
    mean: 0.5,
    std: Math.sqrt(1 / 12),
    xRange: [0, 1],
  },
  exponential: {
    display: "Exponential(1) — heavily right-skewed",
    sample: (rng) => -Math.log(Math.max(rng(), 1e-12)),
    mean: 1,
    std: 1,
    xRange: [0, 6],
  },
  bimodal: {
    display: "Bimodal mixture — 0.5·N(−2, 0.3²) + 0.5·N(2, 0.3²)",
    sample: (rng) => {
      // Box–Muller for a standard normal.
      const u1 = Math.max(rng(), 1e-12);
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const which = rng() < 0.5 ? -2 : 2;
      return which + 0.3 * z;
    },
    mean: 0,
    // Variance: E[X²] − 0 = 0.5·(4 + 0.09) + 0.5·(4 + 0.09) = 4.09 → std ≈ 2.022
    std: Math.sqrt(4.09),
    xRange: [-4, 4],
  },
  bernoulli: {
    display: "Bernoulli(0.3) — discrete, asymmetric",
    sample: (rng) => (rng() < 0.3 ? 1 : 0),
    mean: 0.3,
    std: Math.sqrt(0.3 * 0.7),
    xRange: [-0.4, 1.4],
  },
};

const COL = {
  bg: "#ffffff",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  grid: "#e3ddd0",
  baseFill: "rgba(212, 105, 10, 0.32)",
  baseEdge: "#d4690a",
  sumFill: "rgba(31, 74, 140, 0.30)",
  sumEdge: "#1f4a8c",
  normal: "#b8412a",
  divider: "#c9c0a8",
};

function init() {
  const canvas = document.getElementById("fig-clt") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width") || "800", 10);
  const intrinsicH = parseInt(canvas.getAttribute("height") || "480", 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  const w = rect.width;
  const h = rect.height;

  const nIn = document.getElementById("fig-clt-n") as HTMLInputElement | null;
  const nV = document.getElementById("fig-clt-n-v") as HTMLElement | null;
  const readout = document.getElementById("clt-readout") as HTMLElement | null;
  if (!nIn || !nV || !readout) return;

  let base: Base = "exponential";
  let nSummands = parseInt(nIn.value, 10);
  const N_TRIALS = 5000;

  function buildHistogram(xs: number[], xMin: number, xMax: number, nBins: number) {
    const bins = new Array<number>(nBins).fill(0);
    const dx = (xMax - xMin) / nBins;
    for (const x of xs) {
      if (x < xMin || x > xMax) continue;
      let i = Math.floor((x - xMin) / dx);
      if (i === nBins) i = nBins - 1;
      bins[i]++;
    }
    // Normalize as density.
    const total = xs.length || 1;
    return bins.map((c) => c / (total * dx));
  }

  function normalPdf(x: number) {
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  }

  function render() {
    nV!.textContent = String(nSummands);
    const spec = BASES[base];
    const rng = mulberry32(RNG_SEED ^ (nSummands * 0x9E37) ^ base.length * 7919);

    // Sample one big batch from the base for the top panel.
    const baseBatch: number[] = [];
    for (let i = 0; i < 5000; i++) baseBatch.push(spec.sample(rng));

    // Build N_TRIALS standardized means.
    const zs: number[] = [];
    for (let t = 0; t < N_TRIALS; t++) {
      let sum = 0;
      for (let j = 0; j < nSummands; j++) sum += spec.sample(rng);
      const mean = sum / nSummands;
      // Z_n = (mean − μ) · √n / σ
      const z = (mean - spec.mean) * Math.sqrt(nSummands) / spec.std;
      zs.push(z);
    }

    // Layout.
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, w, h);

    const padL = 56, padR = 18, padT = 26, padB = 32;
    const gap = 36;
    const innerW = w - padL - padR;
    const panelH = (h - padT - padB - gap) / 2;
    const topY = padT;
    const botY = padT + panelH + gap;

    // ---- top panel: base distribution histogram ----
    const [bMin, bMax] = spec.xRange;
    const bBins = buildHistogram(baseBatch, bMin, bMax, base === "bernoulli" ? 12 : 36);
    const bMax2 = Math.max(...bBins, 1e-6) * 1.15;
    const tXS = (x: number) => padL + ((x - bMin) / (bMax - bMin)) * innerW;
    const tYS = (y: number) => topY + panelH - (y / bMax2) * panelH;
    drawPanelFrame(ctx, padL, topY, innerW, panelH);
    ctx.fillStyle = COL.text;
    ctx.font = "12px Inter, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Base distribution:  ${spec.display}`, padL, topY - 8);
    // Bars.
    const binW = innerW / bBins.length;
    ctx.fillStyle = COL.baseFill;
    ctx.strokeStyle = COL.baseEdge;
    ctx.lineWidth = 1;
    for (let i = 0; i < bBins.length; i++) {
      const x = padL + i * binW;
      const y = tYS(bBins[i]);
      ctx.fillRect(x, y, binW, topY + panelH - y);
      ctx.strokeRect(x, y, binW, topY + panelH - y);
    }
    drawXAxis(ctx, padL, topY + panelH, innerW, bMin, bMax, 6, false);
    drawYLabel(ctx, padL, topY + panelH / 2, "p(x)");

    // ---- bottom panel: standardized sum histogram + N(0,1) ----
    const zMin = -4, zMax = 4;
    const zBins = buildHistogram(zs, zMin, zMax, 48);
    const yMax = Math.max(normalPdf(0) * 1.18, Math.max(...zBins) * 1.05);
    const sXS = (x: number) => padL + ((x - zMin) / (zMax - zMin)) * innerW;
    const sYS = (y: number) => botY + panelH - (y / yMax) * panelH;
    drawPanelFrame(ctx, padL, botY, innerW, panelH);
    ctx.fillStyle = COL.text;
    ctx.textAlign = "left";
    ctx.fillText(
      `Standardized sample mean Z_n = (mean_n − μ) · √n / σ,  n = ${nSummands}`,
      padL, botY - 8,
    );
    const binW2 = innerW / zBins.length;
    ctx.fillStyle = COL.sumFill;
    ctx.strokeStyle = COL.sumEdge;
    ctx.lineWidth = 1;
    for (let i = 0; i < zBins.length; i++) {
      const x = padL + i * binW2;
      const y = sYS(zBins[i]);
      ctx.fillRect(x, y, binW2, botY + panelH - y);
      ctx.strokeRect(x, y, binW2, botY + panelH - y);
    }
    // N(0,1) curve.
    ctx.beginPath();
    const N = 250;
    for (let i = 0; i <= N; i++) {
      const x = zMin + ((zMax - zMin) * i) / N;
      const px = sXS(x), py = sYS(normalPdf(x));
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = COL.normal;
    ctx.lineWidth = 2;
    ctx.stroke();

    drawXAxis(ctx, padL, botY + panelH, innerW, zMin, zMax, 8, true);
    drawYLabel(ctx, padL, botY + panelH / 2, "density");
    // x-axis title under bottom panel.
    ctx.fillStyle = COL.textDim;
    ctx.font = "11px Inter, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Z_n", padL + innerW / 2, botY + panelH + 28);

    // Empirical moments readout.
    const mean = zs.reduce((s, v) => s + v, 0) / zs.length;
    const variance = zs.reduce((s, v) => s + (v - mean) * (v - mean), 0) / zs.length;
    readout!.innerHTML =
      `Base: <strong>${spec.display}</strong>. ` +
      `n = <strong>${nSummands}</strong>, trials = ${N_TRIALS}. ` +
      `Empirical mean of Z_n = <strong>${mean.toFixed(3)}</strong>, ` +
      `empirical variance = <strong>${variance.toFixed(3)}</strong> ` +
      `(target: 0 and 1).`;
  }

  function drawPanelFrame(ctx2: CanvasRenderingContext2D, x: number, y: number, ww: number, hh: number) {
    ctx2.strokeStyle = COL.axis;
    ctx2.lineWidth = 1;
    ctx2.strokeRect(x, y, ww, hh);
    ctx2.strokeStyle = COL.grid;
    for (let i = 1; i < 5; i++) {
      const py = y + (i / 5) * hh;
      ctx2.beginPath();
      ctx2.moveTo(x, py); ctx2.lineTo(x + ww, py);
      ctx2.stroke();
    }
  }
  function drawXAxis(
    ctx2: CanvasRenderingContext2D, x: number, y: number, ww: number,
    xMin: number, xMax: number, nTicks: number, isStandardized: boolean,
  ) {
    ctx2.fillStyle = COL.textDim;
    ctx2.font = "11px -apple-system, sans-serif";
    ctx2.textAlign = "center";
    for (let i = 0; i <= nTicks; i++) {
      const v = xMin + ((xMax - xMin) * i) / nTicks;
      const px = x + (i / nTicks) * ww;
      ctx2.fillText(isStandardized ? v.toFixed(0) : v.toFixed(1), px, y + 14);
    }
  }
  function drawYLabel(ctx2: CanvasRenderingContext2D, x: number, y: number, label: string) {
    ctx2.save();
    ctx2.translate(14, y);
    ctx2.rotate(-Math.PI / 2);
    ctx2.fillStyle = COL.text;
    ctx2.font = "11px -apple-system, sans-serif";
    ctx2.textAlign = "center";
    ctx2.fillText(label, 0, 0);
    ctx2.restore();
  }

  // Wire controls.
  document.querySelectorAll<HTMLButtonElement>(".clt-base").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".clt-base").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      base = (btn.dataset.base as Base) || "uniform";
      render();
    });
  });
  nIn.addEventListener("input", () => {
    nSummands = parseInt(nIn.value, 10);
    render();
  });

  // Default-active button: exponential.
  document.querySelectorAll(".clt-base").forEach((b) => b.classList.remove("active"));
  const def = document.querySelector('.clt-base[data-base="exponential"]');
  if (def) def.classList.add("active");

  render();
  window.addEventListener("resize", render);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
