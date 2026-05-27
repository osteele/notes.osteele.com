"use strict";

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  flat: "#1f4a8c",
  jeffreys: "#2d7a3e",
  haldane: "#b8412a",
};

function setupCanvas(canvas: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width") || "780", 10);
  const intrinsicH = parseInt(canvas.getAttribute("height") || "360", 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

function logGamma(z: number) {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = p[0];
  for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
const logBeta = (a: number, b: number) => logGamma(a) + logGamma(b) - logGamma(a + b);
function betaPdf(x: number, a: number, b: number) {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b));
}
// Density of Beta(a,b) in logit-coordinates eta = log p/(1-p):
// p = sigmoid(eta), 1-p = sigmoid(-eta), dp/deta = p(1-p)
// so f_eta(eta) = f_p(p) * p(1-p)
function betaPdfLogit(eta: number, a: number, b: number) {
  const p = 1 / (1 + Math.exp(-eta));
  if (p <= 0 || p >= 1) return 0;
  return betaPdf(p, a, b) * p * (1 - p);
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  padL: number,
  padT: number,
  plotW: number,
  plotH: number,
  xMin: number,
  xMax: number,
  xLabel: string,
) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const x = padL + (i / 10) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();
  ctx.fillStyle = C.textDim;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i <= 10; i += 2) {
    const v = xMin + (i / 10) * (xMax - xMin);
    const px = padL + (i / 10) * plotW;
    const txt = Math.abs(xMax - xMin) > 3 ? v.toFixed(1) : v.toFixed(2);
    ctx.fillText(txt, px, padT + plotH + 14);
  }
  ctx.fillStyle = C.text;
  ctx.fillText(xLabel, padL + plotW / 2, padT + plotH + 30);
  ctx.save();
  ctx.translate(14, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("density", 0, 0);
  ctx.restore();
}

function plotCurve(
  ctx: CanvasRenderingContext2D,
  padL: number,
  padT: number,
  plotW: number,
  plotH: number,
  yMax: number,
  pts: number[],
  color: string,
  lineWidth = 2,
  dash: number[] = [],
) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = padL + (i / (pts.length - 1)) * plotW;
    const y = padT + plotH - Math.min(1, pts[i] / yMax) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.setLineDash([]);
}

function setupThreePriors() {
  const canvas = document.getElementById("fig-three-priors") as HTMLCanvasElement | null;
  if (!canvas) return;
  const coordSel = document.getElementById("fig-three-coord") as HTMLSelectElement;
  const nInput = document.getElementById("fig-three-n") as HTMLInputElement;
  const kInput = document.getElementById("fig-three-k") as HTMLInputElement;
  const nV = document.getElementById("fig-three-n-v");
  const kV = document.getElementById("fig-three-k-v");
  const readout = document.getElementById("fig-three-readout");

  // Haldane prior is improper Beta(0,0); we visualize with a small epsilon so the
  // posterior after >=1 success and >=1 failure is the proper Beta(k, n-k).
  const HALDANE_EPS = 0.02;

  function render() {
    const coord = coordSel.value;
    let n = parseInt(nInput.value, 10);
    kInput.max = String(n);
    let k = parseInt(kInput.value, 10);
    if (k > n) { kInput.value = String(n); k = n; }
    if (nV) nV.textContent = String(n);
    if (kV) kV.textContent = String(k);

    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 50, padR = 24, padT = 24, padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const N = 400;
    let xs: number[];
    let evals: (a: number, b: number) => number[];
    let xLabel: string, xMin: number, xMax: number;
    if (coord === "p") {
      xMin = 0; xMax = 1;
      xLabel = "p";
      xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
      evals = (a, b) => xs.map((x) => betaPdf(x, a, b));
    } else {
      xMin = -5; xMax = 5;
      xLabel = "logit p = log p/(1-p)";
      xs = Array.from({ length: N }, (_, i) => xMin + ((i + 0.5) / N) * (xMax - xMin));
      evals = (a, b) => xs.map((eta) => betaPdfLogit(eta, a, b));
    }

    // Posterior parameters: Beta(prior_a + k, prior_b + n - k)
    const flatA = 1, flatB = 1;
    const jeffA = 0.5, jeffB = 0.5;
    const haldA = HALDANE_EPS, haldB = HALDANE_EPS;

    const flatPts = evals(flatA + k, flatB + n - k);
    const jeffPts = evals(jeffA + k, jeffB + n - k);
    const haldPts = evals(haldA + k, haldB + n - k);

    // Cap density display so a spiky prior doesn't squash everything else.
    const yCap = coord === "p" ? 6 : 1.0;
    const yMax = Math.min(
      yCap,
      Math.max(1.0, ...flatPts, ...jeffPts, ...haldPts) * 1.05,
    );

    drawAxes(ctx, padL, padT, plotW, plotH, xMin, xMax, xLabel);
    plotCurve(ctx, padL, padT, plotW, plotH, yMax, flatPts, C.flat, 2);
    plotCurve(ctx, padL, padT, plotW, plotH, yMax, jeffPts, C.jeffreys, 2);
    plotCurve(ctx, padL, padT, plotW, plotH, yMax, haldPts, C.haldane, 2, [4, 3]);

    if (readout) {
      if (n === 0) {
        readout.innerHTML = `Showing the three priors (no data). In p-coordinates: flat is uniform, Jeffreys is U-shaped near the boundaries, Haldane is essentially a spike on {0, 1}. Switch to log-odds: flat becomes peaked at 0, Jeffreys becomes flat (its defining invariance), Haldane spreads out over ℝ.`;
      } else {
        const flatMean = (flatA + k) / (flatA + flatB + n);
        const jeffMean = (jeffA + k) / (jeffA + jeffB + n);
        const haldMean = (haldA + k) / (haldA + haldB + n);
        readout.innerHTML = `Posteriors after n=${n}, k=${k}. Posterior means: flat ${flatMean.toFixed(3)}, Jeffreys ${jeffMean.toFixed(3)}, Haldane ${haldMean.toFixed(3)}. MLE ${(k / n).toFixed(3)}. Disagreement is largest near the boundaries.`;
      }
    }
  }

  function setPreset(name: string) {
    if (name === "none") { nInput.value = "0"; kInput.value = "0"; }
    else if (name === "small") { nInput.value = "4"; kInput.value = "3"; }
    else if (name === "boundary") { nInput.value = "8"; kInput.value = "8"; }
    else if (name === "large") { nInput.value = "40"; kInput.value = "22"; }
    render();
  }

  coordSel.addEventListener("change", render);
  nInput.addEventListener("input", render);
  kInput.addEventListener("input", render);
  document.querySelectorAll<HTMLButtonElement>("[data-fig-three-preset]").forEach((b) => {
    b.addEventListener("click", () => setPreset(b.dataset.figThreePreset || ""));
  });

  render();
  window.addEventListener("resize", render);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupThreePriors);
} else {
  setupThreePriors();
}
