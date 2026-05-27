import { drawClippedLine, drawLine } from "../../_shared/charts";

function attachHorizontalDrag(opts) {
  const { canvas, input, xToValue, hitTest, cursor = "ew-resize" } = opts;
  canvas.style.touchAction = "none";
  const min = parseFloat(input.min), max = parseFloat(input.max);
  const step = parseFloat(input.step) || 0;
  const clientToLocal = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const apply = (x, y) => {
    let v = xToValue(x, y);
    v = Math.max(min, Math.min(max, v));
    if (step > 0) v = Math.round((v - min) / step) * step + min;
    const s = step > 0 ? v.toFixed(Math.max(0, -Math.floor(Math.log10(step)))) : String(v);
    if (input.value !== s) {
      input.value = s;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };
  let dragging = false;
  canvas.addEventListener("pointerdown", (e) => {
    const { x, y } = clientToLocal(e);
    if (hitTest && !hitTest(x, y)) return;
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = cursor;
    apply(x, y);
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    const { x, y } = clientToLocal(e);
    if (dragging) { apply(x, y); return; }
    canvas.style.cursor = (!hitTest || hitTest(x, y)) ? cursor : "";
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {}
  };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("pointerleave", (e) => { if (!dragging) canvas.style.cursor = ""; });
}

const C = {
  bg: "#ffffff",
  grid: "#e3ddd0",
  axis: "#5a6577",
  text: "#1f2733",
  textDim: "#5a6577",
  blue: "#1f4a8c",
  blueFill: "rgba(31,74,140,0.24)",
  red: "#b8412a",
  redFill: "rgba(184,65,42,0.30)",
  green: "#2d7a3e",
  greenFill: "rgba(45,122,62,0.26)",
  purple: "#6b4592",
  purpleFill: "rgba(107,69,146,0.45)",
  orange: "#d4690a",
  orangeFill: "rgba(212,105,10,0.22)",
  gray: "#bfb9aa",
};

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const intrinsicW = parseInt(canvas.getAttribute("width"), 10);
  const intrinsicH = parseInt(canvas.getAttribute("height"), 10);
  canvas.style.width = "100%";
  canvas.style.height = `${canvas.getBoundingClientRect().width * intrinsicH / intrinsicW}px`;
  canvas.width = intrinsicW * ratio;
  canvas.height = intrinsicH * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);
  return { ctx, w: intrinsicW, h: intrinsicH };
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function safeP(p) { return clamp(p, 1e-4, 1 - 1e-4); }
function logit(p) { return Math.log(p / (1 - p)); }
function logistic(x) { return 1 / (1 + Math.exp(-x)); }

function logGamma(z) {
  const p = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = 0.9999999999998099;
  for (let i = 0; i < p.length; i++) x += p[i] / (z + i + 1);
  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaPdf(x, a, b) {
  const p = safeP(x);
  return Math.exp((a - 1) * Math.log(p) + (b - 1) * Math.log(1 - p) - logGamma(a) - logGamma(b) + logGamma(a + b));
}

function bernLogLik(p, n, k) {
  const q = safeP(p);
  return k * Math.log(q) + (n - k) * Math.log(1 - q);
}

function bernScore(p, n, k) {
  const q = safeP(p);
  return k / q - (n - k) / (1 - q);
}

function normalLogLik(mu, n, xbar, sigma) {
  return -0.5 * n * ((mu - xbar) / sigma) ** 2;
}

function normalScore(mu, n, xbar, sigma) {
  return n * (xbar - mu) / (sigma * sigma);
}

function drawAxes(ctx, x, y, w, h, verticals = 10, horizontals = 4) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= verticals; i++) {
    const px = x + (i / verticals) * w;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
    ctx.stroke();
  }
  for (let i = 0; i <= horizontals; i++) {
    const py = y + (i / horizontals) * h;
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py);
    ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
}

function fillCurve(ctx, points, baseY, fill, stroke) {
  ctx.beginPath();
  points.forEach((pt, i) => {
    if (i === 0) ctx.moveTo(pt[0], pt[1]);
    else ctx.lineTo(pt[0], pt[1]);
  });
  const last = points[points.length - 1];
  const first = points[0];
  ctx.lineTo(last[0], baseY);
  ctx.lineTo(first[0], baseY);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  drawLine(ctx, points, stroke, 2);
}

function drawVMarker(ctx, x, y0, y1, color, label) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y0);
  ctx.lineTo(x, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  if (label) {
    ctx.fillStyle = color;
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, x, y1 + 4);
  }
}

function fmt(x, digits = 3) {
  if (!Number.isFinite(x)) return "undefined";
  return x.toFixed(digits);
}

(function fig1() {
  const canvas = document.getElementById("fig1");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const modelIn = document.getElementById("fig1-model");
  const nIn = document.getElementById("fig1-n");
  const kIn = document.getElementById("fig1-k");
  const xbarIn = document.getElementById("fig1-xbar");
  const sigmaIn = document.getElementById("fig1-sigma");
  const nV = document.getElementById("fig1-n-v");
  const kV = document.getElementById("fig1-k-v");
  const xbarV = document.getElementById("fig1-xbar-v");
  const sigmaV = document.getElementById("fig1-sigma-v");
  const readout = document.getElementById("fig1-readout");

  const padL = 48, padR = 18, padT = 18, padB = 36;
  const gap = 18;
  const panelH = (h - padT - padB - gap) / 2;
  const plotW = w - padL - padR;

  function draw() {
    let n = +nIn.value;
    let k = Math.min(+kIn.value, n);
    kIn.max = String(n);
    kIn.value = String(k);
    const xbar = +xbarIn.value;
    const sigma = +sigmaIn.value;
    nV.textContent = n.toFixed(0);
    kV.textContent = k.toFixed(0);
    xbarV.textContent = xbar.toFixed(2);
    sigmaV.textContent = sigma.toFixed(2);

    const isBern = modelIn.value === "bernoulli";
    const xMin = isBern ? 0.001 : -4;
    const xMax = isBern ? 0.999 : 4;
    const mle = isBern ? k / n : xbar;
    const xS = (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);

    const y0 = padT, y1 = padT + panelH + gap;
    drawAxes(ctx, padL, y0, plotW, panelH, 10, 4);
    drawAxes(ctx, padL, y1, plotW, panelH, 10, 4);

    const N = 360;
    const xs = [], ll = [], score = [];
    let llMax = -Infinity;
    const finiteScoreAbs = [];
    for (let i = 0; i <= N; i++) {
      const x = xMin + (i / N) * (xMax - xMin);
      const lv = isBern ? bernLogLik(x, n, k) : normalLogLik(x, n, xbar, sigma);
      const sv = isBern ? bernScore(x, n, k) : normalScore(x, n, xbar, sigma);
      xs.push(x);
      ll.push(lv);
      score.push(sv);
      llMax = Math.max(llMax, lv);
      if (Number.isFinite(sv)) finiteScoreAbs.push(Math.abs(sv));
    }
    finiteScoreAbs.sort((a, b) => a - b);
    // Scale the score panel to the 90th percentile of |score| so the bulk of
    // the curve is readable. Values beyond that map to NaN and the curve
    // breaks instead of being clamped to the panel edge.
    const sAbs = Math.max(1e-9, finiteScoreAbs[Math.floor(finiteScoreAbs.length * 0.9)] || 1);
    const llMin = Math.max(Math.min(...ll), llMax - 35);
    const yLL = (v) => y0 + panelH - ((Math.max(v, llMin) - llMin) / (llMax - llMin || 1)) * panelH;

    fillCurve(ctx, xs.map((x, i) => [xS(x), yLL(ll[i])]), y0 + panelH, C.blueFill, C.blue);
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(padL, y1 + panelH / 2);
    ctx.lineTo(padL + plotW, y1 + panelH / 2);
    ctx.stroke();
    drawClippedLine(ctx, xs, score, -sAbs, sAbs, xS, y1, panelH, C.purple, { width: 2 });

    drawVMarker(ctx, xS(clamp(mle, xMin, xMax)), y0, y1 + panelH, C.red, isBern ? "MLE p̂" : "MLE μ̂");

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("log-likelihood ℓ(θ)", padL + 5, y0 + 4);
    ctx.fillText("score s(θ) = ∂ℓ/∂θ", padL + 5, y1 + 4);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 4; i++) {
      const x = xMin + (i / 4) * (xMax - xMin);
      ctx.fillText(isBern ? x.toFixed(2) : x.toFixed(1), xS(x), y1 + panelH + 7);
    }

    const info = isBern
      ? (mle > 0 && mle < 1 ? n / (mle * (1 - mle)) : Infinity)
      : n / (sigma * sigma);
    readout.innerHTML =
      `<div class="row"><span class="lbl">model</span><span>${isBern ? `Bernoulli: k=${k}, n=${n}` : `Normal mean: x̄=${xbar.toFixed(2)}, σ=${sigma.toFixed(2)}, n=${n}`}</span></div>` +
      `<div class="row"><span class="lbl">MLE</span><span>${isBern ? `p̂=${fmt(mle)}` : `μ̂=${fmt(mle)}`}</span></div>` +
      `<div class="row"><span class="lbl">observed curvature near MLE</span><span>${Number.isFinite(info) ? fmt(info) : "boundary MLE"}</span></div>`;
  }

  function syncControlVisibility() {
    const isBern = modelIn.value === "bernoulli";
    const show = (input, on) => {
      const wrap = input.closest(".control");
      if (wrap) wrap.style.display = on ? "" : "none";
    };
    show(kIn, isBern);
    show(xbarIn, !isBern);
    show(sigmaIn, !isBern);
  }
  [modelIn, nIn, kIn, xbarIn, sigmaIn].forEach((input) => input.addEventListener("input", draw));
  modelIn.addEventListener("change", () => { syncControlVisibility(); draw(); });
  syncControlVisibility();
  draw();
})();

