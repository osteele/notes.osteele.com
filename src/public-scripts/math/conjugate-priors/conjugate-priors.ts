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

function gammaPdf(x: number, shape: number, rate: number) {
  if (x <= 0) return 0;
  return Math.exp(shape * Math.log(rate) + (shape - 1) * Math.log(x) - rate * x - logGamma(shape));
}

function normalPdf(x: number, mean: number, sd: number) {
  return Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
}

function studentTPdf(x: number, df: number, loc: number, scale: number) {
  const z = (x - loc) / scale;
  return Math.exp(
    logGamma((df + 1) / 2) -
      logGamma(df / 2) -
      0.5 * Math.log(df * Math.PI) -
      Math.log(scale) -
      ((df + 1) / 2) * Math.log(1 + (z * z) / df),
  );
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

function drawUpdaterAxes(
  ctx: CanvasRenderingContext2D,
  padL: number,
  padT: number,
  plotW: number,
  plotH: number,
  xMin: number,
  xMax: number,
  yMax: number,
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
  for (let i = 0; i <= 5; i++) {
    const v = xMin + (i / 5) * (xMax - xMin);
    const x = padL + (i / 5) * plotW;
    ctx.fillText(v.toFixed(Math.abs(xMax - xMin) <= 1 ? 1 : 0), x, padT + plotH + 14);
  }
  ctx.fillStyle = C.text;
  ctx.fillText(xLabel, padL + plotW / 2, padT + plotH + 30);
  ctx.fillStyle = C.textDim;
  ctx.textAlign = "right";
  ctx.fillText(yMax.toFixed(2), padL - 6, padT + 8);
}

function plotDensityXY(
  ctx: CanvasRenderingContext2D,
  padL: number,
  padT: number,
  plotW: number,
  plotH: number,
  xMin: number,
  xMax: number,
  yMax: number,
  pts: Array<{ x: number; y: number }>,
  color: string,
  fillColor?: string,
  lineWidth = 2,
) {
  const xS = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
  const yS = (y: number) => padT + plotH - Math.min(1, y / yMax) * plotH;
  if (fillColor) {
    ctx.beginPath();
    ctx.moveTo(xS(pts[0].x), padT + plotH);
    for (const pt of pts) ctx.lineTo(xS(pt.x), yS(pt.y));
    ctx.lineTo(xS(pts[pts.length - 1].x), padT + plotH);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.beginPath();
  pts.forEach((pt, i) => {
    const x = xS(pt.x);
    const y = yS(pt.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function setupConjugateUpdater() {
  const canvas = document.getElementById("fig-conjugate-updater") as HTMLCanvasElement | null;
  if (!canvas) return;
  const familyInput = document.getElementById("fig-updater-family") as HTMLSelectElement;
  const strengthInput = document.getElementById("fig-updater-strength") as HTMLInputElement;
  const nInput = document.getElementById("fig-updater-n") as HTMLInputElement;
  const dataInput = document.getElementById("fig-updater-data") as HTMLInputElement;
  const familyV = document.getElementById("fig-updater-family-v");
  const strengthV = document.getElementById("fig-updater-strength-v");
  const nV = document.getElementById("fig-updater-n-v");
  const dataV = document.getElementById("fig-updater-data-v");
  const readout = document.getElementById("fig-updater-readout");

  function render() {
    const family = familyInput.value;
    const strength = parseFloat(strengthInput.value);
    const n = parseFloat(nInput.value);
    const data = parseFloat(dataInput.value);
    const label = familyInput.selectedOptions[0]?.textContent || family;
    if (familyV) familyV.textContent = label;
    if (strengthV) strengthV.textContent = strength.toFixed(0);
    if (nV) nV.textContent = n.toFixed(0);

    const { ctx, w, h } = setupCanvas(canvas);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 54, padR = 24, padT = 24, padB = 42;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const sampleCount = 360;

    let xMin = 0;
    let xMax = 1;
    let xLabel = "parameter";
    let dataMark = 0.5;
    let dataText = "";
    let readoutText = "";
    let priorPts: Array<{ x: number; y: number }> = [];
    let posteriorPts: Array<{ x: number; y: number }> = [];

    if (family === "bernoulli") {
      const priorMean = 0.35;
      const dataRate = data;
      const successes = n * dataRate;
      const alpha0 = 1 + priorMean * strength;
      const beta0 = 1 + (1 - priorMean) * strength;
      const alphaN = alpha0 + successes;
      const betaN = beta0 + n - successes;
      const xs = Array.from({ length: sampleCount }, (_, i) => (i + 0.5) / sampleCount);
      priorPts = xs.map((x) => ({ x, y: betaPdf(x, alpha0, beta0) }));
      posteriorPts = xs.map((x) => ({ x, y: betaPdf(x, alphaN, betaN) }));
      xLabel = "Bernoulli bias p";
      dataMark = dataRate;
      dataText = `success rate ${dataRate.toFixed(2)}`;
      readoutText = `Bernoulli: τ is success count. Prior Beta(${alpha0.toFixed(1)}, ${beta0.toFixed(1)}) plus ` +
        `${successes.toFixed(1)} successes in ${n.toFixed(0)} trials gives Beta(${alphaN.toFixed(1)}, ${betaN.toFixed(1)}).`;
    } else if (family === "poisson") {
      const priorRate = 2;
      const dataMean = data * 6;
      const exposure0 = Math.max(strength, 0.5);
      const alpha0 = Math.max(priorRate * exposure0, 0.5);
      const beta0 = exposure0;
      const alphaN = alpha0 + n * dataMean;
      const betaN = beta0 + n;
      xMin = 0;
      xMax = 8;
      const xs = Array.from({ length: sampleCount }, (_, i) => xMin + ((i + 0.5) / sampleCount) * (xMax - xMin));
      priorPts = xs.map((x) => ({ x, y: gammaPdf(x, alpha0, beta0) }));
      posteriorPts = xs.map((x) => ({ x, y: gammaPdf(x, alphaN, betaN) }));
      xLabel = "Poisson rate λ";
      dataMark = dataMean;
      dataText = `mean count ${dataMean.toFixed(2)}`;
      readoutText = `Poisson: τ is total count and ν is exposure. Prior Gamma(${alpha0.toFixed(1)}, ${beta0.toFixed(1)}) plus ` +
        `Σx=${(n * dataMean).toFixed(1)}, n=${n.toFixed(0)} gives Gamma(${alphaN.toFixed(1)}, ${betaN.toFixed(1)}).`;
    } else if (family === "normal") {
      const priorMean = -0.8;
      const sampleMean = -3 + data * 6;
      const priorPrecision = Math.max(strength, 0.2);
      const posteriorPrecision = priorPrecision + n;
      const posteriorMean = (priorPrecision * priorMean + n * sampleMean) / posteriorPrecision;
      xMin = -4;
      xMax = 4;
      const xs = Array.from({ length: sampleCount }, (_, i) => xMin + ((i + 0.5) / sampleCount) * (xMax - xMin));
      priorPts = xs.map((x) => ({ x, y: normalPdf(x, priorMean, Math.sqrt(1 / priorPrecision)) }));
      posteriorPts = xs.map((x) => ({ x, y: normalPdf(x, posteriorMean, Math.sqrt(1 / posteriorPrecision)) }));
      xLabel = "Normal mean μ";
      dataMark = sampleMean;
      dataText = `sample mean ${sampleMean.toFixed(2)}`;
      readoutText = `Normal known variance: τ is precision-weighted mean. Precision ${priorPrecision.toFixed(1)} + ` +
        `${n.toFixed(0)} gives posterior mean ${posteriorMean.toFixed(2)} and precision ${posteriorPrecision.toFixed(1)}.`;
    } else {
      const priorMean = 0;
      const sampleMean = -2.5 + data * 5;
      const sampleVar = 1;
      const kappa0 = Math.max(strength, 0.2);
      const alpha0 = Math.max(1, strength / 2);
      const beta0 = Math.max(1, strength / 2);
      const kappaN = kappa0 + n;
      const muN = (kappa0 * priorMean + n * sampleMean) / kappaN;
      const alphaN = alpha0 + n / 2;
      const betaN = beta0 + 0.5 * n * sampleVar + (kappa0 * n * (sampleMean - priorMean) ** 2) / (2 * kappaN);
      const priorScale = Math.sqrt((beta0 * (kappa0 + 1)) / (alpha0 * kappa0));
      const postScale = Math.sqrt((betaN * (kappaN + 1)) / (alphaN * kappaN));
      xMin = -5;
      xMax = 5;
      const xs = Array.from({ length: sampleCount }, (_, i) => xMin + ((i + 0.5) / sampleCount) * (xMax - xMin));
      priorPts = xs.map((x) => ({ x, y: studentTPdf(x, 2 * alpha0, priorMean, priorScale) }));
      posteriorPts = xs.map((x) => ({ x, y: studentTPdf(x, 2 * alphaN, muN, postScale) }));
      xLabel = "posterior predictive x*";
      dataMark = sampleMean;
      dataText = `sample mean ${sampleMean.toFixed(2)}`;
      readoutText = `Normal-Gamma: κ and α act like mean/variance pseudo-counts. Posterior predictive is Student-t with ` +
        `${(2 * alphaN).toFixed(0)} df; as n grows it tightens toward the Gaussian known-variance case.`;
    }

    if (dataV) dataV.textContent = dataText;
    const yMax = Math.max(0.1, ...priorPts.map((pt) => pt.y), ...posteriorPts.map((pt) => pt.y)) * 1.08;
    drawUpdaterAxes(ctx, padL, padT, plotW, plotH, xMin, xMax, yMax, xLabel);
    plotDensityXY(ctx, padL, padT, plotW, plotH, xMin, xMax, yMax, priorPts, C.prior, C.priorFill, 1.7);
    plotDensityXY(ctx, padL, padT, plotW, plotH, xMin, xMax, yMax, posteriorPts, C.posterior, C.posteriorFill, 2.3);
    drawVertical(ctx, padL, padT, plotW, plotH, (dataMark - xMin) / (xMax - xMin), C.likelihood, dataText, -6);
    if (readout) readout.textContent = readoutText;
  }

  for (const el of [familyInput, strengthInput, nInput, dataInput]) {
    el.addEventListener("input", render);
  }
  render();
  window.addEventListener("resize", render);
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


function setupAll() {
  setupConjugateUpdater();
  setupBetaBernoulli();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupAll);
} else {
  setupAll();
}
