"use strict";

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  prior: "#bfb9aa",
  priorFill: "rgba(191,185,170,0.55)",
  posterior: "#2d7a3e",
  posteriorFill: "rgba(45,122,62,0.18)",
  likelihood: "#1f4a8c",
  mle: "#b8412a",
  postMean: "#6b4592",
};

function setupCanvas(canvas: HTMLCanvasElement) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width") || "780", 10);
  const intrinsicH = parseInt(canvas.getAttribute("height") || "380", 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

// Log-Gamma via Lanczos.
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

function logBeta(a: number, b: number) {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

function betaPdf(x: number, a: number, b: number) {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b));
}

function drawAxes(ctx: CanvasRenderingContext2D, padL: number, padT: number, plotW: number, plotH: number, yMax: number) {
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
    const v = i / 10;
    const px = padL + (i / 10) * plotW;
    ctx.fillText(v.toFixed(1), px, padT + plotH + 14);
  }
  ctx.fillStyle = C.text;
  ctx.fillText("bias p", padL + plotW / 2, padT + plotH + 30);
  ctx.save();
  ctx.translate(14, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("density", 0, 0);
  ctx.restore();
  // y-axis tick at peak
  ctx.textAlign = "right";
  ctx.fillStyle = C.textDim;
  ctx.fillText(yMax.toFixed(2), padL - 6, padT + 8);
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
  fillColor?: string,
  lineWidth = 2,
) {
  const n = pts.length;
  if (fillColor) {
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH);
    for (let i = 0; i < n; i++) {
      const x = padL + (i / (n - 1)) * plotW;
      const y = padT + plotH - Math.min(1, pts[i] / yMax) * plotH;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = padL + (i / (n - 1)) * plotW;
    const y = padT + plotH - Math.min(1, pts[i] / yMax) * plotH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawVertical(
  ctx: CanvasRenderingContext2D,
  padL: number,
  padT: number,
  plotW: number,
  plotH: number,
  xFrac: number,
  color: string,
  label: string,
  labelOffsetY = -6,
) {
  const x = padL + xFrac * plotW;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, padT);
  ctx.lineTo(x, padT + plotH);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, padT + labelOffsetY);
}

function setupBetaBernoulli() {
  const canvas = document.getElementById("fig-beta-bernoulli") as HTMLCanvasElement | null;
  if (!canvas) return;
  const alphaInput = document.getElementById("fig-beta-alpha") as HTMLInputElement;
  const betaInput = document.getElementById("fig-beta-beta") as HTMLInputElement;
  const nInput = document.getElementById("fig-beta-n") as HTMLInputElement;
  const kInput = document.getElementById("fig-beta-k") as HTMLInputElement;
  const alphaV = document.getElementById("fig-beta-alpha-v");
  const betaV = document.getElementById("fig-beta-beta-v");
  const nV = document.getElementById("fig-beta-n-v");
  const kV = document.getElementById("fig-beta-k-v");
  const readout = document.getElementById("fig-beta-readout");

  function clampK() {
    const n = parseInt(nInput.value, 10);
    kInput.max = String(n);
    let k = parseInt(kInput.value, 10);
    if (k > n) {
      kInput.value = String(n);
      k = n;
    }
    return { n, k };
  }

  function render() {
    const alpha = parseFloat(alphaInput.value);
    const beta = parseFloat(betaInput.value);
    const { n, k } = clampK();
    if (alphaV) alphaV.textContent = alpha.toFixed(1);
    if (betaV) betaV.textContent = beta.toFixed(1);
    if (nV) nV.textContent = String(n);
    if (kV) kV.textContent = String(k);

    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 50, padR = 24, padT = 24, padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const N = 320;
    const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N);
    const priorPts = xs.map((x) => betaPdf(x, Math.max(alpha, 0.0001), Math.max(beta, 0.0001)));
    const postPts = xs.map((x) => betaPdf(x, alpha + k, beta + (n - k)));

    // Likelihood as binomial PMF in p, normalized so its peak matches the others for readability.
    const likRaw = xs.map((x) => {
      if (n === 0) return 0;
      // proportional to p^k (1-p)^(n-k); normalize as Beta(k+1, n-k+1) for shape
      return betaPdf(x, k + 1, n - k + 1);
    });

    const yMax = Math.max(
      ...priorPts,
      ...postPts,
      ...likRaw,
      1.5,
    );
    const yMaxPad = yMax * 1.05;

    drawAxes(ctx, padL, padT, plotW, plotH, yMaxPad);
    if (n > 0) plotCurve(ctx, padL, padT, plotW, plotH, yMaxPad, likRaw, C.likelihood, undefined, 1.5);
    plotCurve(ctx, padL, padT, plotW, plotH, yMaxPad, priorPts, C.prior, C.priorFill, 1.5);
    plotCurve(ctx, padL, padT, plotW, plotH, yMaxPad, postPts, C.posterior, C.posteriorFill, 2.2);

    const mle = n === 0 ? 0.5 : k / n;
    const postMean = (alpha + k) / (alpha + beta + n);
    if (n > 0) drawVertical(ctx, padL, padT, plotW, plotH, mle, C.mle, `MLE ${mle.toFixed(2)}`);
    drawVertical(ctx, padL, padT, plotW, plotH, postMean, C.postMean, `mean ${postMean.toFixed(2)}`);

    if (readout) {
      const priorMean = alpha / (alpha + beta);
      const wData = n / (alpha + beta + n);
      const pseudoHeads = (alpha - 1).toFixed(1);
      const pseudoTails = (beta - 1).toFixed(1);
      readout.innerHTML = `Prior Beta(${alpha.toFixed(1)}, ${beta.toFixed(1)}) → posterior Beta(${(alpha + k).toFixed(1)}, ${(beta + n - k).toFixed(1)}). ` +
        `Prior is worth ${pseudoHeads} pseudo-heads + ${pseudoTails} pseudo-tails (effective sample size ${(alpha + beta - 2).toFixed(1)}). ` +
        `Posterior mean ${postMean.toFixed(3)} = ${(wData * 100).toFixed(0)}% × MLE + ${((1 - wData) * 100).toFixed(0)}% × prior mean (${priorMean.toFixed(3)}).`;
    }
  }

  function setPreset(name: string) {
    if (name === "flat") {
      alphaInput.value = "1";
      betaInput.value = "1";
    } else if (name === "jeffreys") {
      alphaInput.value = "0.5";
      betaInput.value = "0.5";
    } else if (name === "haldane") {
      alphaInput.value = "0.5";
      betaInput.value = "0.5";
      // Haldane is α,β → 0; we approximate with smallest slider value.
    } else if (name === "strong-fair") {
      alphaInput.value = "10";
      betaInput.value = "10";
    } else if (name === "strong-biased") {
      alphaInput.value = "1";
      betaInput.value = "10";
    }
    render();
  }

  for (const el of [alphaInput, betaInput, nInput, kInput]) {
    el.addEventListener("input", render);
  }
  document.querySelectorAll<HTMLButtonElement>("[data-fig-beta-preset]").forEach((b) => {
    b.addEventListener("click", () => setPreset(b.dataset.figBetaPreset || ""));
  });

  render();
  window.addEventListener("resize", render);
}


if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupBetaBernoulli);
} else {
  setupBetaBernoulli();
}