// ─────────── Figure 3b: MLE sampling distribution and CRLB ───────────
(function figCrlb() {
  const canvas = document.getElementById("fig3-crlb");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const pIn = document.getElementById("fig3-crlb-p");
  const nIn = document.getElementById("fig3-crlb-n");
  const pV = document.getElementById("fig3-crlb-p-v");
  const nV = document.getElementById("fig3-crlb-n-v");
  const readout = document.getElementById("fig3-crlb-readout");
  let samples = [];
  function binom(n, p) {
    let k = 0;
    for (let i = 0; i < n; i++) if (Math.random() < p) k++;
    return k;
  }
  function resample() {
    const p = +pIn.value, n = +nIn.value;
    samples = Array.from({ length: 900 }, () => binom(n, p) / n);
    draw();
  }
  function draw() {
    const p = +pIn.value, n = +nIn.value;
    pV.textContent = p.toFixed(2); nV.textContent = n.toFixed(0);
    if (!samples.length) resample();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 54, y0 = 30, ww = 650, hh = 250;
    drawAxes(ctx, x0, y0, ww, hh, 10, 4);
    const bins = 40, counts = Array(bins).fill(0);
    for (const s of samples) counts[clamp(Math.floor(s * bins), 0, bins - 1)]++;
    const maxC = Math.max(...counts, 1);
    counts.forEach((c, i) => {
      const bh = c / maxC * hh * 0.82;
      ctx.fillStyle = C.blueFill; ctx.fillRect(x0 + i / bins * ww, y0 + hh - bh, ww / bins - 1, bh);
    });
    const sd = Math.sqrt(p * (1 - p) / n);
    const maxPdf = 1 / (sd * Math.sqrt(2 * Math.PI));
    const pts = Array.from({ length: 220 }, (_, i) => {
      const x = i / 219;
      const pdf = Math.exp(-0.5 * ((x - p) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
      return [x0 + x * ww, y0 + hh - (pdf / maxPdf) * hh * 0.82];
    });
    drawLine(ctx, pts, C.purple, 2.2);
    drawVMarker(ctx, x0 + p * ww, y0, y0 + hh, C.red, "true p");
    const empMean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const empSd = Math.sqrt(samples.reduce((a, b) => a + (b - empMean) ** 2, 0) / samples.length);
    readout.innerHTML = `<div class="row"><span class="lbl">CRLB/asymptotic sd</span><span>${sd.toFixed(4)} from 1/(nI(p))</span></div><div class="row"><span class="lbl">simulated MLE sd</span><span>${empSd.toFixed(4)}</span></div>`;
  }
  [pIn, nIn].forEach((input) => input.addEventListener("input", () => { samples = []; resample(); }));
  document.getElementById("fig3-crlb-resample").addEventListener("click", resample);
  resample();
})();

// ─────────── Figure 2b: Score-arrow field ───────────
(function figScoreField() {
  const canvas = document.getElementById("fig2-score-field");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const nIn = document.getElementById("fig2-field-n");
  const kIn = document.getElementById("fig2-field-k");
  const nV = document.getElementById("fig2-field-n-v");
  const kV = document.getElementById("fig2-field-k-v");
  const readout = document.getElementById("fig2-score-field-readout");
  function draw() {
    let n = +nIn.value;
    let k = Math.min(+kIn.value, n);
    kIn.max = String(n);
    kIn.value = String(k);
    nV.textContent = String(n);
    kV.textContent = String(k);
    const mle = k / n;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 54, y0 = 28, ww = 650, hh = 235;
    drawAxes(ctx, x0, y0, ww, hh, 10, 4);
    const vals = [];
    let maxL = -Infinity, minL = Infinity;
    for (let i = 0; i <= 120; i++) {
      const p = 0.01 + i / 120 * 0.98;
      const v = bernLogLik(p, n, k);
      vals.push([p, v]);
      maxL = Math.max(maxL, v); minL = Math.min(minL, v);
    }
    minL = Math.max(minL, maxL - 45);
    vals.forEach(([p, v], i) => {
      const t = (Math.max(v, minL) - minL) / (maxL - minL || 1);
      ctx.fillStyle = `rgba(31,74,140,${0.08 + 0.45 * t})`;
      ctx.fillRect(x0 + i / 121 * ww, y0, ww / 121 + 1, hh);
    });
    const curve = vals.map(([p, v]) => [x0 + p * ww, y0 + hh - (Math.max(v, minL) - minL) / (maxL - minL || 1) * hh * 0.9]);
    drawLine(ctx, curve, C.blue, 2.4);
    for (let i = 1; i < 10; i++) {
      const p = i / 10;
      const score = bernScore(p, n, k);
      const x = x0 + p * ww;
      const y = y0 + hh - 28;
      const len = clamp(score / n, -1, 1) * 34;
      ctx.strokeStyle = C.purple; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + len, y); ctx.lineTo(x + len - Math.sign(len || 1) * 7, y - 4); ctx.lineTo(x + len - Math.sign(len || 1) * 7, y + 4); ctx.closePath(); ctx.fillStyle = C.purple; ctx.fill();
    }
    drawVMarker(ctx, x0 + mle * ww, y0, y0 + hh, C.red, "MLE");
    readout.innerHTML = `<div class="row"><span class="lbl">score direction</span><span>arrows point toward increasing log-likelihood and flip at p̂=${mle.toFixed(3)}</span></div>`;
  }
  [nIn, kIn].forEach((input) => input.addEventListener("input", draw));
  draw();
})();

// ─────────── Figure 4b: Jeffreys pushforward check ───────────
(function figJeffreysPushforward() {
  const canvas = document.getElementById("fig4-pushforward");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const transformIn = document.getElementById("fig4-pushforward-transform");
  const readout = document.getElementById("fig4-pushforward-readout");
  function jac(p, kind) {
    const q = safeP(p);
    if (kind === "logit") return 1 / (q * (1 - q));
    if (kind === "arcsine") return 1 / Math.sqrt(q * (1 - q));
    return 0.5 / Math.sqrt(q);
  }
  function draw() {
    const kind = transformIn.value;
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 54, y0 = 30, ww = 650, hh = 240;
    drawAxes(ctx, x0, y0, ww, hh, 10, 4);
    const ps = Array.from({ length: 220 }, (_, i) => 0.01 + i / 219 * 0.98);
    const jeff = ps.map((p) => 1 / (Math.PI * Math.sqrt(p * (1 - p))));
    const pushedBack = jeff.slice();
    const flatMapped = ps.map((p) => jac(p, kind));
    // Cap the y-axis so the bulk of both curves is visible; anything
    // exceeding maxV is rendered with off-chart arrowheads via
    // drawClippedLine so the flat-coordinate prior (which diverges at the
    // endpoints) doesn't visually flatten out against the panel cap.
    const maxV = Math.max(...jeff, 10);
    const xS = (p) => x0 + p * ww;
    const panelY = y0 + hh * 0.1;
    const panelH = hh * 0.9;
    drawClippedLine(ctx, ps, jeff, 0, maxV, xS, panelY, panelH, C.green, { width: 2.6 });
    ctx.setLineDash([5, 4]);
    drawClippedLine(ctx, ps, pushedBack, 0, maxV, xS, panelY, panelH, C.blue, { width: 2 });
    ctx.setLineDash([]);
    drawClippedLine(ctx, ps, flatMapped, 0, maxV, xS, panelY, panelH, C.orange, { width: 2 });
    readout.innerHTML = `<div class="row"><span class="lbl">Jeffreys check</span><span>transform Jeffreys to ${kind} and back: same density in p</span></div><div class="row"><span class="lbl">flat-coordinate prior</span><span>mapped back depends on the chosen coordinate</span></div>`;
  }
  transformIn.addEventListener("input", draw);
  draw();
})();

// ─────────── Figure 5b: Posterior shrinkage sequence ───────────
(function figPosteriorShrinkage() {
  const canvas = document.getElementById("fig5-shrinkage");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const pIn = document.getElementById("fig5-shrink-p");
  const nIn = document.getElementById("fig5-shrink-n");
  const pV = document.getElementById("fig5-shrink-p-v");
  const nV = document.getElementById("fig5-shrink-n-v");
  const readout = document.getElementById("fig5-shrinkage-readout");
  let data = [];
  function rand() {
    let x = Math.sin((data.length + 1) * 999 + 17) * 10000;
    return x - Math.floor(x);
  }
  function regenerate() {
    data = [];
    const p = +pIn.value;
    for (let i = 0; i < 120; i++) data.push(rand() < p ? 1 : 0);
  }
  function draw() {
    const p = +pIn.value, n = +nIn.value;
    pV.textContent = p.toFixed(2);
    nV.textContent = String(n);
    if (data.length !== 120) regenerate();
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
    const x0 = 54, y0 = 28, ww = 650, hh = 240;
    drawAxes(ctx, x0, y0, ww, hh, 10, 4);
    const checkpoints = [0, Math.min(n, 8), Math.min(n, 30), n].filter((v, i, a) => a.indexOf(v) === i);
    const colors = [C.gray ?? "#bfb9aa", C.blue, C.green, C.purple];
    const curves = checkpoints.map((m) => {
      const s = data.slice(0, m).reduce((a, b) => a + b, 0);
      const a = 1 + s, b = 1 + m - s;
      return { m, s, a, b, vals: Array.from({ length: 220 }, (_, i) => {
        const x = 0.005 + i / 219 * 0.99;
        return [x, betaPdf(x, a, b)];
      }) };
    });
    const maxV = Math.max(...curves.flatMap((c) => c.vals.map((p) => p[1])));
    curves.forEach((c, idx) => {
      const pts = c.vals.map(([x, v]) => [x0 + x * ww, y0 + hh - v / maxV * hh * 0.9]);
      drawLine(ctx, pts, colors[idx], idx === 0 ? 1.6 : 2.4);
    });
    drawVMarker(ctx, x0 + p * ww, y0, y0 + hh, C.red, "true p");
    const s = data.slice(0, n).reduce((a, b) => a + b, 0);
    readout.innerHTML =
      `<div class="row"><span class="lbl">data so far</span><span>${s} successes, ${n - s} failures</span></div>` +
      `<div class="row"><span class="lbl">posterior</span><span>Beta(${1 + s}, ${1 + n - s}) narrows as evidence accumulates</span></div>` +
      `<div class="row"><span class="lbl">why it wiggles</span><span>each slider step appends ${nIn.step} more Bernoulli draw${(+nIn.step) === 1 ? "" : "s"}; the posterior random-walks toward true $p$ rather than gliding monotonically, because individual samples are 0 or 1.</span></div>`;
  }
  pIn.addEventListener("input", () => { regenerate(); draw(); });
  nIn.addEventListener("input", draw);
  document.getElementById("fig5-shrink-resample").addEventListener("click", () => { data = []; regenerate(); draw(); });
  regenerate(); draw();
})();

(function fig2() {
  const canvas = document.getElementById("fig2");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const nIn = document.getElementById("fig2-n");
  const kIn = document.getElementById("fig2-k");
  const nV = document.getElementById("fig2-n-v");
  const kV = document.getElementById("fig2-k-v");
  const readout = document.getElementById("fig2-readout");
  const padL = 46, padR = 16, padT = 18, padB = 34;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const xMin = 0.01, xMax = 0.99;
  const xS = (p) => padL + ((p - xMin) / (xMax - xMin)) * plotW;

  function drawArrow(x, y, dir) {
    const len = 18 * dir;
    ctx.strokeStyle = C.orange;
    ctx.fillStyle = C.orange;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - len * 0.45, y);
    ctx.lineTo(x + len * 0.45, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + len * 0.45, y);
    ctx.lineTo(x + len * 0.25, y - 4);
    ctx.lineTo(x + len * 0.25, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    let n = +nIn.value;
    let k = Math.min(+kIn.value, n);
    kIn.max = String(n);
    kIn.value = String(k);
    nV.textContent = n.toFixed(0);
    kV.textContent = k.toFixed(0);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    drawAxes(ctx, padL, padT, plotW, plotH, 10, 6);

    const N = 360;
    const vals = [];
    const finiteAbs = [];
    for (let i = 0; i <= N; i++) {
      const p = xMin + (i / N) * (xMax - xMin);
      const s = bernScore(p, n, k);
      vals.push([p, s]);
      if (Number.isFinite(s)) finiteAbs.push(Math.abs(s));
    }
    finiteAbs.sort((a, b) => a - b);
    const maxAbs = Math.max(1, finiteAbs[Math.floor(finiteAbs.length * 0.9)] || 1);
    const yS = (s) => {
      if (!Number.isFinite(s) || Math.abs(s) > maxAbs) return NaN;
      return padT + plotH / 2 - s / (2 * maxAbs) * plotH;
    };
    ctx.strokeStyle = C.axis;
    ctx.beginPath();
    ctx.moveTo(padL, padT + plotH / 2);
    ctx.lineTo(padL + plotW, padT + plotH / 2);
    ctx.stroke();
    drawClippedLine(ctx, vals.map(([p]) => p), vals.map(([, s]) => s), -maxAbs, maxAbs, xS, padT, plotH, C.purple, { width: 2.2 });

    const mle = k / n;
    if (mle > 0 && mle < 1) drawVMarker(ctx, xS(mle), padT, padT + plotH, C.red, "s=0");
    for (let p = 0.1; p < 1; p += 0.1) {
      const s = bernScore(p, n, k);
      drawArrow(xS(p), yS(s), s >= 0 ? 1 : -1);
    }

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("score s(p)=k/p-(n-k)/(1-p)", padL + 5, padT + 4);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 5; i++) {
      const p = i / 5;
      ctx.fillText(p.toFixed(1), xS(clamp(p, xMin, xMax)), padT + plotH + 7);
    }
    const boundary = mle === 0 || mle === 1;
    readout.innerHTML =
      `<div class="row"><span class="lbl">score sign</span><span>positive moves right; negative moves left</span></div>` +
      `<div class="row"><span class="lbl">MLE</span><span>${boundary ? `boundary p̂=${mle.toFixed(0)}` : `interior p̂=${fmt(mle)}`}</span></div>` +
      `<div class="row"><span class="lbl">zero-score equation</span><span>k/p = (n-k)/(1-p)</span></div>`;
  }

  [nIn, kIn].forEach((input) => input.addEventListener("input", draw));
  document.querySelectorAll("[data-fig2-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.fig2Preset;
      if (preset === "balanced") { nIn.value = 24; kIn.value = 12; }
      else if (preset === "few") { nIn.value = 24; kIn.value = 4; }
      else if (preset === "many") { nIn.value = 24; kIn.value = 20; }
      else if (preset === "boundary") { nIn.value = 24; kIn.value = 24; }
      draw();
    });
  });
  draw();
})();

