"use strict";

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  null0: "#1f4a8c",
  null0Fill: "rgba(31,74,140,0.35)",
  alt1: "#b8412a",
  alt1Fill: "rgba(184,65,42,0.35)",
  purple: "#6b4592",
  green: "#2d7a3e",
  diag: "#9aa3b2",
  threshold: "#111827",
};

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width"), 10);
  const intrinsicH = parseInt(canvas.getAttribute("height"), 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, w: rect.width, h: rect.height };
}

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return sign * y;
}
const normalPdf = (x, m = 0, s = 1) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
const normalCdf = (x, m = 0, s = 1) => 0.5 * (1 + erf((x - m) / (s * Math.SQRT2)));

function drawGridX(ctx, padL, padT, plotW, plotH, ticks) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= ticks; i++) {
    const x = padL + (i / ticks) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
  }
}

function drawAxisLabels(ctx, padL, padT, plotW, plotH, xMin, xMax, xLabel, yLabel, yTicks, yMin, yMax) {
  ctx.fillStyle = C.textDim;
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "center";
  for (let i = 0; i <= 5; i++) {
    const v = xMin + (i / 5) * (xMax - xMin);
    const px = padL + (i / 5) * plotW;
    ctx.fillText(v.toFixed(1), px, padT + plotH + 14);
  }
  ctx.textAlign = "right";
  for (let i = 0; i <= yTicks; i++) {
    const v = yMin + (i / yTicks) * (yMax - yMin);
    const py = padT + plotH - (i / yTicks) * plotH;
    ctx.fillText(v.toFixed(yMax - yMin < 5 ? 2 : 1), padL - 6, py + 3);
  }
  ctx.fillStyle = C.text;
  ctx.textAlign = "center";
  ctx.fillText(xLabel, padL + plotW / 2, padT + plotH + 30);
  ctx.save();
  ctx.translate(14, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();
}

// ────────────────────────────────────────────────────────────────────────
// Figure 1: α/β overlap (existing)
// ────────────────────────────────────────────────────────────────────────
(function fig1() {
  const canvas = document.getElementById("fig-alpha-beta");
  if (!canvas) return;
  const effectIn = document.getElementById("ab-effect");
  const thresholdIn = document.getElementById("ab-threshold");
  const effectV = document.getElementById("ab-effect-v");
  const thresholdV = document.getElementById("ab-threshold-v");
  const readout = document.getElementById("alpha-beta-readout");

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const effect = +effectIn.value;
    const threshold = +thresholdIn.value;
    effectV.textContent = effect.toFixed(2);
    thresholdV.textContent = threshold.toFixed(2);
    const xMin = -4, xMax = 7;
    const padL = 48, padR = 22, padT = 24, padB = 42;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const yS = (d) => padT + plotH - d / 0.45 * plotH;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    drawGridX(ctx, padL, padT, plotW, plotH, 10);

    function fillArea(fn, from, to, color) {
      ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const x = from + (i / 180) * (to - from);
        const px = xS(x), py = yS(fn(x));
        if (i === 0) ctx.moveTo(px, yS(0));
        else ctx.lineTo(px, py);
      }
      ctx.lineTo(xS(to), yS(0));
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    fillArea((x) => normalPdf(x, 0, 1), threshold, xMax, C.null0Fill);
    fillArea((x) => normalPdf(x, effect, 1), xMin, threshold, C.alt1Fill);

    const densityCurves: Array<[number, string]> = [[0, C.null0], [effect, C.alt1]];
    for (const [mean, color] of densityCurves) {
      ctx.beginPath();
      for (let i = 0; i <= 260; i++) {
        const x = xMin + (i / 260) * (xMax - xMin);
        const px = xS(x), py = yS(normalPdf(x, mean, 1));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.stroke();
    }
    ctx.strokeStyle = C.threshold;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(xS(threshold), padT);
    ctx.lineTo(xS(threshold), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("reject H0", xS(threshold) + 54, padT + 18);
    ctx.fillText("fail to reject", xS(threshold) - 62, padT + 18);

    const alpha = 1 - normalCdf(threshold, 0, 1);
    const beta = normalCdf(threshold, effect, 1);
    readout.innerHTML =
      `<div class="row"><span class="lbl">type-I error α</span><span>${alpha.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">type-II error β</span><span>${beta.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">power 1−β</span><span>${(1 - beta).toFixed(3)}</span></div>`;
  }
  [effectIn, thresholdIn].forEach((input) => input.addEventListener("input", draw));
  document.querySelectorAll("[data-ab-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const p = button.dataset.abPreset;
      if (p === "five") { thresholdIn.value = "1.64"; effectIn.value = "1.4"; }
      if (p === "strict") { thresholdIn.value = "2.33"; effectIn.value = "1.4"; }
      if (p === "weak") { thresholdIn.value = "1.64"; effectIn.value = "0.7"; }
      if (p === "strong") { thresholdIn.value = "1.64"; effectIn.value = "2.6"; }
      draw();
    });
  });
  draw();
  window.addEventListener("resize", draw);
})();