(function fig3() {
  const canvas = document.getElementById("fig3");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const pIn = document.getElementById("fig3-p");
  const nIn = document.getElementById("fig3-n");
  const pV = document.getElementById("fig3-p-v");
  const nV = document.getElementById("fig3-n-v");
  const readout = document.getElementById("fig3-readout");
  const padL = 48, padR = 16, padT = 18, padB = 34;
  const gap = 16;
  const panelH = (h - padT - padB - gap) / 2;
  const plotW = w - padL - padR;
  const xS = (p) => padL + p * plotW;

  function draw() {
    const p = +pIn.value;
    const n = +nIn.value;
    pV.textContent = p.toFixed(2);
    nV.textContent = n.toFixed(0);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const topY = padT, botY = padT + panelH + gap;
    drawAxes(ctx, padL, topY, plotW, panelH, 10, 4);
    drawAxes(ctx, padL, botY, plotW, panelH, 10, 4);

    const N = 360;
    const infoVals = [];
    let maxInfo = 1;
    for (let i = 0; i <= N; i++) {
      const x = 0.02 + (i / N) * 0.96;
      const info = n / (x * (1 - x));
      infoVals.push([x, info]);
      maxInfo = Math.max(maxInfo, Math.min(info, n * 60));
    }
    const yInfo = (v) => topY + panelH - Math.min(v, maxInfo) / maxInfo * panelH;
    fillCurve(ctx, infoVals.map(([x, v]) => [xS(x), yInfo(v)]), topY + panelH, C.blueFill, C.blue);

    const totalInfo = n / (p * (1 - p));
    drawVMarker(ctx, xS(p), topY, topY + panelH, C.red, "p");

    const se = Math.sqrt(1 / totalInfo);
    const quad = [];
    let qMin = -8;
    for (let i = 0; i <= N; i++) {
      const x = 0.001 + (i / N) * 0.998;
      const q = -0.5 * totalInfo * (x - p) ** 2;
      qMin = Math.min(qMin, q);
      quad.push([x, q]);
    }
    const yQ = (v) => botY + panelH - ((Math.max(v, -8) + 8) / 8) * panelH;
    fillCurve(ctx, quad.map(([x, v]) => [xS(x), yQ(v)]), botY + panelH, C.purpleFill, C.purple);
    drawVMarker(ctx, xS(p), botY, botY + panelH, C.red, "p");
    drawVMarker(ctx, xS(clamp(p - se, 0, 1)), botY, botY + panelH, C.green, "-1 SE");
    drawVMarker(ctx, xS(clamp(p + se, 0, 1)), botY, botY + panelH, C.green, "+1 SE");

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("total Fisher information nI(p)", padL + 5, topY + 4);
    ctx.fillText("local quadratic log-likelihood approximation", padL + 5, botY + 4);

    readout.innerHTML =
      `<div class="row"><span class="lbl">Bernoulli per-observation information</span><span>I(p)=1/[p(1-p)] = ${fmt(1 / (p * (1 - p)))}</span></div>` +
      `<div class="row"><span class="lbl">total information</span><span>nI(p) = ${fmt(totalInfo)}</span></div>` +
      `<div class="row"><span class="lbl">asymptotic standard error</span><span>1/sqrt(nI(p)) = ${fmt(se)}</span></div>`;
  }

  [pIn, nIn].forEach((input) => input.addEventListener("input", draw));
  draw();
  attachHorizontalDrag({
    canvas, input: pIn,
    hitTest: (x) => x >= padL && x <= padL + plotW,
    xToValue: (x) => (x - padL) / plotW,
  });
})();