// ────────────────────────────────────────────────────────────────────────
// Figure 2: likelihood-ratio curve
// log Λ(x) = μx − μ²/2 for two unit-variance Gaussians
// Rejection region: x > x*, where x* = (log k)/μ + μ/2 (assuming μ > 0)
// ────────────────────────────────────────────────────────────────────────
(function fig2() {
  const canvas = document.getElementById("fig-lr");
  if (!canvas) return;
  const effectIn = document.getElementById("lr-effect");
  const logkIn = document.getElementById("lr-logk");
  const effectV = document.getElementById("lr-effect-v");
  const logkV = document.getElementById("lr-logk-v");
  const readout = document.getElementById("lr-readout");

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const mu = +effectIn.value;
    const logk = +logkIn.value;
    effectV.textContent = mu.toFixed(2);
    logkV.textContent = logk.toFixed(2);

    const xMin = -4, xMax = 7;
    const yMin = -6, yMax = 8;
    const padL = 52, padR = 22, padT = 24, padB = 42;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;
    const yS = (y) => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    drawGridX(ctx, padL, padT, plotW, plotH, 11);

    // zero line
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, yS(0));
    ctx.lineTo(padL + plotW, yS(0));
    ctx.stroke();

    // Rejection region: x > x*
    const xStar = mu > 1e-6 ? logk / mu + mu / 2 : Infinity;
    const xStarClipped = Math.max(xMin, Math.min(xMax, xStar));

    // Shade alpha band (P0 mass over rejection region) along the bottom strip
    if (xStar < xMax) {
      const bandTop = padT + plotH - 18;
      const bandBot = padT + plotH;
      ctx.fillStyle = C.null0Fill;
      ctx.fillRect(xS(xStarClipped), bandTop, xS(xMax) - xS(xStarClipped), bandBot - bandTop);
      ctx.fillStyle = C.alt1Fill;
      ctx.fillRect(xS(xMin), bandTop, xS(xStarClipped) - xS(xMin), bandBot - bandTop);
    } else {
      const bandTop = padT + plotH - 18;
      const bandBot = padT + plotH;
      ctx.fillStyle = C.alt1Fill;
      ctx.fillRect(xS(xMin), bandTop, xS(xMax) - xS(xMin), bandBot - bandTop);
    }

    // log Λ(x) curve (a straight line for Gaussians; draw as polyline to share style)
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const lr = mu * x - (mu * mu) / 2;
      const px = xS(x), py = yS(Math.max(yMin, Math.min(yMax, lr)));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Threshold line at log k
    ctx.strokeStyle = C.threshold;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, yS(logk));
    ctx.lineTo(padL + plotW, yS(logk));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("log k", padL + plotW - 38, yS(logk) - 6);

    // Vertical at x*
    if (xStar > xMin && xStar < xMax) {
      ctx.strokeStyle = C.threshold;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(xS(xStar), padT);
      ctx.lineTo(xS(xStar), padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = "center";
      ctx.fillText("x*", xS(xStar), padT + 12);
    }

    drawAxisLabels(ctx, padL, padT, plotW, plotH, xMin, xMax, "x", "log Λ(x)", 7, yMin, yMax);

    // Readout
    const alpha = mu > 1e-6 ? 1 - normalCdf(xStar, 0, 1) : 1;
    const beta = mu > 1e-6 ? normalCdf(xStar, mu, 1) : 0;
    readout.innerHTML =
      `<div class="row"><span class="lbl">k</span><span>${Math.exp(logk).toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">x* (rejection boundary)</span><span>${isFinite(xStar) ? xStar.toFixed(3) : "—"}</span></div>` +
      `<div class="row"><span class="lbl">α</span><span>${alpha.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">β</span><span>${beta.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">power 1−β</span><span>${(1 - beta).toFixed(3)}</span></div>`;
  }
  [effectIn, logkIn].forEach((input) => input.addEventListener("input", draw));
  draw();
  window.addEventListener("resize", draw);
})();

// ────────────────────────────────────────────────────────────────────────
// Figure 3: ROC curve
// ────────────────────────────────────────────────────────────────────────
(function fig3() {
  const canvas = document.getElementById("fig-roc");
  if (!canvas) return;
  const effectIn = document.getElementById("roc-effect");
  const thresholdIn = document.getElementById("roc-threshold");
  const effectV = document.getElementById("roc-effect-v");
  const thresholdV = document.getElementById("roc-threshold-v");
  const readout = document.getElementById("roc-readout");

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const mu = +effectIn.value;
    const t = +thresholdIn.value;
    effectV.textContent = mu.toFixed(2);
    thresholdV.textContent = t.toFixed(2);

    const padL = 52, padR = 22, padT = 24, padB = 42;
    const size = Math.min(w - padL - padR, h - padT - padB);
    const plotW = size;
    const plotH = size;
    const xS = (a) => padL + a * plotW;
    const yS = (p) => padT + plotH - p * plotH;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(xS(i / 10), padT);
      ctx.lineTo(xS(i / 10), padT + plotH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padL, yS(i / 10));
      ctx.lineTo(padL + plotW, yS(i / 10));
      ctx.stroke();
    }

    // chance diagonal
    ctx.strokeStyle = C.diag;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xS(0), yS(0));
    ctx.lineTo(xS(1), yS(1));
    ctx.stroke();
    ctx.setLineDash([]);

    // ROC curve
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const tt = -6 + (i / N) * 16; // threshold sweep
      const alpha = 1 - normalCdf(tt, 0, 1);
      const power = 1 - normalCdf(tt, mu, 1);
      const px = xS(alpha), py = yS(power);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Operating point at current threshold
    const alphaT = 1 - normalCdf(t, 0, 1);
    const powerT = 1 - normalCdf(t, mu, 1);
    ctx.fillStyle = C.alt1;
    ctx.beginPath();
    ctx.arc(xS(alphaT), yS(powerT), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.threshold;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(xS(alphaT), padT);
    ctx.lineTo(xS(alphaT), padT + plotH);
    ctx.moveTo(padL, yS(powerT));
    ctx.lineTo(padL + plotW, yS(powerT));
    ctx.stroke();

    drawAxisLabels(ctx, padL, padT, plotW, plotH, 0, 1, "false-positive rate α", "power 1 − β", 10, 0, 1);

    const auc = normalCdf(mu / Math.SQRT2, 0, 1);
    readout.innerHTML =
      `<div class="row"><span class="lbl">α at threshold</span><span>${alphaT.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">power 1−β at threshold</span><span>${powerT.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">AUC = Φ(μ/√2)</span><span>${auc.toFixed(3)}</span></div>`;
  }
  [effectIn, thresholdIn].forEach((input) => input.addEventListener("input", draw));
  draw();
  window.addEventListener("resize", draw);
})();