(function fig4() {
  const canvas = document.getElementById("fig4");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const readout = document.getElementById("fig4-readout");
  const transformIn = document.getElementById("fig4-transform");
  const padL = 48, padR = 16, padT = 18, padB = 34;
  const gap = 16;
  const panelH = (h - padT - padB - gap) / 2;
  const plotW = w - padL - padR;
  const xS = (p) => padL + p * plotW;
  function transform(p, kind) {
    if (kind === "probit") return Math.SQRT2 * erfInv(2 * p - 1);
    if (kind === "arcsine") return Math.asin(Math.sqrt(p));
    if (kind === "boxcox") {
      const odds = p / (1 - p);
      const lambda = 0.35;
      return (Math.pow(odds, lambda) - 1) / lambda;
    }
    return Math.log(p / (1 - p));
  }
  function dTransformDp(p, kind) {
    if (kind === "probit") return Math.sqrt(2 * Math.PI) * Math.exp(0.5 * transform(p, kind) ** 2);
    if (kind === "arcsine") return 1 / (2 * Math.sqrt(p * (1 - p)));
    if (kind === "boxcox") {
      const odds = p / (1 - p);
      return Math.pow(odds, -0.65) / ((1 - p) * (1 - p));
    }
    return 1 / (p * (1 - p));
  }
  function erfInv(x) {
    const a = 0.147;
    const s = Math.sign(x);
    const ln = Math.log(1 - x * x);
    const first = 2 / (Math.PI * a) + ln / 2;
    return s * Math.sqrt(Math.sqrt(first * first - ln / a) - first);
  }

  function draw() {
    const kind = transformIn?.value || "logit";
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const topY = padT, botY = padT + panelH + gap;
    drawAxes(ctx, padL, topY, plotW, panelH, 10, 4);
    drawAxes(ctx, padL, botY, plotW, panelH, 12, 4);
    const N = 420;
    const flatP = [], flatPhiBack = [], jeff = [], samples = [];
    let maxY = 0;
    for (let i = 0; i <= N; i++) {
      const p = 0.01 + (i / N) * 0.98;
      const dphi = dTransformDp(p, kind);
      const mappedBack = dphi;
      const j = 1 / (Math.PI * Math.sqrt(p * (1 - p)));
      flatP.push([p, 1]);
      flatPhiBack.push([p, Math.min(mappedBack / 14, 8)]);
      jeff.push([p, j]);
      samples.push({ p, phi: transform(p, kind), flatPhi: 1 / dphi, jeffPhi: j / dphi });
      maxY = Math.max(maxY, 1, Math.min(mappedBack / 14, 8), j);
    }
    const phiMin = Math.max(-8, samples[0].phi);
    const phiMax = Math.min(8, samples[samples.length - 1].phi);
    const phiS = (phi) => padL + ((phi - phiMin) / (phiMax - phiMin)) * plotW;
    const yP = (v) => topY + panelH - v / maxY * panelH;
    drawLine(ctx, flatP.map(([p, v]) => [xS(p), yP(v)]), C.blue, 2);
    drawLine(ctx, flatPhiBack.map(([p, v]) => [xS(p), yP(v)]), C.orange, 2);
    drawLine(ctx, jeff.map(([p, v]) => [xS(p), yP(v)]), C.green, 2);
    const finite = samples.filter((d) => d.phi >= phiMin && d.phi <= phiMax);
    const maxPhi = Math.max(...finite.map((d) => Math.max(d.flatPhi, d.jeffPhi)));
    const yPhi = (v) => botY + panelH - v / maxPhi * panelH;
    fillCurve(ctx, finite.map((d) => [phiS(d.phi), yPhi(d.flatPhi)]), botY + panelH, C.blueFill, C.blue);
    drawLine(ctx, finite.map((d) => [phiS(d.phi), yPhi(d.jeffPhi)]), C.green, 2.2);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("densities shown in p-coordinate", padL + 5, topY + 4);
    ctx.fillText(`same priors shown in ${kind} coordinate φ`, padL + 5, botY + 4);
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) ctx.fillText((i / 4).toFixed(2), xS(i / 4), topY + panelH + 5);
    for (let i = 0; i <= 4; i++) {
      const phi = phiMin + (i / 4) * (phiMax - phiMin);
      ctx.fillText(phi.toFixed(1), phiS(phi), botY + panelH + 5);
    }
    readout.innerHTML =
      `<div class="row"><span class="lbl">transform</span><span>${kind}; curves include |dφ/dp| or |dp/dφ|</span></div>` +
      `<div class="row"><span class="lbl">flat in p</span><span>changes shape in φ by the Jacobian</span></div>` +
      `<div class="row"><span class="lbl">Jeffreys</span><span>same measure after reparameterization</span></div>`;
  }
  transformIn?.addEventListener("change", draw);
  draw();
})();

(function fig5() {
  const canvas = document.getElementById("fig5");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const nIn = document.getElementById("fig5-n");
  const kIn = document.getElementById("fig5-k");
  const priorIn = document.getElementById("fig5-prior");
  const nV = document.getElementById("fig5-n-v");
  const kV = document.getElementById("fig5-k-v");
  const readout = document.getElementById("fig5-readout");
  const padL = 46, padR = 16, padT = 18, padB = 34;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const xS = (p) => padL + p * plotW;

  function priorParams(name): [number, number, string] {
    if (name === "flat") return [1, 1, "Beta(1,1)"];
    if (name === "weak") return [2, 2, "Beta(2,2)"];
    return [0.5, 0.5, "Beta(1/2,1/2)"];
  }

  function draw() {
    let n = +nIn.value;
    let k = Math.min(+kIn.value, n);
    kIn.max = String(n);
    kIn.value = String(k);
    nV.textContent = n.toFixed(0);
    kV.textContent = k.toFixed(0);
    const [a, b, label] = priorParams(priorIn.value);
    const postA = a + k;
    const postB = b + n - k;
    const mle = k / n;
    const postMean = postA / (postA + postB);
    const postMode = postA > 1 && postB > 1 ? (postA - 1) / (postA + postB - 2) : null;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    drawAxes(ctx, padL, padT, plotW, plotH, 10, 5);
    const N = 420;
    const like = [], post = [];
    let maxY = 1e-9;
    const llMax = bernLogLik(safeP(clamp(mle, 0.001, 0.999)), n, k);
    for (let i = 0; i <= N; i++) {
      const p = 0.001 + (i / N) * 0.998;
      const lv = Math.exp(bernLogLik(p, n, k) - llMax);
      const pv = betaPdf(p, postA, postB);
      like.push([p, lv]);
      post.push([p, pv]);
      maxY = Math.max(maxY, lv, Math.min(pv, 20));
    }
    const yS = (v) => padT + plotH - Math.min(v, maxY) / maxY * plotH;
    fillCurve(ctx, like.map(([p, v]) => [xS(p), yS(v)]), padT + plotH, C.blueFill, C.blue);
    drawLine(ctx, post.map(([p, v]) => [xS(p), yS(v)]), C.green, 2.3);

    // MLE / posterior mean / posterior mode markers. These three values
    // often fall within a few pixels of each other (e.g., a flat prior
    // makes mean ≈ MLE; a symmetric posterior makes mode = mean), and
    // labeling them all at the same y under the plot turned into an
    // illegible smear. Stagger labels into vertical rows based on x-pixel
    // proximity, place them next to their lines inside the plot.
    const markers: { x: number; color: string; label: string }[] = [
      { x: clamp(mle, 0, 1), color: C.red, label: "MLE" },
      { x: postMean, color: C.purple, label: "mean" },
    ];
    if (postMode !== null) markers.push({ x: postMode, color: C.orange, label: "mode" });

    // Draw the dashed lines (no labels).
    for (const m of markers) {
      drawVMarker(ctx, xS(m.x), padT, padT + plotH, m.color, "");
    }

    // Sort by x-position and assign each label to the lowest row that
    // leaves at least `minSep` horizontal pixels between adjacent labels
    // in the same row.
    const sortedMarkers = markers.slice().sort((a, b) => a.x - b.x);
    const minSep = 44;
    const rowOf = new Map<typeof markers[number], number>();
    const rowEdges: number[] = [];
    for (const m of sortedMarkers) {
      const px = xS(m.x);
      let row = 0;
      while (rowEdges[row] !== undefined && px - rowEdges[row] < minSep) row++;
      rowOf.set(m, row);
      rowEdges[row] = px;
    }
    ctx.font = "600 11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (const m of markers) {
      const px = xS(m.x);
      const row = rowOf.get(m) ?? 0;
      const py = padT + 14 + row * 16;
      ctx.fillStyle = m.color;
      ctx.fillText(m.label, px + 5, py);
    }

    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Bernoulli likelihood and posterior density", padL + 5, padT + 4);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i <= 5; i++) {
      const p = i / 5;
      ctx.fillText(p.toFixed(1), xS(p), padT + plotH + 7);
    }

    readout.innerHTML =
      `<div class="row"><span class="lbl">prior</span><span>${label}</span></div>` +
      `<div class="row"><span class="lbl">posterior</span><span>Beta(${fmt(postA, 1)}, ${fmt(postB, 1)})</span></div>` +
      `<div class="row"><span class="lbl">estimates</span><span>MLE=${fmt(mle)}, posterior mean=${fmt(postMean)}${postMode === null ? ", mode at boundary/undefined" : `, mode=${fmt(postMode)}`}</span></div>`;
  }

  [nIn, kIn, priorIn].forEach((input) => input.addEventListener("input", draw));
  priorIn.addEventListener("change", draw);
  document.querySelectorAll("[data-fig5-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.fig5Preset;
      if (preset === "moderate") { nIn.value = 20; kIn.value = 12; }
      else if (preset === "small") { nIn.value = 4; kIn.value = 3; }
      else if (preset === "all-success") { nIn.value = 12; kIn.value = 12; }
      else if (preset === "all-failure") { nIn.value = 12; kIn.value = 0; }
      draw();
    });
  });
  draw();
})();