// ────────────────────────────────────────────────────────────────────────
// Figure 4: Bayes risk vs threshold
// R(t) = π0 c_I α(t) + π1 c_II β(t)
// Optimal: t* = log((π0 c_I) / (π1 c_II)) / μ + μ/2
// ────────────────────────────────────────────────────────────────────────
(function fig4() {
  const canvas = document.getElementById("fig-bayes");
  if (!canvas) return;
  const effectIn = document.getElementById("bayes-effect");
  const priorIn = document.getElementById("bayes-prior");
  const lossIn = document.getElementById("bayes-loss");
  const thresholdIn = document.getElementById("bayes-threshold");
  const effectV = document.getElementById("bayes-effect-v");
  const priorV = document.getElementById("bayes-prior-v");
  const lossV = document.getElementById("bayes-loss-v");
  const thresholdV = document.getElementById("bayes-threshold-v");
  const readout = document.getElementById("bayes-readout");

  function risk(t, mu, pi1, ratio) {
    const pi0 = 1 - pi1;
    const cI = ratio;
    const cII = 1;
    const alpha = 1 - normalCdf(t, 0, 1);
    const beta = normalCdf(t, mu, 1);
    return { R: pi0 * cI * alpha + pi1 * cII * beta, alpha, beta };
  }

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas);
    const mu = +effectIn.value;
    const pi1 = +priorIn.value;
    const ratio = +lossIn.value;
    const t = +thresholdIn.value;
    effectV.textContent = mu.toFixed(2);
    priorV.textContent = pi1.toFixed(2);
    lossV.textContent = ratio.toFixed(2);
    thresholdV.textContent = t.toFixed(2);

    const pi0 = 1 - pi1;
    const xMin = -3, xMax = 6;
    const padL = 52, padR = 22, padT = 24, padB = 42;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    // Sample risk curve & compute y-range
    const samples = [];
    let yMax = 0;
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const tt = xMin + (i / N) * (xMax - xMin);
      const r = risk(tt, mu, pi1, ratio).R;
      samples.push([tt, r]);
      if (r > yMax) yMax = r;
    }
    yMax = Math.max(yMax * 1.1, 0.05);
    const yS = (r) => padT + plotH - (r / yMax) * plotH;

    drawGridX(ctx, padL, padT, plotW, plotH, 9);

    // Optimal threshold
    let tStar = Infinity;
    if (mu > 1e-6 && pi1 > 0 && pi0 > 0) {
      tStar = Math.log((pi0 * ratio) / (pi1 * 1)) / mu + mu / 2;
    }
    const tStarVisible = tStar > xMin && tStar < xMax;

    // Risk curve
    ctx.beginPath();
    samples.forEach(([tt, r], i) => {
      const px = xS(tt), py = yS(r);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Optimal threshold marker
    if (tStarVisible) {
      const rStar = risk(tStar, mu, pi1, ratio).R;
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(xS(tStar), padT);
      ctx.lineTo(xS(tStar), padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(xS(tStar), yS(rStar), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.text;
      ctx.font = "12px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("t*", xS(tStar), padT + 12);
    }

    // Current threshold
    ctx.strokeStyle = C.threshold;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(xS(t), padT);
    ctx.lineTo(xS(t), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    drawAxisLabels(ctx, padL, padT, plotW, plotH, xMin, xMax, "threshold t", "Bayes risk R(t)", 5, 0, yMax);

    const cur = risk(t, mu, pi1, ratio);
    const optR = tStarVisible ? risk(tStar, mu, pi1, ratio).R : NaN;
    readout.innerHTML =
      `<div class="row"><span class="lbl">α at t</span><span>${cur.alpha.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">β at t</span><span>${cur.beta.toFixed(3)}</span></div>` +
      `<div class="row"><span class="lbl">R(t) current</span><span>${cur.R.toFixed(4)}</span></div>` +
      `<div class="row"><span class="lbl">t* (Bayes optimum)</span><span>${isFinite(tStar) ? tStar.toFixed(3) : "—"}</span></div>` +
      `<div class="row"><span class="lbl">R(t*) minimum</span><span>${isFinite(optR) ? optR.toFixed(4) : "—"}</span></div>` +
      `<div class="row"><span class="lbl">Λ(x*) = (π₀ c_I)/(π₁ c_II)</span><span>${(pi0 * ratio / (pi1 * 1)).toFixed(3)}</span></div>`;
  }
  [effectIn, priorIn, lossIn, thresholdIn].forEach((input) => input.addEventListener("input", draw));
  draw();
  window.addEventListener("resize", draw);
})();