// ─────────── Figure 3c · KL ≈ ½·I·(Δθ)² — Fisher as curvature of KL ───────────
(function figKlQuadratic() {
  const canvas = document.getElementById("fig3-kl-quad");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const modelSel = document.getElementById("fig3-kl-quad-model");
  const thetaIn = document.getElementById("fig3-kl-quad-theta");
  const deltaIn = document.getElementById("fig3-kl-quad-delta");
  const thetaV = document.getElementById("fig3-kl-quad-theta-v");
  const deltaV = document.getElementById("fig3-kl-quad-delta-v");
  const readout = document.getElementById("fig3-kl-quad-readout");
  function klBern(p, q) {
    p = clamp(p, 1e-6, 1 - 1e-6);
    q = clamp(q, 1e-6, 1 - 1e-6);
    return p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q));
  }
  function fisherBern(p) {
    p = clamp(p, 1e-6, 1 - 1e-6);
    return 1 / (p * (1 - p));
  }
  function klNormalMean(mu1, mu2, sigma) {
    return (mu1 - mu2) ** 2 / (2 * sigma * sigma);
  }
  function fisherNormalMean(sigma) { return 1 / (sigma * sigma); }
  function klNormalVar(v1, v2) {
    return 0.5 * (v1 / v2 - 1 - Math.log(v1 / v2));
  }
  function fisherNormalVar(v) { return 1 / (2 * v * v); }
  function configure() {
    const m = modelSel.value;
    if (m === "bernoulli") {
      thetaIn.min = "0.05"; thetaIn.max = "0.95"; thetaIn.step = "0.01";
      if (+thetaIn.value > 0.95 || +thetaIn.value < 0.05) thetaIn.value = 0.4;
      deltaIn.min = "0.01"; deltaIn.max = "0.4"; deltaIn.step = "0.005";
      if (+deltaIn.value > 0.4) deltaIn.value = 0.2;
    } else if (m === "normal-mean") {
      thetaIn.min = "-2"; thetaIn.max = "2"; thetaIn.step = "0.05";
      thetaIn.value = 0;
      deltaIn.min = "0.05"; deltaIn.max = "1.5"; deltaIn.step = "0.01";
      deltaIn.value = 0.6;
    } else if (m === "normal-var") {
      thetaIn.min = "0.3"; thetaIn.max = "3"; thetaIn.step = "0.05";
      thetaIn.value = 1;
      deltaIn.min = "0.05"; deltaIn.max = "1.5"; deltaIn.step = "0.01";
      deltaIn.value = 0.5;
    }
  }
  function evalKL(theta, theta2) {
    const m = modelSel.value;
    if (m === "bernoulli") return klBern(theta, theta2);
    if (m === "normal-mean") return klNormalMean(theta, theta2, 1);
    return klNormalVar(theta, theta2);
  }
  function evalFisher(theta) {
    const m = modelSel.value;
    if (m === "bernoulli") return fisherBern(theta);
    if (m === "normal-mean") return fisherNormalMean(1);
    return fisherNormalVar(theta);
  }
  function safeTheta2(t, dt) {
    const m = modelSel.value;
    if (m === "bernoulli") return clamp(t + dt, 0.001, 0.999);
    if (m === "normal-var") return Math.max(t + dt, 0.05);
    return t + dt;
  }
  function draw() {
    const theta = +thetaIn.value;
    const deltaMax = +deltaIn.value;
    thetaV.textContent = theta.toFixed(3);
    deltaV.textContent = deltaMax.toFixed(3);
    const I = evalFisher(theta);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 56, padR = 18, padT = 24, padB = 38;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const N = 161;
    const samplesKL = [];
    const samplesQ = [];
    for (let i = 0; i < N; i++) {
      const dt = -deltaMax + (i / (N - 1)) * 2 * deltaMax;
      const t2 = safeTheta2(theta, dt);
      const kl = evalKL(theta, t2);
      const q = 0.5 * I * dt * dt;
      samplesKL.push({ dt, v: kl });
      samplesQ.push({ dt, v: q });
    }
    const vmax = Math.max(...samplesKL.map((s) => s.v), ...samplesQ.map((s) => s.v)) * 1.15 + 1e-9;
    const xS = (dt) => padL + (dt + deltaMax) / (2 * deltaMax) * plotW;
    const yS = (v) => padT + plotH - v / vmax * plotH;
    drawAxes(ctx, padL, padT, plotW, plotH, 8, 4);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("0", padL - 8, padT + plotH + 4);
    for (let i = 1; i <= 4; i++) {
      const v = vmax * i / 4;
      ctx.fillText(v.toFixed(3), 4, yS(v) + 4);
    }
    ctx.fillText(`-${deltaMax.toFixed(2)}`, padL - 6, padT + plotH + 16);
    ctx.fillText("0", padL + plotW / 2 - 4, padT + plotH + 16);
    ctx.fillText(`+${deltaMax.toFixed(2)}`, padL + plotW - 24, padT + plotH + 16);
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("Δθ", padL + plotW - 12, padT + plotH + 30);
    ctx.save();
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("KL / quadratic", 0, 0);
    ctx.restore();
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    samplesQ.forEach((s, i) => {
      const x = xS(s.dt), y = yS(s.v);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    samplesKL.forEach((s, i) => {
      const x = xS(s.dt), y = yS(s.v);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = C.red;
    const tipDt = deltaMax;
    const t2 = safeTheta2(theta, tipDt);
    const klTip = evalKL(theta, t2);
    const qTip = 0.5 * I * tipDt * tipDt;
    ctx.beginPath();
    ctx.arc(xS(tipDt), yS(klTip), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(xS(-tipDt), yS(evalKL(theta, safeTheta2(theta, -tipDt))), 4, 0, Math.PI * 2);
    ctx.fill();
    readout.innerHTML = `<div class="row"><span class="lbl">I(θ)</span><span>${I.toFixed(3)}</span></div><div class="row"><span class="lbl">KL at +Δθ</span><span>${klTip.toFixed(4)}</span></div><div class="row"><span class="lbl">quadratic at +Δθ</span><span>${qTip.toFixed(4)}</span></div><div class="row"><span class="lbl">relative gap</span><span>${(100 * Math.abs(klTip - qTip) / Math.max(klTip, 1e-9)).toFixed(1)}%</span></div>`;
  }
  modelSel.addEventListener("change", () => { configure(); draw(); });
  [thetaIn, deltaIn].forEach((input) => input.addEventListener("input", draw));
  configure();
  draw();
})();

// ─────────── Figure 3d · Score as infinitesimal tilting ───────────
(function figScoreTilt() {
  const canvas = document.getElementById("fig3-score-tilt");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const modelSel = document.getElementById("fig3-score-tilt-model");
  const thetaIn = document.getElementById("fig3-score-tilt-theta");
  const deltaIn = document.getElementById("fig3-score-tilt-delta");
  const thetaV = document.getElementById("fig3-score-tilt-theta-v");
  const deltaV = document.getElementById("fig3-score-tilt-delta-v");
  const readout = document.getElementById("fig3-score-tilt-readout");
  function normalPdf(x, mu, sigma) {
    const z = (x - mu) / sigma;
    return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
  }
  function configure() {
    const m = modelSel.value;
    if (m === "normal-mean") {
      thetaIn.min = "-2"; thetaIn.max = "2"; thetaIn.step = "0.05"; thetaIn.value = 0;
      deltaIn.min = "-1.5"; deltaIn.max = "1.5"; deltaIn.step = "0.02"; deltaIn.value = 0.6;
    } else if (m === "poisson") {
      thetaIn.min = "0.5"; thetaIn.max = "8"; thetaIn.step = "0.05"; thetaIn.value = 3;
      deltaIn.min = "-2"; deltaIn.max = "2"; deltaIn.step = "0.05"; deltaIn.value = 1;
    } else if (m === "exponential") {
      thetaIn.min = "0.3"; thetaIn.max = "3"; thetaIn.step = "0.02"; thetaIn.value = 1;
      deltaIn.min = "-0.7"; deltaIn.max = "0.7"; deltaIn.step = "0.01"; deltaIn.value = 0.4;
    }
  }
  function densities(theta) {
    const m = modelSel.value;
    if (m === "normal-mean") {
      const sigma = 1;
      return { pdf: (x) => normalPdf(x, theta, sigma), score: (x) => (x - theta) / (sigma * sigma), I: 1 / (sigma * sigma), kind: "continuous", xMin: -5, xMax: 5 };
    }
    if (m === "exponential") {
      return { pdf: (x) => x >= 0 ? theta * Math.exp(-theta * x) : 0, score: (x) => x >= 0 ? 1 / theta - x : 0, I: 1 / (theta * theta), kind: "continuous", xMin: 0, xMax: 6 };
    }
    function logFact(k) {
      let s = 0;
      for (let i = 2; i <= k; i++) s += Math.log(i);
      return s;
    }
    return { pmf: (k) => Math.exp(-theta + k * Math.log(theta) - logFact(k)), score: (k) => k / theta - 1, I: 1 / theta, kind: "discrete", xMin: 0, xMax: 16 };
  }
  function draw() {
    const theta = +thetaIn.value;
    const dtheta = +deltaIn.value;
    thetaV.textContent = theta.toFixed(2);
    deltaV.textContent = dtheta.toFixed(2);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 50, padR = 18, padT = 22, padB = 38, gap = 14;
    const plotW = w - padL - padR;
    const upperH = (h - padT - padB - gap) * 0.6;
    const lowerH = (h - padT - padB - gap) * 0.4;
    const upperY = padT;
    const lowerY = padT + upperH + gap;
    const D = densities(theta);
    const xS = (x) => padL + (x - D.xMin) / (D.xMax - D.xMin) * plotW;
    drawAxes(ctx, padL, upperY, plotW, upperH, 10, 4);
    if (D.kind === "continuous") {
      const N = 220;
      const xs = [], pBase = [], pTilt = [];
      let pTiltSum = 0;
      const dx = (D.xMax - D.xMin) / N;
      for (let i = 0; i <= N; i++) {
        const x = D.xMin + i * dx;
        xs.push(x);
        const base = D.pdf(x);
        const factor = Math.exp(dtheta * D.score(x));
        pBase.push(base);
        pTilt.push(base * factor);
        pTiltSum += base * factor * dx;
      }
      const tilt = pTilt.map((v) => v / Math.max(pTiltSum, 1e-9));
      const peak = Math.max(...pBase, ...tilt) * 1.15;
      const yS = (v) => upperY + upperH - v / peak * upperH;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      xs.forEach((x, i) => i ? ctx.lineTo(xS(x), yS(pBase[i])) : ctx.moveTo(xS(x), yS(pBase[i])));
      ctx.stroke();
      ctx.fillStyle = "rgba(184,65,42,0.20)";
      ctx.beginPath();
      ctx.moveTo(xS(D.xMin), yS(0));
      xs.forEach((x, i) => ctx.lineTo(xS(x), yS(tilt[i])));
      ctx.lineTo(xS(D.xMax), yS(0));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2;
      ctx.beginPath();
      xs.forEach((x, i) => i ? ctx.lineTo(xS(x), yS(tilt[i])) : ctx.moveTo(xS(x), yS(tilt[i])));
      ctx.stroke();
    } else {
      const ks = [];
      let pBaseSum = 0, pTiltSum = 0;
      const pBase = [], pTiltRaw = [];
      for (let k = 0; k <= D.xMax; k++) {
        ks.push(k);
        const base = D.pmf(k);
        const factor = Math.exp(dtheta * D.score(k));
        pBase.push(base);
        pTiltRaw.push(base * factor);
        pBaseSum += base;
        pTiltSum += base * factor;
      }
      const tilt = pTiltRaw.map((v) => v / pTiltSum);
      const peak = Math.max(...pBase, ...tilt) * 1.2;
      const yS = (v) => upperY + upperH - v / peak * upperH;
      const barW = plotW / (D.xMax + 1) * 0.36;
      ks.forEach((k, i) => {
        const cx = xS(k);
        ctx.fillStyle = "rgba(31,74,140,0.65)";
        ctx.fillRect(cx - barW, yS(pBase[i]), barW * 0.9, yS(0) - yS(pBase[i]));
        ctx.fillStyle = "rgba(184,65,42,0.7)";
        ctx.fillRect(cx + barW * 0.1, yS(tilt[i]), barW * 0.9, yS(0) - yS(tilt[i]));
      });
    }
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("baseline vs tilted density", padL, upperY - 6);
    drawAxes(ctx, padL, lowerY, plotW, lowerH, 10, 3);
    const sMax = (function () {
      let m = 0;
      const N = 200;
      for (let i = 0; i <= N; i++) {
        const x = D.xMin + i / N * (D.xMax - D.xMin);
        const v = Math.abs(D.score(x));
        if (v > m) m = v;
      }
      return Math.max(m * 1.15, 0.1);
    })();
    const ySs = (v) => lowerY + lowerH / 2 - v / sMax * lowerH / 2;
    ctx.strokeStyle = C.axis;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, lowerY + lowerH / 2);
    ctx.lineTo(padL + plotW, lowerY + lowerH / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const N2 = 220;
    for (let i = 0; i <= N2; i++) {
      const x = D.xMin + i / N2 * (D.xMax - D.xMin);
      const v = D.score(x);
      const px = xS(x), py = ySs(v);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("score s_θ(x) — tilt direction", padL, lowerY - 4);
    readout.innerHTML = `<div class="row"><span class="lbl">I(θ)</span><span>${D.I.toFixed(3)}</span></div><div class="row"><span class="lbl">Δθ</span><span>${dtheta.toFixed(3)}</span></div><div class="row"><span class="lbl">½·I(θ)·(Δθ)²</span><span>${(0.5 * D.I * dtheta * dtheta).toFixed(4)}</span></div>`;
  }
  modelSel.addEventListener("change", () => { configure(); draw(); });
  [thetaIn, deltaIn].forEach((input) => input.addEventListener("input", draw));
  configure();
  draw();
})();

// ─────────── Figure 3e · Log-partition A(η) ───────────
(function figLogPartition() {
  const canvas = document.getElementById("fig3-logpartition");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const modelSel = document.getElementById("fig3-logpartition-model");
  const etaIn = document.getElementById("fig3-logpartition-eta");
  const etaV = document.getElementById("fig3-logpartition-eta-v");
  const readout = document.getElementById("fig3-logpartition-readout");
  function configure() {
    const m = modelSel.value;
    if (m === "bernoulli") {
      etaIn.min = "-4"; etaIn.max = "4"; etaIn.step = "0.05";
      if (+etaIn.value < -4 || +etaIn.value > 4) etaIn.value = 0;
    } else if (m === "poisson") {
      etaIn.min = "-2"; etaIn.max = "2.5"; etaIn.step = "0.05";
      etaIn.value = 0.5;
    } else if (m === "exponential") {
      etaIn.min = "-3"; etaIn.max = "-0.1"; etaIn.step = "0.02";
      etaIn.value = -1;
    } else {
      etaIn.min = "-3"; etaIn.max = "3"; etaIn.step = "0.05";
      etaIn.value = 0;
    }
  }
  function A(eta) {
    const m = modelSel.value;
    if (m === "bernoulli") return Math.log(1 + Math.exp(eta));
    if (m === "poisson") return Math.exp(eta);
    if (m === "exponential") return -Math.log(-eta);
    return 0.5 * eta * eta;
  }
  function Ap(eta) {
    const m = modelSel.value;
    if (m === "bernoulli") return 1 / (1 + Math.exp(-eta));
    if (m === "poisson") return Math.exp(eta);
    if (m === "exponential") return -1 / eta;
    return eta;
  }
  function App(eta) {
    const m = modelSel.value;
    if (m === "bernoulli") {
      const p = 1 / (1 + Math.exp(-eta));
      return p * (1 - p);
    }
    if (m === "poisson") return Math.exp(eta);
    if (m === "exponential") return 1 / (eta * eta);
    return 1;
  }
  function ranges() {
    const m = modelSel.value;
    if (m === "bernoulli") return { etaMin: -4, etaMax: 4 };
    if (m === "poisson") return { etaMin: -2, etaMax: 2.5 };
    if (m === "exponential") return { etaMin: -3, etaMax: -0.1 };
    return { etaMin: -3, etaMax: 3 };
  }
  function familyLabel() {
    const m = modelSel.value;
    if (m === "bernoulli") return { name: "Bernoulli", Tlabel: "x", paramTip: "p = σ(η)" };
    if (m === "poisson") return { name: "Poisson", Tlabel: "x", paramTip: "λ = exp(η)" };
    if (m === "exponential") return { name: "Exponential", Tlabel: "x", paramTip: "λ = −η" };
    return { name: "Normal mean (σ=1)", Tlabel: "x", paramTip: "μ = η" };
  }
  function draw() {
    const eta0 = +etaIn.value;
    etaV.textContent = eta0.toFixed(3);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 56, padR = 18, padT = 22, padB = 38, gap = 14;
    const plotW = w - padL - padR;
    const upperH = (h - padT - padB - gap) * 0.58;
    const lowerH = (h - padT - padB - gap) * 0.42;
    const upperY = padT;
    const lowerY = padT + upperH + gap;
    const { etaMin, etaMax } = ranges();
    const xS = (e) => padL + (e - etaMin) / (etaMax - etaMin) * plotW;
    const N = 200;
    const samples = [];
    for (let i = 0; i <= N; i++) {
      const e = etaMin + i / N * (etaMax - etaMin);
      samples.push({ e, A: A(e), Ap: Ap(e), App: App(e) });
    }
    const aMin = Math.min(...samples.map((s) => s.A));
    const aMax = Math.max(...samples.map((s) => s.A));
    const aPad = (aMax - aMin) * 0.12 + 0.05;
    const yAS = (v) => upperY + upperH - (v - aMin + aPad) / (aMax - aMin + 2 * aPad) * upperH;
    drawAxes(ctx, padL, upperY, plotW, upperH, 8, 4);
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = xS(s.e), y = yAS(s.A);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    const a0 = A(eta0), ap0 = Ap(eta0), app0 = App(eta0);
    ctx.strokeStyle = C.orange;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const tanRange = (etaMax - etaMin) * 0.35;
    const eL = Math.max(etaMin, eta0 - tanRange);
    const eR = Math.min(etaMax, eta0 + tanRange);
    ctx.moveTo(xS(eL), yAS(a0 + ap0 * (eL - eta0)));
    ctx.lineTo(xS(eR), yAS(a0 + ap0 * (eR - eta0)));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(xS(eta0), yAS(a0), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("$A(\\eta) = \\log\\int e^{\\eta T(x)} h(x)\\,dx$", padL, upperY - 6);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("η", padL + plotW - 8, upperY + upperH + 14);
    drawAxes(ctx, padL, lowerY, plotW, lowerH, 8, 3);
    const mp = samples.map((s) => s.Ap);
    const mc = samples.map((s) => s.App);
    const lo = Math.min(0, ...mp, ...mc);
    const hi = Math.max(...mp, ...mc);
    const lpad = (hi - lo) * 0.1 + 0.02;
    const yLS = (v) => lowerY + lowerH - (v - lo + lpad) / (hi - lo + 2 * lpad) * lowerH;
    if (lo < 0 && hi > 0) {
      ctx.strokeStyle = C.axis;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(padL, yLS(0));
      ctx.lineTo(padL + plotW, yLS(0));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = xS(s.e), y = yLS(s.Ap);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    samples.forEach((s, i) => {
      const x = xS(s.e), y = yLS(s.App);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.arc(xS(eta0), yLS(ap0), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.purple;
    ctx.beginPath();
    ctx.arc(xS(eta0), yLS(app0), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText("$A'(\\eta) = \\mathbb{E}[T]$ (red), $A''(\\eta) = I(\\eta)$ (purple)", padL, lowerY - 4);
    const F = familyLabel();
    readout.innerHTML = `<div class="row"><span class="lbl">family</span><span>${F.name}</span></div><div class="row"><span class="lbl">$\\eta$</span><span>${eta0.toFixed(3)} (${F.paramTip})</span></div><div class="row"><span class="lbl">$A(\\eta)$</span><span>${a0.toFixed(3)}</span></div><div class="row"><span class="lbl">$\\mathbb{E}_\\eta[T]$</span><span>${ap0.toFixed(3)}</span></div><div class="row"><span class="lbl">$\\mathrm{Var}_\\eta(T) = I(\\eta)$</span><span>${app0.toFixed(3)}</span></div>`;
    if (window.renderMathInElement) window.renderMathInElement(readout, { delimiters: [{ left: "$", right: "$", display: false }, { left: "$$", right: "$$", display: true }] });
  }
  modelSel.addEventListener("change", () => { configure(); draw(); });
  etaIn.addEventListener("input", draw);
  configure();
  draw();
})();

// ─────────── Figure 4c · Max-entropy explorer ───────────
(function figMaxEnt() {
  const canvas = document.getElementById("fig-maxent");
  if (!canvas) return;
  const { ctx, w, h } = setupCanvas(canvas);
  const caseSel = document.getElementById("fig-maxent-case");
  const meanIn = document.getElementById("fig-maxent-mean");
  const varIn = document.getElementById("fig-maxent-var");
  const meanV = document.getElementById("fig-maxent-mean-v");
  const varV = document.getElementById("fig-maxent-var-v");
  const readout = document.getElementById("fig-maxent-readout");

  function configure() {
    const c = caseSel.value;
    if (c === "bounded") {
      meanIn.disabled = true;
      varIn.disabled = true;
      meanIn.parentElement.style.opacity = "0.5";
      varIn.parentElement.style.opacity = "0.5";
    } else if (c === "real") {
      meanIn.disabled = false;
      varIn.disabled = false;
      meanIn.parentElement.style.opacity = "1";
      varIn.parentElement.style.opacity = "1";
      meanIn.min = "-3"; meanIn.max = "3"; meanIn.step = "0.05";
      if (+meanIn.value < -3 || +meanIn.value > 3) meanIn.value = 0;
    } else if (c === "halfline") {
      meanIn.disabled = false;
      varIn.disabled = true;
      meanIn.parentElement.style.opacity = "1";
      varIn.parentElement.style.opacity = "0.5";
      meanIn.min = "0.2"; meanIn.max = "5"; meanIn.step = "0.05";
      if (+meanIn.value < 0.2 || +meanIn.value > 5) meanIn.value = 1.5;
    } else if (c === "discrete") {
      meanIn.disabled = false;
      varIn.disabled = true;
      meanIn.parentElement.style.opacity = "1";
      varIn.parentElement.style.opacity = "0.5";
      meanIn.min = "0.1"; meanIn.max = "9.9"; meanIn.step = "0.05";
      if (+meanIn.value > 9.9) meanIn.value = 3;
    } else {
      meanIn.disabled = false;
      varIn.disabled = true;
      meanIn.parentElement.style.opacity = "1";
      varIn.parentElement.style.opacity = "0.5";
      meanIn.min = "0.2"; meanIn.max = "8"; meanIn.step = "0.05";
      if (+meanIn.value > 8) meanIn.value = 2;
    }
  }

  function solveDiscreteExpFamily(N, targetMean) {
    // Find η so that mean of (k=0..N) under p_k ∝ exp(η·k) equals targetMean.
    // Bisection on η.
    function mean(eta) {
      let sumP = 0, sumKP = 0;
      for (let k = 0; k <= N; k++) {
        const w = Math.exp(eta * k);
        sumP += w;
        sumKP += k * w;
      }
      return sumKP / sumP;
    }
    let lo = -10, hi = 10;
    for (let i = 0; i < 60; i++) {
      const mid = 0.5 * (lo + hi);
      if (mean(mid) < targetMean) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  function draw() {
    const c = caseSel.value;
    const mu = +meanIn.value;
    const v = +varIn.value;
    meanV.textContent = mu.toFixed(2);
    varV.textContent = v.toFixed(2);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    const padL = 56, padR = 18, padT = 24, padB = 64;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    drawAxes(ctx, padL, padT, plotW, plotH, 10, 4);

    let xMin, xMax, density, atoms, label, params, lambdas;

    if (c === "bounded") {
      xMin = 0; xMax = 2;
      density = (x) => (x >= 0 && x <= 2) ? 0.5 : 0;
      label = { name: "Uniform[0, 2]", form: "p(x) = 1/(b−a)" };
      params = "no constraint beyond support";
      lambdas = "λ₀ = log(1/(b−a)) only (normalization)";
    } else if (c === "halfline") {
      // Use a fixed x-axis so the user actually sees the curve change as
      // μ moves: with the previous self-scaling [0, max(6, 5μ)] AND a
      // self-scaling y-axis, the exponential looked self-similar above
      // μ ≈ 1.2 (both axes grew proportionally with μ). Fixed x-axis
      // lets the curve visibly flatten as μ increases.
      const lambda = 1 / mu;
      xMin = 0; xMax = 10;
      density = (x) => x >= 0 ? lambda * Math.exp(-lambda * x) : 0;
      label = { name: "Exponential(λ)", form: "p(x) = λ exp(−λ x)" };
      params = `λ = 1/μ = ${lambda.toFixed(3)}`;
      lambdas = `λ₀ (normalization) + λ₁ = −λ = ${(-lambda).toFixed(3)} (constraint on x)`;
    } else if (c === "real") {
      // Same fix as halfline: pin x-axis so the bell visibly shifts (as
      // μ slides) and reshapes (as σ² slides). The previous μ±4σ window
      // tracked both parameters, making the bell appear stationary.
      xMin = -6; xMax = 6;
      density = (x) => Math.exp(-(x - mu) * (x - mu) / (2 * v)) / Math.sqrt(2 * Math.PI * v);
      label = { name: "Normal(μ, σ²)", form: "p(x) ∝ exp(η₁x + η₂x²)" };
      params = `μ = ${mu.toFixed(2)}, σ² = ${v.toFixed(2)}`;
      lambdas = `η₁ = μ/σ² = ${(mu / v).toFixed(3)}, η₂ = −1/(2σ²) = ${(-1 / (2 * v)).toFixed(3)}`;
    } else if (c === "discrete") {
      const N = 10;
      const eta = solveDiscreteExpFamily(N, mu);
      let Z = 0;
      for (let k = 0; k <= N; k++) Z += Math.exp(eta * k);
      xMin = -0.5; xMax = N + 0.5;
      atoms = [];
      for (let k = 0; k <= N; k++) atoms.push({ x: k, p: Math.exp(eta * k) / Z });
      label = { name: "Discrete exp-family on {0,…,N}", form: "p_k ∝ exp(η k)" };
      params = `target mean μ = ${mu.toFixed(2)} on {0,…,${N}}`;
      lambdas = `η = ${eta.toFixed(3)}`;
    } else if (c === "nonneg-int") {
      // Geometric on {0,1,2,...} with mean μ.  p_k = (1-q) q^k, mean = q/(1-q), so q = μ/(μ+1)
      const q = mu / (mu + 1);
      const eta = Math.log(q);
      xMin = -0.5; xMax = Math.max(12, 4 * mu + 1);
      atoms = [];
      let cum = 0;
      for (let k = 0; k <= Math.ceil(xMax); k++) {
        const pk = (1 - q) * Math.pow(q, k);
        atoms.push({ x: k, p: pk });
        cum += pk;
        if (cum > 0.999) break;
      }
      label = { name: "Geometric on {0,1,2,…}", form: "p_k = (1−q) q^k" };
      params = `q = μ/(μ+1) = ${q.toFixed(3)}, mean μ = ${mu.toFixed(2)}`;
      lambdas = `η = log q = ${eta.toFixed(3)}`;
    }

    const xS = (x) => padL + (x - xMin) / (xMax - xMin) * plotW;

    if (atoms) {
      const peak = Math.max(...atoms.map((a) => a.p)) * 1.2;
      const yS = (p) => padT + plotH - p / peak * plotH;
      const stride = atoms.length > 14 ? plotW / atoms.length * 0.55 : plotW / atoms.length * 0.7;
      ctx.fillStyle = "rgba(31,74,140,0.7)";
      atoms.forEach((a) => {
        ctx.fillRect(xS(a.x) - stride / 2, yS(a.p), stride, yS(0) - yS(a.p));
      });
      ctx.fillStyle = C.red;
      const cx = xS(mu);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = C.red;
      ctx.beginPath();
      ctx.moveTo(cx, padT);
      ctx.lineTo(cx, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.red;
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText(`μ=${mu.toFixed(2)}`, cx + 4, padT + 12);
    } else {
      const N = 240;
      const xs = [], ps = [];
      for (let i = 0; i <= N; i++) {
        const x = xMin + i / N * (xMax - xMin);
        xs.push(x); ps.push(density(x));
      }
      const peak = Math.max(...ps) * 1.2 + 1e-9;
      const yS = (p) => padT + plotH - p / peak * plotH;
      ctx.fillStyle = "rgba(31,74,140,0.22)";
      ctx.beginPath();
      ctx.moveTo(xS(xMin), yS(0));
      xs.forEach((x, i) => ctx.lineTo(xS(x), yS(ps[i])));
      ctx.lineTo(xS(xMax), yS(0));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      xs.forEach((x, i) => i ? ctx.lineTo(xS(x), yS(ps[i])) : ctx.moveTo(xS(x), yS(ps[i])));
      ctx.stroke();
      if (c !== "bounded") {
        ctx.strokeStyle = C.red;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(xS(mu), padT);
        ctx.lineTo(xS(mu), padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.red;
        ctx.font = "11px -apple-system, sans-serif";
        ctx.fillText(`μ=${mu.toFixed(2)}`, xS(mu) + 4, padT + 12);
      }
    }

    // X-axis tick labels: choose a handful of round-number ticks spanning
    // [xMin, xMax]. Without these the user cannot tell that, say, the
    // exponential's tail has visibly receded as μ grows — the curve looks
    // the same against an unlabeled axis.
    ctx.fillStyle = C.textDim;
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const tickCount = 6;
    for (let k = 0; k <= tickCount; k++) {
      const xVal = xMin + (k / tickCount) * (xMax - xMin);
      const decimals = Math.abs(xVal) < 10 ? (Math.abs(xVal - Math.round(xVal)) < 1e-6 ? 0 : 1) : 0;
      ctx.fillText(xVal.toFixed(decimals), xS(xVal), padT + plotH + 4);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.text;
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(label.name, padL, padT - 6);
    ctx.fillStyle = C.textDim;
    ctx.font = "11px 'SF Mono', monospace";
    ctx.fillText(label.form, padL, padT + plotH + 22);
    ctx.fillStyle = C.purple;
    ctx.fillText(lambdas, padL, padT + plotH + 40);
    readout.innerHTML = `<div class="row"><span class="lbl">distribution</span><span>${label.name}</span></div><div class="row"><span class="lbl">constraints</span><span>${params}</span></div><div class="row"><span class="lbl">natural parameters</span><span>${lambdas}</span></div>`;
  }

  caseSel.addEventListener("change", () => { configure(); draw(); });
  [meanIn, varIn].forEach((input) => input.addEventListener("input", draw));
  configure();
  draw();
})();
